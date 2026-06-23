import { describe, expect, it } from "vitest";
import type { ElementSnapshot, ParsedRule, Rect, Snapshot } from "./snapshot.js";
import { runSpec, type ValidatorSpec } from "./primitives.js";

function elem(
  id: string,
  rect: Rect,
  opts: {
    parentId?: string | null;
    computed?: Record<string, string>;
    order?: number;
    tag?: string;
  } = {},
): ElementSnapshot {
  return {
    id,
    tag: opts.tag ?? "div",
    rect,
    computed: opts.computed ?? {},
    parentId: opts.parentId ?? null,
    order: opts.order ?? 0,
  };
}

function snap(els: ElementSnapshot[], decls: ParsedRule[] = [], css = ""): Snapshot {
  return { viewport: { w: 400, h: 300 }, elements: els, declarations: decls, css };
}

const pass = (spec: ValidatorSpec, s: Snapshot) => runSpec(spec, s).pass;

describe("declarationEquals", () => {
  const s = snap([], [{ selector: ".pond", decls: { display: "flex" } }]);
  it("passes when the declaration matches", () => {
    expect(pass({ kind: "declarationEquals", selector: ".pond", prop: "display", value: "flex" }, s)).toBe(true);
  });
  it("fails on value mismatch", () => {
    expect(pass({ kind: "declarationEquals", selector: ".pond", prop: "display", value: "grid" }, s)).toBe(false);
  });
  it("fails when the selector is absent", () => {
    expect(pass({ kind: "declarationEquals", selector: ".x", prop: "display", value: "flex" }, s)).toBe(false);
  });
});

describe("declarationMatches", () => {
  const s = snap([], [
    { selector: ".g", decls: { "grid-template-columns": "repeat(3, 1fr)" } },
    { selector: ".h", decls: { color: "red" } },
  ]);
  it("passes when the pattern matches", () => {
    expect(pass({ kind: "declarationMatches", selector: ".g", prop: "grid-template-columns", pattern: "repeat\\(3" }, s)).toBe(true);
  });
  it("fails when the pattern does not match", () => {
    expect(pass({ kind: "declarationMatches", selector: ".g", prop: "grid-template-columns", pattern: "^flex$" }, s)).toBe(false);
  });
  it("fails when the property is absent on the rule", () => {
    expect(pass({ kind: "declarationMatches", selector: ".h", prop: "grid-template-columns", pattern: ".*" }, s)).toBe(false);
  });
  it("fails when the selector is absent", () => {
    expect(pass({ kind: "declarationMatches", selector: ".z", prop: "x", pattern: ".*" }, s)).toBe(false);
  });
});

describe("sourceMatches", () => {
  const s = snap([], [], "@container (min-width: 400px) { .card { font-size: 24px } }");
  it("passes when the raw CSS matches the pattern", () => {
    expect(pass({ kind: "sourceMatches", pattern: "@container" }, s)).toBe(true);
  });
  it("fails when the raw CSS does not match", () => {
    expect(pass({ kind: "sourceMatches", pattern: "@media" }, s)).toBe(false);
  });
});

describe("computedEquals / computedMatches", () => {
  const s = snap([elem("box", { x: 0, y: 0, w: 10, h: 10 }, { computed: { "justify-content": "center" } })]);
  it("computedEquals passes / fails / handles missing prop / missing element", () => {
    expect(pass({ kind: "computedEquals", id: "box", prop: "justify-content", value: "center" }, s)).toBe(true);
    expect(pass({ kind: "computedEquals", id: "box", prop: "justify-content", value: "start" }, s)).toBe(false);
    expect(pass({ kind: "computedEquals", id: "box", prop: "align-items", value: "center" }, s)).toBe(false);
    expect(pass({ kind: "computedEquals", id: "ghost", prop: "x", value: "y" }, s)).toBe(false);
  });
  it("computedMatches passes / fails / handles missing prop / missing element", () => {
    expect(pass({ kind: "computedMatches", id: "box", prop: "justify-content", pattern: "cent" }, s)).toBe(true);
    expect(pass({ kind: "computedMatches", id: "box", prop: "justify-content", pattern: "^end$" }, s)).toBe(false);
    expect(pass({ kind: "computedMatches", id: "box", prop: "gap", pattern: ".*" }, s)).toBe(false);
    expect(pass({ kind: "computedMatches", id: "ghost", prop: "x", pattern: ".*" }, s)).toBe(false);
  });
});

