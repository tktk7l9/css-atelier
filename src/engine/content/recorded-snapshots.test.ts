import { describe, expect, it } from "vitest";
import { lessonById } from "./index.js";
import { evaluate } from "../validate/run.js";
import { parseCss } from "../validate/css-parse.js";
import type { Snapshot } from "../validate/snapshot.js";

// Lessons graded only by computed values and the CSS text can be replayed in
// Node: the computed values below were recorded from the real sandbox (headless
// Chrome 154) for the starter CSS and for the reference solution. Each lesson
// must fail on its starter and pass on its solution.

type Computed = Record<string, Record<string, string>>;

interface Recording {
  readonly starter: Computed;
  readonly solution: Computed;
}

const INK = "rgb(24, 32, 58)";
const BRAND = "rgb(47, 95, 208)";
const WHITE = "rgb(255, 255, 255)";

const RECORDINGS: Record<string, Recording> = {
  "scope-root": {
    starter: {
      outside: { color: INK, "border-top-color": INK },
      card: { color: INK, "border-top-color": "rgb(219, 228, 251)" },
      inside: { color: INK, "border-top-color": INK },
    },
    solution: {
      outside: { color: INK, "border-top-color": INK },
      card: { color: INK, "border-top-color": BRAND },
      inside: { color: BRAND, "border-top-color": BRAND },
    },
  },
  "scope-donut": {
    starter: { "head-link": { color: INK }, "body-link": { color: INK }, "foot-link": { color: INK } },
    solution: { "head-link": { color: BRAND }, "body-link": { color: INK }, "foot-link": { color: BRAND } },
  },
  "scope-proximity": {
    starter: { "dark-text": { color: WHITE }, "light-text": { color: WHITE } },
    solution: { "dark-text": { color: WHITE }, "light-text": { color: INK } },
  },
  "property-register": {
    starter: { box: { "--space": "2em" } },
    solution: { box: { "--space": "32px" } },
  },
  "property-animate": {
    // Unregistered: discrete, still the `from` value. Registered: interpolated.
    starter: { ring: { "--angle": "0deg" } },
    solution: { ring: { "--angle": "90deg" } },
  },
  "snap-type-align": {
    starter: {
      track: { "scroll-snap-type": "none", "scroll-snap-align": "none" },
      s1: { "scroll-snap-type": "none", "scroll-snap-align": "none" },
      s4: { "scroll-snap-type": "none", "scroll-snap-align": "none" },
    },
    solution: {
      track: { "scroll-snap-type": "x mandatory", "scroll-snap-align": "none" },
      s1: { "scroll-snap-type": "none", "scroll-snap-align": "start" },
      s4: { "scroll-snap-type": "none", "scroll-snap-align": "start" },
    },
  },
  "snap-padding": {
    starter: { list: { "scroll-padding-top": "auto" } },
    solution: { list: { "scroll-padding-top": "48px" } },
  },
  "text-wrap-balance": {
    starter: { heading: { "text-wrap-style": "auto" } },
    solution: { heading: { "text-wrap-style": "balance" } },
  },
  "text-wrap-pretty": {
    starter: {},
    solution: {},
  },
  "clip-circle": {
    starter: { oval: { "clip-path": "none" }, round: { "clip-path": "none" } },
    solution: { oval: { "clip-path": "none" }, round: { "clip-path": "circle()" } },
  },
  "clip-polygon": {
    starter: { tag: { "clip-path": "none" } },
    solution: { tag: { "clip-path": "polygon(0px 0px, 85% 0px, 100% 50%, 85% 100%, 0px 100%)" } },
  },
  "mask-fade": {
    starter: { excerpt: { "mask-image": "none" } },
    solution: { excerpt: { "mask-image": "linear-gradient(rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0))" } },
  },
  "filter-functions": {
    starter: { open: { filter: "none" }, locked: { filter: "none" } },
    solution: { open: { filter: "none" }, locked: { filter: "grayscale(1) blur(4px)" } },
  },
  "filter-backdrop": {
    starter: { caption: { "backdrop-filter": "none", filter: "none" } },
    solution: { caption: { "backdrop-filter": "blur(8px)", filter: "none" } },
  },
  "blend-multiply": {
    starter: { tint: { "mix-blend-mode": "normal" } },
    solution: { tint: { "mix-blend-mode": "multiply" } },
  },
  "math-mod": {
    starter: { t2: { "transition-delay": "0.1s" }, t5: { "transition-delay": "0.4s" }, t8: { "transition-delay": "0.7s" } },
    solution: { t2: { "transition-delay": "0.1s" }, t5: { "transition-delay": "0s" }, t8: { "transition-delay": "0.3s" } },
  },
  "transform-backface": {
    starter: { front: { "backface-visibility": "visible" }, back: { "backface-visibility": "visible" } },
    solution: { front: { "backface-visibility": "hidden" }, back: { "backface-visibility": "hidden" } },
  },
};

