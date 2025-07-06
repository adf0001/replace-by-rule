# replace-by-rule
replace text by rule.

# install
npm i -g replace-by-rule

# CLI tool
```text
replace-by-rule v0.0.5

replace text by rule

Usage: replace-by-rule [ -i <input-file> ] -r <rule-file> [ -o <output-file> ] [ --mode <mode> ]

Options:
  -i <input-file>               Input file; if not specified, read from pipe/redirection.
  -r <rule-file>                Rule file.
  -o <output-file>              Optional, output file (default: stdout).
  --mode <auto|text|json|js>    Optional, default: auto.
  --verbose <0|1|2>             Optional, 0: silent, 1: default, 2: verbose.
```

# API
```javascript

// normalize the raw rule
function normalizeRule(rule);

// mode: "text", "json"
function ruleFromText(text, mode = "text");

// mode: "text", "json", "js" or "auto"
function ruleFromFile(filePath, mode = "auto");

// verbose: 0: silent, 1: show replaced, 2: show all
function replaceByRule(inputText, rule, verbose = 1);

```

# Definition
```text
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
```