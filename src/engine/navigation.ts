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

/** First not-yet-completed lesson in catalogue order (undefined when all done). */
export function resumeLesson(completed: readonly string[]): Lesson | undefined {
  const done = new Set(completed);
  return LESSONS.find((l) => !done.has(l.id));
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
