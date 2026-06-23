import { describe, expect, it } from "vitest";
import { tokenize, type Token } from "./tokenize.js";

/** The overlay relies on this: every char must survive tokenization. */
function roundtrips(css: string): boolean {
  return tokenize(css).map((t) => t.text).join("") === css;
}

const typesOf = (css: string): Token["type"][] => tokenize(css).map((t) => t.type);

describe("tokenize", () => {
  it("preserves every character (round-trips)", () => {
    for (const css of [
      ".a { color: red; }",
      "@media (min-width: 600px) { .a { display: grid } }",
      "/* note */ .x:hover { gap: 10px }",
      ".grid { grid-template-columns: repeat(3, 1fr); }",
      "",
      "   \n\t ",
    ]) {
      expect(roundtrips(css)).toBe(true);
    }
  });

  it("tags selector / prop / value / number", () => {
    const types = typesOf(".a{color:red}");
    expect(types).toEqual(["selector", "punct", "prop", "punct", "value", "punct"]);
    expect(typesOf(".a{width:10px}")).toContain("number");
  });

  it("classifies fr/percent/decimal/negative as numbers, words as values", () => {
    expect(tokenize(".a{x:1fr}").find((t) => t.text === "1fr")?.type).toBe("number");
    expect(tokenize(".a{x:.5}").find((t) => t.text === ".5")?.type).toBe("number");
    expect(tokenize(".a{x:-3px}").find((t) => t.text === "-3px")?.type).toBe("number");
    expect(tokenize(".a{x:red}").find((t) => t.text === "red")?.type).toBe("value");
  });

  it("treats : in selectors (pseudo-class) as part of the selector, splitting parens as punct", () => {
    const tokens = tokenize(".a:has(.b){color:red}");
    // The colon stays in the selector run; parens are structural punctuation.
    expect(tokens[0]).toEqual({ type: "selector", text: ".a:has" });
    expect(tokens.map((t) => t.text).join("")).toBe(".a:has(.b){color:red}");
  });

  it("handles at-rules and nested blocks (depth transitions)", () => {
    const tokens = tokenize("@media x { .a { color: red } }");
    expect(tokens[0]).toEqual({ type: "atword", text: "@media" });
    // closing braces both present
    expect(tokens.filter((t) => t.text === "}").length).toBe(2);
  });

  it("emits structural punctuation for parentheses and commas", () => {
    const types = typesOf(".g{grid-template-columns:repeat(3, 1fr)}");
    expect(types).toContain("punct");
    expect(tokenize(".g{x:repeat(3, 1fr)}").map((t) => t.text)).toEqual(
      expect.arrayContaining(["repeat", "(", "3", ",", ")"]),
    );
  });

  it("handles an unterminated comment to end of input", () => {
    const tokens = tokenize(".a { /* unterminated");
    const comment = tokens.find((t) => t.type === "comment");
    expect(comment?.text).toBe("/* unterminated");
    expect(roundtrips(".a { /* unterminated")).toBe(true);
  });

  it("breaks a value word at a comment start", () => {
    const tokens = tokenize(".a{color:red/*x*/}");
    expect(tokens.find((t) => t.text === "red")?.type).toBe("value");
    expect(tokens.some((t) => t.type === "comment")).toBe(true);
  });

  it("breaks a selector word at an @ with no space", () => {
    const tokens = tokenize(".a@media{}");
    expect(tokens[0]).toEqual({ type: "selector", text: ".a" });
    expect(tokens[1]).toEqual({ type: "atword", text: "@media" });
  });

  it("handles a lone @ and a stray closing brace", () => {
    expect(tokenize("@")).toEqual([{ type: "atword", text: "@" }]);
    expect(tokenize("}")).toEqual([{ type: "punct", text: "}" }]);
  });

  it("handles a top-level semicolon (depth 0)", () => {
    expect(roundtrips("@import 'x';")).toBe(true);
    expect(tokenize("@import 'x';").some((t) => t.text === ";")).toBe(true);
  });
});