describe("centeredIn", () => {
  const pond = elem("pond", { x: 0, y: 0, w: 200, h: 200 });
  const frog = elem("frog", { x: 80, y: 80, w: 40, h: 40 }, { parentId: "pond" });
  const s = snap([pond, frog]);
  it("passes when centered via parentId (x) and (y)", () => {
    expect(pass({ kind: "centeredIn", id: "frog", axis: "x" }, s)).toBe(true);
    expect(pass({ kind: "centeredIn", id: "frog", axis: "y" }, s)).toBe(true);
  });
  it("passes via explicit containerId", () => {
    expect(pass({ kind: "centeredIn", id: "frog", axis: "x", containerId: "pond" }, s)).toBe(true);
  });
  it("fails when off-center", () => {
    const off = snap([pond, elem("frog", { x: 0, y: 0, w: 40, h: 40 }, { parentId: "pond" })]);
    expect(pass({ kind: "centeredIn", id: "frog", axis: "x" }, off)).toBe(false);
  });
  it("fails when the element is missing", () => {
    expect(pass({ kind: "centeredIn", id: "ghost", axis: "x" }, s)).toBe(false);
  });
  it("fails when the container cannot be found", () => {
    const orphan = snap([elem("frog", { x: 0, y: 0, w: 40, h: 40 }, { parentId: "nope" })]);
    expect(pass({ kind: "centeredIn", id: "frog", axis: "x" }, orphan)).toBe(false);
  });
  it("fails when there is neither a containerId nor a parentId", () => {
    const rootless = snap([elem("frog", { x: 0, y: 0, w: 40, h: 40 }, { parentId: null })]);
    expect(pass({ kind: "centeredIn", id: "frog", axis: "x" }, rootless)).toBe(false);
  });
});

describe("alignedEdge", () => {
  it("checks each edge coordinate", () => {
    const a = elem("a", { x: 10, y: 20, w: 30, h: 40 });
    const b = elem("b", { x: 10, y: 20, w: 30, h: 40 });
    const s = snap([a, b]);
    for (const edge of ["left", "right", "top", "bottom", "centerx", "centery"] as const) {
      expect(pass({ kind: "alignedEdge", ids: ["a", "b"], edge }, s)).toBe(true);
    }
  });
  it("fails when edges differ", () => {
    const s = snap([elem("a", { x: 10, y: 0, w: 30, h: 10 }), elem("b", { x: 50, y: 0, w: 30, h: 10 })]);
    expect(pass({ kind: "alignedEdge", ids: ["a", "b"], edge: "left" }, s)).toBe(false);
  });
  it("fails when an element is missing", () => {
    const s = snap([elem("a", { x: 0, y: 0, w: 1, h: 1 })]);
    expect(pass({ kind: "alignedEdge", ids: ["a", "b"], edge: "left" }, s)).toBe(false);
  });
});

describe("order", () => {
  const s = snap([
    elem("a", { x: 0, y: 0, w: 10, h: 10 }),
    elem("b", { x: 20, y: 30, w: 10, h: 10 }),
  ]);
  it("passes when increasing along x and y", () => {
    expect(pass({ kind: "order", ids: ["a", "b"], axis: "x" }, s)).toBe(true);
    expect(pass({ kind: "order", ids: ["a", "b"], axis: "y" }, s)).toBe(true);
  });
  it("fails when not increasing", () => {
    expect(pass({ kind: "order", ids: ["b", "a"], axis: "x" }, s)).toBe(false);
  });
  it("fails when an element is missing", () => {
    expect(pass({ kind: "order", ids: ["a", "z"], axis: "x" }, s)).toBe(false);
  });
});

describe("insideContainer", () => {
  const box = elem("box", { x: 0, y: 0, w: 100, h: 100 });
  it("passes when inside", () => {
    const s = snap([box, elem("kid", { x: 10, y: 10, w: 20, h: 20 })]);
    expect(pass({ kind: "insideContainer", id: "kid", containerId: "box" }, s)).toBe(true);
  });
  it("fails when outside", () => {
    const s = snap([box, elem("kid", { x: 90, y: 10, w: 40, h: 20 })]);
    expect(pass({ kind: "insideContainer", id: "kid", containerId: "box" }, s)).toBe(false);
  });
  it("fails when element or container missing", () => {
    const s = snap([box]);
    expect(pass({ kind: "insideContainer", id: "kid", containerId: "box" }, s)).toBe(false);
    expect(pass({ kind: "insideContainer", id: "box", containerId: "nope" }, s)).toBe(false);
  });
});

