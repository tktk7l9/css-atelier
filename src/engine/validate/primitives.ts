// Validators are serializable spec objects (a discriminated union), not opaque
// closures. A challenge composes them as data; `runSpec` interprets them against
// a Snapshot. Being plain data means the content layer can introspect them
// (e.g. content tests cross-check that a lesson's solution sets the very
// declaration a `declarationEquals` validator asks for) and they stay trivially
// testable. Prefer geometry validators (they accept any correct solution) and
// use declaration/computed validators only when a property name is the lesson.

import type { ElementSnapshot, ParsedRule, Snapshot, ValidationResult } from "./snapshot.js";
import { normalizeProp, normalizeSelector, normalizeValue } from "./css-parse.js";

const TOL = 2;

export type Edge = "left" | "right" | "top" | "bottom" | "centerx" | "centery";
export type Axis = "x" | "y";
export type Dim = "w" | "h";

interface Base {
  /** Pixel tolerance for geometry checks (default 2). */
  readonly tol?: number;
  /** Optional override shown to the learner when this validator fails. */
  readonly message?: string;
}

export type ValidatorSpec =
  | (Base & { kind: "declarationEquals"; selector: string; prop: string; value: string })
  | (Base & { kind: "declarationMatches"; selector: string; prop: string; pattern: string })
  | (Base & { kind: "sourceMatches"; pattern: string })
  | (Base & { kind: "computedEquals"; id: string; prop: string; value: string })
  | (Base & { kind: "computedMatches"; id: string; prop: string; pattern: string })
  | (Base & { kind: "centeredIn"; id: string; axis: Axis; containerId?: string })
  | (Base & { kind: "alignedEdge"; ids: readonly string[]; edge: Edge })
  | (Base & { kind: "order"; ids: readonly string[]; axis: Axis })
  | (Base & { kind: "insideContainer"; id: string; containerId: string })
  | (Base & { kind: "noOverlap"; ids: readonly string[] })
  | (Base & { kind: "sizeApprox"; id: string; w?: number; h?: number })
  | (Base & { kind: "relativeSize"; a: string; b: string; ratio: number; dim: Dim })
  | (Base & { kind: "allOf"; of: readonly ValidatorSpec[] })
  | (Base & { kind: "anyOf"; of: readonly ValidatorSpec[] });

const ok: ValidationResult = { pass: true, message: "" };
const fail = (message: string): ValidationResult => ({ pass: false, message });

function getEl(s: Snapshot, id: string): ElementSnapshot | undefined {
  return s.elements.find((e) => e.id === id);
}

function getRules(s: Snapshot, selector: string): ParsedRule[] {
  const want = normalizeSelector(selector);
  return s.declarations.filter((r) => r.selector === want);
}

function center(e: ElementSnapshot, axis: Axis): number {
  return axis === "x" ? e.rect.x + e.rect.w / 2 : e.rect.y + e.rect.h / 2;
}

function start(e: ElementSnapshot, axis: Axis): number {
  return axis === "x" ? e.rect.x : e.rect.y;
}

function edgeCoord(e: ElementSnapshot, edge: Edge): number {
  const { x, y, w, h } = e.rect;
  switch (edge) {
    case "left":
      return x;
    case "right":
      return x + w;
    case "top":
      return y;
    case "bottom":
      return y + h;
    case "centerx":
      return x + w / 2;
    case "centery":
      return y + h / 2;
  }
}

