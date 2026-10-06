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
};

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
});
