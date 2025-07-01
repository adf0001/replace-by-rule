const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  normalizeRule,
  ruleFromText,
  ruleFromFile,
  replaceByRule,
} = require("../index");

describe("normalizeRule", () => {
  it("normalizeRule, format", () => {
    assert.deepEqual(
      normalizeRule([
        { find: "a", replace: "b" },
        ["comment", "a", "b"],
        "comment",
        "a",
        "b",
        ["", "", "b"],
        [null, "", "b"],
      ]),
      [
        {
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "",
          find: "",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "",
          find: "",
          replace: "b",
          _normalized: true,
        },
      ]
    );
  });

  it("normalizeRule, enclosed", () => {
    assert.deepEqual(
      normalizeRule([
        ["comment", "a", "b"],
        [
          [[[[[["comment", "a", "b"]]]]]],
          "comment",
          "a",
          "b",
          { find: "a", replace: "b" },
        ],
      ]),
      [
        {
          comment: "comment",
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: "a",
          replace: "b",
          _normalized: true,
        },
        {
          find: "a",
          replace: "b",
          _normalized: true,
        },
      ]
    );
  });

  it("normalizeRule, options", () => {
    assert.deepEqual(
      normalizeRule([
        ["@all, comment", "a", "b"],
        ["@reg, comment", "a", "b"],
        ["@reg @all, comment", "a", "b"],
        ["@reg(flags=i), comment", "a", "b"],
        ["@all @reg( flags = i ), comment", "a", "b"],
        ["@all @reg( flags = gi ), comment", "a", "b"],
      ]),
      [
        {
          comment: "@all, comment",
          find: "a",
          replace: "b",
          forAll: true,
          _normalized: true,
        },
        {
          comment: "@reg, comment",
          find: /a/,
          replace: "b",
          // forAll: true,
          _normalized: true,
        },
        {
          comment: "@reg @all, comment",
          find: /a/g,
          replace: "b",
          _normalized: true,
        },
        {
          comment: "@reg(flags=i), comment",
          find: /a/i,
          replace: "b",
          _normalized: true,
        },
        {
          comment: "@all @reg( flags = i ), comment",
          find: /a/gi,
          replace: "b",
          _normalized: true,
        },
        {
          comment: "@all @reg( flags = gi ), comment",
          find: /a/gi,
          replace: "b",
          _normalized: true,
        },
      ]
    );
  });

  it("normalizeRule, object", () => {
    let findFunc = (s, r) => {
      return s.replace("a", r);
    };
    let replaceFunc = () => {};

    assert.deepEqual(
      normalizeRule([
        ["comment", /a/, "b"],
        ["comment", findFunc, "b"],
        ["comment", "a", replaceFunc],
      ]),
      [
        {
          comment: "comment",
          find: /a/,
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: findFunc,
          replace: "b",
          _normalized: true,
        },
        {
          comment: "comment",
          find: "a",
          replace: replaceFunc,
          _normalized: true,
        },
      ]
    );
  });
});

const result_1_txt = [
  {
    comment: "#1",
    find: "a",
    replace: "b",
    _normalized: true,
  },
  {
    comment: "#2 @all",
    find: "a",
    replace: "b",
    forAll: true,
    _normalized: true,
  },
  {
    comment: "#3 @reg",
    find: /a/,
    replace: "b",
    _normalized: true,
  },
  {
    comment: "#4 @reg(flags=i)",
    find: /a/i,
    replace: "b",
    _normalized: true,
  },
];

const result_2_json = [
  {
    find: "a",
    replace: "b",
    _normalized: true,
  },
  {
    comment: "comment",
    find: "a",
    replace: "b",
    _normalized: true,
  },
  {
    comment: "comment",
    find: "a",
    replace: "b",
    _normalized: true,
  },
];

describe("ruleFromText", () => {
  it("ruleFromText, text", () => {
    let text = fs.readFileSync(path.join(__dirname, "files", "1.txt"), "utf8");

    assert.deepEqual(ruleFromText(text), result_1_txt);
  });

  it("ruleFromText, json", () => {
    let text = fs.readFileSync(path.join(__dirname, "files", "2.json"), "utf8");

    assert.deepEqual(ruleFromText(text, "json"), result_2_json);
  });
});

describe("ruleFromFile", () => {
  it("ruleFromFile, text", () => {
    assert.deepEqual(
      ruleFromFile(path.join(__dirname, "files", "1.txt")),
      result_1_txt
    );
  });

  it("ruleFromFile, json", () => {
    assert.deepEqual(
      ruleFromFile(path.join(__dirname, "files", "2.json")),
      result_2_json
    );
  });

  it("ruleFromFile, js", () => {
    assert.deepEqual(
      ruleFromFile(path.join(__dirname, "files", "3.js")),
      result_2_json
    );
  });

  it("ruleFromFile, json as js", () => {
    assert.deepEqual(
      ruleFromFile(path.join(__dirname, "files", "2.json"), "js"),
      result_2_json
    );
  });
});

describe("replaceByRule", () => {
  it("replaceByRule", () => {
    let rule = ruleFromFile(path.join(__dirname, "files", "r1.js"));

    rule = normalizeRule(rule);

    let inputText = "aceg aceg ACEG **";

    let outputText = replaceByRule(inputText, rule);

    assert.equal(outputText, "bdfh adeh ACEh -**-");
  });
});