function dispatch(spec: ValidatorSpec, s: Snapshot): ValidationResult {
  switch (spec.kind) {
    case "declarationEquals": {
      const rules = getRules(s, spec.selector);
      if (rules.length === 0) return fail(`セレクタ ${spec.selector} のルールが見つかりません`);
      const prop = normalizeProp(spec.prop);
      const want = normalizeValue(spec.value);
      const found = rules.some((r) => r.decls[prop] === want);
      return found
        ? ok
        : fail(`${spec.selector} に ${spec.prop}: ${spec.value} を指定しましょう`);
    }
    case "declarationMatches": {
      const rules = getRules(s, spec.selector);
      if (rules.length === 0) return fail(`セレクタ ${spec.selector} のルールが見つかりません`);
      const prop = normalizeProp(spec.prop);
      const re = new RegExp(spec.pattern);
      const found = rules.some((r) => r.decls[prop] !== undefined && re.test(r.decls[prop]));
      return found ? ok : fail(`${spec.selector} の ${spec.prop} の値を見直しましょう`);
    }
    case "sourceMatches": {
      return new RegExp(spec.pattern).test(s.css)
        ? ok
        : fail("CSS に必要な記述が見つかりません");
    }
    case "computedEquals": {
      const el = getEl(s, spec.id);
      if (!el) return fail(`要素 ${spec.id} が見つかりません`);
      const actual = el.computed[spec.prop];
      if (actual === undefined) return fail(`${spec.id} の ${spec.prop} が取得されていません`);
      return normalizeValue(actual) === normalizeValue(spec.value)
        ? ok
        : fail(`${spec.id} の ${spec.prop} は ${spec.value} になっていません`);
    }
    case "computedMatches": {
      const el = getEl(s, spec.id);
      if (!el) return fail(`要素 ${spec.id} が見つかりません`);
      const actual = el.computed[spec.prop];
      if (actual === undefined) return fail(`${spec.id} の ${spec.prop} が取得されていません`);
      return new RegExp(spec.pattern).test(actual)
        ? ok
        : fail(`${spec.id} の ${spec.prop} の値を見直しましょう`);
    }
    case "centeredIn": {
      const el = getEl(s, spec.id);
      if (!el) return fail(`要素 ${spec.id} が見つかりません`);
      const containerId = spec.containerId ?? el.parentId ?? undefined;
      const container = containerId ? getEl(s, containerId) : undefined;
      if (!container) return fail(`${spec.id} を囲むコンテナが見つかりません`);
      const tol = spec.tol ?? TOL;
      return Math.abs(center(el, spec.axis) - center(container, spec.axis)) <= tol
        ? ok
        : fail(`${spec.id} がコンテナの中央（${spec.axis} 軸）にありません`);
    }
    case "alignedEdge": {
      const coords: number[] = [];
      for (const id of spec.ids) {
        const el = getEl(s, id);
        if (!el) return fail(`要素 ${id} が見つかりません`);
        coords.push(edgeCoord(el, spec.edge));
      }
      const tol = spec.tol ?? TOL;
      const spread = Math.max(...coords) - Math.min(...coords);
      return spread <= tol ? ok : fail(`要素の ${spec.edge} がそろっていません`);
    }
    case "order": {
      const positions: number[] = [];
      for (const id of spec.ids) {
        const el = getEl(s, id);
        if (!el) return fail(`要素 ${id} が見つかりません`);
        positions.push(start(el, spec.axis));
      }
      for (let i = 1; i < positions.length; i++) {
        if (!(positions[i - 1] < positions[i])) {
          return fail(`要素の並び順（${spec.axis} 軸）が正しくありません`);
        }
      }
      return ok;
    }
    case "insideContainer": {
      const el = getEl(s, spec.id);
      const container = getEl(s, spec.containerId);
      if (!el) return fail(`要素 ${spec.id} が見つかりません`);
      if (!container) return fail(`コンテナ ${spec.containerId} が見つかりません`);
      const tol = spec.tol ?? TOL;
      const a = el.rect;
      const c = container.rect;
      const inside =
        a.x >= c.x - tol &&
        a.y >= c.y - tol &&
        a.x + a.w <= c.x + c.w + tol &&
        a.y + a.h <= c.y + c.h + tol;
      return inside ? ok : fail(`${spec.id} が ${spec.containerId} の内側に収まっていません`);
    }
    case "noOverlap": {
      const els: ElementSnapshot[] = [];
      for (const id of spec.ids) {
        const el = getEl(s, id);
        if (!el) return fail(`要素 ${id} が見つかりません`);
        els.push(el);
      }
      const tol = spec.tol ?? TOL;
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i].rect;
          const b = els[j].rect;
          const overlap =
            a.x < b.x + b.w - tol &&
            b.x < a.x + a.w - tol &&
            a.y < b.y + b.h - tol &&
            b.y < a.y + a.h - tol;
          if (overlap) return fail(`${els[i].id} と ${els[j].id} が重なっています`);
        }
      }
      return ok;
    }
    case "sizeApprox": {
      const el = getEl(s, spec.id);
      if (!el) return fail(`要素 ${spec.id} が見つかりません`);
      const tol = spec.tol ?? TOL;
      if (spec.w !== undefined && Math.abs(el.rect.w - spec.w) > tol) {
        return fail(`${spec.id} の幅が ${spec.w}px になっていません`);
      }
      if (spec.h !== undefined && Math.abs(el.rect.h - spec.h) > tol) {
        return fail(`${spec.id} の高さが ${spec.h}px になっていません`);
      }
      return ok;
    }
    case "relativeSize": {
      const a = getEl(s, spec.a);
      const b = getEl(s, spec.b);
      if (!a) return fail(`要素 ${spec.a} が見つかりません`);
      if (!b) return fail(`要素 ${spec.b} が見つかりません`);
      const tol = spec.tol ?? 4;
      const av = spec.dim === "w" ? a.rect.w : a.rect.h;
      const bv = spec.dim === "w" ? b.rect.w : b.rect.h;
      return Math.abs(av - spec.ratio * bv) <= tol
        ? ok
        : fail(`${spec.a} は ${spec.b} の ${spec.ratio} 倍の大きさになっていません`);
    }
    case "allOf": {
      for (const child of spec.of) {
        const res = runSpec(child, s);
        if (!res.pass) return res;
      }
      return ok;
    }
    case "anyOf": {
      for (const child of spec.of) {
        const res = runSpec(child, s);
        if (res.pass) return ok;
      }
      return fail("条件のいずれも満たしていません");
    }
  }
}

export function runSpec(spec: ValidatorSpec, s: Snapshot): ValidationResult {
  const res = dispatch(spec, s);
  if (!res.pass && spec.message) return fail(spec.message);
  return res;
}
