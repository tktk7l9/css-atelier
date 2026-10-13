/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getByRole, getByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { loadTrack } from "./engine/content/index.js";
import type { Lesson } from "./engine/content/types.js";
import type { Snapshot } from "./engine/validate/snapshot.js";
import { parseCss } from "./engine/validate/css-parse.js";

// A device without WebGL. Three.js's WebGLRenderer throws when the canvas gives
// it no context ("Error creating WebGL context."); here its constructor throws
// that same error, while the real visualizer and render context run. Only the
// sandbox is a double (jsdom renders no iframe), recording what the lesson
// loads so the test can see the preview and the checks carry on.

const fakes = vi.hoisted(() => ({
  renderers: 0,
  loaded: [] as { html: string; css: string }[],
  computed: {} as Record<string, Record<string, string>>,
  css: "",
}));

vi.mock("three", async (importOriginal) => {
  const THREE = await importOriginal<typeof import("three")>();
  class WebGLRendererWithoutContext {
    constructor() {
      fakes.renderers++;
      throw new Error("Error creating WebGL context.");
    }
  }
  return { ...THREE, WebGLRenderer: WebGLRendererWithoutContext };
});

vi.mock("./sandbox/sandbox.js", () => ({
  createSandbox: () => ({
    load: async (html: string, css: string) => {
      fakes.loaded.push({ html, css });
      fakes.css = css;
    },
    setUserCSS: (css: string) => {
      fakes.css = css;
    },
    setViewport: () => void 0,
    snapshot: (): Snapshot => ({
      viewport: { w: 800, h: 600 },
      elements: Object.entries(fakes.computed).map(([id, computed], order) => ({
        id,
        tag: "div",
        rect: { x: 0, y: 0, w: 100, h: 50 },
        computed,
        parentId: null,
        order,
      })),
      declarations: parseCss(fakes.css),
      css: fakes.css,
    }),
    destroy: () => void 0,
  }),
}));

import { createApp, type AppController } from "./app.js";

const lessons = new Map<string, Lesson>(
  (await Promise.all((["box-model", "flexbox", "selectors"] as const).map((id) => loadTrack(id))))
    .flatMap((t) => t.lessons)
    .map((l) => [l.id, l] as const),
);
const lesson = (id: string): Lesson => lessons.get(id)!;

const NOTE = "この端末では 3D の図を表示できません。プレビューと採点はそのまま使えます。";

const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
const settle = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await nextFrame();
};

function mount(): { app: AppController; root: HTMLElement } {
  const app = createApp({ onComplete: vi.fn(), onBack: vi.fn(), onOpen: vi.fn(), reducedMotion: false });
  document.body.append(app.root);
  return { app, root: app.root };
}

const stageOf = (root: HTMLElement): HTMLElement => root.querySelector(".viz__stage") as HTMLElement;
const noteOf = (root: HTMLElement): HTMLElement => getByText(root, NOTE);

beforeEach(() => {
  Element.prototype.scrollIntoView = () => void 0;
  localStorage.clear();
  fakes.renderers = 0;
  fakes.loaded = [];
  fakes.computed = {};
  fakes.css = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createApp without WebGL", () => {
  it("replaces the 3D view with a note, still loads the preview and still checks the CSS", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    const padding = lesson("box-model-padding");
    await app.open(padding);

    expect(fakes.renderers).toBe(1);
    expect(stageOf(root).classList.contains("hidden")).toBe(true);
    expect(noteOf(root).classList.contains("hidden")).toBe(false);
    // The lesson itself is intact: its preview loaded and the heading has focus.
    expect(fakes.loaded).toEqual([{ html: padding.challenge.starterHTML, css: padding.challenge.starterCSS }]);
    expect(document.activeElement).toBe(getByRole(root, "heading", { level: 1 }));

    fakes.computed = { card: { "padding-top": "20px", "padding-left": "20px" } };
    await user.click(getByRole(root, "button", { name: "チェック" }));
    await settle();
    expect(root.querySelector(".banner")?.textContent).toBe("✓ クリア！ よくできました。");
  });

  it("does not try again on later 3D lessons and hides the note on lessons without a 3D view", async () => {
    const { app, root } = mount();
    await app.open(lesson("box-model-padding"));
    await app.open(lesson("flexbox-justify-center"));
    expect(fakes.renderers).toBe(1);
    expect(noteOf(root).classList.contains("hidden")).toBe(false);
    expect(stageOf(root).classList.contains("hidden")).toBe(true);
    expect(fakes.loaded).toHaveLength(2);

    await app.open(lesson("selectors-class"));
    expect(noteOf(root).classList.contains("hidden")).toBe(true);
    expect(stageOf(root).classList.contains("hidden")).toBe(true);

    await app.open(lesson("box-model-padding"));
    expect(noteOf(root).classList.contains("hidden")).toBe(false);
    expect(fakes.renderers).toBe(1);
    expect(fakes.loaded).toHaveLength(4);

    // Nothing 3D to tear down.
    expect(() => app.dispose()).not.toThrow();
  });
});
