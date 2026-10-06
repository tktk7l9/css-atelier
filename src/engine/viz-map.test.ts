import { describe, expect, it } from "vitest";
import type { ElementSnapshot, Snapshot } from "./validate/snapshot.js";
import { parseTransform, px, pxList, snapshotToSignals, type Quad, type Vec3 } from "./viz-map.js";

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

// Computed values below were read from the real sandbox (headless Chrome 154)
// for the 3D transform lessons.
const ROTATE_Y_50 = "matrix3d(0.642788, 0, -0.766044, 0, 0, 1, 0, 0, 0.766044, 0, 0.642788, 0, 0, 0, 0, 1)";
const CUBE_TURN = "matrix3d(0.819152, 0.242404, 0.519837, 0, 0, 0.906308, -0.422618, 0, -0.573576, 0.346189, 0.742404, 0, 0, 0, 0, 1)";
const FLIP = "matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)";
const I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function node(
  id: string,
  computed: Record<string, string>,
  parentId: string | null = null,
  rect = { x: 0, y: 0, w: 0, h: 0 },
): ElementSnapshot {
  return { id, tag: "div", rect, computed, parentId, order: 0 };
}

function expectPoint(actual: Vec3, expected: Vec3): void {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 1));
}

function span(q: Quad, axis: 0 | 1): number {
  const vals = q.map((p) => p[axis]);
  return Math.max(...vals) - Math.min(...vals);
}

describe("parseTransform", () => {
  it("reads matrix() and matrix3d() in CSS (column-major) order", () => {
    expect(parseTransform("matrix(1, 0, 0, 1, 80, 0)")).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 80, 0, 0, 1]);
    expect(parseTransform("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 50, 1)")[14]).toBe(50);
  });

  it("falls back to the identity for none, other functions and malformed lists", () => {
    for (const value of [undefined, "none", "rotate(10deg)", "matrix(1, 0, 0, 1, 80)", "matrix3d(1, 0, 0, 1, 0, 0)", "matrix(1, 0, x, 1, 0, 0)"]) {
      expect(parseTransform(value), String(value)).toEqual(I4);
    }
  });
});

