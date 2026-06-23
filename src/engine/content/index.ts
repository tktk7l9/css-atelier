import type { Lesson, Track } from "./types.js";
import { selectorsTrack } from "./selectors.js";
import { boxModelTrack } from "./box-model.js";
import { unitsTrack } from "./units.js";
import { customPropsTrack } from "./custom-props.js";
import { colorTrack } from "./color.js";
import { modernSelectorsTrack } from "./modern-selectors.js";
import { nestingTrack } from "./nesting.js";
import { flexboxTrack } from "./flexbox.js";
import { gridTrack } from "./grid.js";
import { logicalPropsTrack } from "./logical-props.js";
import { aspectRatioTrack } from "./aspect-ratio.js";
import { layersTrack } from "./layers.js";
import { transitionsTrack } from "./transitions.js";
import { mediaQueriesTrack } from "./media-queries.js";
import { containerQueriesTrack } from "./container-queries.js";

/** Catalogue order, roughly basics → modern → layout → responsive → polish. */
export const TRACKS: readonly Track[] = [
  selectorsTrack,
  boxModelTrack,
  unitsTrack,
  customPropsTrack,
  colorTrack,
  modernSelectorsTrack,
  nestingTrack,
  flexboxTrack,
  gridTrack,
  logicalPropsTrack,
  aspectRatioTrack,
  mediaQueriesTrack,
  containerQueriesTrack,
  layersTrack,
  transitionsTrack,
];

export const LESSONS: readonly Lesson[] = TRACKS.flatMap((t) => t.lessons);

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function trackOf(lessonId: string): Track | undefined {
  return TRACKS.find((t) => t.lessons.some((l) => l.id === lessonId));
}

/** The lesson after `id` in catalogue order, or undefined at the end. */
export function nextLesson(id: string): Lesson | undefined {
  const idx = LESSONS.findIndex((l) => l.id === id);
  return idx >= 0 ? LESSONS[idx + 1] : undefined;
}