// Lessons graded by geometry as well: the rects ([x, y, w, h], from
// getBoundingClientRect) were recorded from the same real sandbox.
type Box = readonly [number, number, number, number];
type Recorded = Record<string, { readonly rect?: Box; readonly computed?: Record<string, string> }>;

const GEOMETRY_RECORDINGS: Record<string, { readonly starter: Recorded; readonly solution: Recorded }> = {
  "math-round": {
    starter: { "wide-tiles": { rect: [0, 6, 230, 80] }, "narrow-tiles": { rect: [0, 110, 170, 80] } },
    solution: { "wide-tiles": { rect: [15, 6, 200, 80] }, "narrow-tiles": { rect: [5, 110, 160, 80] } },
  },
  "math-trig": {
    starter: {
      g1: { rect: [174, 94, 32, 32] },
      d1: { rect: [94, 94, 32, 32] },
      g2: { rect: [128.14, 157.43, 43.71, 43.71] },
      d2: { rect: [94, 94, 32, 32] },
      g3: { rect: [48.14, 157.43, 43.71, 43.71] },
      d3: { rect: [94, 94, 32, 32] },
      g4: { rect: [14, 94, 32, 32] },
      d4: { rect: [94, 94, 32, 32] },
      g5: { rect: [48.14, 18.86, 43.71, 43.71] },
      d5: { rect: [94, 94, 32, 32] },
      g6: { rect: [128.14, 18.86, 43.71, 43.71] },
      d6: { rect: [94, 94, 32, 32] },
    },
    solution: {
      g1: { rect: [174, 94, 32, 32] },
      d1: { rect: [174, 94, 32, 32] },
      g2: { rect: [128.14, 157.43, 43.71, 43.71] },
      d2: { rect: [134, 163.28, 32, 32] },
      g3: { rect: [48.14, 157.43, 43.71, 43.71] },
      d3: { rect: [54, 163.28, 32, 32] },
      g4: { rect: [14, 94, 32, 32] },
      d4: { rect: [14, 94, 32, 32] },
      g5: { rect: [48.14, 18.86, 43.71, 43.71] },
      d5: { rect: [54, 24.72, 32, 32] },
      g6: { rect: [128.14, 18.86, 43.71, 43.71] },
      d6: { rect: [134, 24.72, 32, 32] },
    },
  },
  "transform-perspective": {
    starter: { stage: { rect: [0, 0, 260, 180], computed: { perspective: "none" } }, card: { rect: [78.58, 40, 102.85, 100] } },
    solution: { stage: { rect: [0, 0, 260, 180], computed: { perspective: "400px" } }, card: { rect: [69.27, 30.95, 105.32, 118.09] } },
  },
  "transform-preserve-3d": {
    starter: {
      cube: { rect: [79.37, 43.03, 85.08, 114.88], computed: { "transform-style": "flat" } },
      right: { rect: [161.29, 63.98, 3.16, 93.93] },
      top: { rect: [79.37, 43.03, 85.08, 20.95] },
    },
    solution: {
      cube: { rect: [79.37, 43.03, 85.08, 114.88], computed: { "transform-style": "preserve-3d" } },
      right: { rect: [133.2, 48.64, 57.61, 131.73] },
      top: { rect: [46.41, 30.14, 144.41, 51.38] },
    },
  },
};

function geometrySnapshot(css: string, rec: Recorded): Snapshot {
  return {
    viewport: { w: 800, h: 600 },
    elements: Object.entries(rec).map(([id, { rect = [0, 0, 0, 0], computed = {} }], order) => ({
      id,
      tag: "div",
      rect: { x: rect[0], y: rect[1], w: rect[2], h: rect[3] },
      computed,
      parentId: null,
      order,
    })),
    declarations: parseCss(css),
    css,
  };
}

