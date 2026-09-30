/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getByRole, getByText, queryByText, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { LESSONS, lessonById, nextLesson } from "./engine/content/index.js";
import type { Snapshot } from "./engine/validate/snapshot.js";
import { parseCss } from "./engine/validate/css-parse.js";
import type { VizSignals } from "./engine/viz-map.js";

// The sandbox (iframe + constructable stylesheets) and the Three.js visualizer
// are replaced by recording doubles: jsdom renders neither. Everything else —
// buttons, editor, banner, hints, undo, drafts, completion — runs for real.

const fakes = vi.hoisted(() => {
  const state = {
    css: "",
    loaded: [] as { html: string; css: string }[],
    viewports: [] as (number | null)[],
    /** Computed values reported by the snapshot, keyed by element id. */
    computed: {} as Record<string, Record<string, string>>,
    /** Per-viewport computed override (for multi-state lessons). */
    computedAt: {} as Record<string, Record<string, Record<string, string>>>,
    destroyed: 0,
    viz: {
      created: 0,
      concepts: [] as string[],
      updates: [] as string[],
      disposed: 0,
      reducedMotion: null as boolean | null,
    },
  };
  return { state };
});

vi.mock("./sandbox/sandbox.js", () => ({
  createSandbox: (iframe: HTMLIFrameElement) => {
    const s = fakes.state;
    let viewport: number | null = null;
    return {
      load: async (html: string, css: string) => {
        s.loaded.push({ html, css });
        s.css = css;
      },
      setUserCSS: (css: string) => {
        s.css = css;
      },
      setViewport: (w: number | null) => {
        viewport = w;
        s.viewports.push(w);
        iframe.style.width = w == null ? "" : `${w}px`;
      },
      snapshot: (): Snapshot => {
        const table = (viewport != null && s.computedAt[String(viewport)]) || s.computed;
        return {
          viewport: { w: viewport ?? 800, h: 600 },
          elements: Object.entries(table).map(([id, computed], order) => ({
            id,
            tag: "div",
            rect: { x: 0, y: 0, w: 100, h: 50 },
            computed,
            parentId: null,
            order,
          })),
          declarations: parseCss(s.css),
          css: s.css,
        };
      },
      destroy: () => {
        s.destroyed++;
      },
    };
  },
}));

vi.mock("./viz/index.js", () => ({
  createVisualizer: (_canvas: HTMLCanvasElement, reducedMotion: boolean) => {
    const v = fakes.state.viz;
    v.created++;
    v.reducedMotion = reducedMotion;
    return {
      setConcept: (c: string) => void v.concepts.push(c),
      update: (sig: VizSignals) => void v.updates.push(sig.concept),
      resize: () => void 0,
      dispose: () => void v.disposed++,
    };
  },
}));

import { createApp, type AppCallbacks, type AppController } from "./app.js";

const PADDING = "box-model-padding"; // 3D lesson with 2 hints
const CLASS = "selectors-class"; // first lesson, no 3D
const CQ = "cq-query"; // viewport 500 + an extra 360px state
const LAST = LESSONS[LESSONS.length - 1].id;

const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
const settle = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await nextFrame();
};
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function mount(overrides: Partial<AppCallbacks> = {}): {
  app: AppController;
  root: HTMLElement;
  callbacks: AppCallbacks;
} {
  const callbacks: AppCallbacks = {
    onComplete: vi.fn(),
    onBack: vi.fn(),
    onOpen: vi.fn(),
    reducedMotion: false,
    ...overrides,
  };
  const app = createApp(callbacks);
  document.body.append(app.root);
  return { app, root: app.root, callbacks };
}

const editorOf = (root: HTMLElement): HTMLTextAreaElement =>
  getByRole(root, "textbox", { name: "CSS エディタ" }) as HTMLTextAreaElement;
const button = (root: HTMLElement, name: string | RegExp): HTMLButtonElement =>
  getByRole(root, "button", { name }) as HTMLButtonElement;
