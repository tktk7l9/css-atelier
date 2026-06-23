import { describe, expect, it } from "vitest";
import type { ElementSnapshot, Snapshot } from "./validate/snapshot.js";
import { px, pxList, snapshotToSignals } from "./viz-map.js";

function el(id: string, computed: Record<string, string> = {}): ElementSnapshot {
  return { id, tag: "div", rect: { x: 0, y: 0, w: 10, h: 10 }, computed, parentId: null, order: 0 };
}
function snap(els: ElementSnapshot[]): Snapshot {
  return { viewport: { w: 400, h: 300 }, elements: els, declarations: [], css: "" };
}

describe("px / pxList", () => {
  it("px parses or falls back to 0", () => {
    expect(px("10px")).toBe(10);
    expect(px(undefined)).toBe(0);
    expect(px("auto")).toBe(0);
  });
  it("pxList splits track lists and drops non-numbers", () => {
    expect(pxList(undefined)).toEqual([]);
    expect(pxList("100px 200px")).toEqual([100, 200]);
    expect(pxList("none 50px")).toEqual([50]);
  });
});

describe("snapshotToSignals", () => {
  it("maps boxes and sets nothing extra for concept 'none'", () => {
    const sig = snapshotToSignals(snap([el("a")]), { concept: "none" });
    expect(sig.concept).toBe("none");
    expect(sig.boxes).toEqual([{ id: "a", x: 0, y: 0, w: 10, h: 10 }]);
    expect(sig.flex).toBeUndefined();
    expect(sig.grid).toBeUndefined();
    expect(sig.boxModel).toBeUndefined();
  });

  it("flexbox: reads container by id with all properties", () => {
    const s = snap([
      el("c", { "flex-direction": "column", "justify-content": "center", "align-items": "end" }),
    ]);
    const sig = snapshotToSignals(s, { concept: "flexbox", containerId: "c" });
    expect(sig.flex).toEqual({ direction: "column", justify: "center", align: "end" });
  });

  it("flexbox: detects container by display and uses defaults for missing props", () => {
    const sig = snapshotToSignals(snap([el("c", { display: "flex" })]), { concept: "flexbox" });
    expect(sig.flex).toEqual({ direction: "row", justify: "normal", align: "normal" });
  });

  it("flexbox: leaves flex undefined when no container is found", () => {
    const sig = snapshotToSignals(snap([el("c")]), { concept: "flexbox" });
    expect(sig.flex).toBeUndefined();
  });

  it("grid: reads tracks and gaps from the container", () => {
    const s = snap([
      el("g", {
        "grid-template-columns": "100px 200px",
        "grid-template-rows": "50px",
        "column-gap": "10px",
        "row-gap": "8px",
      }),
    ]);
    const sig = snapshotToSignals(s, { concept: "grid", containerId: "g" });
    expect(sig.grid).toEqual({ cols: [100, 200], rows: [50], colGap: 10, rowGap: 8 });
  });

  it("grid: leaves grid undefined when no container is found", () => {
    const sig = snapshotToSignals(snap([el("x")]), { concept: "grid" });
    expect(sig.grid).toBeUndefined();
  });

  it("box-model: reads the subject element's edges", () => {
    const s = snap([
      el("box", {
        width: "100px",
        height: "50px",
        "padding-top": "8px",
        "padding-right": "8px",
        "padding-bottom": "8px",
        "padding-left": "8px",
        "border-top-width": "2px",
        "margin-left": "4px",
      }),
    ]);
    const sig = snapshotToSignals(s, { concept: "box-model", subjectId: "box" });
    expect(sig.boxModel?.width).toBe(100);
    expect(sig.boxModel?.height).toBe(50);
    expect(sig.boxModel?.padding).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
    expect(sig.boxModel?.border.top).toBe(2);
    expect(sig.boxModel?.margin.left).toBe(4);
  });

  it("box-model: falls back to the first element when no subjectId", () => {
    const sig = snapshotToSignals(snap([el("first", { width: "20px" })]), { concept: "box-model" });
    expect(sig.boxModel?.width).toBe(20);
  });

  it("box-model: leaves boxModel undefined when there are no elements", () => {
    const sig = snapshotToSignals(snap([]), { concept: "box-model" });
    expect(sig.boxModel).toBeUndefined();
  });
});
