// Static guards for layout rules that jsdom cannot evaluate. Each one pins a
// regression found in a real browser (see the comments beside the rules).
import css from "./styles.css?raw";
import { describe, expect, it } from "vitest";

function block(selector: string, from = 0): string {
  const start = css.indexOf(`${selector} {`, from);
  expect(start, `${selector} rule exists`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
}

describe("preview frame layout", () => {
  it("does not centre with justify-content, which clips an overflowing iframe's left edge", () => {
    expect(block(".preview__frame")).not.toMatch(/justify-content:\s*center/);
  });

  it("keeps the lesson viewport width and centres it with auto margins", () => {
    const rule = block(".preview__frame iframe");
    expect(rule).toMatch(/flex:\s*none/);
    expect(rule).toMatch(/margin-inline:\s*auto/);
  });

  it("lets the single-column lesson grid shrink below a fixed preview width", () => {
    const narrow = css.indexOf("@media (max-width: 920px)");
    expect(narrow).toBeGreaterThanOrEqual(0);
    expect(block(".lesson", narrow)).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });
});