const banner = (root: HTMLElement): HTMLElement => root.querySelector(".banner") as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  const s = fakes.state;
  s.css = "";
  s.loaded = [];
  s.viewports = [];
  s.computed = {};
  s.computedAt = {};
  s.destroyed = 0;
  s.viz = { created: 0, concepts: [], updates: [], disposed: 0, reducedMotion: null };
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createApp: opening a lesson", () => {
  it("renders the lesson text, task, MDN link, starter CSS and preview labels", async () => {
    const { app, root } = mount();
    const lesson = lessonById(PADDING)!;
    await app.open(PADDING);
    expect(getByRole(root, "heading", { level: 2 }).textContent).toBe(lesson.title);
    expect(root.querySelector(".explain")?.innerHTML).toBe(lesson.explanation);
    expect(getByText(root, "課題")).toBeTruthy();
    expect(root.querySelector(".task")?.textContent).toContain(lesson.challenge.task);
    const mdn = getByRole(root, "link", { name: "MDN でもっと学ぶ →" });
    expect(mdn.getAttribute("href")).toBe(`https://developer.mozilla.org${lesson.mdnPath}`);
    expect(editorOf(root).value).toBe(lesson.challenge.starterCSS);
    expect(fakes.state.loaded).toEqual([
      { html: lesson.challenge.starterHTML, css: lesson.challenge.starterCSS },
    ]);
    expect(getByText(root, "auto")).toBeTruthy();
    expect(getByText(root, "3D: ボックスモデル")).toBeTruthy();
    expect(button(root, "ヒント（残り 2）").disabled).toBe(false);
    expect(button(root, "次のレッスン →")).toBeTruthy();
    expect(document.activeElement).toBe(getByRole(root, "heading", { level: 2 }));
  });

  it("ignores an unknown lesson id", async () => {
    const { app } = mount();
    await app.open("nope");
    expect(fakes.state.loaded).toEqual([]);
  });

  it("shows the preview width for a fixed-viewport lesson and restores it afterwards", async () => {
    const { app, root } = mount();
    await app.open(CQ);
    expect(getByText(root, "500px")).toBeTruthy();
    expect(fakes.state.viewports.at(-1)).toBe(500);
    expect(getByText(root, "プレビュー", { selector: ".preview__head" })).toBeTruthy();
  });

  it("hides the MDN link and the stage for a lesson without them, and offers the catalogue on the last lesson", async () => {
    const { app, root } = mount();
    const last = lessonById(LAST)!;
    expect(last.mdnPath).toBeDefined();
    await app.open(LAST);
    expect(button(root, "レッスン一覧へ")).toBeTruthy();
    // A lesson without an MDN path hides the link.
    await app.open(PADDING);
    const noMdn = LESSONS.find((l) => !l.mdnPath);
    if (noMdn) {
      await app.open(noMdn.id);
      expect(root.querySelector(".mdn-link")?.classList.contains("hidden")).toBe(true);
    }
  });

  it("loads the 3D visualizer only for 3D lessons and tears the scene down for 2D ones", async () => {
    const { app, root } = mount({ reducedMotion: true });
    const stage = root.querySelector(".viz__stage") as HTMLElement;
    await app.open(CLASS);
    expect(fakes.state.viz.created).toBe(0);
    expect(stage.classList.contains("hidden")).toBe(true);
    expect(getByText(root, "プレビュー", { selector: ".viz__badge" })).toBeTruthy();

    await app.open(PADDING);
    expect(fakes.state.viz.created).toBe(1);
    expect(fakes.state.viz.reducedMotion).toBe(true);
    expect(fakes.state.viz.concepts).toEqual(["box-model"]);
    expect(stage.classList.contains("hidden")).toBe(false);

    await app.open(CLASS);
    expect(stage.classList.contains("hidden")).toBe(true);
    expect(fakes.state.viz.concepts).toEqual(["box-model", "none"]);
    expect(fakes.state.viz.created).toBe(1);

    await app.open("flexbox-justify-center");
    expect(fakes.state.viz.concepts).toEqual(["box-model", "none", "flexbox"]);
    await settle();
    expect(fakes.state.viz.updates.at(-1)).toBe("flexbox");
  });

  it("restores a saved draft instead of the starter CSS", async () => {
    localStorage.setItem(
      "css-atelier:drafts:v1",
      JSON.stringify({ [PADDING]: ".card { padding: 1px }" }),
    );
    const { app, root } = mount();
    await app.open(PADDING);
    expect(editorOf(root).value).toBe(".card { padding: 1px }");
    expect(fakes.state.loaded[0].css).toBe(".card { padding: 1px }");
  });

  it("resets per-lesson state (hints, banner, undo) when moving between lessons", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    await user.click(button(root, /ヒント/));
    await user.click(button(root, "解答を見る"));
    expect(getByText(root, "解答を表示しました。")).toBeTruthy();
    expect(root.querySelectorAll(".hint").length).toBe(1);

    await app.open(CLASS);
    expect(root.querySelectorAll(".hint").length).toBe(0);
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(true);
    const total = lessonById(CLASS)!.challenge.hints.length;
    expect(button(root, `ヒント（残り ${total}）`)).toBeTruthy();
  });
});

