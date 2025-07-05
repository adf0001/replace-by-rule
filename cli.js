const path = require("path");
const fs = require("fs");

const { ruleFromFile, replaceByRule } = require("./index");

const { version, description } = require("./package.json");

let inputFile = null;
let outputFile = null;
let ruleFile = null;
let mode = "auto";
let verbose = 1;

// console.log(process.argv);

for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "-i") {
    inputFile = process.argv[i + 1];
    i++;
  } else if (arg === "-o") {
    outputFile = process.argv[i + 1];
    i++;
  } else if (arg === "-r") {
    ruleFile = process.argv[i + 1];
    i++;
  } else if (arg === "--mode") {
    mode = process.argv[i + 1];
    i++;
  } else if (arg === "--verbose") {
    verbose = parseInt(process.argv[i + 1]);

    if (verbose >= 2) verbose = 2;
    else if (verbose <= 0) verbose = 0;
    else verbose = 1;

    i++;
  }
}

const help = `replace-by-rule v${version}

${description}

Usage: replace-by-rule [ -i <input-file> ] -r <rule-file> [ -o <output-file> ] [ --mode <mode> ]

Options:
  -i <input-file>               Input file; if not specified, read from pipe/redirection.
  -r <rule-file>                Rule file.
  -o <output-file>              Optional, output file (default: stdout).
  --mode <auto|text|json|js>    Optional, default: auto.
  --verbose <0|1|2>             Optional, 0: silent, 1: default, 2: verbose.
`;

// rule file is required
if (!ruleFile) {
  console.log(help);
  process.exit(0);
}

// input file
let inputText = null;

if (inputFile) {
  // load input file
  inputFile = path.resolve(inputFile);
  if (verbose > 0) {
    console.log(`Loading input file: ${inputFile}`);
  }
  inputText = fs.readFileSync(inputFile, "utf8");
} else if (!process.stdin.isTTY) {
  // read input from pipe/redirection
  inputText = fs.readFileSync(0, "utf8");
} else {
  console.log(help);
  process.exit(0);
}

// load rule file
ruleFile = path.resolve(ruleFile);
if (verbose > 0) {
  console.log(`Loading rule file: ${ruleFile}`);
}
let rule = ruleFromFile(ruleFile, mode);

// replace by rule
let outputText = replaceByRule(inputText, rule, verbose);

// write output file
if (outputFile) {
  outputFile = path.resolve(outputFile);
  let dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (verbose > 0) {
    console.log(`Writing output file: ${outputFile}`);
  }
  fs.writeFileSync(outputFile, outputText, "utf8");
} else {
  // console.log(outputText);
  process.stdout.write(outputText);
}