function snapshotOf(css: string, computed: Computed): Snapshot {
  return {
    viewport: { w: 800, h: 600 },
    elements: Object.entries(computed).map(([id, props], order) => ({
      id,
      tag: "div",
      rect: { x: 0, y: 0, w: 0, h: 0 },
      computed: props,
      parentId: null,
      order,
    })),
    declarations: parseCss(css),
    css,
  };
}

describe("lessons replayed from recorded sandbox values", () => {
  for (const [id, rec] of Object.entries(RECORDINGS)) {
    const lesson = lessonById(id);

    it(`${id}: the starter fails and the reference solution passes`, () => {
      expect(lesson, id).toBeDefined();
      const { challenge } = lesson!;
      const starter = evaluate(challenge.validators, snapshotOf(challenge.starterCSS, rec.starter));
      const solved = evaluate(challenge.validators, snapshotOf(challenge.solution, rec.solution));
      expect(starter.passed).toBe(false);
      expect(solved.failures).toEqual([]);
    });
  }

  it("rejects an unregistered --angle at either end of the cycle", () => {
    const { challenge } = lessonById("property-animate")!;
    for (const angle of ["0deg", "360deg", ""]) {
      const res = evaluate(challenge.validators, snapshotOf(challenge.solution, { ring: { "--angle": angle } }));
      expect(res.passed, angle).toBe(false);
    }
    for (const angle of ["0.5deg", "45deg", "180.25deg", "359.9deg"]) {
      const res = evaluate(challenge.validators, snapshotOf(challenge.solution, { ring: { "--angle": angle } }));
      expect(res.passed, angle).toBe(true);
    }
  });

  it("does not accept a plain descendant selector in place of the donut scope", () => {
    const { challenge } = lessonById("scope-donut")!;
    const css = challenge.starterCSS + "\n.card a {\n  color: #2f5fd0;\n}\n";
    const res = evaluate(
      challenge.validators,
      snapshotOf(css, { "head-link": { color: BRAND }, "body-link": { color: BRAND }, "foot-link": { color: BRAND } }),
    );
    expect(res.passed).toBe(false);
  });

  it("shows a fresh starter one message per unmet step, not every sub-check", () => {
    for (const id of ["clip-circle", "clip-polygon", "mask-fade"]) {
      const { challenge } = lessonById(id)!;
      const res = evaluate(challenge.validators, snapshotOf(challenge.starterCSS, RECORDINGS[id].starter));
      expect(res.failures, id).toHaveLength(1);
    }
  });

  it("accepts the equivalent spellings engines may serialize, and rejects the wrong shapes", () => {
    const cases: Array<[string, string, string, boolean]> = [
      // [lesson, element, computed value, passes]
      ["clip-circle", "round", "circle(at 50% 50%)", true],
      ["clip-circle", "round", "circle(closest-side at 50% 50%)", true],
      ["clip-circle", "round", "circle(60px)", true],
      ["clip-circle", "round", "circle(50%)", false], // a 50% radius overflows a wide box
      ["clip-circle", "round", "ellipse()", false],
      ["clip-polygon", "tag", "polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)", true],
      ["clip-polygon", "tag", "polygon(85% 0px, 100% 50%, 85% 100%, 0px 100%, 0px 0px)", false],
      ["mask-fade", "excerpt", "linear-gradient(to bottom, rgb(0, 0, 0) 60%, transparent)", true],
      ["mask-fade", "excerpt", "linear-gradient(rgba(0, 0, 0, 0) 60%, rgb(0, 0, 0))", false],
      ["mask-fade", "excerpt", "linear-gradient(90deg, rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0))", false],
    ];
    for (const [id, el, value, passes] of cases) {
      const { challenge } = lessonById(id)!;
      const prop = challenge.snapshot.props[0];
      const res = evaluate(challenge.validators, snapshotOf(challenge.solution, { [el]: { [prop]: value } }));
      expect(res.passed, `${id}: ${value}`).toBe(passes);
    }
  });

  it("filters only the members-only photo, in either order", () => {
    const { challenge } = lessonById("filter-functions")!;
    const run = (open: string, locked: string): boolean =>
      evaluate(challenge.validators, snapshotOf(challenge.solution, { open: { filter: open }, locked: { filter: locked } })).passed;
    expect(run("none", "grayscale(100%) blur(4px)")).toBe(true);
    expect(run("none", "blur(4px) grayscale(1)")).toBe(true);
    expect(run("grayscale(1) blur(4px)", "grayscale(1) blur(4px)")).toBe(false);
    expect(run("none", "grayscale(1)")).toBe(false);
  });

  it("does not accept blurring the caption itself instead of its backdrop", () => {
    const { challenge } = lessonById("filter-backdrop")!;
    const res = evaluate(
      challenge.validators,
      snapshotOf(challenge.solution, { caption: { "backdrop-filter": "blur(8px)", filter: "blur(8px)" } }),
    );
    expect(res.passed).toBe(false);
  });
});

