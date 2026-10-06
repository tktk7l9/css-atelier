// Content is pure data. Tracks → Lessons → Challenge. Each challenge composes
// ValidatorSpec primitives and declares which computed props the sandbox should
// measure. Authored per-topic under content/*.ts and aggregated in index.ts.

import type { ValidatorSpec } from "../validate/primitives.js";
import type { SnapshotRequest } from "../validate/snapshot.js";

export type ConceptViz = "box-model" | "flexbox" | "grid" | "transform-3d" | "none";

export type TrackId =
  | "selectors"
  | "box-model"
  | "units"
  | "math-functions"
  | "custom-props"
  | "registered-props"
  | "modern-selectors"
  | "nesting"
  | "scope"
  | "flexbox"
  | "grid"
  | "media-queries"
  | "container-queries"
  | "logical-props"
  | "aspect-ratio"
  | "layers"
  | "color"
  | "color-functions"
  | "text-wrap"
  | "subgrid"
  | "anchor-positioning"
  | "scroll-snap"
  | "clip-mask"
  | "filters"
  | "transitions"
  | "transforms-3d"
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

export interface Lesson {
  readonly id: string;
  readonly title: string;
  /** Short explanation (a tiny markdown-lite subset: paragraphs + `code`). */
  readonly explanation: string;
  readonly mdnPath?: string;
  readonly viz: VizConfig;
  readonly challenge: Challenge;
}

export interface Track {
  readonly id: TrackId;
  readonly title: string;
  readonly summary: string;
  readonly emoji: string;
  readonly lessons: readonly Lesson[];
}
