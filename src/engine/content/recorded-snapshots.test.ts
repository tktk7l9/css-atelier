import { describe, expect, it } from "vitest";
import { lessonById } from "./index.js";
import { evaluate } from "../validate/run.js";
import { parseCss } from "../validate/css-parse.js";
import type { Snapshot } from "../validate/snapshot.js";

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
};

/** The lessons added with the intrinsic sizing, grid alignment, positioning and 2D transform tracks. */
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
