import { describe, expect, it } from "vitest";
import {
  normalizeProp,
  normalizeSelector,
  normalizeValue,
  parseCss,
} from "./css-parse.js";

describe("normalizers", () => {
  it("normalizes selectors by collapsing whitespace", () => {
    expect(normalizeSelector("  .a   >   .b \n")).toBe(".a > .b");
  });

  it("lowercases properties", () => {
    expect(normalizeProp("  Justify-Content ")).toBe("justify-content");
  });

  it("normalizes values: trailing semicolon, !important, case, whitespace", () => {
    expect(normalizeValue("  CENTER ;")).toBe("center");
    expect(normalizeValue("RED !important")).toBe("red");
    expect(normalizeValue("1fr   2fr\t1fr")).toBe("1fr 2fr 1fr");
  });
});

describe("parseCss", () => {
  it("parses a simple rule", () => {
    expect(parseCss(".a { color: red; }")).toEqual([
      { selector: ".a", decls: { color: "red" } },
    ]);
  });

  it("strips line and block comments", () => {
    const rules = parseCss("/* hi */ .a { color: red; /* x */ }");
    expect(rules).toEqual([{ selector: ".a", decls: { color: "red" } }]);
  });

  it("splits multiple comma selectors into one rule each", () => {
    const rules = parseCss(".a, .b { display: flex }");
    expect(rules.map((r) => r.selector)).toEqual([".a", ".b"]);
    expect(rules[0].decls).toEqual({ display: "flex" });
    expect(rules[1].decls).toEqual({ display: "flex" });
  });

  it("ignores commas inside parentheses (function values)", () => {
    const rules = parseCss(".g { grid-template-columns: repeat(3, 1fr); }");
    expect(rules[0].decls["grid-template-columns"]).toBe("repeat(3, 1fr)");
  });

  it("descends into at-rule blocks, ignoring the condition", () => {
    const rules = parseCss("@media (min-width: 600px) { .a { color: red } }");
    expect(rules).toEqual([{ selector: ".a", decls: { color: "red" } }]);
  });

  it("skips statement at-rules ending in semicolons", () => {
    const rules = parseCss("@import 'x.css'; .a { color: red }");
    expect(rules.map((r) => r.selector)).toEqual([".a"]);
  });

  it("skips declarations without a colon or with an empty property", () => {
    const rules = parseCss(".a { color; : red; width: 5px }");
    expect(rules[0].decls).toEqual({ width: "5px" });
  });

  it("skips nested rules when extracting declarations", () => {
    const rules = parseCss(".a { color: red; & .b { color: blue } }");
    expect(rules[0].decls).toEqual({ color: "red" });
  });

  it("keeps the first colon as the prop/value boundary", () => {
    const rules = parseCss(".a { background: url(http://x/y) }");
    expect(rules[0].decls["background"]).toBe("url(http://x/y)");
  });

  it("tolerates unbalanced parentheses in values", () => {
    const rules = parseCss(".a { width: calc(1px)) }");
    expect(rules[0].decls["width"]).toBe("calc(1px))");
  });

  it("tolerates an unclosed block (uses the rest as body)", () => {
    expect(parseCss(".a { color: red")).toEqual([
      { selector: ".a", decls: { color: "red" } },
    ]);
  });

  it("ignores a block with an empty selector prelude", () => {
    expect(parseCss("{ color: red }")).toEqual([]);
  });

  it("drops empty selector segments from a comma list", () => {
    expect(parseCss(".a, { color: red }")).toEqual([
      { selector: ".a", decls: { color: "red" } },
    ]);
  });

  it("ignores top-level declarations with no rule block", () => {
    expect(parseCss("color: red;")).toEqual([]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseCss("   ")).toEqual([]);
  });
});
