/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VizSignals } from "../engine/viz-map.js";

// The WebGL render context and the Three.js concept builders are doubles; this
// covers the manager: concept swapping, signal replay, the idle-rotation loop,
// resize observation and teardown.

const fakes = vi.hoisted(() => {
  const state = {
    scene: { children: [] as unknown[], add: (o: unknown) => void state.scene.children.push(o), remove: (o: unknown) => {
      state.scene.children = state.scene.children.filter((c) => c !== o);
    } },
    renders: 0,
    resizes: 0,
    rendererDisposed: 0,
    built: [] as { key: string; group: { rotation: { y: number } }; updates: VizSignals[]; disposed: number }[],
  };
  return { state };
});

vi.mock("./renderer.js", () => ({
  createRenderContext: () => ({
    scene: fakes.state.scene,
    renderer: { dispose: () => void fakes.state.rendererDisposed++ },
    camera: {},
    resize: () => void fakes.state.resizes++,
    render: () => void fakes.state.renders++,
  }),
}));

vi.mock("./concepts.js", () => {
  const make = (key: string) => () => {
    const entry = { key, group: { rotation: { y: 0 } }, updates: [] as VizSignals[], disposed: 0 };
    fakes.state.built.push(entry);
    return {
      group: entry.group,
      update: (sig: VizSignals) => void entry.updates.push(sig),
      dispose: () => void entry.disposed++,
    };
  };
  return { VIZ_REGISTRY: { "box-model": make("box-model"), flexbox: make("flexbox"), grid: make("grid") } };
});

import { createVisualizer } from "./index.js";

const observed: { targets: Element[]; disconnected: number; trigger: () => void } = {
  targets: [],
  disconnected: 0,
  trigger: () => void 0,
};

class FakeResizeObserver {
  constructor(private readonly cb: () => void) {
    observed.trigger = () => this.cb();
  }
  observe(target: Element): void {
    observed.targets.push(target);
  }
  disconnect(): void {
    observed.disconnected++;
  }
}

const signals = (concept: VizSignals["concept"]): VizSignals => ({
  concept,
  viewport: { w: 100, h: 100 },
  boxes: [],
});

const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  const s = fakes.state;
  s.scene.children = [];
  s.renders = 0;
  s.resizes = 0;
  s.rendererDisposed = 0;
  s.built = [];
  observed.targets = [];
  observed.disconnected = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createVisualizer", () => {
  it("watches the canvas size and renders every frame", async () => {
    const canvas = document.createElement("canvas");
    const viz = createVisualizer(canvas, true);
    expect(observed.targets).toEqual([canvas]);
    observed.trigger();
    expect(fakes.state.resizes).toBe(1);
    viz.resize();
    expect(fakes.state.resizes).toBe(2);
    await frame();
    await frame();
    expect(fakes.state.renders).toBeGreaterThanOrEqual(1);
    viz.dispose();
  });

  it("builds a concept on demand, swaps it and replays the last signals into the new one", () => {
    const viz = createVisualizer(document.createElement("canvas"), true);
    expect(fakes.state.scene.children.length).toBe(0);

    viz.setConcept("box-model");
    expect(fakes.state.built.map((b) => b.key)).toEqual(["box-model"]);
    expect(fakes.state.scene.children).toEqual([fakes.state.built[0].group]);

    viz.update(signals("box-model"));
    expect(fakes.state.built[0].updates.length).toBe(1);

    // Same concept again is a no-op.
    viz.setConcept("box-model");
    expect(fakes.state.built.length).toBe(1);

    viz.setConcept("flexbox");
    expect(fakes.state.built[0].disposed).toBe(1);
    expect(fakes.state.built[1].key).toBe("flexbox");
    expect(fakes.state.scene.children).toEqual([fakes.state.built[1].group]);
    // The previous lesson's signals are replayed so the new scene is not empty.
    expect(fakes.state.built[1].updates).toEqual([signals("box-model")]);
    viz.dispose();
  });

  it("concept none tears the scene down and update becomes a no-op", () => {
    const viz = createVisualizer(document.createElement("canvas"), true);
    viz.setConcept("grid");
    viz.setConcept("none");
    expect(fakes.state.built[0].disposed).toBe(1);
    expect(fakes.state.scene.children).toEqual([]);
    viz.update(signals("grid"));
    expect(fakes.state.built[0].updates).toEqual([]);
    // Coming back rebuilds a fresh scene.
    viz.setConcept("grid");
    expect(fakes.state.built.length).toBe(2);
    viz.dispose();
  });

  it("does not build anything when the first concept is none", () => {
    const viz = createVisualizer(document.createElement("canvas"), true);
    viz.setConcept("none");
    expect(fakes.state.built).toEqual([]);
    viz.dispose();
  });

  it("idles with a gentle rotation unless reduced motion is preferred", async () => {
    const still = createVisualizer(document.createElement("canvas"), true);
    still.setConcept("flexbox");
    await frame();
    await frame();
    expect(fakes.state.built[0].group.rotation.y).toBe(0);
    still.dispose();

    const moving = createVisualizer(document.createElement("canvas"), false);
    moving.setConcept("flexbox");
    await frame();
    await frame();
    const y = fakes.state.built[1].group.rotation.y;
    expect(y).not.toBe(0);
    expect(Math.abs(y)).toBeLessThanOrEqual(0.16);
    moving.dispose();
  });

  it("dispose stops the loop, disconnects the observer and frees the scene and renderer", async () => {
    const viz = createVisualizer(document.createElement("canvas"), true);
    viz.setConcept("grid");
    viz.dispose();
    expect(observed.disconnected).toBe(1);
    expect(fakes.state.built[0].disposed).toBe(1);
    expect(fakes.state.scene.children).toEqual([]);
    expect(fakes.state.rendererDisposed).toBe(1);
    const before = fakes.state.renders;
    await frame();
    await frame();
    expect(fakes.state.renders).toBe(before);
  });

  it("dispose without an active concept only frees the renderer", () => {
    const viz = createVisualizer(document.createElement("canvas"), true);
    viz.dispose();
    expect(fakes.state.rendererDisposed).toBe(1);
    expect(fakes.state.built).toEqual([]);
  });
});