describe("createApp: checking", () => {
  it("passes when the computed styles satisfy the validators, marks completion and promotes Next", async () => {
    const user = userEvent.setup();
    const { app, root, callbacks } = mount();
    await app.open(PADDING);
    fakes.state.computed = { card: { "padding-top": "20px", "padding-left": "20px" } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(banner(root).textContent).toBe("✓ クリア！ よくできました。");
    expect(banner(root).className).toContain("banner--pass");
    expect(callbacks.onComplete).toHaveBeenCalledWith(PADDING);
    expect(JSON.parse(localStorage.getItem("css-atelier:progress:v1") ?? "[]")).toEqual([PADDING]);
    expect(button(root, "次のレッスン →").classList.contains("btn--primary")).toBe(true);
  });

  it("lists every failure when the check does not pass", async () => {
    const user = userEvent.setup();
    const { app, root, callbacks } = mount();
    await app.open(PADDING);
    fakes.state.computed = { card: { "padding-top": "0px", "padding-left": "0px" } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(getByText(root, "もう少し！ 次を確認しましょう:")).toBeTruthy();
    const items = within(banner(root)).getAllByRole("listitem");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("padding-top");
    expect(banner(root).className).toContain("banner--fail");
    expect(callbacks.onComplete).not.toHaveBeenCalled();
    expect(localStorage.getItem("css-atelier:progress:v1")).toBeNull();
    expect(button(root, "次のレッスン →").classList.contains("btn--primary")).toBe(false);
  });

  it("sends the editor CSS to the sandbox before measuring", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    const ta = editorOf(root);
    ta.value = ".card { padding: 20px }";
    fakes.state.computed = { card: { "padding-top": "20px", "padding-left": "20px" } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(fakes.state.css).toBe(".card { padding: 20px }");
  });

  it("checks every extra viewport state and restores the lesson viewport", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(CQ);
    fakes.state.viewports = [];
    editorOf(root).value = "@container (min-width: 400px) { .card { font-size: 24px } }";
    fakes.state.computed = { card: { "font-size": "24px" } };
    // The narrow state must NOT apply the rule; report the wrong value there.
    fakes.state.computedAt = { "360": { card: { "font-size": "24px" } } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(fakes.state.viewports).toEqual([500, 360, 500]);
    expect(banner(root).className).toContain("banner--fail");
    expect(within(banner(root)).getAllByRole("listitem").length).toBe(1);

    fakes.state.computedAt = { "360": { card: { "font-size": "14px" } } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(banner(root).className).toContain("banner--pass");
  });

  it("Cmd/Ctrl+Enter in the editor runs the check", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    fakes.state.computed = { card: { "padding-top": "20px", "padding-left": "20px" } };
    await user.click(editorOf(root));
    await user.keyboard("{Control>}{Enter}{/Control}");
    await settle();
    expect(banner(root).className).toContain("banner--pass");
  });

  it("does nothing before a lesson is open", async () => {
    const user = userEvent.setup();
    const { root } = mount();
    await user.click(button(root, "チェック"));
    await settle();
    expect(banner(root).textContent).toBe("");
  });
});

describe("createApp: hints, reset, solution, undo", () => {
  it("reveals hints one at a time and disables the button at the end", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    const [h1, h2] = lessonById(PADDING)!.challenge.hints;
    await user.click(button(root, "ヒント（残り 2）"));
    expect(getByText(root, `💡 ${h1}`)).toBeTruthy();
    await user.click(button(root, "ヒント（残り 1）"));
    expect(getByText(root, `💡 ${h2}`)).toBeTruthy();
    const done = button(root, "ヒントは以上です");
    expect(done.disabled).toBe(true);
    expect(root.querySelectorAll(".hint").length).toBe(2);
  });

  it("shows the solution with an undo notice and undoes it", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    const lesson = lessonById(PADDING)!;
    await app.open(PADDING);
    const ta = editorOf(root);
    ta.value = ".card { color: red }";
    await user.click(button(root, "解答を見る"));
    expect(ta.value).toBe(lesson.challenge.solution);
    expect(fakes.state.css).toBe(lesson.challenge.solution);
    const status = getByText(root, "解答を表示しました。");
    expect(status.closest("[role=status]")).toBeTruthy();
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(false);

    await user.click(button(root, "元に戻す"));
    expect(ta.value).toBe(".card { color: red }");
    expect(fakes.state.css).toBe(".card { color: red }");
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(true);
    expect(document.activeElement).toBe(ta);
    // A second click is inert: nothing more to undo.
    await user.click(button(root, "元に戻す"));
    expect(ta.value).toBe(".card { color: red }");
  });

  it("resets to the starter CSS, clears the banner and drops the saved draft", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    const lesson = lessonById(PADDING)!;
    await app.open(PADDING);
    fakes.state.computed = { card: { "padding-top": "0px", "padding-left": "0px" } };
    await user.click(button(root, "チェック"));
    await settle();
    expect(banner(root).textContent).not.toBe("");

    const ta = editorOf(root);
    await user.click(ta);
    await user.keyboard("/* x */");
    expect(JSON.parse(localStorage.getItem("css-atelier:drafts:v1") ?? "{}")[PADDING]).toBe(ta.value);

    await user.click(button(root, "リセット"));
    expect(ta.value).toBe(lesson.challenge.starterCSS);
    expect(banner(root).textContent).toBe("");
    expect(getByText(root, "最初の状態に戻しました。")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("css-atelier:drafts:v1") ?? "{}")[PADDING]).toBeUndefined();
  });

  it("does not offer undo when the CSS did not change", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    await user.click(button(root, "リセット"));
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(true);
    expect(queryByText(root, "最初の状態に戻しました。")).toBeNull();
  });

  it("hides the undo notice as soon as the learner types again", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    await user.click(button(root, "解答を見る"));
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(false);
    await user.click(editorOf(root));
    await user.keyboard("x");
    expect(root.querySelector(".undo")?.classList.contains("hidden")).toBe(true);
  });

  it("hint / reset / solution buttons are inert before a lesson is open", async () => {
    const user = userEvent.setup();
    const { root } = mount();
    await user.click(button(root, /ヒント/));
    await user.click(button(root, "リセット"));
    await user.click(button(root, "解答を見る"));
    expect(root.querySelectorAll(".hint").length).toBe(0);
    expect(editorOf(root).value).toBe("");
  });
});

