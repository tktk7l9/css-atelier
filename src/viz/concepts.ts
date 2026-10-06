// Concept visualizers, keyed in a registry. Each builds a THREE.Group and
// rebuilds its contents from VizSignals on update() (update fires only on edits,
// not per-frame, so rebuilding is cheap and keeps the code simple). All driven
// by the pure viz-map output — these never touch the DOM.

import * as THREE from "three";
import type { Quad, Vec3, VizBox, VizSignals } from "../engine/viz-map.js";
import { PALETTE } from "./renderer.js";

export interface ConceptViz3D {
  readonly group: THREE.Group;
  update(sig: VizSignals): void;
  dispose(): void;
}

// ---- shared helpers ----

interface Fit {
  scale: number;
  cx: number;
  cy: number;
}

function fit(boxes: readonly VizBox[], worldW = 7, worldH = 5): Fit {
  if (boxes.length === 0) return { scale: 0.02, cx: 0, cy: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  return { scale: Math.min(worldW / spanX, worldH / spanY), cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

const wx = (px: number, f: Fit): number => (px - f.cx) * f.scale;
const wy = (py: number, f: Fit): number => -(py - f.cy) * f.scale;

function disposeTree(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    const mesh = node as THREE.Mesh & { material?: THREE.Material | THREE.Material[] };
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

function clearGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    disposeTree(child);
  }
}

function rectOutline(w: number, h: number, color: number, z = 0): THREE.LineLoop {
  const hw = w / 2;
  const hh = h / 2;
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hw, -hh, z),
    new THREE.Vector3(hw, -hh, z),
    new THREE.Vector3(hw, hh, z),
    new THREE.Vector3(-hw, hh, z),
  ]);
  return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color }));
}

function panel(w: number, h: number, color: number, opacity: number, z = 0): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.z = z;
  return mesh;
}

function largest(boxes: readonly VizBox[]): VizBox | undefined {
  return boxes.reduce<VizBox | undefined>(
    (best, b) => (!best || b.w * b.h > best.w * best.h ? b : best),
    undefined,
  );
}

function placeBox(group: THREE.Group, b: VizBox, f: Fit, color: number, opacity: number, z: number): void {
  const w = Math.max(0.05, b.w * f.scale);
  const h = Math.max(0.05, b.h * f.scale);
  const p = panel(w, h, color, opacity, z);
  p.position.x = wx(b.x + b.w / 2, f);
  p.position.y = wy(b.y + b.h / 2, f);
  group.add(p);
  const outline = rectOutline(w, h, PALETTE.blueprint, z + 0.01);
  outline.position.copy(p.position);
  group.add(outline);
}

// ---- flexbox ----

function createFlexboxViz(): ConceptViz3D {
  const group = new THREE.Group();
  return {
    group,
    update(sig) {
      clearGroup(group);
      const f = fit(sig.boxes);
      const container = largest(sig.boxes);
      for (const b of sig.boxes) {
        const isContainer = container && b.id === container.id;
        placeBox(group, b, f, isContainer ? PALETTE.fill : PALETTE.green, isContainer ? 0.25 : 0.85, isContainer ? 0 : 0.18);
      }
      if (container) {
        const row = (sig.flex?.direction ?? "row").startsWith("row");
        const cw = container.w * f.scale;
        const ch = container.h * f.scale;
        const cx = wx(container.x + container.w / 2, f);
        const cy = wy(container.y + container.h / 2, f);
        const main = new THREE.ArrowHelper(
          new THREE.Vector3(row ? 1 : 0, row ? 0 : -1, 0),
          new THREE.Vector3(cx - (row ? cw / 2 : 0), cy + (row ? 0 : ch / 2), 0.4),
          row ? cw : ch,
          PALETTE.blueprint,
          0.3,
          0.2,
        );
        const cross = new THREE.ArrowHelper(
          new THREE.Vector3(row ? 0 : 1, row ? -1 : 0, 0),
          new THREE.Vector3(cx + (row ? -cw / 2 : 0), cy + (row ? ch / 2 : 0), 0.4),
          row ? ch : cw,
          PALETTE.soft,
          0.22,
          0.16,
        );
        group.add(main, cross);
      }
    },
    dispose: () => clearGroup(group),
  };
}

// ---- grid ----

function createGridViz(): ConceptViz3D {
  const group = new THREE.Group();
  return {
    group,
    update(sig) {
      clearGroup(group);
      const f = fit(sig.boxes);
      const container = largest(sig.boxes);
      for (const b of sig.boxes) {
        const isContainer = container && b.id === container.id;
        if (isContainer) continue;
        placeBox(group, b, f, PALETTE.blueprint, 0.8, 0.18);
      }
      if (container) {
        placeBox(group, container, f, PALETTE.fill, 0.18, 0);
        const grid = sig.grid;
        if (grid) {
          const top = wy(container.y, f);
          const bottom = wy(container.y + container.h, f);
          const left = wx(container.x, f);
          const right = wx(container.x + container.w, f);
          let acc = container.x;
          for (let i = 0; i < grid.cols.length - 1; i++) {
            acc += grid.cols[i] + grid.colGap;
            const x = wx(acc - grid.colGap / 2, f);
            group.add(line(x, top, x, bottom, PALETTE.blueprint));
          }
          let accY = container.y;
          for (let i = 0; i < grid.rows.length - 1; i++) {
            accY += grid.rows[i] + grid.rowGap;
            const y = wy(accY - grid.rowGap / 2, f);
            group.add(line(left, y, right, y, PALETTE.blueprint));
          }
        }
      }
    },
    dispose: () => clearGroup(group),
  };
}

function line(x1: number, y1: number, x2: number, y2: number, color: number): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x1, y1, 0.3),
    new THREE.Vector3(x2, y2, 0.3),
  ]);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

