import type { Lesson, Track } from "./types.js";
import { selectorsTrack } from "./selectors.js";
import { boxModelTrack } from "./box-model.js";
import { unitsTrack } from "./units.js";
import { customPropsTrack } from "./custom-props.js";
import { colorTrack } from "./color.js";
import { colorFunctionsTrack } from "./color-functions.js";
import { modernSelectorsTrack } from "./modern-selectors.js";
import { nestingTrack } from "./nesting.js";
import { flexboxTrack } from "./flexbox.js";
import { gridTrack } from "./grid.js";
import { subgridTrack } from "./subgrid.js";
import { logicalPropsTrack } from "./logical-props.js";
import { aspectRatioTrack } from "./aspect-ratio.js";
import { anchorPositioningTrack } from "./anchor-positioning.js";
import { layersTrack } from "./layers.js";
import { transitionsTrack } from "./transitions.js";
import { entryAnimationsTrack } from "./entry-animations.js";
import { mediaQueriesTrack } from "./media-queries.js";
import { containerQueriesTrack } from "./container-queries.js";
import { scopeTrack } from "./scope.js";
import { registeredPropsTrack } from "./registered-props.js";
import { scrollSnapTrack } from "./scroll-snap.js";
import { textWrapTrack } from "./text-wrap.js";
import { clipMaskTrack } from "./clip-mask.js";
import { filtersTrack } from "./filters.js";
import { transforms3dTrack } from "./transforms-3d.js";
import { mathFunctionsTrack } from "./math-functions.js";
import { gradientsTrack } from "./gradients.js";
import { writingModesTrack } from "./writing-modes.js";
import { stickyTrack } from "./sticky.js";
import { formsTrack } from "./forms.js";

/**
 * Catalogue order, roughly basics → modern → layout → responsive → polish.
 * Gradients follow the colour tracks (in oklch builds on oklch()), writing
 * modes follow logical properties, and sticky comes before scroll snap (whose
 * scroll-padding lesson uses a sticky header) and after grid (its sidebar
 * lesson is a grid item). The math functions come last: their lessons build on
 * custom properties, transitions and transforms from earlier tracks.
 */
export const TRACKS: readonly Track[] = [
  selectorsTrack,
  boxModelTrack,
  unitsTrack,
  customPropsTrack,
  colorTrack,
  colorFunctionsTrack,
  gradientsTrack,
  textWrapTrack,
  modernSelectorsTrack,
  nestingTrack,
  scopeTrack,
  flexboxTrack,
  gridTrack,
  subgridTrack,
  logicalPropsTrack,
  writingModesTrack,
  aspectRatioTrack,
  anchorPositioningTrack,
  stickyTrack,
  scrollSnapTrack,
  mediaQueriesTrack,
  containerQueriesTrack,
  layersTrack,
  clipMaskTrack,
  filtersTrack,
  formsTrack,
  transitionsTrack,
  transforms3dTrack,
  entryAnimationsTrack,
  registeredPropsTrack,
  mathFunctionsTrack,
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
