// Content is pure data. Tracks → Lessons → Challenge. Each challenge composes
// ValidatorSpec primitives and declares which computed props the sandbox should
// measure. Authored per-topic under content/*.ts; index.ts holds the catalogue
// and loads each track's module on demand.

import type { ValidatorSpec } from "../validate/primitives.js";
import type { SnapshotRequest } from "../validate/snapshot.js";

export type ConceptViz = "box-model" | "flexbox" | "grid" | "transform-3d" | "none";

export type TrackId =
  | "selectors"
  | "combinators"
  | "structural-selectors"
  | "nth-patterns"
  | "box-model"
  | "sizing-basics"
  | "margin-collapse"
  | "inline-boxes"
  | "units"
  | "relative-units"
  | "inheritance"
  | "math-functions"
  | "custom-props"
  | "custom-props-in-practice"
  | "registered-props"
  | "modern-selectors"
  | "has-patterns"
  | "specificity"
  | "generated-content"
  | "list-markers"
  | "attribute-selectors"
  | "nesting"
  | "nesting-in-practice"
  | "scope"
  | "flexbox"
  | "flex-patterns"
  | "flex-sizing"
  | "icon-alignment"
  | "grid"
  | "grid-alignment"
  | "grid-patterns"
  | "grid-placement"
  | "grid-layouts"
  | "card-rows"
  | "intrinsic-sizing"
  | "multicol"
  | "tables"
  | "positioning"
  | "fixed-position"
  | "hiding"
  | "stacking"
  | "hit-areas"
  | "stacking-effects"
  | "tap-comfort"
  | "shapes"
  | "formatting-contexts"
  | "media-queries"
  | "container-queries"
  | "container-queries-in-practice"
  | "supports"
  | "logical-props"
  | "writing-modes"
  | "logical-props-in-practice"
  | "aspect-ratio"
  | "object-fit"
  | "layers"
  | "layers-in-practice"
  | "color"
  | "color-functions"
  | "gradients"
  | "backgrounds"
  | "outline-shadow"
  | "text-wrap"
  | "text-overflow"
  | "typesetting"
  | "text-effects"
  | "white-space"
  | "subgrid"
  | "anchor-positioning"
  | "scroll-areas"
  | "sticky"
  | "sticky-in-practice"
  | "scroll-snap"
  | "overflow-clip"
  | "clip-mask"
  | "filters"
  | "forms"
  | "form-states"
  | "aria-states"
  | "transitions"
  | "transforms-2d"
  | "transforms-3d"
  | "keyframes"
  | "entry-animations";

/** Drives the 3D concept visualizer. `subjectId`/`containerId` tell the pure
 *  viz-map which element to read for box-model / flex / grid extraction; for
 *  transform-3d the container's children become planes and the subject is the
 *  plane whose projection onto the screen is drawn. */
export interface VizConfig {
  readonly concept: ConceptViz;
  readonly subjectId?: string;
  readonly containerId?: string;
}

export interface Challenge {
  /** Trusted markup (with `data-id` hooks) seeded into the sandbox iframe. */
  readonly starterHTML: string;
  /** Pre-filled editor contents. */
  readonly starterCSS: string;
  /** The goal, shown to the learner. */
  readonly task: string;
  /** Which computed properties the sandbox should measure. */
  readonly snapshot: SnapshotRequest;
  /** Fix the preview iframe width (px) — for media-query / responsive lessons. */
  readonly viewport?: number;
  /** Composed validators; the challenge passes when all pass (at `viewport`). */
  readonly validators: readonly ValidatorSpec[];
  /** Extra checks at other viewport widths, e.g. to prove a media/container
   *  query is conditional (the effect must NOT apply at a different width).
   *  All states must pass too. */
  readonly states?: ReadonlyArray<{
    readonly viewport: number;
    readonly validators: readonly ValidatorSpec[];
  }>;
  readonly hints: readonly string[];
  /** A reference CSS known to satisfy the validators. */
  readonly solution: string;
}

/** What the catalogue (the first screen) shows for a lesson. */
export interface LessonMeta {
  readonly id: string;
  readonly title: string;
}

/** What the catalogue shows for a track. Only this ships in the initial
 *  bundle; the lessons themselves load with their track (see index.ts). */
export interface TrackMeta {
  readonly id: TrackId;
  readonly title: string;
  readonly summary: string;
  readonly emoji: string;
  readonly lessons: readonly LessonMeta[];
}

export interface Lesson extends LessonMeta {
  /** Short explanation (a tiny markdown-lite subset: paragraphs + `code`). */
  readonly explanation: string;
  readonly mdnPath?: string;
  readonly viz: VizConfig;
  readonly challenge: Challenge;
}

export interface Track extends TrackMeta {
  readonly lessons: readonly Lesson[];
}