// ---- box model ----

function createBoxModelViz(): ConceptViz3D {
  const group = new THREE.Group();
  return {
    group,
    update(sig) {
      clearGroup(group);
      const bm = sig.boxModel;
      if (!bm) return;
      const contentW = Math.max(1, bm.width);
      const contentH = Math.max(1, bm.height || bm.width || 1);
      const padW = contentW + bm.padding.left + bm.padding.right;
      const padH = contentH + bm.padding.top + bm.padding.bottom;
      const bordW = padW + bm.border.left + bm.border.right;
      const bordH = padH + bm.border.top + bm.border.bottom;
      const marW = bordW + bm.margin.left + bm.margin.right;
      const marH = bordH + bm.margin.top + bm.margin.bottom;

      const scale = Math.min(5 / marW, 3.4 / marH);
      const layers: Array<[number, number, number, number, number]> = [
        [marW, marH, PALETTE.gold, 0.16, -1.8],
        [bordW, bordH, PALETTE.blueprint, 0.3, -1.2],
        [padW, padH, PALETTE.green, 0.28, -0.6],
        [contentW, contentH, PALETTE.fill, 0.95, 0],
      ];
      for (const [w, h, color, opacity, z] of layers) {
        const p = panel(w * scale, h * scale, color, opacity, z);
        group.add(p);
        const outline = rectOutline(w * scale, h * scale, PALETTE.blueprint, z + 0.01);
        group.add(outline);
      }
    },
    dispose: () => clearGroup(group),
  };
}

// ---- 3D transforms ----

const PLANE_COLORS = [PALETTE.blueprint, PALETTE.green, PALETTE.gold, PALETTE.soft] as const;

/** CSS space (px, y down) → world (y up), scaled and shifted back by `dz` world units. */
function toWorld([x, y, z]: Vec3, s: number, dz = 0): THREE.Vector3 {
  return new THREE.Vector3(x * s, -y * s, z * s - dz);
}

function loopOf(points: readonly THREE.Vector3[], color: number): THREE.LineLoop {
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([...points]),
    new THREE.LineBasicMaterial({ color }),
  );
}

function segment(a: THREE.Vector3, b: THREE.Vector3, color: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
  );
}

/** Unit normal of a quad in CSS space; +z (toward the viewer) for an untransformed box. */
function normalOf([tl, tr, , bl]: Quad): Vec3 {
  const a = [tr[0] - tl[0], tr[1] - tl[1], tr[2] - tl[2]];
  const b = [bl[0] - tl[0], bl[1] - tl[1], bl[2] - tl[2]];
  const n: Vec3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = Math.hypot(n[0], n[1], n[2]);
  return len > 1e-9 ? [n[0] / len, n[1] / len, n[2] / len] : [0, 0, 1];
}

function createTransform3dViz(): ConceptViz3D {
  const group = new THREE.Group();
  return {
    group,
    update(sig) {
      clearGroup(group);
      const space = sig.space;
      if (!space) return;
      const proj = space.projection;
      const eye = proj ? space.eye : null;
      const reach = Math.max(
        1,
        ...[space.frame, ...space.planes.map((p) => p.corners)].flat().map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))),
      );
      // Fit the boxes in about ±2.2 units. With an eye, the screen-to-eye span
      // also has to fit, so it is centred on the origin the scene sways around.
      const s = Math.min(2.2 / reach, eye ? 5 / eye : Infinity);
      const dz = eye ? (eye * s) / 2 : 0;
      const at = (p: Vec3): THREE.Vector3 => toWorld(p, s, dz);

      // The container's own plane; darker when the children were pressed into it.
      group.add(loopOf(space.frame.map(at), space.flattened ? PALETTE.ink : PALETTE.soft));

      // Coplanar faces (a card's front and back) are nudged apart along the
      // container's normal in DOM order, as the later element paints on top.
      const n = normalOf(space.frame);
      space.planes.forEach((plane, i) => {
        const lift = i * 0.8;
        const pts = plane.corners.map(([x, y, z]) => at([x + n[0] * lift, y + n[1] * lift, z + n[2] * lift]));
        const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[3], pts[2], pts[0], pts[2], pts[1]]);
        const mat = new THREE.MeshBasicMaterial({
          color: PLANE_COLORS[i % PLANE_COLORS.length],
          transparent: true,
          opacity: 0.8,
          // backface-visibility: hidden → not drawn from behind, as in the browser.
          side: plane.hideBackface ? THREE.FrontSide : THREE.DoubleSide,
        });
        group.add(new THREE.Mesh(geo, mat), loopOf(pts, PALETTE.blueprint));
      });

      if (!proj) return;
      // Where the preview draws the subject: its image on the screen (z = 0).
      group.add(loopOf(proj.screen.map(at), PALETTE.gold));
      if (!eye) return;
      const eyeAt = at([0, 0, eye]);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: PALETTE.ink }));
      ball.position.copy(eyeAt);
      group.add(ball);
      // Each sight line runs from the eye through a corner and its image; draw it
      // to whichever is farther (a corner behind the screen lies beyond its image).
      proj.corners.forEach((corner, i) => {
        group.add(segment(eyeAt, at(corner[2] < 0 ? corner : proj.screen[i]), PALETTE.gold));
      });
    },
    dispose: () => clearGroup(group),
  };
}

export type ConceptKey = "box-model" | "flexbox" | "grid" | "transform-3d";

export const VIZ_REGISTRY: Record<ConceptKey, () => ConceptViz3D> = {
  "box-model": createBoxModelViz,
  flexbox: createFlexboxViz,
  grid: createGridViz,
  "transform-3d": createTransform3dViz,
};
