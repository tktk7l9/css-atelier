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
import { textOverflowTrack } from "./text-overflow.js";
import { hasPatternsTrack } from "./has-patterns.js";
import { objectFitTrack } from "./object-fit.js";
import { supportsTrack } from "./supports.js";
import { gridAlignmentTrack } from "./grid-alignment.js";
import { intrinsicSizingTrack } from "./intrinsic-sizing.js";
import { positioningTrack } from "./positioning.js";
import { transforms2dTrack } from "./transforms-2d.js";

/**
 * Catalogue order, roughly basics → modern → layout → responsive → polish.
 * Gradients follow the colour tracks (in oklch builds on oklch()), writing
 * modes follow logical properties, and sticky comes before scroll snap (whose
 * scroll-padding lesson uses a sticky header) and after grid (its sidebar
 * lesson is a grid item). Text overflow follows text wrapping, the :has()
 * patterns follow the :has() basics in modern selectors, object-fit follows
 * aspect ratio, and feature queries join the other conditional rules after
 * container queries. Grid alignment follows grid; intrinsic sizes come after
 * subgrid (their label column is a grid track); absolute positioning follows
 * logical properties and writing modes (its last lesson uses the logical
 * insets) and precedes anchor positioning and sticky, which build on it. The
 * 2D transform track sits between transitions and 3D transforms, and comes
 * after positioning (its needle and labels are absolutely positioned). The
 * math functions come last: their lessons build on custom properties,
 * transitions and transforms from earlier tracks.
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
  textOverflowTrack,
  modernSelectorsTrack,
  hasPatternsTrack,
  nestingTrack,
  scopeTrack,
  flexboxTrack,
  gridTrack,
  gridAlignmentTrack,
  subgridTrack,
  intrinsicSizingTrack,
  logicalPropsTrack,
  writingModesTrack,
  positioningTrack,
  aspectRatioTrack,
  objectFitTrack,
  anchorPositioningTrack,
  stickyTrack,
  scrollSnapTrack,
  mediaQueriesTrack,
  containerQueriesTrack,
  supportsTrack,
  layersTrack,
  clipMaskTrack,
  filtersTrack,
  formsTrack,
  transitionsTrack,
  transforms2dTrack,
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
