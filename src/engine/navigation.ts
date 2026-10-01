// Pure wayfinding helpers for the shell: where a lesson sits in its track,
// where to resume, and learner-facing labels (no internal ids on screen).

import { LESSONS, trackOf } from "./content/index.js";
import type { ConceptViz, Lesson } from "./content/types.js";

export interface LessonPosition {
  /** 1-based index within the track. */
  readonly index: number;
  readonly total: number;
}

export function lessonPosition(lessonId: string): LessonPosition | undefined {
  const track = trackOf(lessonId);
  if (!track) return undefined;
  const index = track.lessons.findIndex((l) => l.id === lessonId) + 1;
  return { index, total: track.lessons.length };
}

/**
 * Where to pick up: the first unfinished lesson after the one completed most
 * recently (`completed` is in completion order), falling back to the first
 * unfinished lesson in catalogue order. A learner who started mid-catalogue
 * is not sent back to the top (SHIG 12, 20, 77). Undefined when all done.
 */
export function resumeLesson(completed: readonly string[]): Lesson | undefined {
  const done = new Set(completed);
  const unfinished = (l: Lesson): boolean => !done.has(l.id);
  const latest = completed[completed.length - 1];
  const from = latest === undefined ? -1 : LESSONS.findIndex((l) => l.id === latest);
  return LESSONS.slice(from + 1).find(unfinished) ?? LESSONS.find(unfinished);
}

/** Preview width note in plain words; empty when the preview just fills the panel. */
export function viewportLabel(width: number | undefined): string {
  return width === undefined ? "" : `幅 ${width}px に固定`;
}

const CONCEPT_LABEL: Record<ConceptViz, string> = {
  "box-model": "3D: ボックスモデル",
  flexbox: "3D: Flexbox",
  grid: "3D: Grid",
  none: "プレビュー",
};

export function conceptLabel(concept: ConceptViz): string {
  return CONCEPT_LABEL[concept];
}

export function hintButtonLabel(shown: number, total: number): string {
  const left = total - shown;
  return left > 0 ? `ヒント（残り ${left}）` : "ヒントは以上です";
}
