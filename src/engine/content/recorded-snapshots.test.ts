import { describe, expect, it } from "vitest";
import { TRACKS, loadTrack } from "./index.js";
import type { Lesson } from "./types.js";
import { evaluate } from "../validate/run.js";
import { parseCss } from "../validate/css-parse.js";
import type { Snapshot } from "../validate/snapshot.js";

// Lessons load with their track on demand; load them all once to replay them.
const LOADED = new Map<string, Lesson>(
  (await Promise.all(TRACKS.map((t) => loadTrack(t.id)))).flatMap((t) =>
    t.lessons.map((l) => [l.id, l] as const),
  ),
);
const lessonById = (id: string): Lesson | undefined => LOADED.get(id);

// Lessons graded only by computed values and the CSS text can be replayed in
// Node: the computed values below were recorded from the real sandbox (headless
// Chrome 154; 155 for the lessons added since) for the starter CSS and for the
// reference solution. Each lesson must fail on its starter and pass on its
// solution.

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
const GLASS = "rgba(255, 255, 255, 0.4)";

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
  "supports-selector": {
    // The first plan starts selected; the fallback opens every detail.
    starter: { d1: { display: "block" }, d2: { display: "block" } },
    solution: { d1: { display: "block" }, d2: { display: "none" } },
  },
  "supports-or": {
    starter: { caption: { "background-color": "rgba(255, 255, 255, 0.9)" } },
    solution: { caption: { "background-color": GLASS } },
  },
  "has-sibling": {
    starter: { title1: { "margin-bottom": "16px" }, title2: { "margin-bottom": "16px" } },
    solution: { title1: { "margin-bottom": "4px" }, title2: { "margin-bottom": "16px" } },
  },
  "has-empty": {
    starter: { none1: { display: "none" }, none2: { display: "none" } },
    solution: { none1: { display: "none" }, none2: { display: "block" } },
  },
};

// Lessons graded by geometry as well: the rects ([x, y, w, h], from
// getBoundingClientRect) were recorded from the same real sandbox.
type Box = readonly [number, number, number, number];
type Recorded = Record<string, { readonly rect?: Box; readonly computed?: Record<string, string> }>;

/** The three 120px thumbnails, with their recorded object-fit. */
const thumbs = (fit: string, h = 120): Recorded => ({
  t1: { rect: [0, 0, 120, h], computed: { "object-fit": fit } },
  t2: { rect: [132, 0, 120, h], computed: { "object-fit": fit } },
  t3: { rect: [264, 0, 120, h], computed: { "object-fit": fit } },
});

/** The two 140 × 80 logo boxes, with their recorded object-fit. */
const logos = (fit: string, h = 80): Recorded => ({
  wide: { rect: [0, 24.19, 140, h], computed: { "object-fit": fit } },
  tall: { rect: [152, 24.19, 140, h], computed: { "object-fit": fit } },
});

/** Cards filling their grid cells: the fallback no longer applies. */
const GRID_CARDS: Recorded = {
  cards: { rect: [0, 0, 596, 104.78] },
  c1: { rect: [0, 0, 190.66, 46.39] },
  c2: { rect: [202.66, 0, 190.67, 46.39] },
  c3: { rect: [405.33, 0, 190.67, 46.39] },
};

/** The three titles kept on one 41px line, with the recorded overflow-x. */
const oneLineTitles = (overflow: string): Recorded => ({
  t1: { rect: [1, 1, 238, 41], computed: { "overflow-x": overflow, "text-overflow": "ellipsis" } },
  t2: { rect: [1, 42, 238, 41], computed: { "overflow-x": overflow, "text-overflow": "ellipsis" } },
  t3: { rect: [1, 83, 238, 41], computed: { "overflow-x": overflow, "text-overflow": "ellipsis" } },
});

/** The chat row (280px wide), its bubble and the URL inside, with overflow-wrap as recorded on each. */
const chat = (wrap: string, bubbleW: number, rowH: number, url: Box, urlWrap = wrap): Recorded => ({
  msg: { rect: [0, 0, 280, rowH], computed: { "overflow-wrap": "normal" } },
  bubble: { rect: [53, 9, bubbleW, rowH - 18], computed: { "overflow-wrap": wrap } },
  url: { rect: url, computed: { "overflow-wrap": urlWrap } },
});

/** The first label cell of the profile and the span holding its text. */
const labelCell = (w: number, h: number, textW = 109.61, textH = 18): Recorded => ({
  l1: { rect: [17, 13, w, h] },
  "l1-text": { rect: [17, 16, textW, textH] },
});

/** The two photo frames, stacked 12px apart. */
const frames = (w1: number, h1: number, w2: number, h2: number): Recorded => ({
  f1: { rect: [0, 0, w1, h1] },
  f2: { rect: [0, h1 + 12, w2, h2] },
});

/** The 280px column, the short heading with its text, and the long heading. */
const headings = (colH: number, short: Box, text: Box, long: Box): Recorded => ({
  col: { rect: [0, 0, 280, colH] },
  short: { rect: short },
  "short-text": { rect: text },
  long: { rect: long },
});

/** The 300 × 170 thumbnail with its 56px play button and, when given, the running time. */
const thumbnail = (play: Box, time?: Box): Recorded => ({
  thumb: { rect: [0, 0, 300, 170] },
  play: { rect: play },
  ...(time ? { time: { rect: time } } : {}),
});

/** The middle stamp of the wide card (300 × 160) and of the square one (180 × 180). */
const stampCards = (w5: Box, s5: Box): Recorded => ({
  wide: { rect: [0, 0, 300, 160] },
  w5: { rect: w5 },
  square: { rect: [312, 0, 180, 180] },
  s5: { rect: s5 },
});

/** The two product cards with their ribbons, and the first card's position. */
const ribbonCards = (position: string, r1: Box, r2: Box, cardH = 80.78): Recorded => ({
  card1: { rect: [0, 0, 180, cardH], computed: { position } },
  r1: { rect: r1 },
  card2: { rect: [196, 0, 180, cardH] },
  r2: { rect: r2 },
});

/** The left-to-right note and the right-to-left note (320 × 48), each with its close button. */
const notes = (closeJa: Box, closeAr: Box): Recorded => ({
  ja: { rect: [0, 0, 320, 48] },
  "close-ja": { rect: closeJa },
  ar: { rect: [0, 60, 320, 48] },
  "close-ar": { rect: closeAr },
});

/** The gauge, its needle and the hub at the needle's foot. */
const gauge = (needle: Box): Recorded => ({
  gauge: { rect: [16, 16, 200, 100] },
  needle: { rect: needle },
  hub: { rect: [108, 108, 16, 16] },
});

/** The three stickers; the first and third tilted by -6deg and -3deg as in the starter. */
const stickers = (s2: Box, scale: string, s1: Box = [21.14, 18.94, 105.72, 70.12], s3: Box = [270.5, 21.42, 103, 65.15]): Recorded => ({
  s1: { rect: s1 },
  s2: { rect: s2, computed: { scale } },
  s3: { rect: s3 },
});