describe("snapshotToSignals: transform-3d", () => {
  const stage = (extra: Record<string, string> = {}): ElementSnapshot =>
    node("stage", { width: "260px", height: "180px", transform: "none", "transform-style": "flat", ...extra });
  const card = node("card", { width: "160px", height: "100px", transform: ROTATE_Y_50, "transform-origin": "80px 50px" }, "stage");

  it("keeps a child of an untransformed stage in its 3D pose and projects it through the eye", () => {
    const sig = snapshotToSignals(snap([stage({ perspective: "400px" }), card]), {
      concept: "transform-3d",
      containerId: "stage",
      subjectId: "card",
    });
    const space = sig.space!;
    expect(space.flattened).toBe(false);
    expect(space.eye).toBe(400);
    expectPoint(space.frame[0], [-130, -90, 0]);
    // rotateY(50deg): the left edge comes toward the viewer, the right edge recedes.
    expectPoint(space.planes[0].corners[0], [-51.42, -50, 61.28]);
    expectPoint(space.planes[0].corners[1], [51.42, -50, -61.28]);
    expect(space.projection?.corners).toEqual(space.planes[0].corners);
    // Through an eye 400px away the near edge grows: Chrome draws this card 118.09px tall.
    expectPoint(space.projection!.screen[0], [-60.72, -59.05, 0]);
    expect(span(space.projection!.screen, 1)).toBeCloseTo(118.09, 1);
    expect(span(space.projection!.screen, 0)).toBeCloseTo(105.32, 1);
  });

  it("projects straight onto the screen without perspective", () => {
    const sig = snapshotToSignals(snap([stage(), card]), { concept: "transform-3d", containerId: "stage", subjectId: "card" });
    expect(sig.space?.eye).toBeNull();
    // Without perspective the card only narrows: Chrome draws it 102.85 × 100.
    expect(span(sig.space!.projection!.screen, 0)).toBeCloseTo(102.85, 1);
    expect(span(sig.space!.projection!.screen, 1)).toBeCloseTo(100, 5);
    expect(sig.space!.projection!.screen.every(([, , z]) => z === 0)).toBe(true);
  });

  it("drops the projection when a corner reaches the eye", () => {
    const sig = snapshotToSignals(snap([stage({ perspective: "50px" }), card]), {
      concept: "transform-3d",
      containerId: "stage",
      subjectId: "card",
    });
    expect(sig.space?.eye).toBe(50);
    expect(sig.space?.projection).toBeUndefined();
  });

  describe("a cube of three faces", () => {
    const faces = [
      node("front", { width: "100px", height: "100px", transform: "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 50, 1)" }, "cube"),
      node("right", { width: "100px", height: "100px", transform: "matrix3d(0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 50, 0, 0, 1)" }, "cube"),
      node("top", { width: "100px", height: "100px", transform: "matrix3d(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, -50, 0, 1)" }, "cube"),
    ];
    const scene = node("scene", { perspective: "600px" });
    const cube = (style: string): ElementSnapshot =>
      node("cube", { width: "100px", height: "100px", transform: CUBE_TURN, "transform-style": style }, "scene");

    it("presses the faces into the cube's plane while it is flat", () => {
      const sig = snapshotToSignals(snap([scene, cube("flat"), ...faces]), { concept: "transform-3d", containerId: "cube" });
      const space = sig.space!;
      expect(space.flattened).toBe(true);
      expect(space.eye).toBe(600); // from the parent scene
      expect(space.projection).toBeUndefined();
      // The right face is seen edge-on: its left and right corners collapse.
      const [tl, tr] = space.planes[1].corners;
      expectPoint(tl, tr);
    });

    it("assembles the cube with preserve-3d", () => {
      const sig = snapshotToSignals(snap([scene, cube("preserve-3d"), ...faces]), { concept: "transform-3d", containerId: "cube" });
      const space = sig.space!;
      expect(space.flattened).toBe(false);
      expect(space.planes.map((p) => p.id)).toEqual(["front", "right", "top"]);
      const [tl, tr] = space.planes[1].corners;
      expect(Math.hypot(tr[0] - tl[0], tr[1] - tl[1], tr[2] - tl[2])).toBeCloseTo(100, 3);
      // The front face sits 50px in front of the cube's centre, turned with the cube.
      const front = space.planes[0].corners;
      const centre = [0, 1, 2].map((i) => front.reduce((sum, p) => sum + p[i], 0) / 4);
      expect(Math.hypot(centre[0], centre[1], centre[2])).toBeCloseTo(50, 3);
    });
  });

  it("marks hidden back faces and does not flatten a flipped preserve-3d card", () => {
    const front = node("front", { width: "200px", height: "120px", transform: "none", "backface-visibility": "hidden" }, "card");
    const back = node("back", { width: "200px", height: "120px", transform: FLIP, "backface-visibility": "visible" }, "card");
    const sig = snapshotToSignals(
      snap([node("card", { width: "200px", height: "120px", transform: FLIP, "transform-style": "preserve-3d" }), front, back]),
      { concept: "transform-3d", containerId: "card" },
    );
    const space = sig.space!;
    expect(space.flattened).toBe(false);
    expect(space.eye).toBeNull();
    expect(space.planes.map((p) => p.hideBackface)).toEqual([true, false]);
    // The flipped card turns the front face's left edge to the right.
    expectPoint(space.planes[0].corners[0], [100, -60, 0]);
    expectPoint(space.planes[1].corners[0], [-100, -60, 0]);
  });

  it("falls back to the rect size and a centred origin, and survives a degenerate w", () => {
    const flat = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0)"; // w = 0 everywhere
    const sig = snapshotToSignals(
      snap([
        node("box", { transform: "matrix(1, 0, 0, 1, 10, 0)" }, null, { x: 0, y: 0, w: 40, h: 20 }),
        node("child", { transform: flat }, "box", { x: 0, y: 0, w: 40, h: 20 }),
      ]),
      { concept: "transform-3d", containerId: "box", subjectId: "missing" },
    );
    const space = sig.space!;
    expect(space.flattened).toBe(true);
    expectPoint(space.frame[0], [-10, -10, 0]);
    expectPoint(space.planes[0].corners[2], [30, 10, 0]);
    expect(space.projection).toBeUndefined();
  });

  it("transforms around a custom transform-origin", () => {
    const sig = snapshotToSignals(
      snap([node("pivot", { width: "100px", height: "100px", transform: FLIP, "transform-origin": "0px 0px", "transform-style": "preserve-3d" })]),
      { concept: "transform-3d", containerId: "pivot" },
    );
    // Flipped around its left edge, the box swings to the left of it.
    expectPoint(sig.space!.frame[1], [-150, -50, 0]);
  });

  it("leaves space undefined when the container is missing", () => {
    const sig = snapshotToSignals(snap([node("x", {})]), { concept: "transform-3d", containerId: "nope" });
    expect(sig.space).toBeUndefined();
  });
});