describe("lessons replayed from recorded sandbox geometry", () => {
  for (const [id, rec] of Object.entries(GEOMETRY_RECORDINGS)) {
    it(`${id}: the starter fails and the reference solution passes`, () => {
      const lesson = lessonById(id);
      expect(lesson, id).toBeDefined();
      const { challenge } = lesson!;
      const starter = evaluate(challenge.validators, geometrySnapshot(challenge.starterCSS, rec.starter));
      const solved = evaluate(challenge.validators, geometrySnapshot(challenge.solution, rec.solution));
      expect(starter.passed).toBe(false);
      expect(solved.failures).toEqual([]);
    });
  }

  it("does not accept a width hard-coded for one shelf", () => {
    const { challenge } = lessonById("math-round")!;
    // `width: 200px` fits the wide shelf but overflows the narrow one (recorded).
    const css = challenge.starterCSS.replace("  outline:", "  width: 200px; /* round(down, */\n  outline:");
    const res = evaluate(
      challenge.validators,
      geometrySnapshot(css, { "wide-tiles": { rect: [15, 6, 200, 80] }, "narrow-tiles": { rect: [0, 110, 200, 80] } }),
    );
    expect(res.failures).toEqual(["狭い棚（170px）のタイルの列が 160px（40px × 4）になっていません"]);
  });

  it("does not accept the rotate() trick, which lands on the guides without cos() and sin()", () => {
    const { challenge } = lessonById("math-trig")!;
    const css = challenge.starterCSS.replace("  background: #2f5fd0;\n}", "  background: #2f5fd0;\n  transform: rotate(var(--a)) translateX(80px);\n}");
    const res = evaluate(challenge.validators, geometrySnapshot(css, GEOMETRY_RECORDINGS["math-trig"].solution));
    expect(res.passed).toBe(false);
    expect(res.failures).toEqual(["横の位置に cos() を使いましょう", "縦の位置に sin() を使いましょう"]);
  });

  it("names the first dot that is off its guide", () => {
    const { challenge } = lessonById("math-trig")!;
    const solved = GEOMETRY_RECORDINGS["math-trig"].solution;
    // Radius 100px instead of 80px: dot 1 moves 20px to the right.
    const res = evaluate(challenge.validators, geometrySnapshot(challenge.solution, { ...solved, d1: { rect: [194, 94, 32, 32] } }));
    expect(res.failures).toEqual(["1 番の点が目印に重なっていません"]);
  });

  it("does not accept a perspective that is set but different", () => {
    const { challenge } = lessonById("transform-perspective")!;
    // perspective: 800px, recorded: a weaker depth makes the card 108.3px tall.
    const res = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution, {
        stage: { rect: [0, 0, 260, 180], computed: { perspective: "800px" } },
        card: { rect: [74.31, 35.85, 103.45, 108.3] },
      }),
    );
    expect(res.failures).toHaveLength(2);
  });

  it("flags faces still pressed flat although preserve-3d is written (e.g. opacity on the cube)", () => {
    const { challenge } = lessonById("transform-preserve-3d")!;
    const flat = GEOMETRY_RECORDINGS["transform-preserve-3d"].starter;
    const res = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution, { ...flat, cube: { ...flat.cube, computed: { "transform-style": "preserve-3d" } } }),
    );
    expect(res.failures).toEqual([
      "右と上の面が平面に押しつぶされたままです（.cube に opacity や filter などがあると preserve-3d が効きません）",
    ]);
  });
});