/** The two 200 × 130 photos and the labels laid over them. */
const labelled = (b1: Box, b2: Box): Recorded => ({
  p1: { rect: [0, 0, 200, 130] },
  b1: { rect: b1 },
  p2: { rect: [216, 0, 200, 130] },
  b2: { rect: b2 },
});

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
  "fit-cover": {
    starter: thumbs("fill"),
    solution: thumbs("cover"),
  },
  "fit-position": {
    starter: { hero: { rect: [0, 0, 300, 120], computed: { "object-fit": "cover", "object-position": "50% 50%" } } },
    solution: { hero: { rect: [0, 0, 300, 120], computed: { "object-fit": "cover", "object-position": "50% 0%" } } },
  },
  "fit-contain": {
    starter: logos("cover"),
    solution: logos("contain"),
  },
  // The float fallback's width: 31% is taken of the grid cell, so the cards shrink to 59px.
  "supports-not": {
    starter: {
      cards: { rect: [0, 0, 596, 171.95] },
      c1: { rect: [0, 0, 59.09, 68.78] },
      c2: { rect: [202.66, 0, 59.09, 68.78] },
      c3: { rect: [405.33, 0, 59.09, 68.78] },
    },
    solution: GRID_CARDS,
  },
  // One line is 24px plus 8px padding above and below and the 1px border.
  "overflow-ellipsis": {
    starter: {
      t1: { rect: [1, 1, 238, 89], computed: { "overflow-x": "visible", "text-overflow": "ellipsis" } },
      t2: { rect: [1, 90, 238, 65], computed: { "overflow-x": "visible", "text-overflow": "ellipsis" } },
      t3: { rect: [1, 155, 238, 89], computed: { "overflow-x": "visible", "text-overflow": "ellipsis" } },
    },
    solution: oneLineTitles("hidden"),
  },
  "overflow-line-clamp": {
    starter: { summary: { rect: [17, 41.39, 246, 168], computed: { "-webkit-line-clamp": "none", "overflow-y": "visible" } } },
    solution: { summary: { rect: [17, 41.39, 246, 72], computed: { "-webkit-line-clamp": "3", "overflow-y": "hidden" } } },
  },
  // Unwrapped, the bubble is as wide as the URL (a flex item never shrinks below its min-content width).
  "overflow-wrap-anywhere": {
    starter: chat("normal", 548.73, 85.19, [65, 45.59, 524.73, 18]),
    solution: chat("anywhere", 218, 136.38, [65, 45.59, 192.05, 69.19]),
  },
  "has-quantity": {
    starter: {
      a1: { rect: [0, 22.19, 107, 80.25] },
      a3: { rect: [0, 108.44, 107, 80.25] },
      b1: { rect: [240, 22.19, 107, 80.25] },
      b3: { rect: [240, 108.44, 107, 80.25] },
    },
    solution: {
      a1: { rect: [0, 22.19, 107, 80.25] },
      a3: { rect: [0, 108.44, 107, 80.25] },
      b1: { rect: [240, 22.19, 69.33, 51.98] },
      b3: { rect: [390.66, 22.19, 69.34, 52] },
    },
  },
  // A 6em column wraps the longest label onto two lines; max-content ends the column where the label ends.
  "size-max-content": {
    starter: labelCell(96, 48, 94.56, 42),
    solution: labelCell(109.61, 24),
  },
  // The frames span the preview until min-content fits them to the 160px and 120px photos (+ 8px padding each side).
  "size-min-content": {
    starter: frames(596, 142, 596, 162),
    solution: frames(176, 182, 136, 222),
  },
  "size-fit-content": {
    starter: headings(165.19, [0, 0, 280, 31], [0, 3, 72, 21], [0, 78.59, 280, 59]),
    solution: headings(165.19, [0, 0, 72, 31], [0, 3, 72, 21], [0, 78.59, 280, 59]),
  },
  "grid-place-items": {
    starter: thumbnail([0, 0, 56, 56]),
    solution: thumbnail([122, 57, 56, 56]),
  },
  // The parent's place-items: center puts the running time over the play button.
  "grid-place-self": {
    starter: thumbnail([122, 57, 56, 56], [125.09, 73, 49.81, 24]),
    solution: thumbnail([122, 57, 56, 56], [250.19, 146, 49.81, 24]),
  },
  "grid-place-content": {
    starter: stampCards([48, 48, 40, 40], [360, 48, 40, 40]),
    solution: stampCards([130, 60, 40, 40], [382, 70, 40, 40]),
  },
  // Without a positioned card, both ribbons go to the top-right corner of the preview.
  "position-relative": {
    starter: ribbonCards("static", [547.2, 0, 48.8, 24], [547.2, 0, 48.8, 24]),
    solution: ribbonCards("relative", [131.2, 0, 48.8, 24], [327.2, 0, 48.8, 24]),
  },
  // top: 0 and left: 0 alone shrink the cover to its text.
  "position-inset": {
    starter: { item: { rect: [0, 0, 220, 178.78] }, cover: { rect: [0, 0, 80, 28] } },
    solution: { item: { rect: [0, 0, 220, 178.78] }, cover: { rect: [0, 0, 220, 178.78] } },
  },
  "position-logical": {
    starter: notes([288, 0, 32, 32], [288, 60, 32, 32]),
    solution: notes([288, 0, 32, 32], [0, 60, 32, 32]),
  },
  // Turned about its middle, the needle floats 50px above the hub; turned about its foot, it reaches MAX.
  "transform-origin": {
    starter: gauge([66, 63, 100, 6]),
    solution: gauge([116, 113, 100, 6]),
  },
  // transform: scale(1.25) replaces the tilt (125 × 75); tilted by 4deg and enlarged, the box is 129.93 × 83.54.
  "transform-individual": {
    starter: stickers([135.5, 16.5, 125, 75], "none"),
    solution: stickers([133.04, 12.23, 129.93, 83.54], "1.25"),
  },
  "transform-translate-percent": {
    starter: labelled([100, 65, 86.05, 28], [316, 65, 149.63, 28]),
    solution: labelled([56.98, 51, 86.05, 28], [241.19, 51, 149.63, 28]),
  },
  // Multi-column, float / shape and table lessons (headless Chrome 155).
  "multicol-columns": {
    starter: { news: { rect: [0, 0, 280, 202], computed: {"column-count":"auto","column-width":"auto"} }, n1: { rect: [1, 9, 278, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 278, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 278, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [1, 105, 278, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [1, 137, 278, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [1, 169, 278, 24], computed: {"column-count":"auto","column-width":"auto"} } },
    solution: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"2","column-width":"auto"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  "multicol-span": {
    starter: { news: { rect: [0, 0, 280, 139], computed: {"column-span":"none"} }, head: { rect: [1, 9, 127, 58], computed: {"column-span":"none"} }, n1: { rect: [1, 75, 127, 24], computed: {"column-span":"none"} }, n2: { rect: [1, 107, 127, 24], computed: {"column-span":"none"} }, n3: { rect: [152, 9, 127, 24], computed: {"column-span":"none"} }, n4: { rect: [152, 41, 127, 24], computed: {"column-span":"none"} }, n5: { rect: [152, 73, 127, 24], computed: {"column-span":"none"} }, n6: { rect: [152, 105, 127, 24], computed: {"column-span":"none"} } },
    solution: { news: { rect: [0, 0, 280, 144], computed: {"column-span":"none"} }, head: { rect: [1, 9, 278, 30], computed: {"column-span":"all"} }, n1: { rect: [1, 47, 127, 24], computed: {"column-span":"none"} }, n2: { rect: [1, 79, 127, 24], computed: {"column-span":"none"} }, n3: { rect: [1, 111, 127, 24], computed: {"column-span":"none"} }, n4: { rect: [152, 47, 127, 24], computed: {"column-span":"none"} }, n5: { rect: [152, 79, 127, 24], computed: {"column-span":"none"} }, n6: { rect: [152, 111, 127, 24], computed: {"column-span":"none"} } },
  },
  "multicol-break": {
    starter: { wrap: { rect: [0, 0, 280, 176], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"auto"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"auto"} }, c3: { rect: [0, 0, 280, 176], computed: {"break-inside":"auto"} }, c4: { rect: [152, 40, 128, 48], computed: {"break-inside":"auto"} }, c5: { rect: [152, 96, 128, 72], computed: {"break-inside":"auto"} } },
    solution: { wrap: { rect: [0, 0, 280, 208], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"avoid"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"avoid"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"avoid"} }, c4: { rect: [152, 0, 128, 48], computed: {"break-inside":"avoid"} }, c5: { rect: [152, 56, 128, 72], computed: {"break-inside":"avoid"} } },
  },
  "float-left": {
    starter: { para: { rect: [0, 0, 320, 376], computed: {"float":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"float":"none"} }, l1: { rect: [0, 160, 92, 24], computed: {"float":"none"} }, l2: { rect: [0, 184, 92, 24], computed: {"float":"none"} }, l3: { rect: [0, 208, 78, 24], computed: {"float":"none"} }, l4: { rect: [0, 232, 92, 24], computed: {"float":"none"} }, l5: { rect: [0, 256, 92, 24], computed: {"float":"none"} }, l6: { rect: [0, 280, 64, 24], computed: {"float":"none"} }, l7: { rect: [0, 304, 92, 24], computed: {"float":"none"} }, l8: { rect: [0, 328, 92, 24], computed: {"float":"none"} }, l9: { rect: [0, 352, 134, 24], computed: {"float":"none"} } },
    solution: { para: { rect: [0, 0, 320, 216], computed: {"float":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"float":"left"} }, l1: { rect: [160, 0, 92, 24], computed: {"float":"none"} }, l2: { rect: [160, 24, 92, 24], computed: {"float":"none"} }, l3: { rect: [160, 48, 78, 24], computed: {"float":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"float":"none"} }, l5: { rect: [160, 96, 92, 24], computed: {"float":"none"} }, l6: { rect: [160, 120, 64, 24], computed: {"float":"none"} }, l7: { rect: [160, 144, 92, 24], computed: {"float":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"float":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"float":"none"} } },
  },
  "shape-circle": {
    starter: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"none"} }, l1: { rect: [160, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [160, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [160, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [160, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [160, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [160, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
    solution: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"circle()"} }, l1: { rect: [137.13, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [153.31, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [159.59, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [158.38, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [149.28, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [128, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  "shape-margin": {
    starter: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"0px"} }, l1: { rect: [134.14, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [158.81, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [169.45, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [172, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [171.89, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [166.94, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [152.78, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [116.97, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
    solution: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"12px"} }, l1: { rect: [153.95, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [172.78, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [181.8, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [184, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [183.91, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [179.63, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [167.89, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [143.84, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  "table-collapse": {
    starter: { sheet: { rect: [0, 0, 248, 96.78], computed: {"border-collapse":"separate"} }, h1: { rect: [2, 2, 80, 29.59], computed: {"border-collapse":"separate"} }, h2: { rect: [84, 2, 80, 29.59], computed: {"border-collapse":"separate"} }, h3: { rect: [166, 2, 80, 29.59], computed: {"border-collapse":"separate"} }, a1: { rect: [2, 33.59, 80, 29.59], computed: {"border-collapse":"separate"} }, a2: { rect: [84, 33.59, 80, 29.59], computed: {"border-collapse":"separate"} }, a3: { rect: [166, 33.59, 80, 29.59], computed: {"border-collapse":"separate"} }, b1: { rect: [2, 65.19, 80, 29.59], computed: {"border-collapse":"separate"} }, b2: { rect: [84, 65.19, 80, 29.59], computed: {"border-collapse":"separate"} }, b3: { rect: [166, 65.19, 80, 29.59], computed: {"border-collapse":"separate"} } },
    solution: { sheet: { rect: [0, 0, 241, 86.78], computed: {"border-collapse":"collapse"} }, h1: { rect: [0.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, h2: { rect: [80.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, h3: { rect: [160.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, a1: { rect: [0.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, a2: { rect: [80.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, a3: { rect: [160.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, b1: { rect: [0.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} }, b2: { rect: [80.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} }, b3: { rect: [160.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} } },
  },
  "table-fixed": {
    starter: { wrap: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"auto"} }, h1: { rect: [0.5, 0.5, 54.8, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [55.3, 0.5, 269.89, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [325.19, 0.5, 34.31, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 54.8, 48.19], computed: {"table-layout":"auto"} }, a2: { rect: [55.3, 29.09, 269.89, 48.19], computed: {"table-layout":"auto"} }, a3: { rect: [325.19, 29.09, 34.31, 48.19], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 77.28, 54.8, 48.19], computed: {"table-layout":"auto"} }, b2: { rect: [55.3, 77.28, 269.89, 48.19], computed: {"table-layout":"auto"} }, b3: { rect: [325.19, 77.28, 34.31, 48.19], computed: {"table-layout":"auto"} } },
    solution: { wrap: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"fixed"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"table-layout":"auto"} } },
  },
  "table-caption": {
    starter: { wrap: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, sheet: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, cap: { rect: [0, 0, 360, 27.59], computed: {"caption-side":"top"} }, h1: { rect: [0.5, 28.09, 119.66, 28.59], computed: {"caption-side":"top"} }, h2: { rect: [120.16, 28.09, 119.66, 28.59], computed: {"caption-side":"top"} }, h3: { rect: [239.81, 28.09, 119.69, 28.59], computed: {"caption-side":"top"} }, a1: { rect: [0.5, 56.69, 119.66, 87.38], computed: {"caption-side":"top"} }, a2: { rect: [120.16, 56.69, 119.66, 87.38], computed: {"caption-side":"top"} }, a3: { rect: [239.81, 56.69, 119.69, 87.38], computed: {"caption-side":"top"} }, b1: { rect: [0.5, 144.06, 119.66, 28.59], computed: {"caption-side":"top"} }, b2: { rect: [120.16, 144.06, 119.66, 28.59], computed: {"caption-side":"top"} }, b3: { rect: [239.81, 144.06, 119.69, 28.59], computed: {"caption-side":"top"} } },
    solution: { wrap: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, sheet: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"bottom"} }, cap: { rect: [0, 145.56, 360, 27.59], computed: {"caption-side":"bottom"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"caption-side":"bottom"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"caption-side":"bottom"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"caption-side":"bottom"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"caption-side":"bottom"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"caption-side":"bottom"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"caption-side":"bottom"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"caption-side":"bottom"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"caption-side":"bottom"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"caption-side":"bottom"} } },
  },
};

/** The lessons added with the intrinsic sizing, grid alignment, positioning, 2D transform, multi-column, shape and table tracks. */
const NEW_GEOMETRY_LESSONS = [
  "size-max-content",
  "size-min-content",
  "size-fit-content",
  "grid-place-items",
  "grid-place-self",
  "grid-place-content",
  "position-relative",
  "position-inset",
  "position-logical",
  "transform-origin",
  "transform-individual",
  "transform-translate-percent",
  "multicol-columns",
  "multicol-span",
  "multicol-break",
  "float-left",
  "shape-circle",
  "shape-margin",
  "table-collapse",
  "table-fixed",
  "table-caption",
];

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

  it("keeps one plan's detail open whichever plan is picked, and wants the fallback moved, not deleted", () => {
    const { challenge } = lessonById("supports-selector")!;
    const run = (css: string, d1: string, d2: string): readonly string[] =>
      evaluate(challenge.validators, snapshotOf(css, { d1: { display: d1 }, d2: { display: d2 } })).failures;
    // Recorded: picking the second plan in the preview swaps which detail is open.
    expect(run(challenge.solution, "none", "block")).toEqual([]);
    expect(run(challenge.starterCSS, "block", "block")).toEqual([
      "選んでいないプランの説明まで開いています（:has() に対応したブラウザでも、最後のルールが効いています）",
    ]);
    // Recorded: in a current browser, deleting the fallback looks the same as the answer.
    const deleted = challenge.starterCSS.replace(/\/\* :has\(\) に対応していない[\s\S]*$/, "");
    expect(run(deleted, "block", "none")).toEqual(["最後のルールを @supports not selector(:has(*)) { … } で囲みましょう"]);
    // Recorded: a positive query keeps the fallback in a current browser.
    expect(run(challenge.solution.replace("@supports not selector", "@supports selector"), "block", "block")).toHaveLength(1);
    // Recorded: `not (selector(…))` and another selector inside :has() mean the same.
    expect(run(challenge.solution.replace("not selector(:has(*))", "not (selector(:has(a, b)))"), "block", "none")).toEqual([]);
    // Recorded: without the :has() rule, no detail opens at all.
    const noHas = challenge.solution.replace(/\/\* 選んだプラン[^}]*\}\n/, "");
    expect(run(noHas, "none", "none")).toEqual(["選んだプランの説明が開いていません（.plan:has(:checked) .detail のルールは残しておきましょう）"]);
  });

  it("wants the solid fallback behind `not ((…) or (…))`, kept, and with the parentheses right", () => {
    const { challenge } = lessonById("supports-or")!;
    const condition = "not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px)))";
    const run = (css: string, background = GLASS): readonly string[] =>
      evaluate(challenge.validators, snapshotOf(css, { caption: { "background-color": background } })).failures;
    const solid = ".caption {\n  background: rgb(255 255 255 / 0.9);\n}\n";
    // Recorded: every one of these leaves the caption see-through in a current browser.
    expect(run(challenge.solution.replace(condition, "not (backdrop-filter: blur(8px))"))).toEqual([
      "条件には backdrop-filter と -webkit-backdrop-filter の両方を入れて、or でつなぎましょう（Safari 17 以前は -webkit- 付きだけに対応）",
    ]);
    // An invalid condition drops the whole rule, so the fallback never applies anywhere.
    expect(run(challenge.solution.replace(condition, "not (backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))"))).toEqual([
      "not と or を一緒に使うときは、or でつないだ全体をかっこで囲みます: not ((…) or (…))",
    ]);
    expect(run(challenge.solution.replace(condition, "not ((-webkit-backdrop-filter: blur(8px)) or (backdrop-filter: blur(8px)))"))).toEqual([]);
    expect(run(challenge.starterCSS.replace(solid, ""))).toEqual([
      "最後のルールを @supports not (…) { … } で囲みましょう（消してしまうと、すりガラスにできないブラウザで文字が読みにくくなります）",
    ]);
    expect(run(challenge.starterCSS.replace(solid, `@supports ${condition} {\n}\n`))).toEqual([
      "濃い背景のルール（.caption { background: … }）は消さずに、@supports の中へ移しましょう",
    ]);
    // Recorded: the positive query keeps the solid background in a current browser.
    expect(run(challenge.solution.replace("@supports not ((", "@supports (("), "rgba(255, 255, 255, 0.9)")).toEqual([
      "すりガラスにできるブラウザでも、最後のルールの濃い背景が上書きしています。@supports not (…) で囲みましょう",
    ]);
  });

  it("selects the heading followed by a lead, and the results box without any li, with :has()", () => {
    const sibling = lessonById("has-sibling")!.challenge;
    const margins = (a: string, b: string): Computed => ({ title1: { "margin-bottom": a }, title2: { "margin-bottom": b } });
    const run = (css: string, computed: Computed): readonly string[] => evaluate(sibling.validators, snapshotOf(css, computed)).failures;
    // Recorded for each selector below.
    expect(run(sibling.solution.replace(":has(+ .lead)", ":has(~ .lead)"), margins("4px", "16px"))).toEqual([]);
    expect(run(sibling.solution.replace(".title:has(+ .lead)", ".post:first-child .title"), margins("4px", "16px"))).toEqual([
      ":has(+ .lead) で「直後に .lead が続く見出し」を選びましょう",
    ]);
    expect(run(sibling.solution.replace(".title:has(+ .lead)", ".title"), margins("4px", "4px"))).toEqual([
      "リード文のない見出し（2 つ目の記事）の余白は 16px のままにしましょう",
    ]);

    const empty = lessonById("has-empty")!.challenge;
    const shown = (a: string, b: string): Computed => ({ none1: { display: a }, none2: { display: b } });
    const runEmpty = (css: string, computed: Computed): readonly string[] => evaluate(empty.validators, snapshotOf(css, computed)).failures;
    expect(runEmpty(empty.solution.replace(".results:not(:has(li)) .none", ".none:has(+ .list:empty)"), shown("none", "block"))).toEqual([]);
    expect(runEmpty(empty.solution.replace(".results:not(:has(li)) .none", ".none"), shown("block", "block"))).toEqual([
      "結果がある欄にまで「見つかりませんでした」が表示されています",
    ]);
    expect(runEmpty(empty.solution.replace(".results:not(:has(li)) .none", ".results:last-child .none"), shown("none", "block"))).toEqual([
      ":has() で「li がないこと」を調べましょう（:not(:has(li))）",
    ]);
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

  it("wants every thumbnail cropped with cover, at its own size", () => {
    const { challenge } = lessonById("fit-cover")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    // Recorded for each CSS below.
    expect(run(challenge.solution.replace("cover", "contain"), thumbs("contain"))).toEqual([
      "枠いっぱいに切り抜くのは cover です（contain は余白が残り、none は元の大きさのまま切り取ります）",
    ]);
    const firstOnly = thumbs("fill");
    expect(
      run(challenge.starterCSS + ".thumb:first-child { object-fit: cover; }\n", {
        ...firstOnly,
        t1: { ...firstOnly.t1, computed: { "object-fit": "cover" } },
      }),
    ).toEqual(["3 枚すべての写真（.thumb）に指定しましょう"]);
    // Recorded: height: auto keeps the photo's proportions by shrinking the box to 120 × 80.
    expect(run(challenge.starterCSS.replace("height: 120px;", "height: auto;"), thumbs("fill", 80))).toEqual([
      "写真が縦横に引き伸ばされてゆがんでいます。.thumb に object-fit を指定しましょう",
      "サムネイルの大きさ（120px × 120px）は変えないでおきましょう",
    ]);
  });

  it("accepts any position at the top edge for the face, and keeps cover", () => {
    const { challenge } = lessonById("fit-position")!;
    const hero = (position: string, fit = "cover", h = 120): Recorded => ({
      hero: { rect: [0, 0, 300, h], computed: { "object-fit": fit, "object-position": position } },
    });
    const passes = (position: string): boolean => evaluate(challenge.validators, geometrySnapshot(challenge.solution, hero(position))).passed;
    // Recorded serializations: top / center top / top center → 50% 0%, left top → 0% 0%, 50% 0 → 50% 0px.
    for (const position of ["50% 0%", "0% 0%", "50% 0px"]) expect(passes(position), position).toBe(true);
    for (const position of ["50% 100%", "50% 10%", "50% 50%"]) expect(passes(position), position).toBe(false);
    const contain = evaluate(challenge.validators, geometrySnapshot(challenge.solution.replace("cover", "contain"), hero("50% 0%", "contain")));
    expect(contain.failures).toEqual(["object-fit: cover は残しておきましょう（外すと写真が引き伸ばされます）"]);
    // Recorded: height: auto shows the whole portrait, 450px tall.
    const tall = evaluate(challenge.validators, geometrySnapshot(challenge.starterCSS.replace("height: 120px;", "height: auto;"), hero("50% 50%", "cover", 450)));
    expect(tall.failures).toEqual([
      "顔のある写真の上端が見えていません。object-position で上（top）に寄せましょう",
      "バナーの大きさ（300px × 120px）は変えないでおきましょう",
    ]);
  });

  it("accepts contain or scale-down for the logos, nothing that crops or stretches them", () => {
    const { challenge } = lessonById("fit-contain")!;
    const passes = (fit: string, h = 80): boolean => evaluate(challenge.validators, geometrySnapshot(challenge.solution, logos(fit, h))).passed;
    expect(passes("scale-down")).toBe(true);
    for (const fit of ["none", "fill", "cover"]) expect(passes(fit), fit).toBe(false);
    // Recorded: height: auto lets the cropped logos grow to 186px.
    expect(passes("contain", 186)).toBe(false);
  });

  it("wants the float fallback moved into @supports not (display: grid), not deleted", () => {
    const { challenge } = lessonById("supports-not")!;
    const floats = ".card {\n  float: left;\n  width: 31%;\n  margin-right: 2%;\n}\n";
    const run = (css: string): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, GRID_CARDS)).failures;
    // Recorded: each of these lets the cards fill their cells in a current browser.
    expect(run(challenge.starterCSS.replace(floats, ""))).toEqual(["古いブラウザ向けのルールを @supports not (display: grid) { … } で囲みましょう"]);
    expect(run(challenge.starterCSS.replace(floats, "@supports not (display: grid) {\n}\n"))).toEqual([
      "float のルールは消さずに、@supports not (display: grid) の中へ移しましょう（グリッドに対応していないブラウザでは、今もそれが頼りです）",
    ]);
    expect(run(challenge.starterCSS + "@supports (display: grid) {\n  .card { width: auto; margin: 0; }\n}\n")).toEqual([
      "古いブラウザ向けのルールを @supports not (display: grid) { … } で囲みましょう",
    ]);
    expect(run(challenge.solution.replace("not (display: grid)", "not (display:grid)"))).toEqual([]);
    expect(run(challenge.solution.replace("@supports not (display: grid) {\n", "@supports not (display: grid) {\n  .cards { overflow: hidden; }\n"))).toEqual([]);
  });

  it("needs nowrap, a hidden overflow and the ellipsis together for one-line titles", () => {
    const { challenge } = lessonById("overflow-ellipsis")!;
    const wrapped = GEOMETRY_RECORDINGS["overflow-ellipsis"].starter;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    // Recorded for each CSS below.
    expect(run(challenge.solution.replace("  overflow: hidden;\n", ""), oneLineTitles("visible"))).toEqual([
      "1 行に収まらない部分が、枠の右へはみ出しています。overflow: hidden で隠しましょう",
    ]);
    const hiddenButWrapped: Recorded = Object.fromEntries(
      Object.entries(wrapped).map(([id, r]) => [id, { ...r, computed: { "overflow-x": "hidden", "text-overflow": "ellipsis" } }]),
    );
    expect(run(challenge.solution.replace("  white-space: nowrap;\n", ""), hiddenButWrapped)).toEqual([
      "タイトルが折り返して 2 行以上になっています。white-space: nowrap で 1 行に収めましょう",
    ]);
    expect(run(challenge.solution.replace("white-space: nowrap", "text-wrap: nowrap"), oneLineTitles("hidden"))).toEqual([]);
    expect(run(challenge.solution.replace("overflow: hidden", "overflow: clip"), oneLineTitles("clip"))).toEqual([]);
    expect(run(challenge.solution.replace("overflow: hidden", "overflow: auto"), oneLineTitles("auto"))).toHaveLength(1);
  });

  it("clamps the summary with -webkit-line-clamp, not a fixed height, and hides the rest", () => {
    const { challenge } = lessonById("overflow-line-clamp")!;
    const summary = (h: number, clamp: string, overflow: string): Recorded => ({
      summary: { rect: [17, 41.39, 246, h], computed: { "-webkit-line-clamp": clamp, "overflow-y": overflow } },
    });
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    // Recorded: without overflow: hidden the box is clamped but the rest of the text still shows below it.
    expect(run(challenge.solution.replace("  overflow: hidden;\n", ""), summary(72, "3", "visible"))).toEqual([
      "4 行目からの文字が下にはみ出して見えています。overflow: hidden で隠しましょう",
    ]);
    expect(run(challenge.starterCSS.replace("  line-height: 24px;\n", "  line-height: 24px;\n  max-height: 72px;\n  overflow: hidden;\n"), summary(72, "none", "hidden"))).toEqual([
      "最後の行に「…」を付けるには、高さではなく -webkit-line-clamp: 3 で行数を指定します",
    ]);
    // Recorded: without display: -webkit-box the clamp does nothing (7 lines); a clamp of 2 is 48px.
    const tooTall = "要約が 3 行分（72px）の高さになっていません。display: -webkit-box・-webkit-box-orient: vertical・-webkit-line-clamp: 3 の 3 つをそろえましょう";
    expect(run(challenge.solution.replace("  display: -webkit-box;\n", ""), summary(168, "3", "hidden"))).toEqual([tooTall]);
    expect(run(challenge.solution.replace("-webkit-line-clamp: 3", "-webkit-line-clamp: 2"), summary(48, "2", "hidden"))).toEqual([tooTall]);
  });

  it("needs overflow-wrap: anywhere (or break-word with min-width: 0) for the bubble to shrink", () => {
    const { challenge } = lessonById("overflow-wrap-anywhere")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const wrapped: Box = [65, 45.59, 192.05, 69.19];
    // Recorded: break-word leaves the bubble's minimum width at the URL's length.
    expect(run(challenge.solution.replace("anywhere", "break-word"), chat("break-word", 548.73, 85.19, [65, 45.59, 524.73, 18]))).toEqual([
      "吹き出しが、長い URL に引っぱられて枠の右へはみ出しています（flex の子は、中身の最小の幅より縮みません）",
    ]);
    expect(run(challenge.solution.replace("  overflow-wrap: anywhere;\n", "  overflow-wrap: break-word;\n  min-width: 0;\n"), chat("break-word", 218, 136.38, wrapped))).toEqual([]);
    // Recorded: min-width: 0 alone shrinks the bubble, but the URL still sticks out of it.
    expect(run(challenge.solution.replace("  overflow-wrap: anywhere;\n", "  min-width: 0;\n"), chat("normal", 218, 85.19, [65, 45.59, 524.73, 18]))).toEqual([
      "URL が吹き出しの右端からはみ出しています。単語の途中でも折り返せるようにしましょう",
    ]);
    // Recorded: word-break: break-all fits too, but breaks every word.
    expect(run(challenge.solution.replace("overflow-wrap: anywhere", "word-break: break-all"), chat("normal", 218, 136.38, [65, 20, 187.34, 94.78]))).toEqual([
      "URL の途中で折り返すには overflow-wrap を使いましょう（word-break: break-all だと、ふつうの英単語まで途中で切れます）",
    ]);
    // Recorded: overflow-wrap on the URL alone works the same.
    expect(run(challenge.starterCSS + ".url { overflow-wrap: anywhere; }\n", chat("normal", 218, 136.38, wrapped, "anywhere"))).toEqual([]);
  });

  it("switches to three columns from the fifth photo, counted with :has()", () => {
    const { challenge } = lessonById("has-quantity")!;
    const { starter, solution } = GEOMETRY_RECORDINGS["has-quantity"];
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    // Recorded: :nth-child(4) turns the four-photo gallery into three columns as well.
    const bothNarrow: Recorded = { ...solution, a1: { rect: [0, 22.19, 69.33, 51.98] }, a3: { rect: [150.66, 22.19, 69.34, 52] } };
    expect(run(challenge.solution.replace(":nth-child(5)", ":nth-child(4)"), bothNarrow)).toEqual([
      "4 枚のギャラリーまで 3 列になっています。5 枚以上のときだけにしましょう",
    ]);
    // Recorded: :nth-child(6) matches neither gallery.
    expect(run(challenge.solution.replace(":nth-child(5)", ":nth-child(6)"), starter)).toEqual([
      "5 枚のギャラリーが 3 列になっていません（3 枚目の写真が 1 段目に並びます）",
    ]);
    expect(run(challenge.solution.replace(".gallery:has(> :nth-child(5))", ".pair > div:last-child .gallery"), solution)).toEqual([
      ":has() と :nth-child() で、子の数を数えましょう",
    ]);
    expect(run(challenge.solution.replace(":nth-child(5)", ":nth-last-child(5)"), solution)).toEqual([]);
  });

  it("shows a fresh starter of the new lessons one message, the first unmet step", () => {
    for (const id of NEW_GEOMETRY_LESSONS) {
      const { challenge } = lessonById(id)!;
      const res = evaluate(challenge.validators, geometrySnapshot(challenge.starterCSS, GEOMETRY_RECORDINGS[id].starter));
      expect(res.failures, id).toHaveLength(1);
    }
  });

  it("ends the label column where the longest label ends, with max-content", () => {
    const { challenge } = lessonById("size-max-content")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const column = (cols: string): string => challenge.solution.replace("max-content 1fr", cols);
    const mismatch = "ラベルの列の幅が、いちばん長いラベルの長さと合っていません（固定の幅だと、列が余ったり、ラベルがはみ出したりします）";
    // Recorded for each column below.
    expect(run(column("8em 1fr"), labelCell(128, 24))).toEqual([mismatch]);
    expect(run(challenge.starterCSS + ".profile dt { white-space: nowrap; }\n", labelCell(96, 24))).toEqual([mismatch]);
    expect(run(column("min-content 1fr"), labelCell(16, 168, 16, 162))).toEqual(["長いラベル「メールアドレス」が折り返して、2 行以上になっています"]);
    // Recorded: auto and fit-content(10em) lay the column out the same here, but are not max-content.
    expect(run(column("auto 1fr"), labelCell(109.61, 24))).toEqual(["列の幅に max-content を使いましょう"]);
    expect(run(column("fit-content(10em) 1fr"), labelCell(109.61, 24))).toEqual(["列の幅に max-content を使いましょう"]);
    expect(run(column("minmax(0, max-content) 1fr"), labelCell(109.61, 24))).toEqual([]);
  });

  it("fits each frame to its own photo with min-content", () => {
    const { challenge } = lessonById("size-min-content")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const width = (to: string): string => challenge.solution.replace("width: min-content", to);
    const tooWide = "枠（.figure）が写真より横に広がっています。2 枚とも、枠を写真の幅に合わせて、キャプションを写真の幅で折り返しましょう";
    // Recorded: fit-content and max-content both keep each caption on one line.
    expect(run(width("width: fit-content"), frames(392.09, 142, 402.89, 162))).toEqual([tooWide]);
    expect(run(width("width: max-content"), frames(392.09, 142, 402.89, 162))).toEqual([tooWide]);
    // Recorded: a width fixed for the first photo is too wide for the second.
    expect(run(width("width: 176px"), frames(176, 182, 176, 202))).toEqual([tooWide]);
    // Recorded: the old table trick draws the same frames, but is not min-content.
    const solved = GEOMETRY_RECORDINGS["size-min-content"].solution;
    expect(run(width("display: table; width: 1px"), solved)).toEqual(["width: min-content で、いちばん狭くできる幅（写真の幅）にしましょう"]);
    expect(run(width("inline-size: min-content"), solved)).toEqual([]);
  });

  it("hugs the short heading and wraps the long one with fit-content", () => {
    const { challenge } = lessonById("size-fit-content")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const width = (to: string): string => challenge.solution.replace("width: fit-content;", to);
    const solved = GEOMETRY_RECORDINGS["size-fit-content"].solution;
    // Recorded: max-content keeps the long heading on one line, wider than the column.
    expect(run(width("width: max-content;"), headings(137.19, [0, 0, 72, 31], [0, 3, 72, 21], [0, 78.59, 512.53, 31]))).toEqual([
      "長い見出しが列の右へはみ出しています（max-content は折り返さないので、列より広くなります）",
    ]);
    // Recorded: min-content breaks the short heading after every character.
    expect(run(width("width: min-content;"), headings(613.19, [0, 0, 18, 115], [0, 3, 18, 105], [0, 162.59, 36.22, 423]))).toEqual([
      "短い見出し「お知らせ」が 1 文字ずつ折り返しています（min-content は、折り返せるところですべて折り返します）",
    ]);
    // Recorded: inline-block and max-content with max-width: 100% draw the same headings, but are not fit-content.
    expect(run(width("display: inline-block;"), solved)).toEqual(["width: fit-content を使いましょう"]);
    expect(run(width("width: max-content;\n  max-width: 100%;"), solved)).toEqual(["width: fit-content を使いましょう"]);
    expect(run(width("inline-size: fit-content;"), solved)).toEqual([]);
  });

  it("centres the play button with place-items, the vertical value first", () => {
    const { challenge } = lessonById("grid-place-items")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const items = (to: string): string => challenge.solution.replace("place-items: center;", to);
    const notDown = "再生ボタンが、写真の縦の中央にありません（place-items は「縦 横」の順で、値を 1 つだけ書くと両方に効きます）";
    // Recorded: justify-items alone, and place-items: start center, centre the button across only.
    expect(run(items("justify-items: center;"), thumbnail([122, 0, 56, 56]))).toEqual([notDown]);
    expect(run(items("place-items: start center;"), thumbnail([122, 0, 56, 56]))).toEqual([notDown]);
    // Recorded: the longhands and place-self on the button centre it too, but the lesson is place-items.
    const centred = thumbnail([122, 57, 56, 56]);
    expect(run(items("justify-items: center;\n  align-items: center;"), centred)).toEqual(["place-items で、縦と横をまとめてそろえましょう"]);
    expect(run(challenge.starterCSS + ".play { place-self: center; }\n", centred)).toEqual(["place-items で、縦と横をまとめてそろえましょう"]);
    expect(run(items("place-items: center center;"), centred)).toEqual([]);
  });

  it("moves only the running time to the corner, with place-self", () => {
    const { challenge } = lessonById("grid-place-self")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const self = (to: string): string => challenge.solution.replace("place-self: end;", to);
    const centre: Box = [122, 57, 56, 56];
    const corner: Box = [250.19, 146, 49.81, 24];
    // Recorded: place-items: end on the parent takes the play button to the corner as well.
    expect(run(challenge.starterCSS.replace("place-items: center", "place-items: end"), thumbnail([244, 114, 56, 56], corner))).toEqual([
      "再生ボタンは、写真の中央のままにしておきましょう（親の place-items: center は変えずに）",
    ]);
    // Recorded: start end is the top-right corner.
    expect(run(self("place-self: start end;"), thumbnail(centre, [250.19, 0, 49.81, 24]))).toEqual(["再生時間（.time）が、写真の右下の角にありません"]);
    // Recorded: auto margins reach the corner too, but the lesson is place-self.
    expect(run(self("margin: auto 0 0 auto;"), thumbnail(centre, corner))).toEqual(["place-self で、再生時間だけ位置を変えましょう"]);
    expect(run(self("place-self: end end;"), thumbnail(centre, corner))).toEqual([]);
  });

  it("centres the tracks with place-content, keeping the stamps their size", () => {
    const { challenge } = lessonById("grid-place-content")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const content = (to: string): string => challenge.solution.replace("place-content: center;", to);
    const centred = GEOMETRY_RECORDINGS["grid-place-content"].solution;
    // Recorded: place-items moves each stamp inside its cell instead, and shrinks it to its content.
    expect(run(content("place-items: center;"), stampCards([57.8, 48, 20.41, 40], [369.8, 48, 20.41, 40]))).toEqual([
      "スタンプの並びが、カードの横の中央にありません",
    ]);
    expect(run(content("place-content: center;\n  place-items: center;"), stampCards([139.8, 60, 20.41, 40], [391.8, 70, 20.41, 40]))).toEqual([
      "スタンプの大きさ（40px）が変わっています（place-items はセルの中の位置を決めるので、スタンプが中身の大きさに縮みます）",
    ]);
    // Recorded: justify-content alone centres the tracks across only.
    expect(run(content("justify-content: center;"), stampCards([130, 48, 40, 40], [382, 48, 40, 40]))).toEqual([
      "スタンプの並びが、カードの縦の中央にありません（place-content は「縦 横」の順で、値を 1 つだけ書くと両方に効きます）",
    ]);
    // Recorded: padding tuned to each card centres both, but the lesson is place-content.
    expect(run(challenge.starterCSS + ".wide { padding: 12px 82px; }\n.square { padding: 22px; }\n", centred)).toEqual([
      "place-content で、トラック全体の位置をそろえましょう",
    ]);
    expect(run(content("place-content: space-evenly;"), centred)).toEqual([]);
  });

  it("makes the card the containing block with position: relative", () => {
    const { challenge } = lessonById("position-relative")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const inCorners = (position: string): Recorded => ribbonCards(position, [131.2, 0, 48.8, 24], [327.2, 0, 48.8, 24]);
    const notRelative = "カード（.card）に position: relative を指定して、リボンの基準の箱にしましょう";
    // Recorded: position: relative on the ribbon keeps it in the flow, at the top-left of the card's content.
    expect(run(challenge.starterCSS + ".ribbon { position: relative; }\n", ribbonCards("static", [16, 19, 48.8, 19], [212, 19, 48.8, 19], 103.78))).toEqual([
      "リボン（.ribbon）が、それぞれのカードの右上の角にありません（基準の箱が、カードではなくプレビューの画面になっています）",
    ]);
    // Recorded: a transform, or sticky, also makes the card the containing block, but the lesson is position: relative.
    expect(run(challenge.starterCSS + ".card { transform: translate(0); }\n", inCorners("static"))).toEqual([notRelative]);
    expect(run(challenge.starterCSS + ".card { position: sticky; }\n", inCorners("sticky"))).toEqual([notRelative]);
  });

  it("covers the whole card with inset", () => {
    const { challenge } = lessonById("position-inset")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const place = (to: string): string => challenge.starterCSS.replace("  top: 0;\n  left: 0;\n", to);
    const covered = GEOMETRY_RECORDINGS["position-inset"].solution;
    const useInset = "inset で、四辺をまとめて指定しましょう（top・right・bottom・left を 1 行で）";
    // Recorded: the four sides, or width and height of 100%, cover the card the same way.
    expect(run(place("  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n"), covered)).toEqual([useInset]);
    expect(run(place("  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n"), covered)).toEqual([useInset]);
    // Recorded: inset: 8px leaves a margin around the cover.
    expect(run(place("  inset: 8px;\n"), { item: covered.item, cover: { rect: [8, 8, 204, 162.78] } })).toEqual([
      "売り切れの覆い（.cover）が、カード全体を覆っていません（top と left だけでは中身の大きさになります。四辺すべてを 0 にしましょう）",
    ]);
    expect(run(place("  top: 0;\n  left: 0;\n  inset: 0;\n"), covered)).toEqual([]);
  });

  it("puts the close button at the end of the line with inset-inline-end, whichever way the text runs", () => {
    const { challenge } = lessonById("position-logical")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const place = (to: string): string => challenge.starterCSS.replace("  right: 0;\n", to);
    const right: Box = [288, 0, 32, 32];
    // Recorded: with right: 0 still there, the right-to-left note keeps its button on the right.
    expect(run(place("  right: 0;\n  inset-inline-end: 0;\n"), notes(right, [288, 60, 32, 32]))).toEqual([
      "右から左へ書くお知らせ（下）で、閉じるボタンが左上の角にありません（right: 0 が残っていると、こちらでも右に置かれます）",
    ]);
    // Recorded: inset-inline-start is the start of the line.
    expect(run(place("  inset-inline-start: 0;\n"), notes([0, 0, 32, 32], [288, 60, 32, 32]))).toEqual([
      "日本語のお知らせで、閉じるボタンが右上の角にありません",
    ]);
    // Recorded: a [dir="rtl"] rule gives the same picture, but is not the logical inset.
    const ends = notes(right, [0, 60, 32, 32]);
    expect(run(challenge.starterCSS + '[dir="rtl"] .close { right: auto; left: 0; }\n', ends)).toEqual(["inset-inline-end で、行の終わり側に置きましょう"]);
    expect(run(place("  inset-inline-end: 0;\n"), ends)).toEqual([]);
    expect(run(place("  inset-inline: auto 0;\n"), ends)).toEqual([]);
  });

  it("turns the needle about its foot, however the origin is written", () => {
    const { challenge } = lessonById("transform-origin")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const origin = (to: string): string => challenge.solution.replace("bottom center", to);
    const foot: Box = [116, 113, 100, 6];
    const floating = "針の根元が中心の丸（.hub）から離れて、宙に浮いています（回転の中心が、針の下端の中央になっていません）";
    // Recorded: each of these turns the needle about its foot.
    for (const to of ["50% 100%", "bottom", "center bottom"]) expect(run(origin(to), gauge(foot)), to).toEqual([]);
    expect(run(challenge.solution.replace("transform: rotate(90deg);", "rotate: 90deg;"), gauge(foot))).toEqual([]);
    // Recorded: about the bottom-left corner the needle lies 3px below the hub's centre; about the top end it swings left.
    expect(run(origin("bottom left"), gauge([113, 116, 100, 6]))).toEqual([floating]);
    expect(run(origin("top center"), gauge([16, 13, 100, 6]))).toEqual([floating]);
    // Recorded: laying the needle flat without turning it lands in the same place, but is not transform-origin.
    const flat = challenge.starterCSS.replace("  transform: rotate(90deg);\n", "  left: 100px;\n  bottom: -3px;\n  width: 100px;\n  height: 6px;\n");
    expect(run(flat, gauge(foot))).toEqual(["transform-origin で、回転の中心を決めましょう"]);
  });

  it("enlarges the picked sticker with the scale property, keeping its tilt", () => {
    const { challenge } = lessonById("transform-individual")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const tiltedAndEnlarged: Box = [133.04, 12.23, 129.93, 83.54];
    const notBoth = "選んだシール（.picked）が、傾いたまま 1.25 倍になっていません（transform: scale() が、先に書いた transform: rotate() を上書きしています）";
    // Recorded: rotate and scale both as properties.
    expect(run(challenge.solution.replace("transform: rotate(var(--r));", "rotate: var(--r);"), stickers(tiltedAndEnlarged, "1.25"))).toEqual([]);
    // Recorded: writing both into transform again draws the same, but the lesson is the scale property.
    expect(run(challenge.solution.replace("scale: 1.25;", "transform: rotate(var(--r)) scale(1.25);"), stickers(tiltedAndEnlarged, "none"))).toEqual([
      "拡大には scale プロパティを使いましょう（transform に書くと、rotate() まで書き直すことになります）",
    ]);
    // Recorded: without the scale the sticker keeps its tilt at 100 × 60; scale: 1.2 is too small.
    expect(run(challenge.solution.replace("  scale: 1.25;\n", ""), stickers([146.03, 20.59, 103.94, 66.83], "none"))).toEqual([notBoth]);
    expect(run(challenge.solution.replace("scale: 1.25", "scale: 1.2"), stickers([135.63, 13.9, 124.73, 80.2], "1.2"))).toEqual([notBoth]);
    // Recorded: scale on every sticker enlarges the other two as well.
    const everyone = challenge.solution.replace("  transform: rotate(var(--r));\n", "  transform: rotate(var(--r));\n  scale: 1.25;\n");
    expect(run(everyone, stickers(tiltedAndEnlarged, "1.25", [7.92, 10.17, 132.15, 87.66], [257.62, 13.28, 128.75, 81.44]))).toEqual([
      "ほかのシールの大きさと傾きは、そのままにしておきましょう",
    ]);
  });

  it("centres labels of any length with translate: -50% -50%", () => {
    const { challenge } = lessonById("transform-translate-percent")!;
    const run = (css: string, rec: Recorded): readonly string[] => evaluate(challenge.validators, geometrySnapshot(css, rec)).failures;
    const pull = (to: string): string => challenge.solution.replace("translate: -50% -50%;", to);
    const centred = GEOMETRY_RECORDINGS["transform-translate-percent"].solution;
    const offAcross = "ラベルが、写真の横の中央からずれています（left: 50% だけでは、ラベルの左端が中央に来ます）";
    // Recorded: transform: translate() moves them the same way.
    expect(run(pull("transform: translate(-50%, -50%);"), centred)).toEqual([]);
    // Recorded: translate: -50% moves them across only.
    expect(run(pull("translate: -50%;"), labelled([56.98, 65, 86.05, 28], [241.19, 65, 149.63, 28]))).toEqual([
      "ラベルが、写真の縦の中央からずれています（top: 50% だけでは、ラベルの上端が中央に来ます）",
    ]);
    // Recorded: a margin tuned for the short label is wrong for the long one; -100% goes too far.
    expect(run(pull("margin: -14px 0 0 -40px;"), labelled([60, 51, 86.05, 28], [276, 51, 149.63, 28]))).toEqual([offAcross]);
    expect(run(pull("translate: -100% -100%;"), labelled([13.95, 37, 86.05, 28], [166.38, 37, 149.63, 28]))).toEqual([offAcross]);
    // Recorded: inset: 0 with auto margins centres them too, but the lesson is translate.
    const auto = challenge.starterCSS.replace("  top: 50%;\n  left: 50%;\n", "  inset: 0;\n  margin: auto;\n  width: fit-content;\n  height: fit-content;\n");
    expect(run(auto, labelled([56.97, 51, 86.05, 28], [241.19, 51, 149.63, 28]))).toEqual([
      "translate で、ラベル自身の幅と高さの半分だけ戻しましょう",
    ]);
  });
});

// The multi-column, float / shape and table lessons are graded by geometry, so
// the other ways of writing them were rendered in the real sandbox too: each
// entry is one CSS the learner might write, with the rects and computed values
// it produced and the one message the lesson gives for it.
interface Variant {
  readonly lesson: string;
  readonly name: string;
  readonly css: string;
  readonly passes: boolean;
  readonly message?: string;
  readonly elements: Recorded;
}

const VARIANTS: readonly Variant[] = [
{
    lesson: "multicol-columns",
    name: "column-count + gap",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n  column-count: 2;\n  column-gap: 24px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"2","column-width":"auto"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "gap shorthand",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n  columns: 2;\n  gap: 24px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"2","column-width":"auto"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "column-width 120px",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n  column-width: 120px;\n  column-gap: 24px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"auto","column-width":"120px"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "columns without gap",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.news { columns: 2; }\n",
    passes: false,
    message: "段と段の間が 24px 空いていません（column-gap で指定します。指定しないと 1em です）",
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"2","column-width":"auto"} }, n1: { rect: [1, 9, 131, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 131, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 131, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [148, 9, 131, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [148, 41, 131, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [148, 73, 131, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "columns 3",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n  columns: 3;\n  column-gap: 24px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "お知らせが 2 段に分かれていません（4 件目が、1 件目の横＝2 段目の先頭に来ていません）",
    elements: { news: { rect: [0, 0, 280, 122], computed: {"column-count":"3","column-width":"auto"} }, n1: { rect: [1, 9, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 65, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [101.67, 9, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [101.67, 65, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [202.33, 9, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [202.33, 65, 76.66, 48], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "grid 2 cols",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.news { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; }\n",
    passes: false,
    message: "お知らせが 2 段に分かれていません（4 件目が、1 件目の横＝2 段目の先頭に来ていません）",
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"auto","column-width":"auto"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-columns",
    name: "flex column wrap",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.news { display: flex; flex-direction: column; flex-wrap: wrap; height: 106px; column-gap: 24px; }\n",
    passes: false,
    message: "columns: 2（または column-count: 2）で段組みにしましょう（flex や grid で 2 列に並べると、段の高さが中身の量に合わせて決まりません）",
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-count":"auto","column-width":"auto"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-count":"auto","column-width":"auto"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-count":"auto","column-width":"auto"} } },
  },
  {
    lesson: "multicol-span",
    name: "width 200%",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  columns: 2;\n  column-gap: 24px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 16px;\n  line-height: 28px;\n  border-bottom: 2px solid #2f5fd0;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.head { width: 200%; }\n",
    passes: false,
    message: "見出し（h3）が 1 段目の幅のままです（段をまたいでいません）",
    elements: { news: { rect: [0, 0, 280, 130], computed: {"column-span":"none"} }, head: { rect: [1, 9, 254, 30], computed: {"column-span":"none"} }, n1: { rect: [1, 47, 127, 24], computed: {"column-span":"none"} }, n2: { rect: [1, 79, 127, 24], computed: {"column-span":"none"} }, n3: { rect: [152, 9, 127, 24], computed: {"column-span":"none"} }, n4: { rect: [152, 41, 127, 24], computed: {"column-span":"none"} }, n5: { rect: [152, 73, 127, 24], computed: {"column-span":"none"} }, n6: { rect: [152, 105, 127, 24], computed: {"column-span":"none"} } },
  },
  {
    lesson: "multicol-span",
    name: "absolute full width",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  columns: 2;\n  column-gap: 24px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 16px;\n  line-height: 28px;\n  border-bottom: 2px solid #2f5fd0;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.news { position: relative; } .head { position: absolute; top: 0; width: 100%; }\n",
    passes: false,
    message: "column-span: all で、見出しにすべての段をまたがせましょう",
    elements: { news: { rect: [0, 0, 280, 106], computed: {"column-span":"none"} }, head: { rect: [1, 1, 278, 30], computed: {"column-span":"none"} }, n1: { rect: [1, 9, 127, 24], computed: {"column-span":"none"} }, n2: { rect: [1, 41, 127, 24], computed: {"column-span":"none"} }, n3: { rect: [1, 73, 127, 24], computed: {"column-span":"none"} }, n4: { rect: [152, 9, 127, 24], computed: {"column-span":"none"} }, n5: { rect: [152, 41, 127, 24], computed: {"column-span":"none"} }, n6: { rect: [152, 73, 127, 24], computed: {"column-span":"none"} } },
  },
  {
    lesson: "multicol-span",
    name: "columns 1",
    css: ".news {\n  width: 280px;\n  padding: 8px 0 0;\n  columns: 2;\n  column-gap: 24px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 16px;\n  line-height: 28px;\n  border-bottom: 2px solid #2f5fd0;\n}\n.item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n.news { columns: 1; }\n",
    passes: false,
    message: "お知らせが、見出しの下から 2 段に分かれていません",
    elements: { news: { rect: [0, 0, 280, 240], computed: {"column-span":"none"} }, head: { rect: [1, 9, 278, 30], computed: {"column-span":"none"} }, n1: { rect: [1, 47, 278, 24], computed: {"column-span":"none"} }, n2: { rect: [1, 79, 278, 24], computed: {"column-span":"none"} }, n3: { rect: [1, 111, 278, 24], computed: {"column-span":"none"} }, n4: { rect: [1, 143, 278, 24], computed: {"column-span":"none"} }, n5: { rect: [1, 175, 278, 24], computed: {"column-span":"none"} }, n6: { rect: [1, 207, 278, 24], computed: {"column-span":"none"} } },
  },
  {
    lesson: "multicol-break",
    name: "avoid-column",
    css: ".wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n  break-inside: avoid-column;\n}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n",
    passes: true,
    elements: { wrap: { rect: [0, 0, 280, 208], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"avoid-column"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"avoid-column"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"avoid-column"} }, c4: { rect: [152, 0, 128, 48], computed: {"break-inside":"avoid-column"} }, c5: { rect: [152, 56, 128, 72], computed: {"break-inside":"avoid-column"} } },
  },
  {
    lesson: "multicol-break",
    name: "page-break-inside",
    css: ".wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n  page-break-inside: avoid;\n}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n",
    passes: true,
    elements: { wrap: { rect: [0, 0, 280, 208], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"avoid"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"avoid"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"avoid"} }, c4: { rect: [152, 0, 128, 48], computed: {"break-inside":"avoid"} }, c5: { rect: [152, 56, 128, 72], computed: {"break-inside":"avoid"} } },
  },
  {
    lesson: "multicol-break",
    name: "inline-block hack",
    css: ".wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n.card { display: inline-block; width: 100%; }\n",
    passes: false,
    message: "break-inside: avoid で、カードの途中で段が変わらないようにしましょう（display: inline-block や overflow: hidden でも分かれなくなりますが、段組みや印刷のための本来の指定は break-inside です）",
    elements: { wrap: { rect: [0, 0, 280, 216], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"auto"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"auto"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"auto"} }, c4: { rect: [152, 0, 128, 48], computed: {"break-inside":"auto"} }, c5: { rect: [152, 56, 128, 72], computed: {"break-inside":"auto"} } },
  },
  {
    lesson: "multicol-break",
    name: "column-fill auto",
    css: ".wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n.wrap { column-fill: auto; }\n",
    passes: false,
    message: "break-inside: avoid で、カードの途中で段が変わらないようにしましょう（display: inline-block や overflow: hidden でも分かれなくなりますが、段組みや印刷のための本来の指定は break-inside です）",
    elements: { wrap: { rect: [0, 0, 280, 352], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"auto"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"auto"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"auto"} }, c4: { rect: [0, 216, 128, 48], computed: {"break-inside":"auto"} }, c5: { rect: [0, 272, 128, 72], computed: {"break-inside":"auto"} } },
  },
  {
    lesson: "multicol-break",
    name: "overflow hidden (monolithic)",
    css: ".wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n.card { overflow: hidden; }\n",
    passes: false,
    message: "break-inside: avoid で、カードの途中で段が変わらないようにしましょう（display: inline-block や overflow: hidden でも分かれなくなりますが、段組みや印刷のための本来の指定は break-inside です）",
    elements: { wrap: { rect: [0, 0, 280, 208], computed: {"break-inside":"auto"} }, c1: { rect: [0, 0, 128, 72], computed: {"break-inside":"auto"} }, c2: { rect: [0, 80, 128, 48], computed: {"break-inside":"auto"} }, c3: { rect: [0, 136, 128, 72], computed: {"break-inside":"auto"} }, c4: { rect: [152, 0, 128, 48], computed: {"break-inside":"auto"} }, c5: { rect: [152, 56, 128, 72], computed: {"break-inside":"auto"} } },
  },
  {
    lesson: "float-left",
    name: "float + margin-right",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left; margin-right: 12px;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"float":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"float":"left"} }, l1: { rect: [172, 0, 92, 24], computed: {"float":"none"} }, l2: { rect: [172, 24, 92, 24], computed: {"float":"none"} }, l3: { rect: [172, 48, 78, 24], computed: {"float":"none"} }, l4: { rect: [172, 72, 92, 24], computed: {"float":"none"} }, l5: { rect: [172, 96, 92, 24], computed: {"float":"none"} }, l6: { rect: [172, 120, 64, 24], computed: {"float":"none"} }, l7: { rect: [172, 144, 92, 24], computed: {"float":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"float":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"float":"none"} } },
  },
  {
    lesson: "float-left",
    name: "float right",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: right;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "説明文が写真の右に回り込んでいません（写真の下から始まっています）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"float":"none"} }, photo: { rect: [160, 0, 160, 160], computed: {"float":"right"} }, l1: { rect: [0, 0, 92, 24], computed: {"float":"none"} }, l2: { rect: [0, 24, 92, 24], computed: {"float":"none"} }, l3: { rect: [0, 48, 78, 24], computed: {"float":"none"} }, l4: { rect: [0, 72, 92, 24], computed: {"float":"none"} }, l5: { rect: [0, 96, 92, 24], computed: {"float":"none"} }, l6: { rect: [0, 120, 64, 24], computed: {"float":"none"} }, l7: { rect: [0, 144, 92, 24], computed: {"float":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"float":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"float":"none"} } },
  },
  {
    lesson: "float-left",
    name: "absolute + padding",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n.para { position: relative; padding-left: 160px; } .photo { position: absolute; top: 0; left: 0; }\n",
    passes: false,
    message: "写真より下の行（8 行目から）が、左端に戻っていません",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"float":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"float":"none"} }, l1: { rect: [160, 0, 92, 24], computed: {"float":"none"} }, l2: { rect: [160, 24, 92, 24], computed: {"float":"none"} }, l3: { rect: [160, 48, 78, 24], computed: {"float":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"float":"none"} }, l5: { rect: [160, 96, 92, 24], computed: {"float":"none"} }, l6: { rect: [160, 120, 64, 24], computed: {"float":"none"} }, l7: { rect: [160, 144, 92, 24], computed: {"float":"none"} }, l8: { rect: [160, 168, 92, 24], computed: {"float":"none"} }, l9: { rect: [160, 192, 134, 24], computed: {"float":"none"} } },
  },
  {
    lesson: "float-left",
    name: "inline-block",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n.photo { display: inline-block; vertical-align: top; }\n",
    passes: false,
    message: "説明文が写真の右に回り込んでいません（写真の下から始まっています）",
    elements: { para: { rect: [0, 0, 320, 352], computed: {"float":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"float":"none"} }, l1: { rect: [160, 0, 92, 24], computed: {"float":"none"} }, l2: { rect: [0, 160, 92, 24], computed: {"float":"none"} }, l3: { rect: [0, 184, 78, 24], computed: {"float":"none"} }, l4: { rect: [0, 208, 92, 24], computed: {"float":"none"} }, l5: { rect: [0, 232, 92, 24], computed: {"float":"none"} }, l6: { rect: [0, 256, 64, 24], computed: {"float":"none"} }, l7: { rect: [0, 280, 92, 24], computed: {"float":"none"} }, l8: { rect: [0, 304, 92, 24], computed: {"float":"none"} }, l9: { rect: [0, 328, 134, 24], computed: {"float":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "circle(50%)",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n  shape-outside: circle(50%);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"circle(50%)"} }, l1: { rect: [137.13, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [153.31, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [159.59, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [158.38, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [149.28, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [128, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "ellipse()",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n  shape-outside: ellipse();\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"ellipse()"} }, l1: { rect: [137.13, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [153.31, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [159.59, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [158.38, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [149.28, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [128, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "inset round",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n  shape-outside: inset(0 round 50%);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"inset(0px round 50%)"} }, l1: { rect: [137.13, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [153.31, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [159.59, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [158.38, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [149.28, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [128, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "circle(40%) too small",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n  shape-outside: circle(40%);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "真ん中の行の文字が、写真に重なっています（円が写真より小さくなっています。半径を省略した circle() なら、写真の短い辺の半分です）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"circle(40%)"} }, l1: { rect: [110.97, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [135.42, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [143.48, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [144, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [141.95, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [129.95, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [0, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "clip-path only",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n.photo { clip-path: circle(); }\n",
    passes: false,
    message: "説明文が円の形に沿っていません（上の行も真ん中の行も同じ位置から始まり、四角い箱に沿っています）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"none"} }, l1: { rect: [160, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [160, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [160, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [160, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [160, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [160, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "margin-box",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  border-radius: 50%;\n  shape-outside: margin-box;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "shape-outside: circle() で、回り込みの形を円にしましょう（border-radius や clip-path は見た目だけで、回り込みの形は変わりません）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"margin-box"} }, l1: { rect: [137.13, 0, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [153.31, 24, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [159.59, 48, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [160, 72, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [158.38, 96, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [149.28, 120, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [128, 144, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 168, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-circle",
    name: "no float",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  \n  border-radius: 50%;\n  shape-outside: circle();\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "説明文が円の形に沿っていません（上の行も真ん中の行も同じ位置から始まり、四角い箱に沿っています）",
    elements: { para: { rect: [0, 0, 320, 376], computed: {"shape-outside":"none"} }, photo: { rect: [0, 0, 160, 160], computed: {"shape-outside":"circle()"} }, l1: { rect: [0, 160, 92, 24], computed: {"shape-outside":"none"} }, l2: { rect: [0, 184, 92, 24], computed: {"shape-outside":"none"} }, l3: { rect: [0, 208, 78, 24], computed: {"shape-outside":"none"} }, l4: { rect: [0, 232, 92, 24], computed: {"shape-outside":"none"} }, l5: { rect: [0, 256, 92, 24], computed: {"shape-outside":"none"} }, l6: { rect: [0, 280, 64, 24], computed: {"shape-outside":"none"} }, l7: { rect: [0, 304, 92, 24], computed: {"shape-outside":"none"} }, l8: { rect: [0, 328, 92, 24], computed: {"shape-outside":"none"} }, l9: { rect: [0, 352, 134, 24], computed: {"shape-outside":"none"} } },
  },
  {
    lesson: "shape-margin",
    name: "shape-margin 16px",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n  shape-margin: 16px;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"16px"} }, l1: { rect: [159.75, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [177.31, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [184, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [184, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [184, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [183.81, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [172.69, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [150.64, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "shape-margin",
    name: "shape-margin 8px",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n  shape-margin: 8px;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "真ん中の行の文字が写真に近すぎます（図形の外側に 12px ほどの余白を足しましょう。写真の margin を広げても、円は写真の大きさのままです）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"8px"} }, l1: { rect: [147.84, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [168.2, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [177.69, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [180, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [179.91, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [175.42, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [162.98, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [136.36, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "shape-margin",
    name: "margin 24",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n.photo { margin: 24px; }\n",
    passes: false,
    message: "真ん中の行の文字が写真に近すぎます（図形の外側に 12px ほどの余白を足しましょう。写真の margin を広げても、円は写真の大きさのままです）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [24, 24, 160, 160], computed: {"shape-margin":"0px"} }, l1: { rect: [0, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [161.13, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [177.31, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [183.59, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [184, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [182.38, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [173.28, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [152, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "shape-margin",
    name: "bigger circle",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n.photo { shape-outside: circle(92px); }\n",
    passes: false,
    message: "shape-margin で、図形の外側に余白を足しましょう（circle() の半径を大きくすると、図形が写真と合わなくなります）",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"0px"} }, l1: { rect: [153.95, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [172.78, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [181.8, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [184, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [183.91, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [179.63, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [167.89, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [143.84, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "shape-margin",
    name: "shape-margin 24 (clipped by the margin box)",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n  shape-margin: 24px;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: false,
    message: "回り込みが円の形でなくなっています",
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [12, 12, 160, 160], computed: {"shape-margin":"24px"} }, l1: { rect: [170.69, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [184, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [184, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [184, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [184, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [184, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [182.06, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [162.98, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "shape-margin",
    name: "shape-margin + bigger margin",
    css: ".para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n  float: left;\n  margin: 20px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n  shape-margin: 12px;\n}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { para: { rect: [0, 0, 320, 216], computed: {"shape-margin":"0px"} }, photo: { rect: [20, 20, 160, 160], computed: {"shape-margin":"12px"} }, l1: { rect: [151.84, 0, 92, 24], computed: {"shape-margin":"0px"} }, l2: { rect: [175.89, 24, 92, 24], computed: {"shape-margin":"0px"} }, l3: { rect: [187.63, 48, 78, 24], computed: {"shape-margin":"0px"} }, l4: { rect: [191.91, 72, 92, 24], computed: {"shape-margin":"0px"} }, l5: { rect: [192, 96, 92, 24], computed: {"shape-margin":"0px"} }, l6: { rect: [189.8, 120, 64, 24], computed: {"shape-margin":"0px"} }, l7: { rect: [180.78, 144, 92, 24], computed: {"shape-margin":"0px"} }, l8: { rect: [161.95, 168, 92, 24], computed: {"shape-margin":"0px"} }, l9: { rect: [0, 192, 134, 24], computed: {"shape-margin":"0px"} } },
  },
  {
    lesson: "table-collapse",
    name: "spacing 0",
    css: ".sheet {\n  font-size: 14px;\n}\n.sheet th,\n.sheet td {\n  width: 80px;\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet { border-spacing: 0; }\n",
    passes: false,
    message: "border-spacing: 0 ではセルが触れるだけで線は二重のままです。border-collapse: collapse で、隣り合う枠線を 1 本にまとめましょう",
    elements: { sheet: { rect: [0, 0, 240, 88.78], computed: {"border-collapse":"separate"} }, h1: { rect: [0, 0, 80, 29.59], computed: {"border-collapse":"separate"} }, h2: { rect: [80, 0, 80, 29.59], computed: {"border-collapse":"separate"} }, h3: { rect: [160, 0, 80, 29.59], computed: {"border-collapse":"separate"} }, a1: { rect: [0, 29.59, 80, 29.59], computed: {"border-collapse":"separate"} }, a2: { rect: [80, 29.59, 80, 29.59], computed: {"border-collapse":"separate"} }, a3: { rect: [160, 29.59, 80, 29.59], computed: {"border-collapse":"separate"} }, b1: { rect: [0, 59.19, 80, 29.59], computed: {"border-collapse":"separate"} }, b2: { rect: [80, 59.19, 80, 29.59], computed: {"border-collapse":"separate"} }, b3: { rect: [160, 59.19, 80, 29.59], computed: {"border-collapse":"separate"} } },
  },
  {
    lesson: "table-collapse",
    name: "collapse + spacing 0",
    css: ".sheet {\n  font-size: 14px;\n  border-collapse: collapse; border-spacing: 0;\n}\n.sheet th,\n.sheet td {\n  width: 80px;\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n}\n.sheet th {\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { sheet: { rect: [0, 0, 241, 86.78], computed: {"border-collapse":"collapse"} }, h1: { rect: [0.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, h2: { rect: [80.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, h3: { rect: [160.5, 0.5, 80, 28.59], computed: {"border-collapse":"collapse"} }, a1: { rect: [0.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, a2: { rect: [80.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, a3: { rect: [160.5, 29.09, 80, 28.59], computed: {"border-collapse":"collapse"} }, b1: { rect: [0.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} }, b2: { rect: [80.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} }, b3: { rect: [160.5, 57.69, 80, 28.59], computed: {"border-collapse":"collapse"} } },
  },
  {
    lesson: "table-fixed",
    name: "fixed without width",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet { table-layout: fixed; }\n",
    passes: false,
    message: "3 つの列の幅がそろっていません（auto では長い文のある列が広がります。table-layout: fixed は幅の決まった表にだけ効くので、width: 100% も必要です）",
    elements: { wrap: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"fixed"} }, h1: { rect: [0.5, 0.5, 54.8, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [55.3, 0.5, 269.89, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [325.19, 0.5, 34.31, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 54.8, 48.19], computed: {"table-layout":"auto"} }, a2: { rect: [55.3, 29.09, 269.89, 48.19], computed: {"table-layout":"auto"} }, a3: { rect: [325.19, 29.09, 34.31, 48.19], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 77.28, 54.8, 48.19], computed: {"table-layout":"auto"} }, b2: { rect: [55.3, 77.28, 269.89, 48.19], computed: {"table-layout":"auto"} }, b3: { rect: [325.19, 77.28, 34.31, 48.19], computed: {"table-layout":"auto"} } },
  },
  {
    lesson: "table-fixed",
    name: "width only",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet { width: 100%; }\n",
    passes: false,
    message: "3 つの列の幅がそろっていません（auto では長い文のある列が広がります。table-layout: fixed は幅の決まった表にだけ効くので、width: 100% も必要です）",
    elements: { wrap: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 125.97], computed: {"table-layout":"auto"} }, h1: { rect: [0.5, 0.5, 54.8, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [55.3, 0.5, 269.89, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [325.19, 0.5, 34.31, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 54.8, 48.19], computed: {"table-layout":"auto"} }, a2: { rect: [55.3, 29.09, 269.89, 48.19], computed: {"table-layout":"auto"} }, a3: { rect: [325.19, 29.09, 34.31, 48.19], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 77.28, 54.8, 48.19], computed: {"table-layout":"auto"} }, b2: { rect: [55.3, 77.28, 269.89, 48.19], computed: {"table-layout":"auto"} }, b3: { rect: [325.19, 77.28, 34.31, 48.19], computed: {"table-layout":"auto"} } },
  },
  {
    lesson: "table-fixed",
    name: "th width 33%",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet { width: 100%; } .sheet th { width: 33.33%; }\n",
    passes: false,
    message: "列ごとに width を書いてもそろいますが、table-layout: fixed を使いましょう（最初の行だけで列幅が決まり、長い中身があっても列が動かず、描画も速くなります）",
    elements: { wrap: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"auto"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"table-layout":"auto"} } },
  },
  {
    lesson: "table-fixed",
    name: "width 360px + fixed",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  font-size: 14px;\n  border-collapse: collapse;\n  width: 360px;\n  table-layout: fixed;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n",
    passes: true,
    elements: { wrap: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"auto"} }, sheet: { rect: [0, 0, 360, 145.56], computed: {"table-layout":"fixed"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"table-layout":"auto"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"table-layout":"auto"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"table-layout":"auto"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"table-layout":"auto"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"table-layout":"auto"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"table-layout":"auto"} } },
  },
  {
    lesson: "table-caption",
    name: "on the caption",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  width: 100%;\n  table-layout: fixed;\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet caption {\n  padding: 4px 0;\n  font-weight: 700;\n  text-align: left;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet caption { caption-side: bottom; }\n",
    passes: true,
    elements: { wrap: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, sheet: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, cap: { rect: [0, 145.56, 360, 27.59], computed: {"caption-side":"bottom"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"caption-side":"top"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"caption-side":"top"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"caption-side":"top"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"caption-side":"top"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"caption-side":"top"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"caption-side":"top"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"caption-side":"top"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"caption-side":"top"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"caption-side":"top"} } },
  },
  {
    lesson: "table-caption",
    name: "transform",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  width: 100%;\n  table-layout: fixed;\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet caption {\n  padding: 4px 0;\n  font-weight: 700;\n  text-align: left;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet caption { transform: translateY(140px); }\n",
    passes: false,
    message: "表題（caption）が表の下にありません（上に出たままです）",
    elements: { wrap: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, sheet: { rect: [0, 0, 360, 173.16], computed: {"caption-side":"top"} }, cap: { rect: [0, 140, 360, 27.59], computed: {"caption-side":"top"} }, h1: { rect: [0.5, 28.09, 119.66, 28.59], computed: {"caption-side":"top"} }, h2: { rect: [120.16, 28.09, 119.66, 28.59], computed: {"caption-side":"top"} }, h3: { rect: [239.81, 28.09, 119.69, 28.59], computed: {"caption-side":"top"} }, a1: { rect: [0.5, 56.69, 119.66, 87.38], computed: {"caption-side":"top"} }, a2: { rect: [120.16, 56.69, 119.66, 87.38], computed: {"caption-side":"top"} }, a3: { rect: [239.81, 56.69, 119.69, 87.38], computed: {"caption-side":"top"} }, b1: { rect: [0.5, 144.06, 119.66, 28.59], computed: {"caption-side":"top"} }, b2: { rect: [120.16, 144.06, 119.66, 28.59], computed: {"caption-side":"top"} }, b3: { rect: [239.81, 144.06, 119.69, 28.59], computed: {"caption-side":"top"} } },
  },
  {
    lesson: "table-caption",
    name: "table-footer-group",
    css: ".wrap {\n  max-width: 360px;\n}\n.sheet {\n  width: 100%;\n  table-layout: fixed;\n  font-size: 14px;\n  border-collapse: collapse;\n}\n.sheet caption {\n  padding: 4px 0;\n  font-weight: 700;\n  text-align: left;\n}\n.sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n.sheet caption { display: table-footer-group; }\n",
    passes: false,
    message: "caption-side: bottom で表題を下側に置きましょう（表に指定しても、継承されて caption に効きます）",
    elements: { wrap: { rect: [0, 0, 360, 184.75], computed: {"caption-side":"top"} }, sheet: { rect: [0, 0, 360, 184.75], computed: {"caption-side":"top"} }, cap: { rect: [0.5, 145.06, 359, 39.69], computed: {"caption-side":"top"} }, h1: { rect: [0.5, 0.5, 119.66, 28.59], computed: {"caption-side":"top"} }, h2: { rect: [120.16, 0.5, 119.66, 28.59], computed: {"caption-side":"top"} }, h3: { rect: [239.81, 0.5, 119.69, 28.59], computed: {"caption-side":"top"} }, a1: { rect: [0.5, 29.09, 119.66, 87.38], computed: {"caption-side":"top"} }, a2: { rect: [120.16, 29.09, 119.66, 87.38], computed: {"caption-side":"top"} }, a3: { rect: [239.81, 29.09, 119.69, 87.38], computed: {"caption-side":"top"} }, b1: { rect: [0.5, 116.47, 119.66, 28.59], computed: {"caption-side":"top"} }, b2: { rect: [120.16, 116.47, 119.66, 28.59], computed: {"caption-side":"top"} }, b3: { rect: [239.81, 116.47, 119.69, 28.59], computed: {"caption-side":"top"} } },
  },
];

describe("multi-column, float / shape and table lessons: alternatives and wrong answers", () => {
  it("covers every lesson of the three tracks", () => {
    expect(new Set(VARIANTS.map((v) => v.lesson)).size).toBe(9);
  });

  for (const v of VARIANTS) {
    it(`${v.lesson}: ${v.name} ${v.passes ? "passes" : "fails with one message"}`, () => {
      const { challenge } = lessonById(v.lesson)!;
      const res = evaluate(challenge.validators, geometrySnapshot(v.css, v.elements));
      expect(res.failures).toEqual(v.passes ? [] : [v.message]);
    });
  }

  it("the shape lessons read the line starts: with a square wrap every line beside the photo starts at the same x", () => {
    const { starter } = GEOMETRY_RECORDINGS["shape-circle"];
    const xs = ["l1", "l2", "l3", "l4", "l5", "l6", "l7"].map((id) => starter[id]!.rect![0]);
    expect(new Set(xs).size).toBe(1);
    const { solution } = GEOMETRY_RECORDINGS["shape-circle"];
    expect(solution.l1!.rect![0]).toBeLessThan(solution.l4!.rect![0] - 10);
    expect(solution.l7!.rect![0]).toBeLessThan(solution.l4!.rect![0] - 10);
  });

  it("a card broken across the columns reports a box spanning both columns", () => {
    const { starter, solution } = GEOMETRY_RECORDINGS["multicol-break"];
    expect(starter.c3!.rect).toEqual([0, 0, 280, 176]);
    expect(solution.c3!.rect).toEqual([0, 136, 128, 72]);
  });
});

// The flex and grid pattern, keyframe and generated-content lessons, recorded in
// the real sandbox (headless Chrome 155) the way the app checks them: at the
// lesson viewport and, for the two gallery lessons, again at 320px. Each entry
// is one CSS a learner might write (the lesson's own starter or solution when
// `css` is left out) with every message the app shows for it, in order.
interface RecordedCase {
  readonly lesson: string;
  readonly name: string;
  readonly css?: string;
  readonly messages: readonly string[];
  readonly elements: Recorded;
  readonly states?: Readonly<Record<number, Recorded>>;
}

const PATTERN_LESSONS = [
  "flex-wrap",
  "flex-shrink",
  "flex-auto-margin",
  "grid-auto-fill",
  "grid-full-row",
  "grid-minmax-zero",
  "keyframes-define",
  "keyframes-steps",
  "keyframes-fill-mode",
  "before-content",
  "after-attribute",
  "counter-chapters",
];

const PATTERN_CASES: readonly RecordedCase[] = [
  {
    lesson: "flex-wrap",
    name: "starter",
    messages: ["カードが 120px より細く縮んでいます（1 行に詰め込まれています）"],
    elements: { shelf: { rect: [0, 0, 280, 90.78], computed: {"flex-wrap":"nowrap"} }, c1: { rect: [8, 8, 59, 74.78], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [79, 8, 57.94, 74.78], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [148.94, 8, 56.45, 74.78], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [217.39, 8, 58.73, 74.78], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [288.13, 8, 55.98, 74.78], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "solution",
    messages: [],
    elements: { shelf: { rect: [0, 0, 280, 205.56], computed: {"flex-wrap":"wrap"} }, c1: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [140, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [8, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [140, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [8, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "flex-flow row wrap",
    css: ".shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n  flex-flow: row wrap;\n}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: [],
    elements: { shelf: { rect: [0, 0, 280, 205.56], computed: {"flex-wrap":"wrap"} }, c1: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [140, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [8, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [140, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [8, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "wrap-reverse",
    css: ".shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n  flex-wrap: wrap-reverse;\n}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: ["カードが棚の中で折り返していません（2 枚目は 1 枚目の横に、3 枚目は 2 行目の先頭に来るはずです）"],
    elements: { shelf: { rect: [0, 0, 280, 205.56], computed: {"flex-wrap":"wrap-reverse"} }, c1: { rect: [8, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [140, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [8, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [140, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "flex-shrink 0 on the cards",
    css: ".shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.card {\n  flex-shrink: 0;\n}\n",
    messages: ["カードが棚の中で折り返していません（2 枚目は 1 枚目の横に、3 枚目は 2 行目の先頭に来るはずです）"],
    elements: { shelf: { rect: [0, 0, 280, 71.19], computed: {"flex-wrap":"nowrap"} }, c1: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [140, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [272, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [404, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [536, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "column direction",
    css: ".shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.shelf {\n  flex-direction: column;\n}\n",
    messages: ["カードが棚の中で折り返していません（2 枚目は 1 枚目の横に、3 枚目は 2 行目の先頭に来るはずです）"],
    elements: { shelf: { rect: [0, 0, 280, 339.94], computed: {"flex-wrap":"nowrap"} }, c1: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [8, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [8, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [8, 209.56, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [8, 276.75, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-wrap",
    name: "two-column grid",
    css: ".shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.shelf {\n  display: grid;\n  grid-template-columns: repeat(2, 120px);\n}\n",
    messages: ["grid で 2 列にしても見た目は同じですが、ここでは flex-wrap: wrap で折り返しましょう（カードの数や幅が変わっても、入るだけ並びます）"],
    elements: { shelf: { rect: [0, 0, 280, 205.56], computed: {"flex-wrap":"nowrap"} }, c1: { rect: [8, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c2: { rect: [140, 8, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c3: { rect: [8, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c4: { rect: [140, 75.19, 120, 55.19], computed: {"flex-wrap":"nowrap"} }, c5: { rect: [8, 142.38, 120, 55.19], computed: {"flex-wrap":"nowrap"} } },
  },
  {
    lesson: "flex-shrink",
    name: "starter",
    messages: ["アイコンが横につぶれています（幅が 48px より狭く、円になっていません）"],
    elements: { row: { rect: [0, 0, 280, 87], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 18.02, 48], computed: {"flex-shrink":"1"} }, text: { rect: [42.02, 12, 225.98, 63], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "solution",
    messages: [],
    elements: { row: { rect: [0, 0, 280, 108], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 48, 48], computed: {"flex-shrink":"0"} }, text: { rect: [72, 12, 196, 84], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "flex none",
    css: ".row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n  flex: none;\n}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n",
    messages: [],
    elements: { row: { rect: [0, 0, 280, 108], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 48, 48], computed: {"flex-shrink":"0"} }, text: { rect: [72, 12, 196, 84], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "flex 0 0 48px",
    css: ".row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n  flex: 0 0 48px;\n}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n",
    messages: [],
    elements: { row: { rect: [0, 0, 280, 108], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 48, 48], computed: {"flex-shrink":"0"} }, text: { rect: [72, 12, 196, 84], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "min-width 48px",
    css: ".row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n  min-width: 48px;\n}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n",
    messages: ["幅は守れていますが、アイコン自身に flex-shrink: 0 を指定しましょう（「この要素は縮めない」と書くのがいちばん直接的で、アイコンの大きさを変えても書き直しが要りません）"],
    elements: { row: { rect: [0, 0, 280, 108], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 48, 48], computed: {"flex-shrink":"1"} }, text: { rect: [72, 12, 196, 84], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "flex 1 on the text",
    css: ".row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n.text {\n  flex: 1;\n}\n",
    messages: ["幅は守れていますが、アイコン自身に flex-shrink: 0 を指定しましょう（「この要素は縮めない」と書くのがいちばん直接的で、アイコンの大きさを変えても書き直しが要りません）"],
    elements: { row: { rect: [0, 0, 280, 108], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 48, 48], computed: {"flex-shrink":"1"} }, text: { rect: [72, 12, 196, 84], computed: {"flex-shrink":"1"} } },
  },
  {
    lesson: "flex-shrink",
    name: "flex-shrink 0 on the text",
    css: ".row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n.text {\n  flex-shrink: 0;\n}\n",
    messages: ["アイコンが横につぶれています（幅が 48px より狭く、円になっていません）"],
    elements: { row: { rect: [0, 0, 280, 72], computed: {"flex-shrink":"1"} }, avatar: { rect: [12, 12, 0, 48], computed: {"flex-shrink":"1"} }, text: { rect: [24, 12, 601.86, 21], computed: {"flex-shrink":"0"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "starter",
    messages: ["ログインボタンが右端（余白 12px の位置）にありません"],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [181.13, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "solution",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"324.266px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "margin-inline-start auto",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n  margin-inline-start: auto;\n}\n",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"324.266px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "margin shorthand",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n  margin: 0 0 0 auto;\n}\n",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"324.266px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "auto margin after the last link",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n.link + .link {\n  margin-right: auto;\n}\n",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"324.266px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "space-between",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n",
    messages: ["リンクがロゴから離れています（余りはログインボタンの手前にだけ入れて、ロゴとリンクは左に詰めたままにします）"],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [187.22, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [339.3, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "flex-end",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n",
    messages: ["ボタンの左のマージンを auto にして、余ったスペースを吸収させましょう（margin-left: auto）"],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [336.27, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [403.39, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [447.39, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "auto margin after the logo",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n.logo {\n  margin-right: auto;\n}\n",
    messages: ["リンクがロゴから離れています（余りはログインボタンの手前にだけ入れて、ロゴとリンクは左に詰めたままにします）"],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"324.266px"} }, l1: { rect: [403.39, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [447.39, 14, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "absolute button",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n.login {\n  position: absolute;\n  right: 12px;\n}\n",
    messages: ["ボタンの左のマージンを auto にして、余ったスペースを吸収させましょう（margin-left: auto）"],
    elements: { nav: { rect: [0, 0, 596, 38.39], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 8, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 9.39, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 9.39, 42, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 3.39, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "flex-auto-margin",
    name: "growing last link",
    css: ".nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n}\n.link + .link {\n  flex-grow: 1;\n}\n",
    messages: ["ボタンの左のマージンを auto にして、余ったスペースを吸収させましょう（margin-left: auto）"],
    elements: { nav: { rect: [0, 0, 596, 47.59], computed: {"margin-left":"0px","margin-right":"0px"} }, logo: { rect: [12, 12.59, 51.13, 22.39], computed: {"margin-left":"0px","margin-right":"0px"} }, l1: { rect: [79.13, 14, 28, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, l2: { rect: [123.13, 14, 366.27, 19.59], computed: {"margin-left":"0px","margin-right":"0px"} }, login: { rect: [505.39, 8, 78.61, 31.59], computed: {"margin-left":"0px","margin-right":"0px"} } },
  },
  {
    lesson: "grid-auto-fill",
    name: "starter",
    messages: ["grid-template-columns を repeat(auto-fill, minmax(120px, 1fr)) にして、列の数をブラウザに任せましょう（列の数を決め打ちしたり、メディアクエリで切り替えたりせずに）","幅 320px で 2 列になっていません（タイルが 120px より細くならないよう、入るだけの列にします）"],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 131, 56] }, t6: { rect: [143, 68, 131, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 124] }, t1: { rect: [0, 0, 71, 56] }, t2: { rect: [83, 0, 71, 56] }, t3: { rect: [166, 0, 71, 56] }, t4: { rect: [249, 0, 71, 56] }, t5: { rect: [0, 68, 71, 56] }, t6: { rect: [83, 68, 71, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "solution",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 131, 56] }, t6: { rect: [143, 68, 131, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "auto-fit",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 131, 56] }, t6: { rect: [143, 68, 131, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "minmax 110px",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 131, 56] }, t6: { rect: [143, 68, 131, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "minmax 100px (five columns)",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: ["幅 560px で 4 列になっていません（1 段目に 4 枚、5 枚目は 2 段目の先頭に来るはずです）"],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 102.39, 56] }, t2: { rect: [114.39, 0, 102.41, 56] }, t3: { rect: [228.8, 0, 102.39, 56] }, t4: { rect: [343.19, 0, 102.41, 56] }, t5: { rect: [457.59, 0, 102.41, 56] }, t6: { rect: [0, 68, 102.39, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "fixed 120px tracks",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, 120px);\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: ["タイルが行の幅いっぱいに広がっていません（120px 以上の列を、余りを分け合って広げます）","幅 320px で 2 列になっていません（タイルが 120px より細くならないよう、入るだけの列にします）"],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 120, 56] }, t2: { rect: [132, 0, 120, 56] }, t3: { rect: [264, 0, 120, 56] }, t4: { rect: [396, 0, 120, 56] }, t5: { rect: [0, 68, 120, 56] }, t6: { rect: [132, 68, 120, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 120, 56] }, t2: { rect: [132, 0, 120, 56] }, t3: { rect: [0, 68, 120, 56] }, t4: { rect: [132, 68, 120, 56] }, t5: { rect: [0, 136, 120, 56] }, t6: { rect: [132, 136, 120, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "media query",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n@media (max-width: 400px) {\n  .gallery {\n    grid-template-columns: repeat(2, 1fr);\n  }\n}\n",
    messages: ["grid-template-columns を repeat(auto-fill, minmax(120px, 1fr)) にして、列の数をブラウザに任せましょう（列の数を決め打ちしたり、メディアクエリで切り替えたりせずに）"],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 131, 56] }, t6: { rect: [143, 68, 131, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-auto-fill",
    name: "flex wrap",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 12px;\n}\n.tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n.gallery {\n  display: flex;\n  flex-wrap: wrap;\n}\n.tile {\n  flex: 1 1 120px;\n}\n",
    messages: ["2 段目のタイルが 1 段目と同じ列の幅になっていません（グリッドの列にそろえましょう）"],
    elements: { gallery: { rect: [0, 0, 560, 124] }, t1: { rect: [0, 0, 131, 56] }, t2: { rect: [143, 0, 131, 56] }, t3: { rect: [286, 0, 131, 56] }, t4: { rect: [429, 0, 131, 56] }, t5: { rect: [0, 68, 274, 56] }, t6: { rect: [286, 68, 274, 56] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 192] }, t1: { rect: [0, 0, 154, 56] }, t2: { rect: [166, 0, 154, 56] }, t3: { rect: [0, 68, 154, 56] }, t4: { rect: [166, 68, 154, 56] }, t5: { rect: [0, 136, 154, 56] }, t6: { rect: [166, 136, 154, 56] } } },
  },
  {
    lesson: "grid-full-row",
    name: "starter",
    messages: ["見出し（10 月・9 月）が行の幅いっぱいに広がっていません","幅 320px で、見出しが行の幅いっぱいに広がっていません"],
    elements: { gallery: { rect: [0, 0, 560, 104] }, oct: { rect: [0, 0, 131, 48] }, t1: { rect: [143, 0, 131, 48] }, t2: { rect: [286, 0, 131, 48] }, t3: { rect: [429, 0, 131, 48] }, sep: { rect: [0, 56, 131, 48] }, t4: { rect: [143, 56, 131, 48] }, t5: { rect: [286, 56, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 216] }, oct: { rect: [0, 0, 154, 48] }, t1: { rect: [166, 0, 154, 48] }, t2: { rect: [0, 56, 154, 48] }, t3: { rect: [166, 56, 154, 48] }, sep: { rect: [0, 112, 154, 48] }, t4: { rect: [166, 112, 154, 48] }, t5: { rect: [0, 168, 154, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "solution",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 159.19] }, oct: { rect: [0, 0, 560, 19.59] }, t1: { rect: [0, 27.59, 131, 48] }, t2: { rect: [143, 27.59, 131, 48] }, t3: { rect: [286, 27.59, 131, 48] }, sep: { rect: [0, 83.59, 560, 19.59] }, t4: { rect: [0, 111.19, 131, 48] }, t5: { rect: [143, 111.19, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 215.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 154, 48] }, t2: { rect: [166, 27.59, 154, 48] }, t3: { rect: [0, 83.59, 154, 48] }, sep: { rect: [0, 139.59, 320, 19.59] }, t4: { rect: [0, 167.19, 154, 48] }, t5: { rect: [166, 167.19, 154, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "-1 / 1",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n  grid-column: -1 / 1;\n}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 159.19] }, oct: { rect: [0, 0, 560, 19.59] }, t1: { rect: [0, 27.59, 131, 48] }, t2: { rect: [143, 27.59, 131, 48] }, t3: { rect: [286, 27.59, 131, 48] }, sep: { rect: [0, 83.59, 560, 19.59] }, t4: { rect: [0, 111.19, 131, 48] }, t5: { rect: [143, 111.19, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 215.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 154, 48] }, t2: { rect: [166, 27.59, 154, 48] }, t3: { rect: [0, 83.59, 154, 48] }, sep: { rect: [0, 139.59, 320, 19.59] }, t4: { rect: [0, 167.19, 154, 48] }, t5: { rect: [166, 167.19, 154, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "longhands",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n  grid-column-start: 1;\n  grid-column-end: -1;\n}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 560, 159.19] }, oct: { rect: [0, 0, 560, 19.59] }, t1: { rect: [0, 27.59, 131, 48] }, t2: { rect: [143, 27.59, 131, 48] }, t3: { rect: [286, 27.59, 131, 48] }, sep: { rect: [0, 83.59, 560, 19.59] }, t4: { rect: [0, 111.19, 131, 48] }, t5: { rect: [143, 111.19, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 215.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 154, 48] }, t2: { rect: [166, 27.59, 154, 48] }, t3: { rect: [0, 83.59, 154, 48] }, sep: { rect: [0, 139.59, 320, 19.59] }, t4: { rect: [0, 167.19, 154, 48] }, t5: { rect: [166, 167.19, 154, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "span 4",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n  grid-column: span 4;\n}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: ["幅 320px で、写真が 2 列に並んでいません（span 4 のように列の数を決め打ちすると、列が足りない幅では空の列が足されます）"],
    elements: { gallery: { rect: [0, 0, 560, 159.19] }, oct: { rect: [0, 0, 560, 19.59] }, t1: { rect: [0, 27.59, 131, 48] }, t2: { rect: [143, 27.59, 131, 48] }, t3: { rect: [286, 27.59, 131, 48] }, sep: { rect: [0, 83.59, 560, 19.59] }, t4: { rect: [0, 111.19, 131, 48] }, t5: { rect: [143, 111.19, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 159.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 142, 48] }, t2: { rect: [154, 27.59, 142, 48] }, t3: { rect: [308, 27.59, 0, 48] }, sep: { rect: [0, 83.59, 320, 19.59] }, t4: { rect: [0, 111.19, 142, 48] }, t5: { rect: [154, 111.19, 142, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "1 / 5",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n  grid-column: 1 / 5;\n}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: ["幅 320px で、写真が 2 列に並んでいません（span 4 のように列の数を決め打ちすると、列が足りない幅では空の列が足されます）"],
    elements: { gallery: { rect: [0, 0, 560, 159.19] }, oct: { rect: [0, 0, 560, 19.59] }, t1: { rect: [0, 27.59, 131, 48] }, t2: { rect: [143, 27.59, 131, 48] }, t3: { rect: [286, 27.59, 131, 48] }, sep: { rect: [0, 83.59, 560, 19.59] }, t4: { rect: [0, 111.19, 131, 48] }, t5: { rect: [143, 111.19, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 159.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 142, 48] }, t2: { rect: [154, 27.59, 142, 48] }, t3: { rect: [308, 27.59, 0, 48] }, sep: { rect: [0, 83.59, 320, 19.59] }, t4: { rect: [0, 111.19, 142, 48] }, t5: { rect: [154, 111.19, 142, 48] } } },
  },
  {
    lesson: "grid-full-row",
    name: "span 2",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n  grid-column: span 2;\n}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n",
    messages: ["見出し（10 月・9 月）が行の幅いっぱいに広がっていません"],
    elements: { gallery: { rect: [0, 0, 560, 160] }, oct: { rect: [0, 0, 274, 48] }, t1: { rect: [286, 0, 131, 48] }, t2: { rect: [429, 0, 131, 48] }, t3: { rect: [0, 56, 131, 48] }, sep: { rect: [143, 56, 274, 48] }, t4: { rect: [429, 56, 131, 48] }, t5: { rect: [0, 112, 131, 48] } },
    states: { 320: { gallery: { rect: [0, 0, 320, 215.19] }, oct: { rect: [0, 0, 320, 19.59] }, t1: { rect: [0, 27.59, 154, 48] }, t2: { rect: [166, 27.59, 154, 48] }, t3: { rect: [0, 83.59, 154, 48] }, sep: { rect: [0, 139.59, 320, 19.59] }, t4: { rect: [0, 167.19, 154, 48] }, t5: { rect: [166, 167.19, 154, 48] } } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "starter",
    messages: ["説明とコードの列の幅がそろっていません（長いコマンドの行のぶん、コードの列が広がっています）"],
    elements: { docs: { rect: [0, 0, 596, 103.38], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 145.5, 103.38], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [157.5, 0, 438.5, 103.38], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [165.5, 8, 422.5, 18.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "solution",
    messages: [],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [312, 8, 276, 33.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "two minmax tracks",
    css: ".docs {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n",
    messages: [],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [312, 8, 276, 33.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "min-width 0 on the code",
    css: ".docs {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n.code {\n  min-width: 0;\n}\n",
    messages: [],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, pre: { rect: [312, 8, 276, 33.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "overflow hidden on the code",
    css: ".docs {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n.code {\n  overflow: hidden;\n}\n",
    messages: [],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"hidden"} }, pre: { rect: [312, 8, 276, 33.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "min-width 0 on the note",
    css: ".docs {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n.note {\n  min-width: 0;\n}\n",
    messages: ["説明とコードの列の幅がそろっていません（長いコマンドの行のぶん、コードの列が広がっています）"],
    elements: { docs: { rect: [0, 0, 596, 103.38], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 145.5, 103.38], computed: {"min-width":"0px","overflow-x":"visible"} }, code: { rect: [157.5, 0, 438.5, 103.38], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [165.5, 8, 422.5, 18.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "percentage tracks",
    css: ".docs {\n  display: grid;\n  grid-template-columns: calc(50% - 6px) calc(50% - 6px);\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n",
    messages: ["1fr のまま、列の最小の幅を 0 にしましょう（grid-template-columns: repeat(2, minmax(0, 1fr))。50% などの固定の幅や、コードの折り返しでそろえるのではなく）"],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [312, 8, 276, 33.19], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "grid-minmax-zero",
    name: "wrapped code",
    css: ".docs {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n.code pre {\n  white-space: pre-wrap;\n}\n",
    messages: ["1fr のまま、列の最小の幅を 0 にしましょう（grid-template-columns: repeat(2, minmax(0, 1fr))。50% などの固定の幅や、コードの折り返しでそろえるのではなく）"],
    elements: { docs: { rect: [0, 0, 596, 64.19], computed: {"min-width":"0px","overflow-x":"visible"} }, note: { rect: [0, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, code: { rect: [304, 0, 292, 64.19], computed: {"min-width":"auto","overflow-x":"visible"} }, pre: { rect: [312, 8, 276, 36.38], computed: {"min-width":"0px","overflow-x":"auto"} } },
  },
  {
    lesson: "keyframes-define",
    name: "starter",
    messages: ["ボールが動いていません（@keyframes slide を書きましょう。名前は animation の slide とそろえます）"],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [60, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [60, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [60, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "solution",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [110, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [160, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [210, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "to only",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -1s;\n}\n.f2 .ball {\n  animation-delay: -2s;\n}\n.f3 .ball {\n  animation-delay: -3s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes slide {\n  to {\n    translate: 200px;\n  }\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [110, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [160, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [210, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "percentages and transform",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -1s;\n}\n.f2 .ball {\n  animation-delay: -2s;\n}\n.f3 .ball {\n  animation-delay: -3s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes slide {\n  0% {\n    transform: translateX(0);\n  }\n  100% {\n    transform: translateX(200px);\n  }\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [110, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [160, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [210, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "margin-left",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -1s;\n}\n.f2 .ball {\n  animation-delay: -2s;\n}\n.f3 .ball {\n  animation-delay: -3s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes slide {\n  from {\n    margin-left: 0;\n  }\n  to {\n    margin-left: 200px;\n  }\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [110, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [160, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [210, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "only halfway (100px)",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -1s;\n}\n.f2 .ball {\n  animation-delay: -2s;\n}\n.f3 .ball {\n  animation-delay: -3s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes slide {\n  to {\n    translate: 100px;\n  }\n}\n",
    messages: ["コマの位置が合っていません（1 秒で 50px、2 秒で 100px、3 秒で 150px。from で 0、to で 200px まで動かしましょう）"],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [85, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [110, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [135, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-define",
    name: "different name",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -1s;\n}\n.f2 .ball {\n  animation-delay: -2s;\n}\n.f3 .ball {\n  animation-delay: -3s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes move {\n  to {\n    translate: 200px;\n  }\n}\n",
    messages: ["ボールが動いていません（@keyframes slide を書きましょう。名前は animation の slide とそろえます）"],
    elements: { l1: { rect: [60, 70.39, 232, 32] }, b1: { rect: [60, 70.39, 32, 32] }, l2: { rect: [60, 110.39, 232, 32] }, b2: { rect: [60, 110.39, 32, 32] }, l3: { rect: [60, 150.39, 232, 32] }, b3: { rect: [60, 150.39, 32, 32] } },
  },
  {
    lesson: "keyframes-steps",
    name: "starter",
    messages: ["50px ずつのコマ送りになっていません（途中の位置でも止まっています。steps(4) で 4 段階にしましょう）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [85, 70.39, 32, 32], computed: {"animation-timing-function":"linear"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [135, 110.39, 32, 32], computed: {"animation-timing-function":"linear"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [185, 150.39, 32, 32], computed: {"animation-timing-function":"linear"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "solution",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [110, 110.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "steps(4, end)",
    css: ".ball {\n  animation: slide 4s steps(4, end) infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [110, 110.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "steps(4, jump-end)",
    css: ".ball {\n  animation: slide 4s steps(4, jump-end) infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [110, 110.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "longhand",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n.ball {\n  animation-timing-function: steps(4);\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [110, 110.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"steps(4)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "steps(4, start)",
    css: ".ball {\n  animation: slide 4s steps(4, start) infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["最初の一歩が早すぎます（steps(4, start) は区間の始めで進みます。区間の終わりで進む steps(4) にしましょう）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-timing-function":"steps(4, start)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [160, 110.39, 32, 32], computed: {"animation-timing-function":"steps(4, start)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [210, 150.39, 32, 32], computed: {"animation-timing-function":"steps(4, start)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "steps(2)",
    css: ".ball {\n  animation: slide 4s steps(2) infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["4 段階になっていません（0.5 秒・1.5 秒・2.5 秒のコマで、0px・50px・100px に止まるはずです）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"steps(2)"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [60, 110.39, 32, 32], computed: {"animation-timing-function":"steps(2)"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"steps(2)"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "ease",
    css: ".ball {\n  animation: slide 4s ease infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["50px ずつのコマ送りになっていません（途中の位置でも止まっています。steps(4) で 4 段階にしましょう）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [87.38, 70.39, 32, 32], computed: {"animation-timing-function":"ease"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [189.06, 110.39, 32, 32], computed: {"animation-timing-function":"ease"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [240.27, 150.39, 32, 32], computed: {"animation-timing-function":"ease"} } },
  },
  {
    lesson: "keyframes-steps",
    name: "stepped keyframes",
    css: ".ball {\n  animation: slide 4s linear infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n@keyframes slide {\n  0%, 24.9% {\n    translate: 0;\n  }\n  25%, 49.9% {\n    translate: 50px;\n  }\n  50%, 74.9% {\n    translate: 100px;\n  }\n  75%, 100% {\n    translate: 150px;\n  }\n}\n",
    messages: ["キーフレームを細かく刻んでも作れますが、ここでは timing function の steps(4) でコマ送りにしましょう"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b1: { rect: [60, 70.39, 32, 32], computed: {"animation-timing-function":"linear"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b2: { rect: [110, 110.39, 32, 32], computed: {"animation-timing-function":"linear"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-timing-function":"ease"} }, b3: { rect: [160, 150.39, 32, 32], computed: {"animation-timing-function":"linear"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "starter",
    messages: ["終わったあと、ボールが右端に残っていません（いまは終わった瞬間に、アニメーションの前の位置＝左端に戻っています）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [60, 150.39, 32, 32], computed: {"animation-fill-mode":"none"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "solution",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"forwards"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"forwards"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [260, 150.39, 32, 32], computed: {"animation-fill-mode":"forwards"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "both",
    css: ".ball {\n  animation: slide 2s linear both;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"both"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"both"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [260, 150.39, 32, 32], computed: {"animation-fill-mode":"both"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "longhand",
    css: ".ball {\n  animation: slide 2s linear;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n.ball {\n  animation-fill-mode: forwards;\n}\n",
    messages: [],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"forwards"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"forwards"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [260, 150.39, 32, 32], computed: {"animation-fill-mode":"forwards"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "backwards",
    css: ".ball {\n  animation: slide 2s linear backwards;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["終わったあと、ボールが右端に残っていません（いまは終わった瞬間に、アニメーションの前の位置＝左端に戻っています）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"backwards"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"backwards"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [60, 150.39, 32, 32], computed: {"animation-fill-mode":"backwards"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "infinite",
    css: ".ball {\n  animation: slide 2s linear infinite;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["終わったあと、ボールが右端に残っていません（いまは終わった瞬間に、アニメーションの前の位置＝左端に戻っています）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [110, 150.39, 32, 32], computed: {"animation-fill-mode":"none"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "end state as the ball's own style",
    css: ".ball {\n  animation: slide 2s linear;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n.ball {\n  translate: 200px;\n}\n",
    messages: ["ボールの位置そのものを 200px にしておいても残せますが、ここでは animation-fill-mode: forwards で最後のキーフレームを保ちましょう"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [110, 70.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [210, 110.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [260, 150.39, 32, 32], computed: {"animation-fill-mode":"none"} } },
  },
  {
    lesson: "keyframes-fill-mode",
    name: "no animation, ball at 200px",
    css: ".ball {\n  translate: 200px;\n}\n@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n.f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n.f1 .ball {\n  animation-delay: -0.5s;\n}\n.f2 .ball {\n  animation-delay: -1.5s;\n}\n.f3 .ball {\n  animation-delay: -2.5s;\n}\n/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n.demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n",
    messages: ["途中のコマの位置が変わっています（0.5 秒で 50px、1.5 秒で 150px のまま、終わったあとだけ右端に残しましょう）"],
    elements: { l1: { rect: [60, 70.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b1: { rect: [260, 70.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l2: { rect: [60, 110.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b2: { rect: [260, 110.39, 32, 32], computed: {"animation-fill-mode":"none"} }, l3: { rect: [60, 150.39, 232, 32], computed: {"animation-fill-mode":"none"} }, b3: { rect: [260, 150.39, 32, 32], computed: {"animation-fill-mode":"none"} } },
  },
  {
    lesson: "before-content",
    name: "starter",
    messages: ["丸が表示されていません（::before は content がないと作られません。文字のない飾りなら content: \"\" を足します）"],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [0, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [0, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [0, 56.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "solution",
    messages: [],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [18, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [18, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [18, 56.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "space content",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  content: \" \";\n  display: inline-block;\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n",
    messages: [],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [18, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [18, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [18, 56.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "flex item",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n.status {\n  display: flex;\n  align-items: center;\n}\n.status::before {\n  content: \"\";\n}\n",
    messages: [],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [18, 0, 42, 19.59] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [18, 27.59, 42, 19.59] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [18, 55.19, 42, 19.59] } },
  },
  {
    lesson: "before-content",
    name: "vertical-align middle",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  content: \"\";\n  display: inline-block;\n  vertical-align: middle;\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n",
    messages: [],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [18, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [18, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [18, 56.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "content only",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  content: \"\";\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n",
    messages: ["丸の大きさ（10px）が反映されていません（擬似要素は既定でインラインなので、width と height が効きません。display: inline-block を足しましょう）"],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [8, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [8, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [8, 56.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "display block",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  content: \"\";\n  display: block;\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n",
    messages: ["丸と文字が別の行に分かれています（display: block ではなく inline-block にして、文字と同じ行に並べましょう）"],
    elements: { s1: { rect: [0, 0, 596, 29.59] }, "s1-text": { rect: [0, 11, 42, 17] }, s2: { rect: [0, 37.59, 596, 29.59] }, "s2-text": { rect: [0, 48.59, 42, 17] }, s3: { rect: [0, 75.19, 596, 29.59] }, "s3-text": { rect: [0, 86.19, 42, 17] } },
  },
  {
    lesson: "before-content",
    name: "glyph",
    css: ".statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n  content: \"●\";\n  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n",
    messages: ["丸の大きさ（10px）が反映されていません（擬似要素は既定でインラインなので、width と height が効きません。display: inline-block を足しましょう）"],
    elements: { s1: { rect: [0, 0, 596, 19.59] }, "s1-text": { rect: [20.81, 1, 42, 17] }, s2: { rect: [0, 27.59, 596, 19.59] }, "s2-text": { rect: [20.81, 28.59, 42, 17] }, s3: { rect: [0, 55.19, 596, 19.59] }, "s3-text": { rect: [20.81, 56.19, 42, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "starter",
    messages: ["外部サイトへのリンク（https:// で始まるもの）の後ろに、印が付いていません"],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 101.94, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 133.05, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "solution",
    messages: [],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "href^=http",
    css: ".links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n.links a[href^=\"http\"]::after {\n  content: \" ↗\";\n}\n",
    messages: [],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "href*=://",
    css: ".links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n.links a[href*=\"://\"]::after {\n  content: \" ↗\";\n}\n",
    messages: [],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "alt text only",
    css: ".links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n.links a[href^=\"https://\"]::after {\n  content: \" ↗\" / \"（外部サイト）\";\n}\n",
    messages: [],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "every link",
    css: ".links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n.links a::after {\n  content: \" ↗\";\n}\n",
    messages: ["サイト内のリンクにまで印が付いています（属性セレクタ [href^=\"https://\"] で、https:// で始まるものだけを選びましょう）"],
    elements: { in1: { rect: [20, 4, 98.34, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [20, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 98.34, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [20, 79.56, 133.05, 17] } },
  },
  {
    lesson: "after-attribute",
    name: "before instead of after",
    css: ".links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n.links a[href^=\"https://\"]::before {\n  content: \"↗ \";\n}\n",
    messages: ["外部サイトへのリンク（https:// で始まるもの）の後ろに、印が付いていません"],
    elements: { in1: { rect: [20, 4, 84, 17] }, "in1-text": { rect: [20, 4, 84, 17] }, ext1: { rect: [20, 29.19, 116.28, 17] }, "ext1-text": { rect: [34.34, 29.19, 101.94, 17] }, in2: { rect: [20, 54.38, 84, 17] }, "in2-text": { rect: [20, 54.38, 84, 17] }, ext2: { rect: [20, 79.56, 147.39, 17] }, "ext2-text": { rect: [34.34, 79.56, 133.05, 17] } },
  },
  {
    lesson: "counter-chapters",
    name: "starter",
    messages: ["章の前に番号が表示されていません（::before の content に counter(chapter, upper-roman) を書きます）"],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"none"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [0, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [0, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [0, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "solution",
    messages: [],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [18.03, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [22.81, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [27.59, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "increment in ::before",
    css: ".toc {\n  counter-reset: chapter;\n}\n.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.chapter::before {\n  counter-increment: chapter;\n  content: counter(chapter, upper-roman) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: [],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [18.03, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [22.81, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [27.59, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "lower-roman",
    css: ".toc {\n  counter-reset: chapter;\n}\n.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n  counter-increment: chapter;\n}\n.chapter::before {\n  content: counter(chapter, lower-roman) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: [],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [17.53, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [21.81, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [26.09, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "dot and space",
    css: ".toc {\n  counter-reset: chapter;\n}\n.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n  counter-increment: chapter;\n}\n.chapter::before {\n  content: counter(chapter, upper-roman) \". \";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: [],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [21.84, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [26.63, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [31.41, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "decimal",
    css: ".toc {\n  counter-reset: chapter;\n}\n.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n  counter-increment: chapter;\n}\n.chapter::before {\n  content: counter(chapter) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: ["番号が I・II・III と 1 つずつ増えるローマ数字になっていません（どの章も同じ番号なら、.chapter に counter-increment: chapter を書きます）"],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [20.7, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [23.11, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [23.02, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "no counter-increment",
    css: ".toc {\n  counter-reset: chapter;\n}\n.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.chapter::before {\n  content: counter(chapter, upper-roman) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: ["番号が I・II・III と 1 つずつ増えるローマ数字になっていません（どの章も同じ番号なら、.chapter に counter-increment: chapter を書きます）"],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"chapter 0"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [23.08, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [23.08, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [23.08, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "increment in ::before without reset",
    css: ".chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.chapter::before {\n  counter-increment: chapter;\n  content: counter(chapter, upper-roman) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: ["番号が I・II・III と 1 つずつ増えるローマ数字になっていません（どの章も同じ番号なら、.chapter に counter-increment: chapter を書きます）"],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"none"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [18.03, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [18.03, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [18.03, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
  {
    lesson: "counter-chapters",
    name: "no counter-reset",
    css: ".chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n  counter-increment: chapter;\n}\n.chapter::before {\n  content: counter(chapter, upper-roman) \".\";\n  margin-right: 8px;\n  color: #2f5fd0;\n}\n",
    messages: ["番号は振れていますが、目次（.toc）に counter-reset: chapter を書いて、カウンターを用意しましょう（別の目次や入れ子の中でも、1 から数え直せます）"],
    elements: { toc: { rect: [0, 0, 596, 83.17], computed: {"counter-reset":"none"} }, c1: { rect: [0, 0, 596, 22.39], computed: {"counter-reset":"none"} }, "c1-text": { rect: [18.03, 2, 64, 18], computed: {"counter-reset":"none"} }, c2: { rect: [0, 30.39, 596, 22.39], computed: {"counter-reset":"none"} }, "c2-text": { rect: [22.81, 32.39, 48, 18], computed: {"counter-reset":"none"} }, c3: { rect: [0, 60.78, 596, 22.39], computed: {"counter-reset":"none"} }, "c3-text": { rect: [27.59, 62.78, 96, 18], computed: {"counter-reset":"none"} } },
  },
];

/** Every message the app would show for a recorded case: the lesson viewport first, then each extra state. */
function messagesFor(c: RecordedCase): string[] {
  const { challenge } = lessonById(c.lesson)!;
  const css = c.css ?? (c.name === "starter" ? challenge.starterCSS : challenge.solution);
  const messages = [...evaluate(challenge.validators, geometrySnapshot(css, c.elements)).failures];
  for (const state of challenge.states ?? []) {
    const recorded = c.states?.[state.viewport];
    if (!recorded) throw new Error(`${c.lesson} / ${c.name}: nothing recorded at ${state.viewport}px`);
    messages.push(...evaluate(state.validators, geometrySnapshot(css, recorded)).failures);
  }
  return messages;
}

describe("flex and grid patterns, keyframes and generated content: recorded answers", () => {
  it("records a starter, a solution and other answers for each of the 12 lessons", () => {
    expect([...new Set(PATTERN_CASES.map((c) => c.lesson))].sort()).toEqual([...PATTERN_LESSONS].sort());
    for (const id of PATTERN_LESSONS) {
      const names = PATTERN_CASES.filter((c) => c.lesson === id).map((c) => c.name);
      expect(names, id).toEqual(expect.arrayContaining(["starter", "solution"]));
      expect(names.length, id).toBeGreaterThanOrEqual(5);
    }
  });

  for (const c of PATTERN_CASES) {
    it(`${c.lesson}: ${c.name} ${c.messages.length ? "fails with its messages" : "passes"}`, () => {
      expect(messagesFor(c)).toEqual(c.messages);
    });
  }

  it("fails each fresh starter with one message per checked width, and passes each solution", () => {
    for (const id of PATTERN_LESSONS) {
      const { challenge } = lessonById(id)!;
      const starter = PATTERN_CASES.find((c) => c.lesson === id && c.name === "starter")!;
      const solution = PATTERN_CASES.find((c) => c.lesson === id && c.name === "solution")!;
      expect(messagesFor(starter), id).toHaveLength(1 + (challenge.states?.length ?? 0));
      expect(messagesFor(solution), id).toEqual([]);
    }
  });

  it("reads the motion from frames paused at fixed times: linear, stepped, and after the end", () => {
    const x = (c: RecordedCase, n: number): number => c.elements[`b${n}`]!.rect![0] - c.elements[`l${n}`]!.rect![0];
    const frames = (id: string, name: string): number[] => {
      const c = PATTERN_CASES.find((k) => k.lesson === id && k.name === name)!;
      return [1, 2, 3].map((n) => x(c, n));
    };
    expect(frames("keyframes-define", "solution")).toEqual([50, 100, 150]);
    expect(frames("keyframes-steps", "starter")).toEqual([25, 75, 125]);
    expect(frames("keyframes-steps", "solution")).toEqual([0, 50, 100]);
    expect(frames("keyframes-fill-mode", "starter")).toEqual([50, 150, 0]);
    expect(frames("keyframes-fill-mode", "solution")).toEqual([50, 150, 200]);
  });
});

// The combinator, unit, inheritance and hiding lessons, recorded the same way
// (headless Chrome 155, the lesson viewport only: none of them fixes one).
const FUNDAMENTAL_LESSONS = [
  "child-combinator",
  "next-sibling",
  "subsequent-sibling",
  "calc-columns",
  "rem-nested",
  "dvh-height",
  "inherit-font",
  "current-color",
  "revert-reset",
  "visibility-hidden",
  "hidden-attribute",
  "visually-hidden",
];

const FUNDAMENTAL_CASES: readonly RecordedCase[] = [
  {
    lesson: "child-combinator",
    name: "starter",
    messages: ["入れ子の「新着」「セール」にも線や背景が付いています（.menu li は、孫の li まで選びます）"],
    elements: { menu: { rect: [0, 4, 596, 159.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 91.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 68.78, 560, 26.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s2: { rect: [28, 99.17, 560, 26.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m3: { rect: [0, 133.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: "solution",
    messages: [],
    elements: { menu: { rect: [0, 4, 596, 151.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 83.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 64.78, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s2: { rect: [28, 91.17, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m3: { rect: [0, 125.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: "ul.menu > li",
    css: ".menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\nul.menu > li {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n",
    messages: [],
    elements: { menu: { rect: [0, 4, 596, 151.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 83.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 64.78, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s2: { rect: [28, 91.17, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m3: { rect: [0, 125.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: "override the nested items",
    css: ".menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\n.menu li {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n.sub li {\n  margin-top: 0;\n  border-left: 0;\n  background: none;\n}\n",
    messages: ["入れ子の項目を上書きして消すのではなく、.menu > li で直下の子だけを選びましょう"],
    elements: { menu: { rect: [0, 4, 596, 151.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 83.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 64.78, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s2: { rect: [28, 91.17, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m3: { rect: [0, 125.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: "override only the border",
    css: ".menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\n.menu li {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n.sub li {\n  border-left: 0;\n}\n",
    messages: ["入れ子の「新着」「セール」にも線や背景が付いています（.menu li は、孫の li まで選びます）"],
    elements: { menu: { rect: [0, 4, 596, 159.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 91.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 68.78, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgb(219, 228, 251)"} }, s2: { rect: [28, 99.17, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgb(219, 228, 251)"} }, m3: { rect: [0, 133.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: ":not(.sub li)",
    css: ".menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\n.menu li:not(.sub li) {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n",
    messages: ["入れ子の項目を上書きして消すのではなく、.menu > li で直下の子だけを選びましょう"],
    elements: { menu: { rect: [0, 4, 596, 151.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 4, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, m2: { rect: [0, 38.39, 596, 83.17], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} }, s1: { rect: [28, 64.78, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s2: { rect: [28, 91.17, 560, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m3: { rect: [0, 125.56, 596, 30.39], computed: {"border-left-width":"4px","background-color":"rgb(219, 228, 251)"} } },
  },
  {
    lesson: "child-combinator",
    name: "bar removed from every item",
    css: ".menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\n.menu-item {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n",
    messages: ["上の段の項目（ホーム・お問い合わせ）に、左の線が付いていません"],
    elements: { menu: { rect: [0, 0, 596, 119.95], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m1: { rect: [0, 0, 596, 22.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m2: { rect: [0, 22.39, 596, 75.17], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s1: { rect: [16, 44.78, 580, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, s2: { rect: [16, 71.17, 580, 26.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} }, m3: { rect: [0, 97.56, 596, 22.39], computed: {"border-left-width":"0px","background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "next-sibling",
    name: "starter",
    messages: ["見出しのすぐ後の段落が、見出しから離れたままです（上の余白を 4px に詰めます）"],
    elements: { post: { rect: [0, 0, 596, 222.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 38.39, 596, 22.39] }, p2: { rect: [0, 76.78, 596, 22.39] }, h2: { rect: [0, 123.17, 596, 22.39] }, p3: { rect: [0, 161.56, 596, 22.39] }, p4: { rect: [0, 199.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "solution",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 198.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 64.78, 596, 22.39] }, h2: { rect: [0, 111.17, 596, 22.39] }, p3: { rect: [0, 137.56, 596, 22.39] }, p4: { rect: [0, 175.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "h3+p without spaces",
    css: ".post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.post h3+p {\n  margin-top: 4px;\n}\n",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 198.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 64.78, 596, 22.39] }, h2: { rect: [0, 111.17, 596, 22.39] }, p3: { rect: [0, 137.56, 596, 22.39] }, p4: { rect: [0, 175.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "h3 ~ p",
    css: ".post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.post h3 ~ p {\n  margin-top: 4px;\n}\n",
    messages: ["段落どうしの間まで詰まっています（~ は後ろのすべての兄弟を選びます。+ なら直後の 1 つだけです）"],
    elements: { post: { rect: [0, 0, 596, 174.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 52.78, 596, 22.39] }, h2: { rect: [0, 99.17, 596, 22.39] }, p3: { rect: [0, 125.56, 596, 22.39] }, p4: { rect: [0, 151.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "p:first-of-type",
    css: ".post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.post p:first-of-type {\n  margin-top: 4px;\n}\n",
    messages: ["見出しのすぐ後の段落が、見出しから離れたままです（上の余白を 4px に詰めます）"],
    elements: { post: { rect: [0, 0, 596, 210.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 64.78, 596, 22.39] }, h2: { rect: [0, 111.17, 596, 22.39] }, p3: { rect: [0, 149.56, 596, 22.39] }, p4: { rect: [0, 187.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "negative margin under the headings",
    css: ".post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.post h3 {\n  margin-bottom: -12px;\n}\n",
    messages: ["見出しのすぐ次の段落を選ぶ h3 + p を使いましょう（段落を足しても、見出しの直後だけに効きます）"],
    elements: { post: { rect: [0, 0, 596, 198.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 64.78, 596, 22.39] }, h2: { rect: [0, 111.17, 596, 22.39] }, p3: { rect: [0, 137.56, 596, 22.39] }, p4: { rect: [0, 175.95, 596, 22.39] } },
  },
  {
    lesson: "next-sibling",
    name: "counted with nth-child",
    css: ".post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.post p:nth-child(2),\n.post p:nth-child(5) {\n  margin-top: 4px;\n}\n",
    messages: ["見出しのすぐ次の段落を選ぶ h3 + p を使いましょう（段落を足しても、見出しの直後だけに効きます）"],
    elements: { post: { rect: [0, 0, 596, 198.34] }, h1: { rect: [0, 0, 596, 22.39] }, p1: { rect: [0, 26.39, 596, 22.39] }, p2: { rect: [0, 64.78, 596, 22.39] }, h2: { rect: [0, 111.17, 596, 22.39] }, p3: { rect: [0, 137.56, 596, 22.39] }, p4: { rect: [0, 175.95, 596, 22.39] } },
  },
  {
    lesson: "subsequent-sibling",
    name: "starter",
    messages: ["「確認」が薄くなっていません（opacity: 0.4）"],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"1"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"1"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"1"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"1"} } },
  },
  {
    lesson: "subsequent-sibling",
    name: "solution",
    messages: [],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"1"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"1"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"0.4"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"0.4"} } },
  },
  {
    lesson: "subsequent-sibling",
    name: ".current ~ *",
    css: ".steps {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 0;\n  padding: 4px;\n  list-style: none;\n}\n.step {\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n.current {\n  outline: 3px solid #f5c400;\n}\n.current ~ * {\n  opacity: 0.4;\n}\n",
    messages: [],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"1"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"1"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"0.4"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"0.4"} } },
  },
  {
    lesson: "subsequent-sibling",
    name: "+ instead of ~",
    css: ".steps {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 0;\n  padding: 4px;\n  list-style: none;\n}\n.step {\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n.current {\n  outline: 3px solid #f5c400;\n}\n.current + .step {\n  opacity: 0.4;\n}\n",
    messages: ["「完了」が薄くなっていません（+ は直後の 1 つだけを選びます。後ろのすべての兄弟は ~ で選びます）"],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"1"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"1"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"0.4"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"1"} } },
  },
  {
    lesson: "subsequent-sibling",
    name: "counted with nth-child",
    css: ".steps {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 0;\n  padding: 4px;\n  list-style: none;\n}\n.step {\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n.current {\n  outline: 3px solid #f5c400;\n}\n.step:nth-child(n + 4) {\n  opacity: 0.4;\n}\n",
    messages: ["何番目かで選ぶのではなく、.current ~ .step で「いまの段階より後ろ」を選びましょう（いまの段階が変わっても書き直しが要りません）"],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"1"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"1"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"0.4"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"0.4"} } },
  },
  {
    lesson: "subsequent-sibling",
    name: ".step ~ .step",
    css: ".steps {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 0;\n  padding: 4px;\n  list-style: none;\n}\n.step {\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n.current {\n  outline: 3px solid #f5c400;\n}\n.step ~ .step {\n  opacity: 0.4;\n}\n",
    messages: ["「お支払い」とその前の段階は、薄くしません"],
    elements: { steps: { rect: [0, 0, 596, 35.59], computed: {"opacity":"1"} }, st1: { rect: [4, 4, 62, 27.59], computed: {"opacity":"1"} }, st2: { rect: [74, 4, 76, 27.59], computed: {"opacity":"0.4"} }, st3: { rect: [158, 4, 76, 27.59], computed: {"opacity":"0.4"} }, st4: { rect: [242, 4, 48, 27.59], computed: {"opacity":"0.4"} }, st5: { rect: [298, 4, 48, 27.59], computed: {"opacity":"0.4"} } },
  },
  {
    lesson: "calc-columns",
    name: "starter",
    messages: ["1 行に 3 枚並んでいません（4 枚目が 2 行目の先頭に来るはずです）"],
    elements: { cards: { rect: [0, 0, 596, 154.78] }, c1: { rect: [0, 0, 198.66, 43.59] }, c2: { rect: [210.66, 0, 198.66, 43.59] }, c3: { rect: [0, 55.59, 198.66, 43.59] }, c4: { rect: [210.66, 55.59, 198.66, 43.59] }, c5: { rect: [0, 111.19, 198.66, 43.59] }, c6: { rect: [210.66, 111.19, 198.66, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "solution",
    messages: [],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 190.66, 43.59] }, c2: { rect: [202.66, 0, 190.66, 43.59] }, c3: { rect: [405.31, 0, 190.66, 43.59] }, c4: { rect: [0, 55.59, 190.66, 43.59] }, c5: { rect: [202.66, 55.59, 190.66, 43.59] }, c6: { rect: [405.31, 55.59, 190.66, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "calc(33.333% - 8px)",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: calc(33.333% - 8px);\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: [],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 190.66, 43.59] }, c2: { rect: [202.66, 0, 190.66, 43.59] }, c3: { rect: [405.31, 0, 190.66, 43.59] }, c4: { rect: [0, 55.59, 190.66, 43.59] }, c5: { rect: [202.66, 55.59, 190.66, 43.59] }, c6: { rect: [405.31, 55.59, 190.66, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "flex basis calc",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  flex: 0 0 calc((100% - 24px) / 3);\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: [],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 190.66, 43.59] }, c2: { rect: [202.66, 0, 190.66, 43.59] }, c3: { rect: [405.31, 0, 190.66, 43.59] }, c4: { rect: [0, 55.59, 190.66, 43.59] }, c5: { rect: [202.66, 55.59, 190.66, 43.59] }, c6: { rect: [405.31, 55.59, 190.66, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "width 31%",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: 31%;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: ["3 枚で行の幅ぴったりになっていません（gap の 24px を引いてから 3 で割ります）"],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 184.75, 43.59] }, c2: { rect: [196.75, 0, 184.75, 43.59] }, c3: { rect: [393.5, 0, 184.75, 43.59] }, c4: { rect: [0, 55.59, 184.75, 43.59] }, c5: { rect: [196.75, 55.59, 184.75, 43.59] }, c6: { rect: [393.5, 55.59, 184.75, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "flex 1 1 30%",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  flex: 1 1 30%;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n",
    messages: ["ほかの方法でも 3 列にできますが、ここでは .card の幅を calc((100% - 24px) / 3) で計算しましょう（gap を引いて 3 等分するので、幅が変わってもぴったり収まります）"],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 190.66, 43.59] }, c2: { rect: [202.66, 0, 190.67, 43.59] }, c3: { rect: [405.33, 0, 190.67, 43.59] }, c4: { rect: [0, 55.59, 190.66, 43.59] }, c5: { rect: [202.66, 55.59, 190.67, 43.59] }, c6: { rect: [405.33, 55.59, 190.67, 43.59] } },
  },
  {
    lesson: "calc-columns",
    name: "three-column grid",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: 33.333%;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.cards {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}\n",
    messages: ["3 枚で行の幅ぴったりになっていません（gap の 24px を引いてから 3 で割ります）"],
    elements: { cards: { rect: [0, 0, 596, 99.19] }, c1: { rect: [0, 0, 63.55, 43.59] }, c2: { rect: [202.66, 0, 63.55, 43.59] }, c3: { rect: [405.33, 0, 63.55, 43.59] }, c4: { rect: [0, 55.59, 63.55, 43.59] }, c5: { rect: [202.66, 55.59, 63.55, 43.59] }, c6: { rect: [405.33, 55.59, 63.55, 43.59] } },
  },
  {
    lesson: "rem-nested",
    name: "starter",
    messages: ["入れ子の項目の文字が 14px にそろっていません（em は親の文字の大きさが基準なので、階層ごとに 0.875 倍されます）"],
    elements: { i1: { rect: [16, 0, 580, 59.13], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 36.73], computed: {"font-size":"12.25px"} }, i3: { rect: [48, 41.98, 548, 17.14], computed: {"font-size":"10.7188px"} } },
  },
  {
    lesson: "rem-nested",
    name: "solution",
    messages: [],
    elements: { i1: { rect: [16, 0, 580, 67.17], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 44.78], computed: {"font-size":"14px"} }, i3: { rect: [48, 44.78, 548, 22.39], computed: {"font-size":"14px"} } },
  },
  {
    lesson: "rem-nested",
    name: "calc with rem",
    css: ".tree,\n.tree ul {\n  margin: 0;\n  padding-left: 16px;\n}\n.tree li {\n  font-size: calc(14 / 16 * 1rem);\n  line-height: 1.6;\n}\n",
    messages: [],
    elements: { i1: { rect: [16, 0, 580, 67.17], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 44.78], computed: {"font-size":"14px"} }, i3: { rect: [48, 44.78, 548, 22.39], computed: {"font-size":"14px"} } },
  },
  {
    lesson: "rem-nested",
    name: "14px",
    css: ".tree,\n.tree ul {\n  margin: 0;\n  padding-left: 16px;\n}\n.tree li {\n  font-size: 14px;\n  line-height: 1.6;\n}\n",
    messages: ["14px と固定してもそろいますが、rem にしましょう（利用者がブラウザで文字を大きくすると、それに合わせて大きくなります）"],
    elements: { i1: { rect: [16, 0, 580, 67.17], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 44.78], computed: {"font-size":"14px"} }, i3: { rect: [48, 44.78, 548, 22.39], computed: {"font-size":"14px"} } },
  },
  {
    lesson: "rem-nested",
    name: "1em on the nested items",
    css: ".tree,\n.tree ul {\n  margin: 0;\n  padding-left: 16px;\n}\n.tree li {\n  font-size: 0.875em;\n  line-height: 1.6;\n}\n.tree li li {\n  font-size: 1em;\n}\n",
    messages: ["14px と固定してもそろいますが、rem にしましょう（利用者がブラウザで文字を大きくすると、それに合わせて大きくなります）"],
    elements: { i1: { rect: [16, 0, 580, 67.17], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 44.78], computed: {"font-size":"14px"} }, i3: { rect: [48, 44.78, 548, 22.39], computed: {"font-size":"14px"} } },
  },
  {
    lesson: "rem-nested",
    name: "87.5%",
    css: ".tree,\n.tree ul {\n  margin: 0;\n  padding-left: 16px;\n}\n.tree li {\n  font-size: 87.5%;\n  line-height: 1.6;\n}\n",
    messages: ["入れ子の項目の文字が 14px にそろっていません（em は親の文字の大きさが基準なので、階層ごとに 0.875 倍されます）"],
    elements: { i1: { rect: [16, 0, 580, 59.13], computed: {"font-size":"14px"} }, i2: { rect: [32, 22.39, 564, 36.73], computed: {"font-size":"12.25px"} }, i3: { rect: [48, 41.98, 548, 17.14], computed: {"font-size":"10.7188px"} } },
  },
  {
    lesson: "dvh-height",
    name: "starter",
    messages: ["メインの高さが、画面の残り（280px − 56px ＝ 224px）になっていません"],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 54.39] } },
  },
  {
    lesson: "dvh-height",
    name: "solution",
    messages: [],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "vh",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n  min-height: calc(100vh - 56px);\n}\n",
    messages: [],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "svh",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n  min-height: calc(100svh - 56px);\n}\n",
    messages: [],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "height instead of min-height",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n}\n.main {\n  height: calc(100dvh - 56px);\n}\n",
    messages: [],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "flex column on the body",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n}\nbody {\n  display: flex;\n  flex-direction: column;\n  min-height: 100dvh;\n}\n.main {\n  flex: 1;\n}\n",
    messages: [],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "224px",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n}\n.main {\n  height: 224px;\n}\n",
    messages: ["224px と固定すると、画面の高さが変わったときに合いません。100dvh（画面の高さ）から 56px を引きましょう"],
    elements: { head: { rect: [0, 0, 596, 56] }, main: { rect: [0, 56, 596, 224] } },
  },
  {
    lesson: "dvh-height",
    name: "100dvh without the header",
    css: ".head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n}\n.main {\n  min-height: 100dvh;\n}\n",
    messages: ["メインの高さが、画面の残り（280px − 56px ＝ 224px）になっていません"],
    elements: { head: { rect: [0, 0, 581, 56] }, main: { rect: [0, 56, 581, 280] } },
  },
  {
    lesson: "inherit-font",
    name: "starter",
    messages: ["入力欄とボタンの文字が 18px になっていません（フォームの部品は、親の文字の設定を受け継ぎません）"],
    elements: { card: { rect: [0, 0, 596, 93.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 51.8, 165, 27], computed: {"font-size":"13.3333px","font-family":"Arial"} }, btn: { rect: [177, 48.8, 81.33, 33], computed: {"font-size":"13.3333px","font-family":"Arial"} } },
  },
  {
    lesson: "inherit-font",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 596, 101.59], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 48.8, 226, 40.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, btn: { rect: [238, 48.8, 100, 40.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} } },
  },
  {
    lesson: "inherit-font",
    name: "font-family inherit and font-size 100%",
    css: ".card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  font: 18px/1.6 \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\n.card p {\n  margin: 0 0 8px;\n}\n.card input {\n  padding: 4px 8px;\n}\n.card button {\n  padding: 4px 12px;\n}\n.card input,\n.card button {\n  font-family: inherit;\n  font-size: 100%;\n}\n",
    messages: [],
    elements: { card: { rect: [0, 0, 596, 99.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 48.8, 226, 39], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, btn: { rect: [238, 48.8, 100, 39], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} } },
  },
  {
    lesson: "inherit-font",
    name: "font-size 18px only",
    css: ".card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  font: 18px/1.6 \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\n.card p {\n  margin: 0 0 8px;\n}\n.card input {\n  padding: 4px 8px;\n}\n.card button {\n  padding: 4px 12px;\n}\n.card input,\n.card button {\n  font-size: 18px;\n}\n",
    messages: ["大きさだけでなく、書体（font-family）も受け継ぎましょう（font: inherit なら、まとめて親と同じになります）"],
    elements: { card: { rect: [0, 0, 596, 99.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 52.8, 207, 33], computed: {"font-size":"18px","font-family":"Arial"} }, btn: { rect: [219, 48.8, 100, 39], computed: {"font-size":"18px","font-family":"Arial"} } },
  },
  {
    lesson: "inherit-font",
    name: "values copied by hand",
    css: ".card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  font: 18px/1.6 \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\n.card p {\n  margin: 0 0 8px;\n}\n.card input {\n  padding: 4px 8px;\n}\n.card button {\n  padding: 4px 12px;\n}\n.card input,\n.card button {\n  font-size: 18px;\n  font-family: \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\n",
    messages: ["値を書き写すのではなく、inherit で親から受け継ぎましょう（カードの文字を変えても、部品がついてきます）"],
    elements: { card: { rect: [0, 0, 596, 99.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 48.8, 226, 39], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, btn: { rect: [238, 48.8, 100, 39], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} } },
  },
  {
    lesson: "inherit-font",
    name: "button only",
    css: ".card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  font: 18px/1.6 \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\n.card p {\n  margin: 0 0 8px;\n}\n.card input {\n  padding: 4px 8px;\n}\n.card button {\n  padding: 4px 12px;\n}\n.card button {\n  font: inherit;\n}\n",
    messages: ["入力欄とボタンの文字が 18px になっていません（フォームの部品は、親の文字の設定を受け継ぎません）"],
    elements: { card: { rect: [0, 0, 596, 101.59], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, text: { rect: [12, 12, 572, 28.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} }, field: { rect: [12, 57.8, 165, 27], computed: {"font-size":"13.3333px","font-family":"Arial"} }, btn: { rect: [177, 48.8, 100, 40.8], computed: {"font-size":"18px","font-family":"\"Hiragino Sans\", \"Noto Sans JP\", sans-serif"} } },
  },
  {
    lesson: "current-color",
    name: "starter",
    messages: ["削除ボタンの枠線が赤くなっていません（.btn の枠線の色を currentColor に）"],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(47, 95, 208)"} } },
  },
  {
    lesson: "current-color",
    name: "solution",
    messages: [],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(217, 54, 54)"} } },
  },
  {
    lesson: "current-color",
    name: "border without a colour",
    css: ".btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 2px solid;\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: currentColor;\n}\n.danger {\n  color: #d93636;\n}\n",
    messages: [],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(217, 54, 54)"} } },
  },
  {
    lesson: "current-color",
    name: "lowercase currentcolor longhands",
    css: ".btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 2px solid #2f5fd0;\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: #2f5fd0;\n}\n.danger {\n  color: #d93636;\n}\n.btn {\n  border-color: currentcolor;\n}\n.icon {\n  fill: currentcolor;\n}\n",
    messages: [],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(217, 54, 54)"} } },
  },
  {
    lesson: "current-color",
    name: "red written for the danger button",
    css: ".btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 2px solid #2f5fd0;\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: #2f5fd0;\n}\n.danger {\n  color: #d93636;\n}\n.danger {\n  border-color: #d93636;\n}\n.danger .icon {\n  fill: #d93636;\n}\n",
    messages: ["赤を書き足すのではなく、currentColor で文字の色を使いましょう（色の種類が増えても、color を変えるだけで済みます）"],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(217, 54, 54)"} } },
  },
  {
    lesson: "current-color",
    name: "border only",
    css: ".btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 2px solid currentColor;\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: #2f5fd0;\n}\n.danger {\n  color: #d93636;\n}\n",
    messages: ["削除ボタンのアイコンが赤くなっていません（.icon の fill を currentColor に）"],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(47, 95, 208)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(47, 95, 208)"} } },
  },
  {
    lesson: "current-color",
    name: "fill: inherit",
    css: ".btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 2px solid currentColor;\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: inherit;\n}\n.danger {\n  color: #d93636;\n}\n",
    messages: ["削除ボタンのアイコンが赤くなっていません（.icon の fill を currentColor に）"],
    elements: { save: { rect: [0, 0, 82, 38.39], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, "save-icon": { rect: [14, 11.19, 16, 16], computed: {"border-top-color":"rgb(47, 95, 208)","fill":"rgb(0, 0, 0)"} }, del: { rect: [86.19, 0, 82, 38.39], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} }, "del-icon": { rect: [100.19, 11.19, 16, 16], computed: {"border-top-color":"rgb(217, 54, 54)","fill":"rgb(0, 0, 0)"} } },
  },
  {
    lesson: "revert-reset",
    name: "starter",
    messages: ["記事の箇条書きに、黒丸が戻っていません"],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 67.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 52.78, 596, 44.78], computed: {"list-style-type":"none"} }, i1: { rect: [0, 52.78, 596, 22.39], computed: {"list-style-type":"none"} }, "i1-text": { rect: [0, 54.78, 32, 18], computed: {"list-style-type":"none"} }, i2: { rect: [0, 75.17, 596, 22.39], computed: {"list-style-type":"none"} }, "i2-text": { rect: [0, 77.17, 32, 18], computed: {"list-style-type":"none"} } },
  },
  {
    lesson: "revert-reset",
    name: "solution",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 83.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 68.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [40, 68.78, 556, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [40, 70.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [40, 91.17, 556, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [40, 93.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "revert-reset",
    name: "all: revert",
    css: "/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\n.prose ul {\n  all: revert;\n}\n",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 83.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 68.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [40, 68.78, 556, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [40, 70.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [40, 91.17, 556, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [40, 93.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "revert-reset",
    name: "padding and list-style only",
    css: "/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\n.prose ul {\n  padding: revert;\n  list-style: revert;\n}\n",
    messages: [],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 67.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 52.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [40, 52.78, 556, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [40, 54.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [40, 75.17, 556, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [40, 77.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "revert-reset",
    name: "unset",
    css: "/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\n.prose ul {\n  padding: unset;\n  list-style: unset;\n}\n",
    messages: ["記事の箇条書きの字下げ（40px）が戻っていません（unset は初期値の 0 になります。revert ならブラウザの既定に戻ります）"],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 67.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 52.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [0, 52.78, 596, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [0, 54.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [0, 75.17, 596, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [0, 77.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "revert-reset",
    name: "40px and disc by hand",
    css: "/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\n.prose ul {\n  padding-left: 40px;\n  list-style: disc;\n}\n",
    messages: ["40px や disc を書き直しても戻せますが、revert で「ブラウザの既定」に戻しましょう（値を覚えておく必要がありません）"],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"none"} }, n1: { rect: [0, 0, 47.2, 22.39], computed: {"list-style-type":"none"} }, n2: { rect: [63.2, 0, 47.38, 22.39], computed: {"list-style-type":"none"} }, prose: { rect: [0, 30.39, 596, 67.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 52.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [40, 52.78, 556, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [40, 54.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [40, 75.17, 556, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [40, 77.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "revert-reset",
    name: "every ul reverted",
    css: "/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\nul {\n  padding: revert;\n  list-style: revert;\n}\n",
    messages: ["ナビゲーションまで元に戻っています（.prose の中の ul だけを選びます）"],
    elements: { nav: { rect: [0, 0, 596, 22.39], computed: {"list-style-type":"disc"} }, n1: { rect: [40, 0, 47.2, 22.39], computed: {"list-style-type":"disc"} }, n2: { rect: [103.2, 0, 47.38, 22.39], computed: {"list-style-type":"disc"} }, prose: { rect: [0, 30.39, 596, 67.17], computed: {"list-style-type":"disc"} }, list: { rect: [0, 52.78, 596, 44.78], computed: {"list-style-type":"disc"} }, i1: { rect: [40, 52.78, 556, 22.39], computed: {"list-style-type":"disc"} }, "i1-text": { rect: [40, 54.78, 32, 18], computed: {"list-style-type":"disc"} }, i2: { rect: [40, 75.17, 556, 22.39], computed: {"list-style-type":"disc"} }, "i2-text": { rect: [40, 77.17, 32, 18], computed: {"list-style-type":"disc"} } },
  },
  {
    lesson: "visibility-hidden",
    name: "starter",
    messages: ["削除ボタンの場所が詰められ、共有ボタンが左にずれています（display: none は場所ごと取り除きます）"],
    elements: { bar: { rect: [0, 0, 596, 36.39], computed: {"visibility":"visible","opacity":"1"} }, edit: { rect: [0, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} }, del: { rect: [0, 0, 0, 0], computed: {"visibility":"visible","opacity":"1"} }, share: { rect: [70, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} } },
  },
  {
    lesson: "visibility-hidden",
    name: "solution",
    messages: [],
    elements: { bar: { rect: [0, 0, 596, 36.39], computed: {"visibility":"visible","opacity":"1"} }, edit: { rect: [0, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} }, del: { rect: [70, 0, 62, 36.39], computed: {"visibility":"hidden","opacity":"1"} }, share: { rect: [140, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} } },
  },
  {
    lesson: "visibility-hidden",
    name: "opacity 0",
    css: ".toolbar {\n  display: flex;\n  gap: 8px;\n}\n.tool {\n  padding: 6px 14px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #fff;\n  font: inherit;\n}\n.delete {\n  opacity: 0;\n}\n",
    messages: ["opacity: 0 では見えないだけで、クリックやキーボードのフォーカスはできてしまいます。visibility: hidden にしましょう"],
    elements: { bar: { rect: [0, 0, 596, 36.39], computed: {"visibility":"visible","opacity":"1"} }, edit: { rect: [0, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} }, del: { rect: [70, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"0"} }, share: { rect: [140, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} } },
  },
  {
    lesson: "visibility-hidden",
    name: "not hidden at all",
    css: ".toolbar {\n  display: flex;\n  gap: 8px;\n}\n.tool {\n  padding: 6px 14px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #fff;\n  font: inherit;\n}\n.delete {\n  color: inherit;\n}\n",
    messages: ["削除ボタンが見えたままです（場所を残したまま隠します）"],
    elements: { bar: { rect: [0, 0, 596, 36.39], computed: {"visibility":"visible","opacity":"1"} }, edit: { rect: [0, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} }, del: { rect: [70, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} }, share: { rect: [140, 0, 62, 36.39], computed: {"visibility":"visible","opacity":"1"} } },
  },
  {
    lesson: "hidden-attribute",
    name: "starter",
    messages: ["hidden の付いた「保存できませんでした」が表示されたままです（hidden 属性で選んで display: none にします）"],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 43.59, 596, 35.59], computed: {"display":"flex"} }, n3: { rect: [0, 87.19, 596, 35.59], computed: {"display":"flex"} } },
  },
  {
    lesson: "hidden-attribute",
    name: "solution",
    messages: [],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, n3: { rect: [0, 43.59, 596, 35.59], computed: {"display":"flex"} } },
  },
  {
    lesson: "hidden-attribute",
    name: "[hidden] after .notice without !important",
    css: ".notice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n[hidden] {\n  display: none;\n}\n",
    messages: [],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, n3: { rect: [0, 43.59, 596, 35.59], computed: {"display":"flex"} } },
  },
  {
    lesson: "hidden-attribute",
    name: ".notice[hidden]",
    css: ".notice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n.notice[hidden] {\n  display: none;\n}\n",
    messages: [],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, n3: { rect: [0, 43.59, 596, 35.59], computed: {"display":"flex"} } },
  },
  {
    lesson: "hidden-attribute",
    name: ".error hidden",
    css: ".notice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n.error {\n  display: none;\n}\n",
    messages: ["表示するお知らせまで消えたり、display: flex でなくなったりしています（hidden の付いた要素だけを選びます）"],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, n3: { rect: [0, 0, 0, 0], computed: {"display":"none"} } },
  },
  {
    lesson: "hidden-attribute",
    name: "[hidden] with visibility",
    css: ".notice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n[hidden] {\n  visibility: hidden;\n}\n",
    messages: ["hidden の付いた「保存できませんでした」が表示されたままです（hidden 属性で選んで display: none にします）"],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"flex"} }, n2: { rect: [0, 43.59, 596, 35.59], computed: {"display":"flex"} }, n3: { rect: [0, 87.19, 596, 35.59], computed: {"display":"flex"} } },
  },
  {
    lesson: "hidden-attribute",
    name: "display: flex removed",
    css: ".notice {\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n",
    messages: ["表示するお知らせまで消えたり、display: flex でなくなったりしています（hidden の付いた要素だけを選びます）"],
    elements: { n1: { rect: [0, 0, 596, 35.59], computed: {"display":"block"} }, n2: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, n3: { rect: [0, 43.59, 596, 35.59], computed: {"display":"block"} } },
  },
  {
    lesson: "visually-hidden",
    name: "starter",
    messages: ["ラベルが、まだボタンの中で場所を取っています（position: absolute で流れから外します）"],
    elements: { search: { rect: [0, 0, 70, 38.39], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 11.19, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [30, 8, 32, 22.39], computed: {"display":"block","visibility":"visible","clip-path":"none"} } },
  },
  {
    lesson: "visually-hidden",
    name: "solution",
    messages: [],
    elements: { search: { rect: [0, 0, 32, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [8, 15.5, 1, 1], computed: {"display":"block","visibility":"visible","clip-path":"inset(50%)"} } },
  },
  {
    lesson: "visually-hidden",
    name: "clip-path only",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  position: absolute;\n  clip-path: inset(50%);\n}\n",
    messages: [],
    elements: { search: { rect: [0, 0, 32, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [8, 4.8, 32, 22.39], computed: {"display":"block","visibility":"visible","clip-path":"inset(50%)"} } },
  },
  {
    lesson: "visually-hidden",
    name: "moved off screen",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  position: absolute;\n  left: -9999px;\n}\n",
    messages: [],
    elements: { search: { rect: [0, 0, 32, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [-9999, 4.8, 32, 22.39], computed: {"display":"block","visibility":"visible","clip-path":"none"} } },
  },
  {
    lesson: "visually-hidden",
    name: "display none",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  display: none;\n}\n",
    messages: ["display: none や visibility: hidden では、読み上げソフトからも消えてしまいます（見た目だけを消します）"],
    elements: { search: { rect: [0, 0, 32, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [0, 0, 0, 0], computed: {"display":"none","visibility":"visible","clip-path":"none"} } },
  },
  {
    lesson: "visually-hidden",
    name: "visibility hidden",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  visibility: hidden;\n}\n",
    messages: ["display: none や visibility: hidden では、読み上げソフトからも消えてしまいます（見た目だけを消します）"],
    elements: { search: { rect: [0, 0, 70, 38.39], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 11.19, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [30, 8, 32, 22.39], computed: {"display":"block","visibility":"hidden","clip-path":"none"} } },
  },
  {
    lesson: "visually-hidden",
    name: "font-size 0",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  font-size: 0;\n}\n",
    messages: ["ラベルが、まだボタンの中で場所を取っています（position: absolute で流れから外します）"],
    elements: { search: { rect: [0, 0, 38, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [30, 16, 0, 0], computed: {"display":"block","visibility":"visible","clip-path":"none"} } },
  },
  {
    lesson: "visually-hidden",
    name: "absolute but still visible",
    css: ".icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n.label {\n  position: absolute;\n}\n",
    messages: ["ラベルが、まだ見えています（1px の大きさに切り詰めるか、clip-path: inset(50%) で切り抜くか、画面の外へ出します）"],
    elements: { search: { rect: [0, 0, 32, 32], computed: {"display":"inline-flex","visibility":"visible","clip-path":"none"} }, icon: { rect: [8, 8, 16, 16], computed: {"display":"block","visibility":"visible","clip-path":"none"} }, label: { rect: [8, 4.8, 32, 22.39], computed: {"display":"block","visibility":"visible","clip-path":"none"} } },
  },
];

describe("combinators, units, inheritance and hiding: recorded answers", () => {
  it("records a starter, a solution and other answers for each of the 12 lessons", () => {
    expect([...new Set(FUNDAMENTAL_CASES.map((c) => c.lesson))].sort()).toEqual([...FUNDAMENTAL_LESSONS].sort());
    for (const id of FUNDAMENTAL_LESSONS) {
      const names = FUNDAMENTAL_CASES.filter((c) => c.lesson === id).map((c) => c.name);
      expect(names, id).toEqual(expect.arrayContaining(["starter", "solution"]));
      expect(names.length, id).toBeGreaterThanOrEqual(4);
    }
  });

  for (const c of FUNDAMENTAL_CASES) {
    it(`${c.lesson}: ${c.name} ${c.messages.length ? "fails with its message" : "passes"}`, () => {
      expect(messagesFor(c)).toEqual(c.messages);
    });
  }

  it("fails each fresh starter with one message and passes each solution", () => {
    for (const id of FUNDAMENTAL_LESSONS) {
      const starter = FUNDAMENTAL_CASES.find((c) => c.lesson === id && c.name === "starter")!;
      const solution = FUNDAMENTAL_CASES.find((c) => c.lesson === id && c.name === "solution")!;
      expect(messagesFor(starter), id).toHaveLength(1);
      expect(messagesFor(solution), id).toEqual([]);
    }
  });

  it("keeps the hidden button's box with visibility, and takes the visually hidden label out of its button", () => {
    const box = (id: string, name: string, el: string): readonly number[] =>
      FUNDAMENTAL_CASES.find((c) => c.lesson === id && c.name === name)!.elements[el]!.rect!;
    // display: none removes the delete button's box; visibility: hidden keeps it, so "share" stays put.
    expect(box("visibility-hidden", "starter", "del")[2]).toBe(0);
    expect(box("visibility-hidden", "solution", "share")[0]).toBeGreaterThan(box("visibility-hidden", "starter", "share")[0]);
    // The icon button shrinks to the icon and its padding, whichever way the label is hidden.
    for (const name of ["solution", "clip-path only", "moved off screen"]) {
      expect(box("visually-hidden", name, "search")[2], name).toBe(32);
    }
  });
});

// The structural selector, inline box, float and scroll area lessons, recorded
// the same way (headless Chrome 155, the lesson viewport only).
const DETAIL_LESSONS = [
  "nth-child-even",
  "last-child",
  "nth-child-first-three",
  "inline-block",
  "image-gap",
  "unitless-line-height",
  "flow-root",
  "clear-float",
  "display-contents",
  "max-height-scroll",
  "overflow-x-table",
  "flex-min-height",
];

const DETAIL_CASES: readonly RecordedCase[] = [
  {
    lesson: "nth-child-even",
    name: "starter",
    messages: ["2 行目と 4 行目に背景（#eef1f8）が付いていません"],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "solution",
    messages: [],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "2n",
    css: ".table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n.table tbody tr:nth-child(2n) {\n  background: #eef1f8;\n}\n",
    messages: [],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "nth-of-type(even)",
    css: ".table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n.table tbody tr:nth-of-type(even) {\n  background: #eef1f8;\n}\n",
    messages: [],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "odd",
    css: ".table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n.table tbody tr:nth-child(odd) {\n  background: #eef1f8;\n}\n",
    messages: ["2 行目と 4 行目に背景（#eef1f8）が付いていません"],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "rows 2 and 4 listed",
    css: ".table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n.table tbody tr:nth-child(2),\n.table tbody tr:nth-child(4) {\n  background: #eef1f8;\n}\n",
    messages: ["行ごとに番号を書くのではなく :nth-child(even) で選びましょう（行が増えても 1 行おきのままになります）"],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-even",
    name: "every row",
    css: ".table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n.table tbody tr {\n  background: #eef1f8;\n}\n",
    messages: ["1・3・5 行目にまで背景が付いています（even は偶数番目＝2・4…行目です）"],
    elements: { table: { rect: [0, 0, 169.45, 167.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, r1: { rect: [0, 28.59, 169.45, 28.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r2: { rect: [0, 57.19, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r3: { rect: [0, 84.78, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r4: { rect: [0, 112.38, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} }, r5: { rect: [0, 139.97, 169.45, 27.59], computed: {"background-color":"rgb(238, 241, 248)"} } },
  },
  {
    lesson: "last-child",
    name: "starter",
    messages: ["最後の項目（ログアウト）の下線が残っています"],
    elements: { list: { rect: [0, 0, 596, 148.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i2: { rect: [1, 37.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 74.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 110.78, 594, 36.59], computed: {"border-bottom-width":"1px"} } },
  },
  {
    lesson: "last-child",
    name: "solution",
    messages: [],
    elements: { list: { rect: [0, 0, 596, 147.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i2: { rect: [1, 37.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 74.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 110.78, 594, 35.59], computed: {"border-bottom-width":"0px"} } },
  },
  {
    lesson: "last-child",
    name: ":not(:last-child) for the lines",
    css: ".list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  font-size: 14px;\n}\n.list li:not(:last-child) {\n  border-bottom: 1px solid #9fb2e6;\n}\n",
    messages: [],
    elements: { list: { rect: [0, 0, 596, 147.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i2: { rect: [1, 37.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 74.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 110.78, 594, 35.59], computed: {"border-bottom-width":"0px"} } },
  },
  {
    lesson: "last-child",
    name: ":last-of-type",
    css: ".list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #9fb2e6;\n  font-size: 14px;\n}\n.list li:last-of-type {\n  border-bottom: 0;\n}\n",
    messages: [],
    elements: { list: { rect: [0, 0, 596, 147.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i2: { rect: [1, 37.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 74.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 110.78, 594, 35.59], computed: {"border-bottom-width":"0px"} } },
  },
  {
    lesson: "last-child",
    name: "nth-child(4)",
    css: ".list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #9fb2e6;\n  font-size: 14px;\n}\n.list li:nth-child(4) {\n  border-bottom: 0;\n}\n",
    messages: ["4 番目と数えるのではなく :last-child で選びましょう（項目が増えても最後だけに効きます）"],
    elements: { list: { rect: [0, 0, 596, 147.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i2: { rect: [1, 37.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 74.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 110.78, 594, 35.59], computed: {"border-bottom-width":"0px"} } },
  },
  {
    lesson: "last-child",
    name: ":first-child",
    css: ".list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #9fb2e6;\n  font-size: 14px;\n}\n.list li:first-child {\n  border-bottom: 0;\n}\n",
    messages: ["最後の項目（ログアウト）の下線が残っています"],
    elements: { list: { rect: [0, 0, 596, 147.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 35.59], computed: {"border-bottom-width":"0px"} }, i2: { rect: [1, 36.59, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i3: { rect: [1, 73.19, 594, 36.59], computed: {"border-bottom-width":"1px"} }, i4: { rect: [1, 109.78, 594, 36.59], computed: {"border-bottom-width":"1px"} } },
  },
  {
    lesson: "last-child",
    name: "every line removed",
    css: ".list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #9fb2e6;\n  font-size: 14px;\n}\n.list li {\n  border-bottom: 0;\n}\n",
    messages: ["最後以外の項目の下線まで消えています（区切り線は残します）"],
    elements: { list: { rect: [0, 0, 596, 144.38], computed: {"border-bottom-width":"1px"} }, i1: { rect: [1, 1, 594, 35.59], computed: {"border-bottom-width":"0px"} }, i2: { rect: [1, 36.59, 594, 35.59], computed: {"border-bottom-width":"0px"} }, i3: { rect: [1, 72.19, 594, 35.59], computed: {"border-bottom-width":"0px"} }, i4: { rect: [1, 107.78, 594, 35.59], computed: {"border-bottom-width":"0px"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "starter",
    messages: ["上位 3 位に背景（#fff3c4）が付いていません"],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "solution",
    messages: [],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "-n+3 without spaces",
    css: ".ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n.ranking li:nth-child(-n+3) {\n  background: #fff3c4;\n}\n",
    messages: [],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "all, then n + 4 reset",
    css: ".ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n.ranking li {\n  background: #fff3c4;\n}\n.ranking li:nth-child(n + 4) {\n  background: none;\n}\n",
    messages: [],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "1, 2 and 3 listed",
    css: ".ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n.ranking li:nth-child(1),\n.ranking li:nth-child(2),\n.ranking li:nth-child(3) {\n  background: #fff3c4;\n}\n",
    messages: ["1・2・3 と順に書くのではなく、:nth-child(-n + 3) で「最初の 3 つ」を選びましょう（順位の数が変わっても書き直しが要りません）"],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "-n + 2",
    css: ".ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n.ranking li:nth-child(-n + 2) {\n  background: #fff3c4;\n}\n",
    messages: ["上位 3 位に背景（#fff3c4）が付いていません"],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} } },
  },
  {
    lesson: "nth-child-first-three",
    name: "n + 3",
    css: ".ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n.ranking li:nth-child(n + 3) {\n  background: #fff3c4;\n}\n",
    messages: ["上位 3 位に背景（#fff3c4）が付いていません"],
    elements: { ranking: { rect: [0, 0, 596, 165.56], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k1: { rect: [28, 0, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k2: { rect: [28, 27.59, 568, 27.59], computed: {"background-color":"rgba(0, 0, 0, 0)"} }, k3: { rect: [28, 55.19, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k4: { rect: [28, 82.78, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k5: { rect: [28, 110.38, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} }, k6: { rect: [28, 137.97, 568, 27.59], computed: {"background-color":"rgb(255, 243, 196)"} } },
  },
  {
    lesson: "inline-block",
    name: "starter",
    messages: ["タグの幅が 72px になっていません（インライン要素には width が効きません）"],
    elements: { tags: { rect: [0, 0, 596, 28], computed: {"display":"block"} }, t1: { rect: [39.8, 3, 27.42, 21], computed: {"display":"inline"} }, t2: { rect: [75.22, 3, 38.86, 21], computed: {"display":"inline"} }, t3: { rect: [122.08, 3, 55.17, 21], computed: {"display":"inline"} } },
  },
  {
    lesson: "inline-block",
    name: "solution",
    messages: [],
    elements: { tags: { rect: [0, 0, 596, 40], computed: {"display":"block"} }, t1: { rect: [39.8, 4, 72, 32], computed: {"display":"inline-block"} }, t2: { rect: [119.8, 4, 72, 32], computed: {"display":"inline-block"} }, t3: { rect: [199.8, 4, 72, 32], computed: {"display":"inline-block"} } },
  },
  {
    lesson: "inline-block",
    name: "inline-flex",
    css: ".tags {\n  margin: 0;\n  font-size: 14px;\n  line-height: 2;\n}\n.tag {\n  width: 72px;\n  margin: 4px;\n  padding: 2px 0;\n  border-radius: 999px;\n  background: #dbe4fb;\n  color: #18203a;\n  text-align: center;\n  text-decoration: none;\n  display: inline-flex;\n}\n",
    messages: [],
    elements: { tags: { rect: [0, 0, 596, 40], computed: {"display":"block"} }, t1: { rect: [39.8, 4, 72, 32], computed: {"display":"inline-flex"} }, t2: { rect: [119.8, 4, 72, 32], computed: {"display":"inline-flex"} }, t3: { rect: [199.8, 4, 72, 32], computed: {"display":"inline-flex"} } },
  },
  {
    lesson: "inline-block",
    name: "block",
    css: ".tags {\n  margin: 0;\n  font-size: 14px;\n  line-height: 2;\n}\n.tag {\n  width: 72px;\n  margin: 4px;\n  padding: 2px 0;\n  border-radius: 999px;\n  background: #dbe4fb;\n  color: #18203a;\n  text-align: center;\n  text-decoration: none;\n  display: block;\n}\n",
    messages: ["タグが 1 つずつ改行されています（display: block ではなく、行の中に並ぶ inline-block にします）"],
    elements: { tags: { rect: [0, 0, 596, 136], computed: {"display":"block"} }, t1: { rect: [4, 32, 72, 32], computed: {"display":"block"} }, t2: { rect: [4, 68, 72, 32], computed: {"display":"block"} }, t3: { rect: [4, 104, 72, 32], computed: {"display":"block"} } },
  },
  {
    lesson: "inline-block",
    name: "float left",
    css: ".tags {\n  margin: 0;\n  font-size: 14px;\n  line-height: 2;\n}\n.tag {\n  float: left;\n  width: 72px;\n  margin: 4px;\n  padding: 2px 0;\n  border-radius: 999px;\n  background: #dbe4fb;\n  color: #18203a;\n  text-align: center;\n  text-decoration: none;\n}\n",
    messages: ["float や flex でも並びますが、文章の行の中に置く部品は display: inline-block にしましょう"],
    elements: { tags: { rect: [0, 0, 596, 28], computed: {"display":"block"} }, t1: { rect: [4, 4, 72, 32], computed: {"display":"block"} }, t2: { rect: [84, 4, 72, 32], computed: {"display":"block"} }, t3: { rect: [164, 4, 72, 32], computed: {"display":"block"} } },
  },
  {
    lesson: "inline-block",
    name: "flex on the paragraph",
    css: ".tags {\n  margin: 0;\n  font-size: 14px;\n  line-height: 2;\n}\n.tag {\n  width: 72px;\n  margin: 4px;\n  padding: 2px 0;\n  border-radius: 999px;\n  background: #dbe4fb;\n  color: #18203a;\n  text-align: center;\n  text-decoration: none;\n}\n.tags {\n  display: flex;\n  align-items: center;\n}\n",
    messages: ["float や flex でも並びますが、文章の行の中に置く部品は display: inline-block にしましょう"],
    elements: { tags: { rect: [0, 0, 596, 40], computed: {"display":"flex"} }, t1: { rect: [36.02, 4, 72, 32], computed: {"display":"block"} }, t2: { rect: [116.02, 4, 72, 32], computed: {"display":"block"} }, t3: { rect: [196.02, 4, 72, 32], computed: {"display":"block"} } },
  },
  {
    lesson: "image-gap",
    name: "starter",
    messages: ["写真の下にすき間が残っています（画像は文字のベースラインに乗るので、下に文字の下がり分の余白ができます）"],
    elements: { frame: { rect: [0, 0, 240, 125.39], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline","vertical-align":"baseline"} } },
  },
  {
    lesson: "image-gap",
    name: "solution",
    messages: [],
    elements: { frame: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} } },
  },
  {
    lesson: "image-gap",
    name: "vertical-align middle",
    css: ".frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n.photo {\n  vertical-align: middle;\n}\n",
    messages: [],
    elements: { frame: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline","vertical-align":"middle"} } },
  },
  {
    lesson: "image-gap",
    name: "vertical-align bottom",
    css: ".frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n.photo {\n  vertical-align: bottom;\n}\n",
    messages: [],
    elements: { frame: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline","vertical-align":"bottom"} } },
  },
  {
    lesson: "image-gap",
    name: "line-height 0 on the frame",
    css: ".frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n.frame {\n  line-height: 0;\n}\n",
    messages: ["枠の高さや行の高さで隠すのではなく、画像を display: block（または vertical-align: middle など）にしましょう（画像の大きさや文字が変わっても崩れません）"],
    elements: { frame: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline","vertical-align":"baseline"} } },
  },
  {
    lesson: "image-gap",
    name: "frame height fixed",
    css: ".frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n.frame {\n  height: 120px;\n}\n",
    messages: ["枠の高さや行の高さで隠すのではなく、画像を display: block（または vertical-align: middle など）にしましょう（画像の大きさや文字が変わっても崩れません）"],
    elements: { frame: { rect: [0, 0, 240, 120], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline","vertical-align":"baseline"} } },
  },
  {
    lesson: "image-gap",
    name: "inline-block image",
    css: ".frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n.photo {\n  display: inline-block;\n}\n",
    messages: ["写真の下にすき間が残っています（画像は文字のベースラインに乗るので、下に文字の下がり分の余白ができます）"],
    elements: { frame: { rect: [0, 0, 240, 125.39], computed: {"display":"block","vertical-align":"baseline"} }, photo: { rect: [0, 0, 240, 120], computed: {"display":"inline-block","vertical-align":"baseline"} } },
  },
  {
    lesson: "unitless-line-height",
    name: "starter",
    messages: ["見出しの行が詰まっています（親の 24px がそのまま受け継がれています。28px の 1.5 倍の 42px × 2 行＝ 84px になるはずです）"],
    elements: { post: { rect: [0, 0, 596, 104] }, title: { rect: [0, 0, 596, 48] }, body: { rect: [0, 56, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "solution",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 140] }, title: { rect: [0, 0, 596, 84] }, body: { rect: [0, 92, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "font shorthand 16px/1.5",
    css: ".post {\n  font-size: 16px;\n  line-height: 24px;\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n.post {\n  font: 16px/1.5 system-ui, sans-serif;\n}\n",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 140] }, title: { rect: [0, 0, 596, 84] }, body: { rect: [0, 92, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "unitless on the heading",
    css: ".post {\n  font-size: 16px;\n  line-height: 24px;\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n.post h2 {\n  line-height: 1.5;\n}\n",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 140] }, title: { rect: [0, 0, 596, 84] }, body: { rect: [0, 92, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "1.5em",
    css: ".post {\n  font-size: 16px;\n  line-height: 1.5em;\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n",
    messages: ["見出しの行が詰まっています（親の 24px がそのまま受け継がれています。28px の 1.5 倍の 42px × 2 行＝ 84px になるはずです）"],
    elements: { post: { rect: [0, 0, 596, 104] }, title: { rect: [0, 0, 596, 48] }, body: { rect: [0, 56, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "150%",
    css: ".post {\n  font-size: 16px;\n  line-height: 150%;\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n",
    messages: ["見出しの行が詰まっています（親の 24px がそのまま受け継がれています。28px の 1.5 倍の 42px × 2 行＝ 84px になるはずです）"],
    elements: { post: { rect: [0, 0, 596, 104] }, title: { rect: [0, 0, 596, 48] }, body: { rect: [0, 56, 596, 48] } },
  },
  {
    lesson: "unitless-line-height",
    name: "42px on the heading",
    css: ".post {\n  font-size: 16px;\n  line-height: 24px;\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n.post h2 {\n  line-height: 42px;\n}\n",
    messages: ["見出しだけを px で直すのではなく、親の line-height を 1.5 のような単位なしの数にしましょう（子は自分の文字の大きさに掛け算します）"],
    elements: { post: { rect: [0, 0, 596, 140] }, title: { rect: [0, 0, 596, 84] }, body: { rect: [0, 92, 596, 48] } },
  },
  {
    lesson: "flow-root",
    name: "starter",
    messages: ["写真がカードの枠からはみ出しています（float した要素は、親の高さに含まれません）"],
    elements: { card: { rect: [0, 0, 596, 48.39], computed: {"display":"block"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [13, 13, 570, 22.39], computed: {"display":"block"} }, after: { rect: [0, 56.39, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "flow-root",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 596, 122], computed: {"display":"flow-root"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [13, 13, 570, 22.39], computed: {"display":"block"} }, after: { rect: [0, 130, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "flow-root",
    name: "overflow hidden",
    css: ".card {\n  overflow: hidden;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.photo {\n  float: left;\n  margin-right: 12px;\n}\n.card p {\n  margin: 0;\n}\n.after {\n  margin: 8px 0 0;\n}\n",
    messages: ["overflow: hidden や高さの指定、clearfix でも囲めますが、display: flow-root を使いましょう（影や中身が切れたり、文章が増えて崩れたりせず、余計な指定も要りません）"],
    elements: { card: { rect: [0, 0, 596, 122], computed: {"display":"block"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [13, 13, 570, 22.39], computed: {"display":"block"} }, after: { rect: [0, 130, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "flow-root",
    name: "fixed height",
    css: ".card {\n  height: 122px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.photo {\n  float: left;\n  margin-right: 12px;\n}\n.card p {\n  margin: 0;\n}\n.after {\n  margin: 8px 0 0;\n}\n",
    messages: ["overflow: hidden や高さの指定、clearfix でも囲めますが、display: flow-root を使いましょう（影や中身が切れたり、文章が増えて崩れたりせず、余計な指定も要りません）"],
    elements: { card: { rect: [0, 0, 596, 122], computed: {"display":"block"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [13, 13, 570, 22.39], computed: {"display":"block"} }, after: { rect: [0, 130, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "flow-root",
    name: "clearfix",
    css: ".card {\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.photo {\n  float: left;\n  margin-right: 12px;\n}\n.card p {\n  margin: 0;\n}\n.after {\n  margin: 8px 0 0;\n}\n.card::after {\n  content: \"\";\n  display: block;\n  clear: both;\n}\n",
    messages: ["overflow: hidden や高さの指定、clearfix でも囲めますが、display: flow-root を使いましょう（影や中身が切れたり、文章が増えて崩れたりせず、余計な指定も要りません）"],
    elements: { card: { rect: [0, 0, 596, 122], computed: {"display":"block"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [13, 13, 570, 22.39], computed: {"display":"block"} }, after: { rect: [0, 130, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "flow-root",
    name: "flex card",
    css: ".card {\n  display: flex;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.photo {\n  float: left;\n  margin-right: 12px;\n}\n.card p {\n  margin: 0;\n}\n.after {\n  margin: 8px 0 0;\n}\n",
    messages: ["overflow: hidden や高さの指定、clearfix でも囲めますが、display: flow-root を使いましょう（影や中身が切れたり、文章が増えて崩れたりせず、余計な指定も要りません）"],
    elements: { card: { rect: [0, 0, 596, 122], computed: {"display":"flex"} }, photo: { rect: [13, 13, 96, 96], computed: {"display":"block"} }, text: { rect: [121, 13, 224, 96], computed: {"display":"block"} }, after: { rect: [0, 130, 596, 22.39], computed: {"display":"block"} } },
  },
  {
    lesson: "clear-float",
    name: "starter",
    messages: ["見出し「淹れ方」が、写真の横に回り込んでいます（写真の下から始めます）"],
    elements: { post: { rect: [0, 0, 596, 87.17], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [0, 0, 596, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 38.39, 596, 22.39], computed: {"clear":"none"} }, tail: { rect: [0, 64.78, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "clear-float",
    name: "solution",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 152.78], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [0, 0, 596, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 104, 596, 22.39], computed: {"clear":"both"} }, tail: { rect: [0, 130.39, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "clear-float",
    name: "clear left",
    css: ".photo {\n  float: left;\n  margin: 0 12px 8px 0;\n}\n.lead,\n.tail {\n  margin: 0;\n}\n.next {\n  margin: 16px 0 4px;\n  font-size: 16px;\n  clear: left;\n}\n",
    messages: [],
    elements: { post: { rect: [0, 0, 596, 152.78], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [0, 0, 596, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 104, 596, 22.39], computed: {"clear":"left"} }, tail: { rect: [0, 130.39, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "clear-float",
    name: "pushed down with a margin",
    css: ".photo {\n  float: left;\n  margin: 0 12px 8px 0;\n}\n.lead,\n.tail {\n  margin: 0;\n}\n.next {\n  margin: 80px 0 4px;\n  font-size: 16px;\n}\n",
    messages: ["余白で押し下げるのではなく、clear で float の下へ送りましょう（写真の大きさが変わっても、ちょうど下から始まります）"],
    elements: { post: { rect: [0, 0, 596, 151.17], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [0, 0, 596, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 102.39, 596, 22.39], computed: {"clear":"none"} }, tail: { rect: [0, 128.78, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "clear-float",
    name: "clear right",
    css: ".photo {\n  float: left;\n  margin: 0 12px 8px 0;\n}\n.lead,\n.tail {\n  margin: 0;\n}\n.next {\n  margin: 16px 0 4px;\n  font-size: 16px;\n  clear: right;\n}\n",
    messages: ["見出し「淹れ方」が、写真の横に回り込んでいます（写真の下から始めます）"],
    elements: { post: { rect: [0, 0, 596, 87.17], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [0, 0, 596, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 38.39, 596, 22.39], computed: {"clear":"right"} }, tail: { rect: [0, 64.78, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "clear-float",
    name: "flow-root on the lead",
    css: ".photo {\n  float: left;\n  margin: 0 12px 8px 0;\n}\n.lead,\n.tail {\n  margin: 0;\n}\n.next {\n  margin: 16px 0 4px;\n  font-size: 16px;\n}\n.lead {\n  display: flow-root;\n}\n",
    messages: ["見出し「淹れ方」が、写真の横に回り込んでいます（写真の下から始めます）"],
    elements: { post: { rect: [0, 0, 596, 87.17], computed: {"clear":"none"} }, photo: { rect: [0, 0, 96, 96], computed: {"clear":"none"} }, lead: { rect: [108, 0, 488, 22.39], computed: {"clear":"none"} }, next: { rect: [0, 38.39, 596, 22.39], computed: {"clear":"none"} }, tail: { rect: [0, 64.78, 596, 22.39], computed: {"clear":"none"} } },
  },
  {
    lesson: "display-contents",
    name: "starter",
    messages: ["おすすめの 2 枚が 1 マスの中に積まれています（入れ物の .group が、1 つのグリッドアイテムになっています）"],
    elements: { grid: { rect: [0, 0, 596, 87.19], computed: {"display":"grid"} }, c1: { rect: [0, 0, 143, 87.19], computed: {"display":"block"} }, group: { rect: [151, 0, 143, 87.19], computed: {"display":"block"} }, c2: { rect: [151, 0, 143, 43.59], computed: {"display":"block"} }, c3: { rect: [151, 43.59, 143, 43.59], computed: {"display":"block"} }, c4: { rect: [302, 0, 143, 87.19], computed: {"display":"block"} } },
  },
  {
    lesson: "display-contents",
    name: "solution",
    messages: [],
    elements: { grid: { rect: [0, 0, 596, 43.59], computed: {"display":"grid"} }, c1: { rect: [0, 0, 143, 43.59], computed: {"display":"block"} }, group: { rect: [0, 0, 0, 0], computed: {"display":"contents"} }, c2: { rect: [151, 0, 143, 43.59], computed: {"display":"block"} }, c3: { rect: [302, 0, 143, 43.59], computed: {"display":"block"} }, c4: { rect: [453, 0, 143, 43.59], computed: {"display":"block"} } },
  },
  {
    lesson: "display-contents",
    name: "subgrid",
    css: ".grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 8px;\n}\n.card {\n  padding: 12px 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.pick {\n  background: #fff3c4;\n}\n.group {\n  display: grid;\n  grid-column: span 2;\n  grid-template-columns: subgrid;\n}\n",
    messages: ["subgrid などでも並べられますが、ここでは display: contents で入れ物の箱をなくしましょう"],
    elements: { grid: { rect: [0, 0, 596, 43.59], computed: {"display":"grid"} }, c1: { rect: [0, 0, 143, 43.59], computed: {"display":"block"} }, group: { rect: [151, 0, 294, 43.59], computed: {"display":"grid"} }, c2: { rect: [151, 0, 143, 43.59], computed: {"display":"block"} }, c3: { rect: [302, 0, 143, 43.59], computed: {"display":"block"} }, c4: { rect: [453, 0, 143, 43.59], computed: {"display":"block"} } },
  },
  {
    lesson: "display-contents",
    name: "group hidden",
    css: ".grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 8px;\n}\n.card {\n  padding: 12px 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.pick {\n  background: #fff3c4;\n}\n.group {\n  display: none;\n}\n",
    messages: ["おすすめの 2 枚が 1 マスの中に積まれています（入れ物の .group が、1 つのグリッドアイテムになっています）"],
    elements: { grid: { rect: [0, 0, 596, 43.59], computed: {"display":"grid"} }, c1: { rect: [0, 0, 143, 43.59], computed: {"display":"block"} }, group: { rect: [0, 0, 0, 0], computed: {"display":"none"} }, c2: { rect: [0, 0, 0, 0], computed: {"display":"block"} }, c3: { rect: [0, 0, 0, 0], computed: {"display":"block"} }, c4: { rect: [151, 0, 143, 43.59], computed: {"display":"block"} } },
  },
  {
    lesson: "display-contents",
    name: "flex group",
    css: ".grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 8px;\n}\n.card {\n  padding: 12px 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.pick {\n  background: #fff3c4;\n}\n.group {\n  display: flex;\n  gap: 8px;\n}\n",
    messages: ["おすすめの 2 枚が 1 マスの中に積まれています（入れ物の .group が、1 つのグリッドアイテムになっています）"],
    elements: { grid: { rect: [0, 0, 596, 63.19], computed: {"display":"grid"} }, c1: { rect: [0, 0, 143, 63.19], computed: {"display":"block"} }, group: { rect: [151, 0, 143, 63.19], computed: {"display":"flex"} }, c2: { rect: [151, 0, 66.75, 63.19], computed: {"display":"block"} }, c3: { rect: [225.75, 0, 68.25, 63.19], computed: {"display":"block"} }, c4: { rect: [302, 0, 143, 63.19], computed: {"display":"block"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "starter",
    messages: ["一覧の高さが 160px になっていません（max-height で上限を決めます）"],
    elements: { panel: { rect: [0, 0, 260, 305.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 264], computed: {"overflow-y":"visible","max-height":"none"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "solution",
    messages: [],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"auto","max-height":"160px"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "overflow-y scroll",
    css: ".panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  max-height: 160px;\n  overflow-y: scroll;\n}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n",
    messages: [],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"scroll","max-height":"160px"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "overflow shorthand",
    css: ".panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  max-height: 160px;\n  overflow: auto;\n}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n",
    messages: [],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"auto","max-height":"160px"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "height instead of max-height",
    css: ".panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  height: 160px;\n  overflow-y: auto;\n}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n",
    messages: ["height: 160px だと、通知が少ないときも 160px のままです。max-height で「最大 160px」にしましょう"],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"auto","max-height":"none"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "max-height without overflow",
    css: ".panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  max-height: 160px;\n}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n",
    messages: ["高さは 160px ですが、あふれた通知が一覧の外にはみ出しています（overflow-y: auto で一覧の中をスクロールさせます）"],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"visible","max-height":"160px"} } },
  },
  {
    lesson: "max-height-scroll",
    name: "overflow hidden",
    css: ".panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  max-height: 160px;\n  overflow-y: hidden;\n}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n",
    messages: ["overflow-y: hidden では、あふれた通知が見えなくなり、スクロールもできません。auto にしましょう"],
    elements: { panel: { rect: [0, 0, 260, 201.59], computed: {"overflow-y":"visible","max-height":"none"} }, list: { rect: [9, 32.59, 242, 160], computed: {"overflow-y":"hidden","max-height":"160px"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "starter",
    messages: ["表がカードの枠からはみ出したままです（表を包む .table-wrap を、横にスクロールする領域にします）"],
    elements: { card: { rect: [0, 0, 280, 111.78], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 85.78], computed: {"overflow-x":"visible"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 126.78], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 100.78], computed: {"overflow-x":"auto"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "overflow-x scroll",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n.table-wrap {\n  overflow-x: scroll;\n}\n",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 126.78], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 100.78], computed: {"overflow-x":"scroll"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "the card scrolls",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n.card {\n  overflow-x: auto;\n}\n",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 126.78], computed: {"overflow-x":"auto"} }, wrap: { rect: [13, 13, 254, 85.78], computed: {"overflow-x":"visible"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "overflow-x hidden",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n.table-wrap {\n  overflow-x: hidden;\n}\n",
    messages: ["overflow-x: hidden では右の列が切れて見えなくなり、スクロールもできません。auto にしましょう"],
    elements: { card: { rect: [0, 0, 280, 111.78], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 85.78], computed: {"overflow-x":"hidden"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "columns squeezed",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n.table-wrap {\n  overflow-x: auto;\n}\n.table {\n  width: 100%;\n  table-layout: fixed;\n}\n.table th,\n.table td {\n  white-space: normal;\n}\n",
    messages: ["表の列が縮められています（列を折り返したり詰めたりせず、表の幅のままスクロールさせます）"],
    elements: { card: { rect: [0, 0, 280, 224.75], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 198.75], computed: {"overflow-x":"auto"} }, table: { rect: [13, 13, 254, 183.75], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "overflow-x-table",
    name: "overflow on the table",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n.table {\n  overflow-x: auto;\n}\n",
    messages: ["表がカードの枠からはみ出したままです（表を包む .table-wrap を、横にスクロールする領域にします）"],
    elements: { card: { rect: [0, 0, 280, 111.78], computed: {"overflow-x":"visible"} }, wrap: { rect: [13, 13, 254, 85.78], computed: {"overflow-x":"visible"} }, table: { rect: [13, 13, 350.66, 85.78], computed: {"overflow-x":"visible"} } },
  },
  {
    lesson: "flex-min-height",
    name: "starter",
    messages: ["一覧がパネル（240px）の下へはみ出しています（真ん中の .main が、中身より小さく縮めないためです）"],
    elements: { panel: { rect: [0, 0, 581, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 579, 320], computed: {"min-height":"auto","overflow-y":"visible"} }, list: { rect: [1, 49, 579, 320], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "solution",
    messages: [],
    elements: { panel: { rect: [0, 0, 596, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 594, 190], computed: {"min-height":"0px","overflow-y":"visible"} }, list: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "overflow hidden on .main",
    css: ".panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n",
    messages: [],
    elements: { panel: { rect: [0, 0, 596, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"hidden"} }, list: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "min-height 0 on the list only",
    css: ".panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n.list {\n  min-height: 0;\n}\n",
    messages: ["一覧がパネル（240px）の下へはみ出しています（真ん中の .main が、中身より小さく縮めないためです）"],
    elements: { panel: { rect: [0, 0, 581, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 579, 320], computed: {"min-height":"auto","overflow-y":"visible"} }, list: { rect: [1, 49, 579, 320], computed: {"min-height":"0px","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "fixed height on .main",
    css: ".panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n.main {\n  height: 190px;\n  flex: none;\n}\n",
    messages: ["高さを固定するのではなく、.main に min-height: 0 を指定して縮められるようにしましょう（パネルの高さが変わっても合います）"],
    elements: { panel: { rect: [0, 0, 596, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"visible"} }, list: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "max-height on the list",
    css: ".panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n.list {\n  max-height: 190px;\n}\n",
    messages: ["高さを固定するのではなく、.main に min-height: 0 を指定して縮められるようにしましょう（パネルの高さが変わっても合います）"],
    elements: { panel: { rect: [0, 0, 596, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"visible"} }, list: { rect: [1, 49, 594, 190], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
  {
    lesson: "flex-min-height",
    name: "flex basis 0",
    css: ".panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n.main {\n  flex: 1 1 0;\n}\n",
    messages: ["一覧がパネル（240px）の下へはみ出しています（真ん中の .main が、中身より小さく縮めないためです）"],
    elements: { panel: { rect: [0, 0, 581, 240], computed: {"min-height":"0px","overflow-y":"visible"} }, main: { rect: [1, 49, 579, 320], computed: {"min-height":"auto","overflow-y":"visible"} }, list: { rect: [1, 49, 579, 320], computed: {"min-height":"auto","overflow-y":"auto"} } },
  },
];

describe("structural selectors, inline boxes, floats and scroll areas: recorded answers", () => {
  it("records a starter, a solution and other answers for each of the 12 lessons", () => {
    expect([...new Set(DETAIL_CASES.map((c) => c.lesson))].sort()).toEqual([...DETAIL_LESSONS].sort());
    for (const id of DETAIL_LESSONS) {
      const names = DETAIL_CASES.filter((c) => c.lesson === id).map((c) => c.name);
      expect(names, id).toEqual(expect.arrayContaining(["starter", "solution"]));
      expect(names.length, id).toBeGreaterThanOrEqual(5);
    }
  });

  for (const c of DETAIL_CASES) {
    it(`${c.lesson}: ${c.name} ${c.messages.length ? "fails with its message" : "passes"}`, () => {
      expect(messagesFor(c)).toEqual(c.messages);
    });
  }

  it("fails each fresh starter with one message and passes each solution", () => {
    for (const id of DETAIL_LESSONS) {
      const starter = DETAIL_CASES.find((c) => c.lesson === id && c.name === "starter")!;
      const solution = DETAIL_CASES.find((c) => c.lesson === id && c.name === "solution")!;
      expect(messagesFor(starter), id).toHaveLength(1);
      expect(messagesFor(solution), id).toEqual([]);
    }
  });

  it("measures what the layout does, not how the CSS reads", () => {
    const rect = (id: string, name: string, el: string): readonly number[] =>
      DETAIL_CASES.find((c) => c.lesson === id && c.name === name)!.elements[el]!.rect!;
    // On the baseline the image leaves a strip under it; off the baseline it does not.
    const gap = (name: string): number => {
      const [, fy, , fh] = rect("image-gap", name, "frame");
      const [, py, , ph] = rect("image-gap", name, "photo");
      return fy + fh - (py + ph);
    };
    expect(gap("starter")).toBeGreaterThan(2);
    expect(gap("solution")).toBe(0);
    // An inherited 24px squeezes the 28px heading's two lines; a unitless 1.5 gives each 42px.
    expect(rect("unitless-line-height", "starter", "title")[3]).toBe(48);
    expect(rect("unitless-line-height", "solution", "title")[3]).toBe(84);
    // The middle box grows with the list until min-height: 0 lets it shrink into the panel.
    expect(rect("flex-min-height", "starter", "main")[3]).toBeGreaterThan(rect("flex-min-height", "starter", "panel")[3]);
    expect(rect("flex-min-height", "solution", "main")[3]).toBeLessThan(rect("flex-min-height", "solution", "panel")[3]);
  });
});

// The sizing, decoration, flex sizing and grid placement lessons, recorded the
// same way (headless Chrome 155; the two flex sizing lessons at 560px and 320px).
const SIZING_LESSONS = [
  "box-sizing",
  "width-auto",
  "image-max-width",
  "outline-selected",
  "layered-shadow",
  "border-radius-shapes",
  "flex-ratio",
  "flex-basis-wrap",
  "flex-order",
  "grid-span",
  "grid-dense",
  "grid-overlap",
];

const SIZING_CASES: readonly RecordedCase[] = [
  {
    lesson: "box-sizing",
    name: "starter",
    messages: ["検索欄がカードの幅にぴったり収まっていません（content-box では、width: 100% に padding と枠線が足されます）"],
    elements: { card: { rect: [0, 0, 280, 91.98], computed: {"box-sizing":"border-box"} }, field: { rect: [13, 36.59, 282, 42.39], computed: {"box-sizing":"content-box"} } },
  },
  {
    lesson: "box-sizing",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 91.98], computed: {"box-sizing":"border-box"} }, field: { rect: [13, 36.59, 254, 42.39], computed: {"box-sizing":"border-box"} } },
  },
  {
    lesson: "box-sizing",
    name: "calc(100% - 28px)",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.label {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 14px;\n}\n/* 以前から使っている部品の CSS */\n.field {\n  box-sizing: content-box;\n  width: calc(100% - 28px);\n  padding: 8px 12px;\n  border: 2px solid #2f5fd0;\n  border-radius: 6px;\n  font: inherit;\n}\n",
    messages: ["calc で引き算しなくても、box-sizing: border-box なら width に padding と枠線が含まれます"],
    elements: { card: { rect: [0, 0, 280, 91.98], computed: {"box-sizing":"border-box"} }, field: { rect: [13, 36.59, 254, 42.39], computed: {"box-sizing":"content-box"} } },
  },
  {
    lesson: "box-sizing",
    name: "width auto",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.label {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 14px;\n}\n/* 以前から使っている部品の CSS */\n.field {\n  box-sizing: content-box;\n  width: auto;\n  padding: 8px 12px;\n  border: 2px solid #2f5fd0;\n  border-radius: 6px;\n  font: inherit;\n}\n",
    messages: ["検索欄がカードの幅にぴったり収まっていません（content-box では、width: 100% に padding と枠線が足されます）"],
    elements: { card: { rect: [0, 0, 280, 91.98], computed: {"box-sizing":"border-box"} }, field: { rect: [13, 36.59, 203, 42.39], computed: {"box-sizing":"content-box"} } },
  },
  {
    lesson: "box-sizing",
    name: "padding removed",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.label {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 14px;\n}\n/* 以前から使っている部品の CSS */\n.field {\n  box-sizing: content-box;\n  width: 100%;\n  padding: 0;\n  border: 2px solid #2f5fd0;\n  border-radius: 6px;\n  font: inherit;\n}\n",
    messages: ["検索欄がカードの幅にぴったり収まっていません（content-box では、width: 100% に padding と枠線が足されます）"],
    elements: { card: { rect: [0, 0, 280, 75.98], computed: {"box-sizing":"border-box"} }, field: { rect: [13, 36.59, 258, 26.39], computed: {"box-sizing":"content-box"} } },
  },
  {
    lesson: "width-auto",
    name: "starter",
    messages: ["お知らせが、左右に 16px ずつあけてカードに収まっていません（width: 100% に margin が足されてはみ出しています）"],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [29, 43.39, 254, 55.19] } },
  },
  {
    lesson: "width-auto",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [29, 43.39, 222, 55.19] } },
  },
  {
    lesson: "width-auto",
    name: "width: auto written",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-weight: 700;\n}\n.notice {\n  width: auto;\n  margin: 0 16px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #fff3c4;\n  font-size: 14px;\n}\n",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [29, 43.39, 222, 55.19] } },
  },
  {
    lesson: "width-auto",
    name: "calc(100% - 32px)",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-weight: 700;\n}\n.notice {\n  width: calc(100% - 32px);\n  margin: 0 16px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #fff3c4;\n  font-size: 14px;\n}\n",
    messages: ["calc で幅を引き算しなくても、width: auto（指定しない）なら左右の margin を除いた幅に自動で収まります"],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [29, 43.39, 222, 55.19] } },
  },
  {
    lesson: "width-auto",
    name: "margins removed",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-weight: 700;\n}\n.notice {\n  width: 100%;\n  margin: 0;\n  padding: 8px;\n  border-radius: 6px;\n  background: #fff3c4;\n  font-size: 14px;\n}\n",
    messages: ["お知らせが、左右に 16px ずつあけてカードに収まっていません（width: 100% に margin が足されてはみ出しています）"],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [13, 43.39, 254, 55.19] } },
  },
  {
    lesson: "width-auto",
    name: "border-box does not help",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-weight: 700;\n}\n.notice {\n  width: 100%;\n  margin: 0 16px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #fff3c4;\n  font-size: 14px;\n}\n.notice {\n  box-sizing: border-box;\n}\n",
    messages: ["お知らせが、左右に 16px ずつあけてカードに収まっていません（width: 100% に margin が足されてはみ出しています）"],
    elements: { card: { rect: [0, 0, 280, 111.58] }, notice: { rect: [29, 43.39, 254, 55.19] } },
  },
  {
    lesson: "image-max-width",
    name: "starter",
    messages: ["写真がカードの幅に収まっていません（画像は元の大きさで表示されます）"],
    elements: { card: { rect: [0, 0, 280, 296.39], computed: {"max-width":"none"} }, photo: { rect: [13, 43.39, 480, 240], computed: {"max-width":"none"} } },
  },
  {
    lesson: "image-max-width",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 280, 183.39], computed: {"max-width":"none"} }, photo: { rect: [13, 43.39, 254, 127], computed: {"max-width":"100%"} } },
  },
  {
    lesson: "image-max-width",
    name: "max-width only",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.photo {\n  display: block;\n  max-width: 100%;\n}\n",
    messages: ["写真が縦に引き伸ばされています（height 属性の 240px が残っています。height: auto で縦横比を保ちます）"],
    elements: { card: { rect: [0, 0, 280, 296.39], computed: {"max-width":"none"} }, photo: { rect: [13, 43.39, 254, 240], computed: {"max-width":"100%"} } },
  },
  {
    lesson: "image-max-width",
    name: "width 100% and height auto",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.photo {\n  display: block;\n  width: 100%;\n  height: auto;\n}\n",
    messages: ["width: 100% だと、枠より小さい画像まで引き伸ばされます。max-width: 100% で「枠より大きいときだけ縮める」にしましょう"],
    elements: { card: { rect: [0, 0, 280, 183.39], computed: {"max-width":"none"} }, photo: { rect: [13, 43.39, 254, 127], computed: {"max-width":"none"} } },
  },
  {
    lesson: "image-max-width",
    name: "fixed 254px",
    css: ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.photo {\n  display: block;\n  width: 254px;\n  height: auto;\n}\n",
    messages: ["width: 100% だと、枠より小さい画像まで引き伸ばされます。max-width: 100% で「枠より大きいときだけ縮める」にしましょう"],
    elements: { card: { rect: [0, 0, 280, 183.39], computed: {"max-width":"none"} }, photo: { rect: [13, 43.39, 254, 127], computed: {"max-width":"none"} } },
  },
  {
    lesson: "outline-selected",
    name: "starter",
    messages: ["選んだチップが大きくなっています（border は箱の大きさに含まれるので、太くすると隣のチップが押されます）"],
    elements: { chips: { rect: [0, 0, 596, 33.59], computed: {"border-top-width":"0px","outline-style":"none","outline-width":"3px"} }, c1: { rect: [0, 0, 67.03, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c2: { rect: [75.03, 0, 72, 33.59], computed: {"border-top-width":"3px","outline-style":"none","outline-width":"3px"} }, c3: { rect: [155.03, 0, 66.75, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c4: { rect: [229.78, 0, 54, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} } },
  },
  {
    lesson: "outline-selected",
    name: "solution",
    messages: [],
    elements: { chips: { rect: [0, 0, 596, 29.59], computed: {"border-top-width":"0px","outline-style":"none","outline-width":"3px"} }, c1: { rect: [0, 0, 67.03, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c2: { rect: [75.03, 0, 68, 29.59], computed: {"border-top-width":"1px","outline-style":"solid","outline-width":"2px"} }, c3: { rect: [151.03, 0, 66.75, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c4: { rect: [225.78, 0, 54, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} } },
  },
  {
    lesson: "outline-selected",
    name: "outline with offset",
    css: ".chips {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n}\n.chip {\n  padding: 4px 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 999px;\n  background: #fff;\n  font: inherit;\n  font-size: 14px;\n}\n.selected {\n  outline: 2px solid #2f5fd0;\n  outline-offset: 2px;\n}\n",
    messages: [],
    elements: { chips: { rect: [0, 0, 596, 29.59], computed: {"border-top-width":"0px","outline-style":"none","outline-width":"3px"} }, c1: { rect: [0, 0, 67.03, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c2: { rect: [75.03, 0, 68, 29.59], computed: {"border-top-width":"1px","outline-style":"solid","outline-width":"2px"} }, c3: { rect: [151.03, 0, 66.75, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c4: { rect: [225.78, 0, 54, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} } },
  },
  {
    lesson: "outline-selected",
    name: "box-shadow ring",
    css: ".chips {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n}\n.chip {\n  padding: 4px 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 999px;\n  background: #fff;\n  font: inherit;\n  font-size: 14px;\n}\n.selected {\n  box-shadow: 0 0 0 2px #2f5fd0;\n}\n",
    messages: ["選んだチップに outline で 2px 以上の線を引きましょう（box-shadow の輪でも大きさは変わりませんが、ここでは outline を使います）"],
    elements: { chips: { rect: [0, 0, 596, 29.59], computed: {"border-top-width":"0px","outline-style":"none","outline-width":"3px"} }, c1: { rect: [0, 0, 67.03, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c2: { rect: [75.03, 0, 68, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c3: { rect: [151.03, 0, 66.75, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c4: { rect: [225.78, 0, 54, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} } },
  },
  {
    lesson: "outline-selected",
    name: "outline 1px",
    css: ".chips {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n}\n.chip {\n  padding: 4px 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 999px;\n  background: #fff;\n  font: inherit;\n  font-size: 14px;\n}\n.selected {\n  outline: 1px solid #2f5fd0;\n}\n",
    messages: ["選んだチップに outline で 2px 以上の線を引きましょう（box-shadow の輪でも大きさは変わりませんが、ここでは outline を使います）"],
    elements: { chips: { rect: [0, 0, 596, 29.59], computed: {"border-top-width":"0px","outline-style":"none","outline-width":"3px"} }, c1: { rect: [0, 0, 67.03, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c2: { rect: [75.03, 0, 68, 29.59], computed: {"border-top-width":"1px","outline-style":"solid","outline-width":"1px"} }, c3: { rect: [151.03, 0, 66.75, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} }, c4: { rect: [225.78, 0, 54, 29.59], computed: {"border-top-width":"1px","outline-style":"none","outline-width":"3px"} } },
  },
  {
    lesson: "layered-shadow",
    name: "starter",
    messages: ["カードに影が付いていません（box-shadow）"],
    elements: { card: { rect: [16, 16, 240, 77.98], computed: {"box-shadow":"none"} } },
  },
  {
    lesson: "layered-shadow",
    name: "solution",
    messages: [],
    elements: { card: { rect: [16, 16, 240, 77.98], computed: {"box-shadow":"rgba(24, 32, 58, 0.2) 0px 1px 2px 0px, rgba(24, 32, 58, 0.15) 0px 8px 24px 0px"} } },
  },
  {
    lesson: "layered-shadow",
    name: "hsl colours",
    css: ".card {\n  width: 240px;\n  margin: 16px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #fff;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0;\n  font-size: 14px;\n}\n.card {\n  box-shadow: 0 1px 3px hsl(228 40% 16% / 0.25), 0 10px 30px hsl(228 40% 16% / 0.12);\n}\n",
    messages: [],
    elements: { card: { rect: [16, 16, 240, 77.98], computed: {"box-shadow":"rgba(24, 31, 57, 0.25) 0px 1px 3px 0px, rgba(24, 31, 57, 0.12) 0px 10px 30px 0px"} } },
  },
  {
    lesson: "layered-shadow",
    name: "single shadow",
    css: ".card {\n  width: 240px;\n  margin: 16px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #fff;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0;\n  font-size: 14px;\n}\n.card {\n  box-shadow: 0 8px 24px rgb(24 32 58 / 0.15);\n}\n",
    messages: ["影が 1 枚です。カンマで区切って 2 枚重ねましょう（短く濃い影と、遠くまで広がる薄い影）"],
    elements: { card: { rect: [16, 16, 240, 77.98], computed: {"box-shadow":"rgba(24, 32, 58, 0.15) 0px 8px 24px 0px"} } },
  },
  {
    lesson: "layered-shadow",
    name: "a shadow without blur",
    css: ".card {\n  width: 240px;\n  margin: 16px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #fff;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0;\n  font-size: 14px;\n}\n.card {\n  box-shadow: 0 1px 0 rgb(24 32 58 / 0.2), 0 8px 24px rgb(24 32 58 / 0.15);\n}\n",
    messages: ["どちらの影も、下向きにずらして（2 つめの値）ぼかしましょう（3 つめの値）"],
    elements: { card: { rect: [16, 16, 240, 77.98], computed: {"box-shadow":"rgba(24, 32, 58, 0.2) 0px 1px 0px 0px, rgba(24, 32, 58, 0.15) 0px 8px 24px 0px"} } },
  },
  {
    lesson: "border-radius-shapes",
    name: "starter",
    messages: ["写真が円になっていません（正方形に border-radius: 50%）"],
    elements: { avatar: { rect: [0, 0, 64, 64], computed: {"border-top-left-radius":"0px"} }, follow: { rect: [80, 14, 136, 36], computed: {"border-top-left-radius":"0px"} } },
  },
  {
    lesson: "border-radius-shapes",
    name: "solution",
    messages: [],
    elements: { avatar: { rect: [0, 0, 64, 64], computed: {"border-top-left-radius":"50%"} }, follow: { rect: [80, 14, 136, 36], computed: {"border-top-left-radius":"999px"} } },
  },
  {
    lesson: "border-radius-shapes",
    name: "32px avatar and 18px pill",
    css: ".profile {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n.avatar {\n  display: block;\n  border-radius: 32px;\n}\n.follow {\n  height: 36px;\n  padding: 0 20px;\n  border: 0;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n  border-radius: 18px;\n}\n",
    messages: [],
    elements: { avatar: { rect: [0, 0, 64, 64], computed: {"border-top-left-radius":"32px"} }, follow: { rect: [80, 14, 136, 36], computed: {"border-top-left-radius":"18px"} } },
  },
  {
    lesson: "border-radius-shapes",
    name: "50% on the button",
    css: ".profile {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n.avatar {\n  display: block;\n  border-radius: 50%;\n}\n.follow {\n  height: 36px;\n  padding: 0 20px;\n  border: 0;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n  border-radius: 50%;\n}\n",
    messages: ["ボタンがピル形になっていません（高さ 36px の半分の 18px 以上を px などの長さで。横長の箱に 50% だと楕円になります）"],
    elements: { avatar: { rect: [0, 0, 64, 64], computed: {"border-top-left-radius":"50%"} }, follow: { rect: [80, 14, 136, 36], computed: {"border-top-left-radius":"50%"} } },
  },
  {
    lesson: "border-radius-shapes",
    name: "rounded corners only",
    css: ".profile {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n.avatar {\n  display: block;\n  border-radius: 8px;\n}\n.follow {\n  height: 36px;\n  padding: 0 20px;\n  border: 0;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n  border-radius: 999px;\n}\n",
    messages: ["写真が円になっていません（正方形に border-radius: 50%）"],
    elements: { avatar: { rect: [0, 0, 64, 64], computed: {"border-top-left-radius":"8px"} }, follow: { rect: [80, 14, 136, 36], computed: {"border-top-left-radius":"999px"} } },
  },
  {
    lesson: "flex-ratio",
    name: "starter",
    messages: ["本文の幅が、サイドのちょうど 2 倍になっていません（flex: 2 と flex: 1 で 2:1 に分けます）","幅 320px で、本文の幅がサイドの 2 倍になっていません（幅を決め打ちすると、画面の幅が変わったときに崩れます）"],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 274, 46.39], computed: {"flex-grow":"1"} }, side: { rect: [286, 0, 274, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 154, 46.39], computed: {"flex-grow":"1"} }, side: { rect: [166, 0, 154, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-ratio",
    name: "solution",
    messages: [],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"2"} }, side: { rect: [377.33, 0, 182.67, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 205.33, 46.39], computed: {"flex-grow":"2"} }, side: { rect: [217.33, 0, 102.67, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-ratio",
    name: "flex-grow 2 on the base of flex: 1",
    css: ".layout {\n  display: flex;\n  gap: 12px;\n}\n.main,\n.side {\n  flex: 1;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.side {\n  background: #eef1f8;\n}\n.layout p {\n  margin: 0;\n  padding: 12px;\n}\n.main {\n  flex-grow: 2;\n}\n",
    messages: [],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"2"} }, side: { rect: [377.33, 0, 182.67, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 205.33, 46.39], computed: {"flex-grow":"2"} }, side: { rect: [217.33, 0, 102.67, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-ratio",
    name: "sidebar at 0.5",
    css: ".layout {\n  display: flex;\n  gap: 12px;\n}\n.main,\n.side {\n  flex: 1;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.side {\n  background: #eef1f8;\n}\n.layout p {\n  margin: 0;\n  padding: 12px;\n}\n.side {\n  flex: 0.5;\n}\n",
    messages: [],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"1"} }, side: { rect: [377.33, 0, 182.67, 46.39], computed: {"flex-grow":"0.5"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 205.33, 46.39], computed: {"flex-grow":"1"} }, side: { rect: [217.33, 0, 102.67, 46.39], computed: {"flex-grow":"0.5"} } } },
  },
  {
    lesson: "flex-ratio",
    name: "widths fixed for 560px",
    css: ".layout {\n  display: flex;\n  gap: 12px;\n}\n.main,\n.side {\n  flex: 1;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.side {\n  background: #eef1f8;\n}\n.layout p {\n  margin: 0;\n  padding: 12px;\n}\n.main {\n  flex: none;\n  width: 365.33px;\n}\n.side {\n  flex: none;\n  width: 182.67px;\n}\n",
    messages: ["幅を % や px で決めるのではなく、flex の数（flex-grow）の比で分けましょう","幅 320px で、本文の幅がサイドの 2 倍になっていません（幅を決め打ちすると、画面の幅が変わったときに崩れます）"],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"0"} }, side: { rect: [377.33, 0, 182.66, 46.39], computed: {"flex-grow":"0"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"0"} }, side: { rect: [377.33, 0, 182.66, 46.39], computed: {"flex-grow":"0"} } } },
  },
  {
    lesson: "flex-ratio",
    name: "percentage bases",
    css: ".layout {\n  display: flex;\n  gap: 12px;\n}\n.main,\n.side {\n  flex: 1;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.side {\n  background: #eef1f8;\n}\n.layout p {\n  margin: 0;\n  padding: 12px;\n}\n.main {\n  flex: 0 0 calc((100% - 12px) * 2 / 3);\n}\n.side {\n  flex: 0 0 calc((100% - 12px) / 3);\n}\n",
    messages: ["幅を % や px で決めるのではなく、flex の数（flex-grow）の比で分けましょう"],
    elements: { layout: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 365.33, 46.39], computed: {"flex-grow":"0"} }, side: { rect: [377.33, 0, 182.66, 46.39], computed: {"flex-grow":"0"} } },
    states: { 320: { layout: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"0"} }, main: { rect: [0, 0, 205.33, 46.39], computed: {"flex-grow":"0"} }, side: { rect: [217.33, 0, 102.66, 46.39], computed: {"flex-grow":"0"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "starter",
    messages: ["幅 560px で、各行がカードで端まで埋まっていません（1 行に 3 枚、最後の行は 2 枚が伸びて埋めます）","幅 320px で、1 行に 2 枚並んで端まで埋まっていません（基準の幅は 140px のまま）"],
    elements: { cards: { rect: [0, 0, 560, 104.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 140, 46.39], computed: {"flex-grow":"0"} }, c2: { rect: [152, 0, 140, 46.39], computed: {"flex-grow":"0"} }, c3: { rect: [304, 0, 140, 46.39], computed: {"flex-grow":"0"} }, c4: { rect: [0, 58.39, 140, 46.39], computed: {"flex-grow":"0"} }, c5: { rect: [152, 58.39, 140, 46.39], computed: {"flex-grow":"0"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 163.17], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 140, 46.39], computed: {"flex-grow":"0"} }, c2: { rect: [152, 0, 140, 46.39], computed: {"flex-grow":"0"} }, c3: { rect: [0, 58.39, 140, 46.39], computed: {"flex-grow":"0"} }, c4: { rect: [152, 58.39, 140, 46.39], computed: {"flex-grow":"0"} }, c5: { rect: [0, 116.78, 140, 46.39], computed: {"flex-grow":"0"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "solution",
    messages: [],
    elements: { cards: { rect: [0, 0, 560, 104.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 178.66, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [190.66, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [381.33, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [0, 58.39, 274, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [286, 58.39, 274, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 163.17], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 154, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [166, 0, 154, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [0, 58.39, 154, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [166, 58.39, 154, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [0, 116.78, 320, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "flex-grow with the 140px width",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: 140px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.card {\n  flex-grow: 1;\n}\n",
    messages: [],
    elements: { cards: { rect: [0, 0, 560, 104.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 178.66, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [190.66, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [381.33, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [0, 58.39, 274, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [286, 58.39, 274, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 163.17], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 154, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [166, 0, 154, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [0, 58.39, 154, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [166, 58.39, 154, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [0, 116.78, 320, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "flex 1 1 160px",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  flex: 1 1 160px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n",
    messages: ["幅 320px で、1 行に 2 枚並んで端まで埋まっていません（基準の幅は 140px のまま）"],
    elements: { cards: { rect: [0, 0, 560, 104.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 178.66, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [190.66, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [381.33, 0, 178.67, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [0, 58.39, 274, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [286, 58.39, 274, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 279.95], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 320, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [0, 58.39, 320, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [0, 116.78, 320, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [0, 175.17, 320, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [0, 233.56, 320, 46.39], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "flex: 1",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  flex: 1;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n",
    messages: ["幅 560px で、各行がカードで端まで埋まっていません（1 行に 3 枚、最後の行は 2 枚が伸びて埋めます）","幅 320px で、1 行に 2 枚並んで端まで埋まっていません（基準の幅は 140px のまま）"],
    elements: { cards: { rect: [0, 0, 560, 46.39], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 102.39, 46.39], computed: {"flex-grow":"1"} }, c2: { rect: [114.39, 0, 102.41, 46.39], computed: {"flex-grow":"1"} }, c3: { rect: [228.8, 0, 102.39, 46.39], computed: {"flex-grow":"1"} }, c4: { rect: [343.19, 0, 102.41, 46.39], computed: {"flex-grow":"1"} }, c5: { rect: [457.59, 0, 102.41, 46.39], computed: {"flex-grow":"1"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 68.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 54.39, 68.78], computed: {"flex-grow":"1"} }, c2: { rect: [66.39, 0, 54.41, 68.78], computed: {"flex-grow":"1"} }, c3: { rect: [132.8, 0, 54.39, 68.78], computed: {"flex-grow":"1"} }, c4: { rect: [199.19, 0, 54.41, 68.78], computed: {"flex-grow":"1"} }, c5: { rect: [265.59, 0, 54.41, 68.78], computed: {"flex-grow":"1"} } } },
  },
  {
    lesson: "flex-basis-wrap",
    name: "grid auto-fill",
    css: ".cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: 140px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n}\n.card {\n  width: auto;\n}\n",
    messages: ["幅 560px で、各行がカードで端まで埋まっていません（1 行に 3 枚、最後の行は 2 枚が伸びて埋めます）"],
    elements: { cards: { rect: [0, 0, 560, 104.78], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 178.66, 46.39], computed: {"flex-grow":"0"} }, c2: { rect: [190.66, 0, 178.67, 46.39], computed: {"flex-grow":"0"} }, c3: { rect: [381.33, 0, 178.67, 46.39], computed: {"flex-grow":"0"} }, c4: { rect: [0, 58.39, 178.66, 46.39], computed: {"flex-grow":"0"} }, c5: { rect: [190.66, 58.39, 178.67, 46.39], computed: {"flex-grow":"0"} } },
    states: { 320: { cards: { rect: [0, 0, 320, 163.17], computed: {"flex-grow":"0"} }, c1: { rect: [0, 0, 154, 46.39], computed: {"flex-grow":"0"} }, c2: { rect: [166, 0, 154, 46.39], computed: {"flex-grow":"0"} }, c3: { rect: [0, 58.39, 154, 46.39], computed: {"flex-grow":"0"} }, c4: { rect: [166, 58.39, 154, 46.39], computed: {"flex-grow":"0"} }, c5: { rect: [0, 116.78, 154, 46.39], computed: {"flex-grow":"0"} } } },
  },
  {
    lesson: "flex-order",
    name: "starter",
    messages: ["「いち押し」が左端に来ていないか、ほかの 2 つの順番が変わっています（row-reverse では全体が逆になります）"],
    elements: { row: { rect: [0, 0, 596, 46.39], computed: {"order":"0"} }, a: { rect: [0, 0, 75.3, 46.39], computed: {"order":"0"} }, b: { rect: [83.3, 0, 77.53, 46.39], computed: {"order":"0"} }, hot: { rect: [168.83, 0, 96, 46.39], computed: {"order":"0"} } },
  },
  {
    lesson: "flex-order",
    name: "solution",
    messages: [],
    elements: { row: { rect: [0, 0, 596, 46.39], computed: {"order":"0"} }, a: { rect: [104, 0, 75.3, 46.39], computed: {"order":"0"} }, b: { rect: [187.3, 0, 77.53, 46.39], computed: {"order":"0"} }, hot: { rect: [0, 0, 96, 46.39], computed: {"order":"-1"} } },
  },
  {
    lesson: "flex-order",
    name: "the others after",
    css: ".row {\n  display: flex;\n  gap: 8px;\n}\n.item {\n  padding: 12px 16px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.hot {\n  background: #fff3c4;\n}\n.item {\n  order: 1;\n}\n.row .hot {\n  order: 0;\n}\n",
    messages: [],
    elements: { row: { rect: [0, 0, 596, 46.39], computed: {"order":"0"} }, a: { rect: [104, 0, 75.3, 46.39], computed: {"order":"1"} }, b: { rect: [187.3, 0, 77.53, 46.39], computed: {"order":"1"} }, hot: { rect: [0, 0, 96, 46.39], computed: {"order":"0"} } },
  },
  {
    lesson: "flex-order",
    name: "row-reverse",
    css: ".row {\n  display: flex;\n  gap: 8px;\n}\n.item {\n  padding: 12px 16px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.hot {\n  background: #fff3c4;\n}\n.row {\n  flex-direction: row-reverse;\n  justify-content: flex-end;\n}\n",
    messages: ["「いち押し」が左端に来ていないか、ほかの 2 つの順番が変わっています（row-reverse では全体が逆になります）"],
    elements: { row: { rect: [0, 0, 596, 46.39], computed: {"order":"0"} }, a: { rect: [189.53, 0, 75.3, 46.39], computed: {"order":"0"} }, b: { rect: [104, 0, 77.53, 46.39], computed: {"order":"0"} }, hot: { rect: [0, 0, 96, 46.39], computed: {"order":"0"} } },
  },
  {
    lesson: "flex-order",
    name: "order on the wrong item",
    css: ".row {\n  display: flex;\n  gap: 8px;\n}\n.item {\n  padding: 12px 16px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.hot {\n  background: #fff3c4;\n}\n.item:first-child {\n  order: -1;\n}\n",
    messages: ["「いち押し」が左端に来ていないか、ほかの 2 つの順番が変わっています（row-reverse では全体が逆になります）"],
    elements: { row: { rect: [0, 0, 596, 46.39], computed: {"order":"0"} }, a: { rect: [0, 0, 75.3, 46.39], computed: {"order":"-1"} }, b: { rect: [83.3, 0, 77.53, 46.39], computed: {"order":"0"} }, hot: { rect: [168.83, 0, 96, 46.39], computed: {"order":"0"} } },
  },
  {
    lesson: "grid-span",
    name: "starter",
    messages: ["1 枚目が横 2 列・縦 2 行ぶん（184 × 152px）になっていません"],
    elements: { gallery: { rect: [0, 0, 280, 152] }, t1: { rect: [0, 0, 88, 72] }, t2: { rect: [96, 0, 88, 72] }, t3: { rect: [192, 0, 88, 72] }, t4: { rect: [0, 80, 88, 72] }, t5: { rect: [96, 80, 88, 72] } },
  },
  {
    lesson: "grid-span",
    name: "solution",
    messages: [],
    elements: { gallery: { rect: [0, 0, 280, 232] }, t1: { rect: [0, 0, 184, 152] }, t2: { rect: [192, 0, 88, 72] }, t3: { rect: [192, 80, 88, 72] }, t4: { rect: [0, 160, 88, 72] }, t5: { rect: [96, 160, 88, 72] } },
  },
  {
    lesson: "grid-span",
    name: "grid-area spans",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 72px;\n  gap: 8px;\n  width: 280px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.featured {\n  background: #fff3c4;\n  grid-area: span 2 / span 2;\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 280, 232] }, t1: { rect: [0, 0, 184, 152] }, t2: { rect: [192, 0, 88, 72] }, t3: { rect: [192, 80, 88, 72] }, t4: { rect: [0, 160, 88, 72] }, t5: { rect: [96, 160, 88, 72] } },
  },
  {
    lesson: "grid-span",
    name: "width and height instead",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 72px;\n  gap: 8px;\n  width: 280px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.featured {\n  background: #fff3c4;\n  width: 184px;\n  height: 152px;\n}\n",
    messages: ["ほかのタイルが、大きくした 1 枚目と重なっているか、右の列に縦に並んでいません（width や height で大きくしても、マスはまたぎません）"],
    elements: { gallery: { rect: [0, 0, 280, 152] }, t1: { rect: [0, 0, 184, 152] }, t2: { rect: [192, 0, 40, 72] }, t3: { rect: [240, 0, 40, 72] }, t4: { rect: [0, 80, 184, 72] }, t5: { rect: [192, 80, 40, 72] } },
  },
  {
    lesson: "grid-span",
    name: "columns only",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 72px;\n  gap: 8px;\n  width: 280px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.featured {\n  background: #fff3c4;\n  grid-column: span 2;\n}\n",
    messages: ["1 枚目が横 2 列・縦 2 行ぶん（184 × 152px）になっていません"],
    elements: { gallery: { rect: [0, 0, 280, 152] }, t1: { rect: [0, 0, 184, 72] }, t2: { rect: [192, 0, 88, 72] }, t3: { rect: [0, 80, 88, 72] }, t4: { rect: [96, 80, 88, 72] }, t5: { rect: [192, 80, 88, 72] } },
  },
  {
    lesson: "grid-dense",
    name: "starter",
    messages: ["1 行目の右端のすき間が埋まっていません（4 枚目が、すき間に入るはずです）"],
    elements: { gallery: { rect: [0, 0, 280, 184], computed: {"grid-auto-flow":"row"} }, d1: { rect: [0, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d2: { rect: [96, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d3: { rect: [0, 64, 184, 56], computed: {"grid-auto-flow":"row"} }, d4: { rect: [192, 64, 88, 56], computed: {"grid-auto-flow":"row"} }, d5: { rect: [0, 128, 88, 56], computed: {"grid-auto-flow":"row"} } },
  },
  {
    lesson: "grid-dense",
    name: "solution",
    messages: [],
    elements: { gallery: { rect: [0, 0, 280, 120], computed: {"grid-auto-flow":"dense"} }, d1: { rect: [0, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d2: { rect: [96, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d3: { rect: [0, 64, 184, 56], computed: {"grid-auto-flow":"row"} }, d4: { rect: [192, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d5: { rect: [192, 64, 88, 56], computed: {"grid-auto-flow":"row"} } },
  },
  {
    lesson: "grid-dense",
    name: "row dense",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 56px;\n  gap: 8px;\n  width: 280px;\n  grid-auto-flow: row dense;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.wide {\n  grid-column: span 2;\n  background: #fff3c4;\n}\n",
    messages: [],
    elements: { gallery: { rect: [0, 0, 280, 120], computed: {"grid-auto-flow":"dense"} }, d1: { rect: [0, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d2: { rect: [96, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d3: { rect: [0, 64, 184, 56], computed: {"grid-auto-flow":"row"} }, d4: { rect: [192, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d5: { rect: [192, 64, 88, 56], computed: {"grid-auto-flow":"row"} } },
  },
  {
    lesson: "grid-dense",
    name: "fourth tile placed by hand",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 56px;\n  gap: 8px;\n  width: 280px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.wide {\n  grid-column: span 2;\n  background: #fff3c4;\n}\n[data-id=\"d4\"] {\n  grid-column: 3;\n  grid-row: 1;\n}\n",
    messages: ["1 枚ずつ置き場所を指定するのではなく、grid-auto-flow: dense で自動ですき間を埋めましょう（タイルが増えても埋まります）"],
    elements: { gallery: { rect: [0, 0, 280, 120], computed: {"grid-auto-flow":"row"} }, d1: { rect: [0, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d2: { rect: [96, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d3: { rect: [0, 64, 184, 56], computed: {"grid-auto-flow":"row"} }, d4: { rect: [192, 0, 88, 56], computed: {"grid-auto-flow":"row"} }, d5: { rect: [192, 64, 88, 56], computed: {"grid-auto-flow":"row"} } },
  },
  {
    lesson: "grid-dense",
    name: "column dense",
    css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 56px;\n  gap: 8px;\n  width: 280px;\n  grid-auto-flow: column dense;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n.wide {\n  grid-column: span 2;\n  background: #fff3c4;\n}\n",
    messages: ["1 行目の右端のすき間が埋まっていません（4 枚目が、すき間に入るはずです）"],
    elements: { gallery: { rect: [0, 0, 280, 56], computed: {"grid-auto-flow":"column dense"} }, d1: { rect: [0, 0, 73, 56], computed: {"grid-auto-flow":"row"} }, d2: { rect: [81, 0, 73, 56], computed: {"grid-auto-flow":"row"} }, d3: { rect: [162, 0, 81, 56], computed: {"grid-auto-flow":"row"} }, d4: { rect: [251, 0, 10.69, 56], computed: {"grid-auto-flow":"row"} }, d5: { rect: [269.69, 0, 10.31, 56], computed: {"grid-auto-flow":"row"} } },
  },
  {
    lesson: "grid-overlap",
    name: "starter",
    messages: ["キャプションが、写真の下端に重なっていません（写真とキャプションを同じマスに置き、align-self: end で下端にそろえます。そろえないと、マス全体に引き伸ばされます）"],
    elements: { card: { rect: [0, 0, 240, 185.59], computed: {"position":"static"} }, photo: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, cap: { rect: [0, 150, 240, 35.59], computed: {"position":"static"} } },
  },
  {
    lesson: "grid-overlap",
    name: "solution",
    messages: [],
    elements: { card: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, photo: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, cap: { rect: [0, 114.41, 240, 35.59], computed: {"position":"static"} } },
  },
  {
    lesson: "grid-overlap",
    name: "grid-row and grid-column",
    css: ".card {\n  display: grid;\n  width: 240px;\n  margin: 0;\n}\n.photo {\n  display: block;\n  width: 100%;\n  height: auto;\n}\n.cap {\n  padding: 8px 12px;\n  background: rgb(24 32 58 / 0.7);\n  color: #fff;\n  font-size: 14px;\n}\n.photo,\n.cap {\n  grid-row: 1;\n  grid-column: 1;\n}\n.cap {\n  align-self: end;\n}\n",
    messages: [],
    elements: { card: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, photo: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, cap: { rect: [0, 114.41, 240, 35.59], computed: {"position":"static"} } },
  },
  {
    lesson: "grid-overlap",
    name: "absolute caption",
    css: ".card {\n  display: grid;\n  width: 240px;\n  margin: 0;\n}\n.photo {\n  display: block;\n  width: 100%;\n  height: auto;\n}\n.cap {\n  padding: 8px 12px;\n  background: rgb(24 32 58 / 0.7);\n  color: #fff;\n  font-size: 14px;\n}\n.card {\n  position: relative;\n}\n.cap {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n",
    messages: ["position: absolute でも重なりますが、ここではグリッドの同じマスに置いて重ねましょう（キャプションが長くなっても、枠からはみ出しません）"],
    elements: { card: { rect: [0, 0, 240, 150], computed: {"position":"relative"} }, photo: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, cap: { rect: [0, 114.41, 240, 35.59], computed: {"position":"absolute"} } },
  },
  {
    lesson: "grid-overlap",
    name: "same cell, caption at the top",
    css: ".card {\n  display: grid;\n  width: 240px;\n  margin: 0;\n}\n.photo {\n  display: block;\n  width: 100%;\n  height: auto;\n}\n.cap {\n  padding: 8px 12px;\n  background: rgb(24 32 58 / 0.7);\n  color: #fff;\n  font-size: 14px;\n}\n.photo,\n.cap {\n  grid-area: 1 / 1;\n}\n",
    messages: ["キャプションが、写真の下端に重なっていません（写真とキャプションを同じマスに置き、align-self: end で下端にそろえます。そろえないと、マス全体に引き伸ばされます）"],
    elements: { card: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, photo: { rect: [0, 0, 240, 150], computed: {"position":"static"} }, cap: { rect: [0, 0, 240, 150], computed: {"position":"static"} } },
  },
];

describe("sizing, outlines and shadows, flex sizing and grid placement: recorded answers", () => {
  it("records a starter, a solution and other answers for each of the 12 lessons", () => {
    expect([...new Set(SIZING_CASES.map((c) => c.lesson))].sort()).toEqual([...SIZING_LESSONS].sort());
    for (const id of SIZING_LESSONS) {
      const names = SIZING_CASES.filter((c) => c.lesson === id).map((c) => c.name);
      expect(names, id).toEqual(expect.arrayContaining(["starter", "solution"]));
      expect(names.length, id).toBeGreaterThanOrEqual(4);
    }
  });

  for (const c of SIZING_CASES) {
    it(`${c.lesson}: ${c.name} ${c.messages.length ? "fails with its messages" : "passes"}`, () => {
      expect(messagesFor(c)).toEqual(c.messages);
    });
  }

  it("fails each fresh starter with one message per checked width and passes each solution", () => {
    for (const id of SIZING_LESSONS) {
      const { challenge } = lessonById(id)!;
      const starter = SIZING_CASES.find((c) => c.lesson === id && c.name === "starter")!;
      const solution = SIZING_CASES.find((c) => c.lesson === id && c.name === "solution")!;
      expect(messagesFor(starter), id).toHaveLength(1 + (challenge.states?.length ?? 0));
      expect(messagesFor(solution), id).toEqual([]);
    }
  });

  it("keeps the measurements the lessons are about", () => {
    const rect = (id: string, name: string, el: string): readonly number[] =>
      SIZING_CASES.find((c) => c.lesson === id && c.name === name)!.elements[el]!.rect!;
    // A 3px border makes the picked chip taller than the others; an outline does not.
    expect(rect("outline-selected", "starter", "c2")[3]).toBeGreaterThan(rect("outline-selected", "starter", "c1")[3]);
    expect(rect("outline-selected", "solution", "c2")[3]).toBe(rect("outline-selected", "solution", "c1")[3]);
    // max-width alone keeps the height attribute's 240px; height: auto brings back the 2:1 ratio.
    expect(rect("image-max-width", "max-width only", "photo")[3]).toBe(240);
    expect(rect("image-max-width", "solution", "photo").slice(2)).toEqual([254, 127]);
    // flex: 2 against flex: 1 is exactly twice as wide.
    const [, , mainW] = rect("flex-ratio", "solution", "main");
    const [, , sideW] = rect("flex-ratio", "solution", "side");
    expect(Math.abs(mainW - 2 * sideW)).toBeLessThan(1);
  });
});
