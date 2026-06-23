// The Snapshot is the I/O boundary between the impure sandbox (which reads the
// real iframe via getComputedStyle / getBoundingClientRect / a CSS parse) and
// the pure validators here. Everything below is plain, serializable data so the
// validation logic runs deterministically in Node and stays 100% testable.

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** One rendered element, keyed by its author-assigned `data-id`. */
export interface ElementSnapshot {
  readonly id: string;
  readonly tag: string;
  readonly rect: Rect;
  /** Only the computed properties a challenge asked for (SnapshotRequest.props). */
  readonly computed: Readonly<Record<string, string>>;
  /** Nearest ancestor that also carries a `data-id`, else null. */
  readonly parentId: string | null;
  /** Source order among siblings (DOM order). */
  readonly order: number;
}

/** The user's CSS parsed into selector → declaration maps (see css-parse.ts). */
export interface ParsedRule {
  readonly selector: string;
  readonly decls: Readonly<Record<string, string>>;
}

export interface Snapshot {
  readonly viewport: { readonly w: number; readonly h: number };
  readonly elements: readonly ElementSnapshot[];
  readonly declarations: readonly ParsedRule[];
  /** The learner's raw CSS text (for `sourceMatches` structural checks). */
  readonly css: string;
}

/** Tells the sandbox which computed properties to measure for a challenge. */
export interface SnapshotRequest {
  readonly props: readonly string[];
}

export interface ValidationResult {
  readonly pass: boolean;
  readonly message: string;
}
