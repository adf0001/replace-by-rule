module.exports = [
  ["comment", "a", "b"],
  ["@all", "c", "d"],
  ["@reg", "e", "f"],
  ["@all @reg(flags=i)", "g", "h"],
  ["function", (inp, r) => inp.replace(r, "-" + r + "-"), "**"],
  ["comment", "x", "y"],
];
