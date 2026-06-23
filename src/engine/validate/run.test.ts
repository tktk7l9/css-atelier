import { describe, expect, it } from "vitest";
import type { Snapshot } from "./snapshot.js";
import type { ValidatorSpec } from "./primitives.js";
import { evaluate } from "./run.js";

const snap: Snapshot = {
  viewport: { w: 400, h: 300 },
  elements: [],
  declarations: [{ selector: ".a", decls: { color: "red", display: "flex" } }],
  css: "",
};

describe("evaluate", () => {
  it("passes when every validator passes", () => {
    const specs: ValidatorSpec[] = [
      { kind: "declarationEquals", selector: ".a", prop: "color", value: "red" },
      { kind: "declarationEquals", selector: ".a", prop: "display", value: "flex" },
    ];
    const res = evaluate(specs, snap);
    expect(res.passed).toBe(true);
    expect(res.failures).toEqual([]);
    expect(res.results).toHaveLength(2);
  });

  it("collects failure messages in order", () => {
    const specs: ValidatorSpec[] = [
      { kind: "declarationEquals", selector: ".a", prop: "color", value: "red" },
      { kind: "declarationEquals", selector: ".a", prop: "display", value: "grid", message: "display を grid に" },
    ];
    const res = evaluate(specs, snap);
    expect(res.passed).toBe(false);
    expect(res.failures).toEqual(["display を grid に"]);
  });
});
