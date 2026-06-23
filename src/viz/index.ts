// Visualizer manager: owns the render context + render loop and swaps the active
// concept viz. Concept "none" tears the scene down (handled by the caller hiding
// the canvas). A gentle idle rotation conveys the 3D depth unless reduced motion.

import type { ConceptViz } from "../engine/content/types.js";
import type { VizSignals } from "../engine/viz-map.js";
import { createRenderContext } from "./renderer.js";
import { VIZ_REGISTRY, type ConceptViz3D } from "./concepts.js";

export interface Visualizer {
  setConcept(concept: ConceptViz): void;
  update(sig: VizSignals): void;
  resize(): void;
  dispose(): void;
}

export function createVisualizer(
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
): Visualizer {
  const ctx = createRenderContext(canvas, reducedMotion);
  let active: ConceptViz3D | null = null;
  let activeKey: ConceptViz | null = null;
  let last: VizSignals | null = null;
  let raf = 0;
  let t = 0;

  const ro = new ResizeObserver(() => ctx.resize());
  ro.observe(canvas);

  function setConcept(concept: ConceptViz): void {
    if (concept === activeKey) return;
    if (active) {
      ctx.scene.remove(active.group);
      active.dispose();
      active = null;
    }
    activeKey = concept;
    if (concept !== "none") {
      active = VIZ_REGISTRY[concept]();
      ctx.scene.add(active.group);
      if (last) active.update(last);
    }
  }

  function update(sig: VizSignals): void {
    last = sig;
    active?.update(sig);
  }

  function loop(): void {
    raf = requestAnimationFrame(loop);
    if (!reducedMotion && active) {
      t += 0.006;
      active.group.rotation.y = Math.sin(t) * 0.16;
    }
    ctx.render();
  }
  loop();

  function dispose(): void {
    cancelAnimationFrame(raf);
    ro.disconnect();
    if (active) {
      ctx.scene.remove(active.group);
      active.dispose();
    }
    ctx.renderer.dispose();
  }

  return { setConcept, update, resize: ctx.resize, dispose };
}
