import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS, lessonById, nextLesson, trackOf } from "./index.js";
import type { ValidatorSpec } from "../validate/primitives.js";
import type { Challenge } from "./types.js";
import { normalizeProp, normalizeSelector, normalizeValue, parseCss } from "../validate/css-parse.js";

const CONCEPTS = new Set(["box-model", "flexbox", "grid", "transform-3d", "none"]);

/** Every validator a challenge runs: the main set plus all responsive states. */
function allSpecs(challenge: Challenge): ValidatorSpec[] {
  return [...challenge.validators, ...(challenge.states ?? []).flatMap((s) => s.validators)];
}

/** Flatten allOf/anyOf so we can inspect every leaf validator. */
function flatten(specs: readonly ValidatorSpec[]): ValidatorSpec[] {
  const out: ValidatorSpec[] = [];
  for (const s of specs) {
    if (s.kind === "allOf" || s.kind === "anyOf") out.push(...flatten(s.of));
    else out.push(s);
  }
  return out;
}

/** Collect every element id a validator references. */
function referencedIds(spec: ValidatorSpec): string[] {
  switch (spec.kind) {
    case "computedEquals":
    case "computedMatches":
    case "sizeApprox":
      return [spec.id];
    case "centeredIn":
      return spec.containerId ? [spec.id, spec.containerId] : [spec.id];
    case "insideContainer":
      return [spec.id, spec.containerId];
    case "alignedEdge":
    case "order":
    case "noOverlap":
      return [...spec.ids];
    case "relativeSize":
      return [spec.a, spec.b];
    default:
      return [];
  }
}

describe("content integrity", () => {
  it("has unique lesson ids", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique track ids", () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least a handful of tracks and lessons", () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(6);
    expect(LESSONS.length).toBeGreaterThanOrEqual(15);
  });

  it("links to the current MDN structure (Reference/ or Guides/), not the pre-2025 flat paths", () => {
    for (const lesson of LESSONS) {
      if (!lesson.mdnPath) continue;
      expect(lesson.mdnPath, lesson.id).toMatch(/^\/ja\/docs\/Web\/CSS\/(Reference|Guides)\//);
    }
  });

  for (const lesson of LESSONS) {
    describe(`lesson: ${lesson.id}`, () => {
      const { challenge, viz } = lesson;

      it("has non-empty copy and a valid viz concept", () => {
        expect(lesson.title.length).toBeGreaterThan(0);
        expect(lesson.explanation.length).toBeGreaterThan(0);
        expect(challenge.task.length).toBeGreaterThan(0);
        expect(challenge.solution.length).toBeGreaterThan(0);
        expect(challenge.hints.length).toBeGreaterThan(0);
        expect(challenge.validators.length).toBeGreaterThan(0);
        expect(Array.isArray(challenge.snapshot.props)).toBe(true);
        expect(CONCEPTS.has(viz.concept)).toBe(true);
      });

      it("starts from CSS that still leaves something to do", () => {
        expect(challenge.starterCSS).not.toBe(challenge.solution);
      });

      it("measures every computed property its validators read", () => {
        const props = new Set(challenge.snapshot.props);
        for (const spec of flatten(allSpecs(challenge))) {
          if (spec.kind === "computedEquals" || spec.kind === "computedMatches") {
            expect(props.has(spec.prop), `${lesson.id}: snapshot does not request ${spec.prop}`).toBe(true);
          }
        }
      });

      it("references only element ids present in the starter HTML", () => {
        const leaves = flatten(allSpecs(challenge));
        const ids = new Set(leaves.flatMap(referencedIds));
        for (const id of ids) {
          expect(challenge.starterHTML).toContain(`data-id="${id}"`);
        }
        for (const id of [viz.subjectId, viz.containerId]) {
          if (id) expect(challenge.starterHTML).toContain(`data-id="${id}"`);
        }
      });

      it("the solution satisfies its own declaration validators", () => {
        const rules = parseCss(challenge.solution);
        for (const spec of flatten(allSpecs(challenge))) {
          if (spec.kind === "declarationEquals") {
            const sel = normalizeSelector(spec.selector);
            const prop = normalizeProp(spec.prop);
            const want = normalizeValue(spec.value);
            const found = rules.some((r) => r.selector === sel && r.decls[prop] === want);
            expect(found, `${lesson.id}: solution missing ${spec.selector}{${spec.prop}:${spec.value}}`).toBe(true);
          } else if (spec.kind === "declarationMatches") {
            const sel = normalizeSelector(spec.selector);
            const prop = normalizeProp(spec.prop);
            const re = new RegExp(spec.pattern);
            const found = rules.some(
              (r) => r.selector === sel && r.decls[prop] !== undefined && re.test(r.decls[prop]),
            );
            expect(found, `${lesson.id}: solution missing ${spec.selector}{${spec.prop} ~ ${spec.pattern}}`).toBe(true);
          } else if (spec.kind === "sourceMatches") {
            expect(new RegExp(spec.pattern).test(challenge.solution)).toBe(true);
          }
        }
      });
    });
  }

  it("lookups work and tolerate misses", () => {
    expect(lessonById(LESSONS[0].id)).toBe(LESSONS[0]);
    expect(lessonById("nope")).toBeUndefined();
    expect(trackOf(LESSONS[0].id)).toBe(TRACKS[0]);
    expect(trackOf("nope")).toBeUndefined();
    expect(nextLesson(LESSONS[0].id)).toBe(LESSONS[1]);
    expect(nextLesson(LESSONS[LESSONS.length - 1].id)).toBeUndefined();
    expect(nextLesson("nope")).toBeUndefined();
  });
});
