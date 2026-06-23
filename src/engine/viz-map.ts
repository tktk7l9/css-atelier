// Pure mapper: Snapshot → VizSignals. The 3D concept visualizer (presentation)
// consumes these typed signals, so it never reads the DOM directly and the
// mapping logic stays 100% testable. Live values flow: editor → sandbox CSS →
// snapshot → snapshotToSignals → visualizer.update().

import type { ConceptViz, VizConfig } from "./content/types.js";
import type { ElementSnapshot, Snapshot } from "./validate/snapshot.js";

export interface VizBox {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Edges {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface VizSignals {
  readonly concept: ConceptViz;
  readonly viewport: { readonly w: number; readonly h: number };
  readonly boxes: readonly VizBox[];
  readonly flex?: { readonly direction: string; readonly justify: string; readonly align: string };
  readonly grid?: {
    readonly cols: readonly number[];
    readonly rows: readonly number[];
    readonly colGap: number;
    readonly rowGap: number;
  };
  readonly boxModel?: {
    readonly width: number;
    readonly height: number;
    readonly padding: Edges;
    readonly border: Edges;
    readonly margin: Edges;
  };
}

/** parseFloat that falls back to 0 for missing/non-numeric values. */
export function px(value: string | undefined): number {
  const n = parseFloat(value ?? "");
  return Number.isFinite(n) ? n : 0;
}

/** Split a track-list computed value ("100px 200px") into numbers. */
export function pxList(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .trim()
    .split(/\s+/)
    .map((s) => parseFloat(s))
    .filter((n) => Number.isFinite(n));
}

function edges(el: ElementSnapshot, prefix: string, suffix = ""): Edges {
  return {
    top: px(el.computed[`${prefix}-top${suffix}`]),
    right: px(el.computed[`${prefix}-right${suffix}`]),
    bottom: px(el.computed[`${prefix}-bottom${suffix}`]),
    left: px(el.computed[`${prefix}-left${suffix}`]),
  };
}

function byId(s: Snapshot, id: string | undefined): ElementSnapshot | undefined {
  return id ? s.elements.find((e) => e.id === id) : undefined;
}

function byDisplay(s: Snapshot, needle: string): ElementSnapshot | undefined {
  return s.elements.find((e) => (e.computed["display"] ?? "").includes(needle));
}

export function snapshotToSignals(s: Snapshot, cfg: VizConfig): VizSignals {
  const boxes: VizBox[] = s.elements.map((e) => ({
    id: e.id,
    x: e.rect.x,
    y: e.rect.y,
    w: e.rect.w,
    h: e.rect.h,
  }));

  const base = { concept: cfg.concept, viewport: s.viewport, boxes };

  if (cfg.concept === "flexbox") {
    const c = byId(s, cfg.containerId) ?? byDisplay(s, "flex");
    if (c) {
      return {
        ...base,
        flex: {
          direction: c.computed["flex-direction"] ?? "row",
          justify: c.computed["justify-content"] ?? "normal",
          align: c.computed["align-items"] ?? "normal",
        },
      };
    }
  } else if (cfg.concept === "grid") {
    const c = byId(s, cfg.containerId) ?? byDisplay(s, "grid");
    if (c) {
      return {
        ...base,
        grid: {
          cols: pxList(c.computed["grid-template-columns"]),
          rows: pxList(c.computed["grid-template-rows"]),
          colGap: px(c.computed["column-gap"]),
          rowGap: px(c.computed["row-gap"]),
        },
      };
    }
  } else if (cfg.concept === "box-model") {
    const el = byId(s, cfg.subjectId) ?? s.elements[0];
    if (el) {
      return {
        ...base,
        boxModel: {
          width: px(el.computed["width"]),
          height: px(el.computed["height"]),
          padding: edges(el, "padding"),
          border: edges(el, "border", "-width"),
          margin: edges(el, "margin"),
        },
      };
    }
  }

  return base;
}
