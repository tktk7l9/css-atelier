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
const GREEN = "rgb(47, 157, 91)";
const OCHRE = "rgb(185, 121, 27)";
const YELLOW = "rgb(245, 196, 0)";
const RED = "rgb(217, 54, 54)";
const FIELD = "rgb(197, 205, 224)";
const SRGB_BAR = `linear-gradient(to right, ${BRAND}, ${YELLOW})`;

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
  "gradient-stripes": {
    starter: { tape: { "background-image": "none" } },
    solution: {
      tape: { "background-image": `repeating-linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 12px, ${INK} 12px, ${INK} 24px)` },
    },
  },
  "gradient-conic": {
    starter: { pie: { "background-image": "none" } },
    solution: {
      pie: {
        "background-image": `conic-gradient(${BRAND} 0%, ${BRAND} 50%, ${GREEN} 50%, ${GREEN} 80%, ${OCHRE} 80%, ${OCHRE} 100%)`,
      },
    },
  },
  "gradient-oklch": {
    starter: { before: { "background-image": SRGB_BAR }, after: { "background-image": SRGB_BAR } },
    solution: {
      before: { "background-image": SRGB_BAR },
      after: { "background-image": `linear-gradient(to right in oklch, ${BRAND}, ${YELLOW})` },
    },
  },
  "writing-orientation": {
    starter: {
      text: { "text-orientation": "mixed", "writing-mode": "vertical-rl" },
      abbr: { "text-orientation": "mixed", "writing-mode": "vertical-rl" },
      word: { "text-orientation": "mixed", "writing-mode": "vertical-rl" },
    },
    solution: {
      text: { "text-orientation": "mixed", "writing-mode": "vertical-rl" },
      abbr: { "text-orientation": "upright", "writing-mode": "vertical-rl" },
      word: { "text-orientation": "mixed", "writing-mode": "vertical-rl" },
    },
  },
  "writing-tcy": {
    starter: {
      text: { "text-combine-upright": "none" },
      month: { "text-combine-upright": "none" },
      day: { "text-combine-upright": "none" },
      hour: { "text-combine-upright": "none" },
    },
    solution: {
      text: { "text-combine-upright": "none" },
      month: { "text-combine-upright": "all" },
      day: { "text-combine-upright": "all" },
      hour: { "text-combine-upright": "all" },
    },
  },
  "form-accent-color": {
    starter: {
      form: { "accent-color": "auto" },
      check: { "accent-color": "auto" },
      radio: { "accent-color": "auto" },
      range: { "accent-color": "auto" },
      progress: { "accent-color": "auto" },
    },
    solution: {
      form: { "accent-color": GREEN },
      check: { "accent-color": GREEN },
      radio: { "accent-color": GREEN },
      range: { "accent-color": GREEN },
      progress: { "accent-color": GREEN },
    },
  },
  "form-user-invalid": {
    // The hidden `untouched` input can never be interacted with.
    starter: {
      mail: { "border-top-color": RED },
      nick: { "border-top-color": RED },
      untouched: { "border-top-color": RED },
    },
    solution: {
      mail: { "border-top-color": FIELD },
      nick: { "border-top-color": FIELD },
      untouched: { "border-top-color": FIELD },
    },
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
  "writing-vertical": {
    starter: {
      page: { rect: [0, 0, 596, 200], computed: { "writing-mode": "horizontal-tb" } },
      p1: { rect: [16, 12, 564, 28.8] },
      p2: { rect: [16, 56.8, 564, 28.8] },
    },
    solution: {
      page: { rect: [0, 0, 207.98, 200], computed: { "writing-mode": "vertical-rl" } },
      p1: { rect: [105.59, 12, 86.39, 176] },
      p2: { rect: [32, 12, 57.59, 176] },
    },
  },
  // The sticky previews open scrolled to the far end (column-reverse / row-reverse),
  // so a header or column that does not stick is out of view (negative y / x).
  "sticky-header": {
    starter: {
      box: { rect: [0, 0, 596, 220] },
      head: { rect: [0, -201.52, 581, 42.39], computed: { position: "static", top: "auto" } },
    },
    solution: {
      box: { rect: [0, 0, 596, 220] },
      head: { rect: [0, 0, 581, 42.39], computed: { position: "sticky", top: "0px" } },
    },
  },
  "sticky-column": {
    starter: {
      scroller: { rect: [0, 0, 300, 172.56] },
      corner: { rect: [-156, 0, 72, 39.39] },
      name1: { rect: [-156, 39.39, 72, 39.39], computed: { position: "static", left: "auto" } },
      name3: { rect: [-156, 118.17, 72, 39.39] },
    },
    solution: {
      scroller: { rect: [0, 0, 300, 172.56] },
      corner: { rect: [0, 0, 72, 39.39] },
      name1: { rect: [0, 39.39, 72, 39.39], computed: { position: "sticky", left: "0px" } },
      name3: { rect: [0, 118.17, 72, 39.39] },
    },
  },
  "sticky-sidebar": {
    starter: {
      box: { rect: [0, 0, 596, 220] },
      side: { rect: [8, -178.25, 120, 398.25], computed: { position: "sticky", "align-self": "auto" } },
    },
    solution: {
      box: { rect: [0, 0, 596, 220] },
      side: { rect: [8, 0, 120, 112], computed: { position: "sticky", "align-self": "start" } },
    },
  },
  "form-appearance": {
    starter: {
      off: { rect: [0, 1.19, 20, 20], computed: { appearance: "auto" } },
      on: { rect: [0, 33.58, 20, 20], computed: { appearance: "auto" } },
    },
    solution: {
      off: { rect: [0, 1.19, 20, 20], computed: { appearance: "none" } },
      on: { rect: [0, 33.58, 20, 20], computed: { appearance: "none" } },
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

  it("accepts the ways browsers serialize the same stripes, pie and oklch mix, and rejects other pictures", () => {
    const cases: Array<[string, string, string, boolean]> = [
      // [lesson, element, computed background-image, passes]
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW}, ${YELLOW} 12px, ${INK} 12px, ${INK} 24px)`, true],
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 12px, ${INK} 0px, ${INK} 24px)`, true],
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW} 0px 12px, ${INK} 12px 24px)`, true],
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 12px, rgba(0, 0, 0, 0) 12px, rgba(0, 0, 0, 0) 24px)`, true],
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 12px, ${YELLOW} 12px, ${YELLOW} 24px)`, false], // one colour, no stripes
      ["gradient-stripes", "tape", `repeating-linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 10px, ${INK} 10px, ${INK} 20px)`, false],
      ["gradient-stripes", "tape", `repeating-linear-gradient(to right top, ${YELLOW} 0px, ${YELLOW} 12px, ${INK} 12px, ${INK} 24px)`, false],
      ["gradient-stripes", "tape", `linear-gradient(45deg, ${YELLOW} 0px, ${YELLOW} 12px, ${INK} 12px, ${INK} 24px)`, false],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0deg, ${BRAND} 50%, ${GREEN} 0deg, ${GREEN} 80%, ${OCHRE} 0deg)`, true], // the "0" shorthand
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0deg, ${BRAND} 180deg, ${GREEN} 180deg, ${GREEN} 288deg, ${OCHRE} 288deg, ${OCHRE} 360deg)`, true],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 50%, ${GREEN} 50%, ${GREEN} 80%, ${OCHRE} 80%)`, true],
      ["gradient-conic", "pie", `conic-gradient(${BRAND}, ${BRAND} 50%, ${GREEN} 50%, ${GREEN} 80%, ${OCHRE} 80%, ${OCHRE})`, true],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0% 50%, ${GREEN} 50% 80%, ${OCHRE} 80% 100%)`, true],
      ["gradient-conic", "pie", `conic-gradient(from 90deg, ${BRAND} 0%, ${BRAND} 50%, ${GREEN} 50%, ${GREEN} 80%, ${OCHRE} 80%, ${OCHRE} 100%)`, false],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0%, ${BRAND} 40%, ${GREEN} 40%, ${GREEN} 80%, ${OCHRE} 80%, ${OCHRE} 100%)`, false],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0%, ${BRAND} 50%, ${GREEN} 50%, ${GREEN} 70%, ${OCHRE} 70%, ${OCHRE} 100%)`, false],
      ["gradient-conic", "pie", `conic-gradient(${BRAND} 0%, ${BRAND} 50%, ${GREEN} 50%, ${GREEN} 80%, ${OCHRE} 80%, ${OCHRE} 90%, ${INK} 90%)`, false],
      ["gradient-oklch", "after", `linear-gradient(90deg in oklch, ${BRAND}, ${YELLOW})`, true],
      ["gradient-oklch", "after", `linear-gradient(in oklch to right, ${BRAND}, ${YELLOW})`, true],
      ["gradient-oklch", "after", `linear-gradient(to right in oklch shorter hue, ${BRAND}, ${YELLOW})`, true],
      ["gradient-oklch", "after", `linear-gradient(to right in oklch longer hue, ${BRAND}, ${YELLOW})`, false],
      ["gradient-oklch", "after", `linear-gradient(to right in oklab, ${BRAND}, ${YELLOW})`, false],
      ["gradient-oklch", "after", `linear-gradient(in oklch, ${BRAND}, ${YELLOW})`, false], // lost its direction
    ];
    for (const [id, el, value, passes] of cases) {
      const { challenge } = lessonById(id)!;
      const computed = { ...RECORDINGS[id].solution, [el]: { "background-image": value } };
      const res = evaluate(challenge.validators, snapshotOf(challenge.solution, computed));
      expect(res.passed, `${id}: ${value}`).toBe(passes);
    }
  });

  it("keeps the sRGB bar as it is, for comparison", () => {
    const { challenge } = lessonById("gradient-oklch")!;
    const mixed = `linear-gradient(to right in oklch, ${BRAND}, ${YELLOW})`;
    const res = evaluate(
      challenge.validators,
      snapshotOf(challenge.solution, { before: { "background-image": mixed }, after: { "background-image": mixed } }),
    );
    expect(res.failures).toEqual(["比べられるように、上の帯（.before）は既定（sRGB）のままにしておきましょう"]);
  });

  it("does not accept text-orientation or text-combine-upright on the whole paragraph (both are inherited)", () => {
    const orientation = lessonById("writing-orientation")!.challenge;
    const upright = { "text-orientation": "upright", "writing-mode": "vertical-rl" };
    // Recorded: on .text, the long word inherits upright as well.
    const res1 = evaluate(
      orientation.validators,
      snapshotOf(orientation.starterCSS.replace("height: 240px;", "height: 240px;\n  text-orientation: upright;"), {
        text: upright,
        abbr: upright,
        word: upright,
      }),
    );
    expect(res1.failures).toEqual(["長い英単語（.word）まで立っています。段落全体ではなく .abbr にだけ指定しましょう"]);

    const tcy = lessonById("writing-tcy")!.challenge;
    const all = { "text-combine-upright": "all" };
    // Recorded: on .text, every run of the sentence is squeezed into one character.
    const res2 = evaluate(
      tcy.validators,
      snapshotOf(tcy.starterCSS.replace("height: 240px;", "height: 240px;\n  text-combine-upright: all;"), {
        text: all,
        month: all,
        day: all,
        hour: all,
      }),
    );
    expect(res2.failures).toEqual(["段落（.text）全体が縦中横になっています。数字の .tcy にだけ指定しましょう"]);
  });

  it("wants the accent colour on the form, so that the progress bar inherits it too", () => {
    const { challenge } = lessonById("form-accent-color")!;
    const green = { "accent-color": GREEN };
    const auto = { "accent-color": "auto" };
    // Recorded: `input { accent-color }` leaves the <progress> bar on auto.
    const res = evaluate(
      challenge.validators,
      snapshotOf(challenge.starterCSS + "input { accent-color: #2f9d5b; }\n", {
        form: auto,
        check: green,
        radio: green,
        range: green,
        progress: auto,
      }),
    );
    expect(res.passed).toBe(false);
  });

  it("judges :user-invalid on the untouched field, whatever the learner typed into the preview", () => {
    const { challenge } = lessonById("form-user-invalid")!;
    const border = (color: string) => ({ "border-top-color": color });
    // Recorded: typing "abc" into the e-mail field and leaving it turns that field red.
    const typed = evaluate(
      challenge.validators,
      snapshotOf(challenge.solution, { mail: border(RED), nick: border(FIELD), untouched: border(FIELD) }),
    );
    expect(typed.failures).toEqual([]);
    // Recorded: keeping :invalid next to :user-invalid paints every field red from the start.
    const kept = evaluate(
      challenge.validators,
      snapshotOf(challenge.solution.replace("input:user-invalid {", "input:invalid,\ninput:user-invalid {"), {
        mail: border(RED),
        nick: border(RED),
        untouched: border(RED),
      }),
    );
    expect(kept.failures).toEqual(["まだ触っていない欄まで、最初から赤くなっています（:invalid は入力する前から当てはまります）"]);
    // Deleting the rule removes the red border too, but never tells the user about a mistake.
    const deleted = evaluate(
      challenge.validators,
      snapshotOf(challenge.starterCSS.replace(/\/\* 入力に誤り[\s\S]*$/, ""), {
        mail: border(FIELD),
        nick: border(FIELD),
        untouched: border(FIELD),
      }),
    );
    expect(deleted.failures).toEqual([":invalid の代わりに :user-invalid を使いましょう"]);
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

  it("checks that the paragraphs really run right to left, not just the writing-mode value", () => {
    const { challenge } = lessonById("writing-vertical")!;
    const vertical = GEOMETRY_RECORDINGS["writing-vertical"].solution;
    // Recorded: a vertical-rl flex container stacks the paragraphs in one column.
    const flex = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution.replace("writing-mode: vertical-rl;", "writing-mode: vertical-rl;\n  display: flex;"), {
        page: { rect: [0, 0, 191.98, 200], computed: { "writing-mode": "vertical-rl" } },
        p1: { rect: [32, 12, 143.98, 104.84] },
        p2: { rect: [32, 116.84, 143.98, 71.16] },
      }),
    );
    expect(flex.failures).toEqual(["段落が右から左へ並んでいません（一つ目の段落が右端に来ます）"]);
    // Recorded: vertical-lr puts the first paragraph on the left.
    const lr = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution.replace("vertical-rl", "vertical-lr"), {
        page: { rect: [0, 0, 207.98, 200], computed: { "writing-mode": "vertical-lr" } },
        p1: { rect: [16, 12, 86.39, 176] },
        p2: { rect: [118.39, 12, 57.59, 176] },
      }),
    );
    expect(lr.failures).toEqual([".page に writing-mode: vertical-rl を指定しましょう"]);
    // Recorded: the old SVG spelling tb-rl computes to vertical-rl and lays out the same.
    const tbRl = evaluate(challenge.validators, geometrySnapshot(challenge.solution.replace("vertical-rl", "tb-rl"), vertical));
    expect(tbRl.failures).toEqual([]);
  });

  it("needs an inset for sticky to stick, and accepts the logical one", () => {
    const { challenge } = lessonById("sticky-header")!;
    const box = GEOMETRY_RECORDINGS["sticky-header"].starter.box;
    // Recorded: sticky without top scrolls away like any other element.
    const noTop = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS.replace("background: #18203a;\n", "background: #18203a;\n  position: sticky;\n"), {
        box,
        head: { rect: [0, -201.52, 581, 42.39], computed: { position: "sticky", top: "auto" } },
      }),
    );
    expect(noTop.failures).toEqual(["sticky だけでは止まる位置が決まりません。top: 0 も指定しましょう"]);
    // Recorded: inset-block-start: 0 computes to top: 0px and sticks.
    const logical = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS.replace("background: #18203a;\n", "background: #18203a;\n  position: sticky;\n  inset-block-start: 0;\n"), {
        box,
        head: { rect: [0, 0, 581, 42.39], computed: { position: "sticky", top: "0px" } },
      }),
    );
    expect(logical.failures).toEqual([]);
    // Scrolled back to the very top, a header that is not sticky also touches the top edge.
    const atTop = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS, { box, head: { rect: [0, 0, 581, 42.39], computed: { position: "static", top: "auto" } } }),
    );
    expect(atTop.passed).toBe(false);
  });

  it("wants the first cell of every row to stick, not only the header cell", () => {
    const { challenge } = lessonById("sticky-column")!;
    const { scroller, name3 } = GEOMETRY_RECORDINGS["sticky-column"].starter;
    // Recorded: `.sheet thead th:first-child` sticks the corner cell only.
    const res = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS + ".sheet thead th:first-child { position: sticky; left: 0; }\n", {
        scroller,
        corner: { rect: [0, 0, 72, 39.39] },
        name1: { rect: [-156, 39.39, 72, 39.39], computed: { position: "static", left: "auto" } },
        name3,
      }),
    );
    expect(res.failures).toEqual(["1 列目（.sheet tr > :first-child）に position: sticky を指定しましょう"]);
  });

  it("accepts any way of un-stretching the sidebar, as long as it stays sticky", () => {
    const { challenge } = lessonById("sticky-sidebar")!;
    const box = GEOMETRY_RECORDINGS["sticky-sidebar"].starter.box;
    // Recorded: height: fit-content stops the stretch as well.
    const fit = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS.replace("background: #eef1f8;\n}", "background: #eef1f8;\n  height: fit-content;\n}"), {
        box,
        side: { rect: [8, 0, 120, 112], computed: { position: "sticky", "align-self": "auto" } },
      }),
    );
    expect(fit.failures).toEqual([]);
    // Recorded: align-self: start without sticky stays at the top of the layout, out of view.
    const noSticky = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution.replace("position: sticky;", "position: static;"), {
        box,
        side: { rect: [8, -178.25, 120, 112], computed: { position: "static", "align-self": "start" } },
      }),
    );
    expect(noSticky.failures).toEqual(["サイドバーの position: sticky は残しておきましょう"]);
    // Scrolled back to the very top, the stretched sidebar touches the top edge but is still a full row tall.
    const atTop = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS, { box, side: { rect: [8, 0, 120, 398.25], computed: { position: "sticky", "align-self": "auto" } } }),
    );
    expect(atTop.failures).toEqual(["サイドバーがグリッドの行の高さいっぱいに引き伸ばされています（align-self: start で中身の高さに）"]);
  });

  it("accepts the -webkit- spelling of appearance, but not a checkbox that lost its size", () => {
    const { challenge } = lessonById("form-appearance")!;
    const none = { appearance: "none" };
    // Recorded: -webkit-appearance: none computes to appearance: none.
    const webkit = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.starterCSS.replace(".opt input {\n", ".opt input {\n  -webkit-appearance: none;\n"), {
        off: { rect: [0, 1.19, 20, 20], computed: none },
        on: { rect: [0, 33.58, 20, 20], computed: none },
      }),
    );
    expect(webkit.failures).toEqual([]);
    // Recorded: without width and height it shrinks to its 2px borders.
    const tiny = evaluate(
      challenge.validators,
      geometrySnapshot(challenge.solution.replace("  width: 20px;\n  height: 20px;\n", ""), {
        off: { rect: [0, 9.19, 4, 4], computed: none },
        on: { rect: [0, 41.58, 4, 4], computed: none },
      }),
    );
    expect(tiny.failures).toEqual(["チェックボックスの大きさ（20px × 20px）は変えないでおきましょう"]);
  });
});
