/*
Replace text by predefined rule, which is a list with many rule items.

One rule item can be defined as an object,
  {
    "comment"?: <comment>,
    "find": <find>,
    "replace"?: <replace>
    "forAll"?: <forAll>
  }

or an array of three-items,
  [<comment>, <find>, <replace>]

or a group of three array-items in order,
  <comment>
  <find>
  <replace>

The rule items in the list can be a mixed of the above formats,
  [
    {"comment": <comment-1>, "find": <find-1>, "replace": <replace-1>},
    [<comment-2>, <find-2>, <replace-2>],
    <comment-3>,
    <find-3>,
    <replace-3>,
    ...
  ]

In which,
  <comment>
    An optional text or empty,
      when <find> is a text, it can contain options starting with '@',
        @all  // if the @reg option not exists, use the replaceAll() method for all occurrences.
              // if the @reg option existes, used as a "g" flag for @reg option.
        @reg  // if <find> is a text, use the replace() method of a RegExp(<find>,<flags>) object.
        @reg(flags=<falgs>)

  <find>
    A string to find, or a RegExp object, or a function of (inputText, <replace>)=>{ return outputText }
    if empty, skip this rule.

  <replace>
    A string to replace, or a replacement function for the replace()/replaceAll() method when <find> is text or RegExp.

  <forAll>
    An optional flag to use the replaceAll() method for text replacement, not for RegExp.

Text file format
  One rule item is a group of three text lines in order.
    <comment>
    <find>
    <replace>
*/

const fs = require("fs");
const path = require("path");

// return a normalized rule item, or error string message.
function _normalizeRuleItem(ruleItem) {
  if (ruleItem._normalized) return ruleItem;

  let { comment, find, replace } = ruleItem;

  if (!find || find instanceof RegExp || typeof find === "function") {
    // skip empty or programmatic rule
  } else {
    if (typeof find !== "string") return "Invalid find value type";

    // @all
    let forAll = ruleItem.forAll || comment?.match(/@all\b/);

    // @reg
    let regm = comment?.match(/@reg\b(?:\s*\(\s*flags\s*=\s*([a-z]+)\s*\))?/);

    if (regm) {
      let flags = regm[1] || "";
      if (forAll && !flags.includes("g")) flags += "g";

      ruleItem.find = new RegExp(find, flags);
    } else if (forAll) {
      ruleItem.forAll = true;
    }
  }

  if (!replace) ruleItem.replace = "";

  ruleItem._normalized = true;

  return ruleItem;
}

// normalize the raw rule
function normalizeRule(rule) {
  if (!Array.isArray(rule))
    throw new Error("Invalid rule list, must be an array.");

  let result = [];

  for (let i = 0; i < rule.length; i++) {
    let ruleItem = rule[i];
    let typeStr = typeof ruleItem;

    if (typeStr === "string" || !ruleItem) {
      // string or empty
      let comment = ruleItem || "";
      let find = rule[i + 1];
      let replace = rule[i + 2];
      i += 2;

      let rsl = _normalizeRuleItem({ comment, find, replace });

      if (typeof rsl === "string")
        throw new Error(
          `Invalid rule, ${rsl}\n  ${[comment, find, replace].join("  \n")}`
        );
      result.push(rsl);
    } else if (Array.isArray(ruleItem)) {
      // array
      result.push(...normalizeRule(ruleItem));
    } else if (Object.prototype.toString.call(ruleItem) === "[object Object]") {
      let rsl = _normalizeRuleItem(ruleItem);
      if (typeof rsl === "string")
        throw new Error(
          `Invalid rule, ${rsl}\n  ${JSON.stringify(ruleItem, null, 2).replace(
            /\n/g,
            "\n  "
          )}`
        );
      result.push(rsl);
    } else {
      throw new Error(
        `Invalid rule type, ${typeStr}, ${Object.prototype.toString.call(
          ruleItem
        )}, ${ruleItem}`
      );
    }
  }

  return result;
}

// mode: "text", "json"
function ruleFromText(text, mode = "text") {
  if (mode === "text") {
    const lines = text.replaceAll("\r\n", "\n").split(/\r|\n/);
    return normalizeRule(lines);
  } else if (mode === "json") {
    let json = JSON.parse(text);
    return normalizeRule(json);
  } else
    throw new Error(
      `Invalid mode '${mode}' when calling ruleFromText, must be 'text' or 'json'`
    );
}

// mode: "text", "json", "js" or "auto"
function ruleFromFile(filePath, mode = "auto") {
  if (mode === "auto") {
    let ext = path.extname(filePath).toLowerCase();

    if (ext === ".json") {
      mode = "json";
    } else if (ext === ".js" || ext === ".mjs") {
      mode = "js";
    } else {
      mode = "text";
    }
  }

  if (mode === "js") {
    let obj = require(filePath);
    return normalizeRule(obj);
  } else if (mode === "text" || mode === "json") {
    return ruleFromText(fs.readFileSync(filePath, "utf8"), mode);
  } else
    throw new Error(
      `Invalid mode '${mode}' when calling ruleFromFile, must be 'text', 'json', 'js' or 'auto'`
    );
}

// verbose: 0: silent, 1: show replaced, 2: show all
function replaceByRule(inputText, rule, verbose = 1) {
  let inputText0 = inputText;

  for (let i = 0; i < rule.length; i++) {
    let { find, replace, forAll,comment } = rule[i];

    if (!find) continue; // skip empty rule

    // for js object
    if (find instanceof RegExp) {
      inputText = inputText.replace(find, replace);
    } else if (typeof find === "function") {
      inputText = find(inputText, replace);
    } else if (forAll) {
      inputText = inputText.replaceAll(find, replace);
    } else {
      inputText = inputText.replace(find, replace);
    }

    if (inputText !== inputText0) {
      if (verbose > 0) console.log(`  Found '${find}', replace: '${replace}'${ comment ? `  //${comment}` : ""}`);
      inputText0 = inputText;
    } else {
      if (verbose > 1) console.log(`  Not found '${find}'${ comment ? `  //${comment}` : ""}`);
    }
  }

  return inputText;
}

// exports

exports.normalizeRule = normalizeRule;
exports.ruleFromText = ruleFromText;
exports.ruleFromFile = ruleFromFile;
exports.replaceByRule = replaceByRule;