describe("noOverlap", () => {
  it("passes when rects are disjoint", () => {
    const s = snap([elem("a", { x: 0, y: 0, w: 10, h: 10 }), elem("b", { x: 20, y: 0, w: 10, h: 10 })]);
    expect(pass({ kind: "noOverlap", ids: ["a", "b"] }, s)).toBe(true);
  });
  it("fails when rects overlap", () => {
    const s = snap([elem("a", { x: 0, y: 0, w: 30, h: 30 }), elem("b", { x: 10, y: 10, w: 30, h: 30 })]);
    expect(pass({ kind: "noOverlap", ids: ["a", "b"] }, s)).toBe(false);
  });
  it("fails when an element is missing", () => {
    const s = snap([elem("a", { x: 0, y: 0, w: 1, h: 1 })]);
    expect(pass({ kind: "noOverlap", ids: ["a", "b"] }, s)).toBe(false);
  });
});

describe("sizeApprox", () => {
  const s = snap([elem("box", { x: 0, y: 0, w: 100, h: 50 })]);
  it("passes/fails on width and height; passes when no dims given", () => {
    expect(pass({ kind: "sizeApprox", id: "box", w: 100 }, s)).toBe(true);
    expect(pass({ kind: "sizeApprox", id: "box", w: 200 }, s)).toBe(false);
    expect(pass({ kind: "sizeApprox", id: "box", h: 50 }, s)).toBe(true);
    expect(pass({ kind: "sizeApprox", id: "box", h: 80 }, s)).toBe(false);
    expect(pass({ kind: "sizeApprox", id: "box" }, s)).toBe(true);
  });
  it("fails when the element is missing", () => {
    expect(pass({ kind: "sizeApprox", id: "ghost", w: 1 }, s)).toBe(false);
  });
});

describe("relativeSize", () => {
  const s = snap([
    elem("a", { x: 0, y: 0, w: 200, h: 100 }),
    elem("b", { x: 0, y: 0, w: 100, h: 50 }),
  ]);
  it("passes / fails on the ratio for each dim", () => {
    expect(pass({ kind: "relativeSize", a: "a", b: "b", ratio: 2, dim: "w" }, s)).toBe(true);
    expect(pass({ kind: "relativeSize", a: "a", b: "b", ratio: 2, dim: "h" }, s)).toBe(true);
    expect(pass({ kind: "relativeSize", a: "a", b: "b", ratio: 3, dim: "w" }, s)).toBe(false);
  });
  it("fails when either element is missing", () => {
    expect(pass({ kind: "relativeSize", a: "x", b: "b", ratio: 2, dim: "w" }, s)).toBe(false);
    expect(pass({ kind: "relativeSize", a: "a", b: "y", ratio: 2, dim: "w" }, s)).toBe(false);
  });
});

describe("combinators", () => {
  const s = snap([], [{ selector: ".a", decls: { color: "red" } }]);
  const passing: ValidatorSpec = { kind: "declarationEquals", selector: ".a", prop: "color", value: "red" };
  const failing: ValidatorSpec = { kind: "declarationEquals", selector: ".a", prop: "color", value: "blue" };
  it("allOf passes only when all pass", () => {
    expect(pass({ kind: "allOf", of: [passing, passing] }, s)).toBe(true);
    expect(pass({ kind: "allOf", of: [passing, failing] }, s)).toBe(false);
  });
  it("anyOf passes when any passes", () => {
    expect(pass({ kind: "anyOf", of: [failing, passing] }, s)).toBe(true);
    expect(pass({ kind: "anyOf", of: [failing, failing] }, s)).toBe(false);
  });
});

describe("message override", () => {
  const s = snap([], [{ selector: ".a", decls: { color: "red" } }]);
  it("overrides the failure message when provided", () => {
    const r = runSpec({ kind: "declarationEquals", selector: ".a", prop: "color", value: "blue", message: "色を blue に" }, s);
    expect(r).toEqual({ pass: false, message: "色を blue に" });
  });
  it("ignores the override when passing", () => {
    const r = runSpec({ kind: "declarationEquals", selector: ".a", prop: "color", value: "red", message: "色を blue に" }, s);
    expect(r.pass).toBe(true);
    expect(r.message).toBe("");
  });
  it("keeps the default message when no override is given", () => {
    const r = runSpec({ kind: "declarationEquals", selector: ".a", prop: "color", value: "blue" }, s);
    expect(r.pass).toBe(false);
    expect(r.message).toContain(".a");
  });
});
