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

/** A point around the container's centre in CSS px: x right, y down, z toward the viewer. */
export type Vec3 = readonly [number, number, number];
/** Four corners in the order top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Vec3, Vec3, Vec3, Vec3];

export interface VizPlane {
  readonly id: string;
  readonly corners: Quad;
  /** `backface-visibility: hidden`: the plane is not drawn while it faces away. */
  readonly hideBackface: boolean;
}

export interface VizSpace {
  /** The container's own box after its transform; flattened children lie in it. */
  readonly frame: Quad;
  /** The container's children in DOM order, placed in 3D. */
  readonly planes: readonly VizPlane[];
  /** The children were pressed into the container's plane (`transform-style: flat`). */
  readonly flattened: boolean;
  /** Distance from the screen to the viewer's eye (`perspective`), or null for none. */
  readonly eye: number | null;
  /** The subject plane and where the preview draws it on the screen (z = 0). */
  readonly projection?: { readonly corners: Quad; readonly screen: Quad };
}

export interface VizSignals {
  readonly concept: ConceptViz;
  readonly viewport: { readonly w: number; readonly h: number };
  readonly boxes: readonly VizBox[];
  readonly space?: VizSpace;
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

// ---- 3D transforms ----

/** A column-major 4×4 matrix, in the same order as CSS matrix3d(). */
export type Mat4 = readonly number[];

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Parse a computed `transform` (none / matrix() / matrix3d()); anything else is the identity. */
export function parseTransform(value: string | undefined): Mat4 {
  const m = /^(matrix3d|matrix)\(([^)]*)\)$/.exec((value ?? "").trim());
  if (!m) return IDENTITY;
  const n = m[2].split(",").map(Number);
  if (n.some((v) => !Number.isFinite(v))) return IDENTITY;
  if (m[1] === "matrix" && n.length === 6) {
    const [a, b, c, d, e, f] = n;
    return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1];
  }
  return m[1] === "matrix3d" && n.length === 16 ? n : IDENTITY;
}

function isIdentity(m: Mat4): boolean {
  return m.every((v, i) => Math.abs(v - IDENTITY[i]) < 1e-6);
}

/** Transform a point, dividing by w for matrices that carry a perspective() term. */
function applyMat(m: Mat4, [x, y, z]: Vec3): Vec3 {
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  const k = w === 0 ? 1 : 1 / w;
  return [
    (m[0] * x + m[4] * y + m[8] * z + m[12]) * k,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) * k,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) * k,
  ];
}

function mapQuad(q: Quad, f: (p: Vec3) => Vec3): Quad {
  return [f(q[0]), f(q[1]), f(q[2]), f(q[3])];
}

/** The border box size: computed width/height (border-box in the sandbox), else the rect. */
function sizeOf(el: ElementSnapshot): { readonly w: number; readonly h: number } {
  return { w: px(el.computed["width"]) || el.rect.w, h: px(el.computed["height"]) || el.rect.h };
}

/**
 * Apply the element's own transform around its transform-origin (CSS default:
 * the centre) to a point given relative to the element's centre.
 */
function transformAround(el: ElementSnapshot, p: Vec3, flatten = false): Vec3 {
  const { w, h } = sizeOf(el);
  const [ox = w / 2, oy = h / 2, oz = 0] = pxList(el.computed["transform-origin"]);
  const local: Vec3 = [p[0] + w / 2 - ox, p[1] + h / 2 - oy, (flatten ? 0 : p[2]) - oz];
  const [x, y, z] = applyMat(parseTransform(el.computed["transform"]), local);
  return [x + ox - w / 2, y + oy - h / 2, z + oz];
}

function boxQuad(el: ElementSnapshot): Quad {
  const { w, h } = sizeOf(el);
  return [
    [-w / 2, -h / 2, 0],
    [w / 2, -h / 2, 0],
    [w / 2, h / 2, 0],
    [-w / 2, h / 2, 0],
  ];
}

/** Project onto the screen through the eye, or straight on without perspective. */
function project(q: Quad, eye: number | null): Quad | undefined {
  if (eye === null) return mapQuad(q, ([x, y]) => [x, y, 0]);
  // A corner level with or behind the eye has no image on the screen.
  if (q.some(([, , z]) => z >= eye)) return undefined;
  return mapQuad(q, ([x, y, z]) => {
    const t = eye / (eye - z);
    return [x * t, y * t, 0];
  });
}

/**
 * The container's children as planes in 3D. Every 3D lesson lays its children
 * out centred on the container, so a child's centre-relative corners are also
 * container-centre-relative. A flat container presses its children into its own
 * plane before its transform; an untransformed flat container is the screen
 * itself, so its children keep their 3D pose and the eye shows the projection.
 */
function spaceOf(s: Snapshot, cfg: VizConfig): VizSpace | undefined {
  const c = byId(s, cfg.containerId);
  if (!c) return undefined;
  const flattened =
    c.computed["transform-style"] !== "preserve-3d" && !isIdentity(parseTransform(c.computed["transform"]));
  const place = (p: Vec3): Vec3 => transformAround(c, p, flattened);
  const planes: VizPlane[] = s.elements
    .filter((e) => e.parentId === c.id)
    .map((e) => ({
      id: e.id,
      corners: mapQuad(boxQuad(e), (p) => place(transformAround(e, p))),
      hideBackface: e.computed["backface-visibility"] === "hidden",
    }));
  const parent = byId(s, c.parentId ?? undefined);
  const depth = px(c.computed["perspective"]) || px(parent?.computed["perspective"]);
  const eye = depth > 0 ? depth : null;
  const subject = planes.find((p) => p.id === cfg.subjectId);
  const screen = subject && project(subject.corners, eye);
  return {
    frame: mapQuad(boxQuad(c), place),
    planes,
    flattened,
    eye,
    ...(subject && screen ? { projection: { corners: subject.corners, screen } } : {}),
  };
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
  } else if (cfg.concept === "transform-3d") {
    const space = spaceOf(s, cfg);
    if (space) return { ...base, space };
  }

  return base;
}