describe("createApp: typing, drafts and live preview", () => {
  it("saves a draft on every keystroke and pushes the CSS to the preview after a pause", async () => {
    const user = userEvent.setup();
    const { app, root } = mount();
    await app.open(PADDING);
    const ta = editorOf(root);
    await user.click(ta);
    await user.keyboard("b");
    const expected = `${lessonById(PADDING)!.challenge.starterCSS}b`;
    expect(JSON.parse(localStorage.getItem("css-atelier:drafts:v1") ?? "{}")[PADDING]).toBe(expected);
    expect(fakes.state.css).not.toBe(expected);
    await wait(200);
    await settle();
    expect(fakes.state.css).toBe(expected);
  });
});

describe("createApp: storage failures", () => {
  it("keeps working when storage writes are blocked", async () => {
    const user = userEvent.setup();
    const blocked = (): never => {
      throw new Error("blocked");
    };
    const spies = [
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked),
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked),
    ];
    try {
      const { app, root, callbacks } = mount();
      await app.open(PADDING);
      await user.click(editorOf(root));
      await user.keyboard("x");
      fakes.state.computed = { card: { "padding-top": "20px", "padding-left": "20px" } };
      await user.click(button(root, "チェック"));
      await settle();
      expect(banner(root).className).toContain("banner--pass");
      expect(callbacks.onComplete).toHaveBeenCalledWith(PADDING);
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});

describe("createApp: navigation", () => {
  it("Next opens the following lesson, or goes back to the catalogue at the end", async () => {
    const user = userEvent.setup();
    const { app, root, callbacks } = mount();
    await app.open(PADDING);
    await user.click(button(root, "次のレッスン →"));
    expect(callbacks.onOpen).toHaveBeenCalledWith(nextLesson(PADDING)!.id);
    await app.open(LAST);
    await user.click(button(root, "レッスン一覧へ"));
    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
  });

  it("Next before any lesson is open falls back to the catalogue", async () => {
    const user = userEvent.setup();
    const { root, callbacks } = mount();
    await user.click(button(root, "次のレッスン →"));
    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
  });

  it("keeps the destructive actions apart from the check button", async () => {
    const { root } = mount();
    const main = root.querySelector(".actions__main") as HTMLElement;
    const sub = root.querySelector(".actions__sub") as HTMLElement;
    expect(within(main).getByRole("button", { name: "チェック" })).toBeTruthy();
    expect(within(sub).getByRole("button", { name: "リセット" })).toBeTruthy();
    expect(within(sub).getByRole("button", { name: "解答を見る" })).toBeTruthy();
    expect(button(root, "チェック").getAttribute("aria-keyshortcuts")).toBe(
      "Meta+Enter Control+Enter",
    );
  });

  it("dispose tears down the visualizer and the sandbox", async () => {
    const { app } = mount();
    await app.open(PADDING);
    app.dispose();
    expect(fakes.state.viz.disposed).toBe(1);
    expect(fakes.state.destroyed).toBe(1);
  });

  it("dispose without a visualizer only destroys the sandbox", () => {
    const { app } = mount();
    app.dispose();
    expect(fakes.state.viz.disposed).toBe(0);
    expect(fakes.state.destroyed).toBe(1);
  });
});
