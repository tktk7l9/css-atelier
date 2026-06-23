// Heavy lesson runtime (lazy-loaded by main.ts). Builds the lesson view once and
// reuses it across lessons via open(id). Wires the editor → sandbox (live CSS) →
// snapshot → validation, and (from the visualizer phase) the 3D concept view.

import { createSandbox, type Sandbox } from "./sandbox/sandbox.js";
import { createEditor, type Editor } from "./ui/editor.js";
import { el } from "./ui/dom.js";
import { evaluate } from "./engine/validate/run.js";
import { snapshotToSignals } from "./engine/viz-map.js";
import { lessonById, nextLesson } from "./engine/content/index.js";
import type { Lesson } from "./engine/content/types.js";
import { markComplete, type ProgressStore } from "./engine/progress.js";
// Three.js lives in viz/index.js — imported dynamically only for 3D lessons so
// the ~22 non-3D lessons never pull the Three chunk.
import type { Visualizer } from "./viz/index.js";

const store: ProgressStore = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage disabled */
    }
  },
};

export interface AppCallbacks {
  onComplete(lessonId: string): void;
  onBack(): void;
  onOpen(lessonId: string): void;
  reducedMotion: boolean;
}

export interface AppController {
  readonly root: HTMLElement;
  open(lessonId: string): Promise<void>;
  dispose(): void;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | undefined;
  return ((...args: never[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function createApp(callbacks: AppCallbacks): AppController {
  const root = el("div", { class: "lesson" });

  // ---- left: doc + editor + actions ----
  const doc = el("div", { class: "panel lesson__doc" });
  const title = el("h2");
  const explain = el("div", { class: "explain" });
  const task = el("div", { class: "task" });
  const mdn = el("a", { class: "mdn-link", attrs: { target: "_blank", rel: "noopener" } });
  const editor: Editor = createEditor("CSS エディタ");

  const checkBtn = el("button", { class: "btn btn--primary", text: "チェック" });
  const resetBtn = el("button", { class: "btn btn--ghost", text: "リセット" });
  const hintBtn = el("button", { class: "btn btn--ghost", text: "ヒント" });
  const solBtn = el("button", { class: "btn btn--ghost", text: "解答を見る" });
  const nextBtn = el("button", { class: "btn", text: "次のレッスン →" });
  const actions = el("div", { class: "actions" });
  actions.append(checkBtn, resetBtn, hintBtn, solBtn, nextBtn);

  const banner = el("div", { class: "banner", attrs: { role: "status", "aria-live": "polite" } });
  const hints = el("div", { class: "hints" });
  doc.append(title, explain, task, mdn, editor.root, actions, banner, hints);

  // ---- right: 3D stage + live preview ----
  const stage = el("div", { class: "viz__stage" });
  const canvas = el("canvas", { attrs: { id: "scene", "aria-hidden": "true" } });
  const badge = el("div", { class: "viz__badge" });
  stage.append(canvas, badge);

  const preview = el("div", { class: "preview" });
  const previewHead = el("div", { class: "preview__head", text: "プレビュー" });
  const vpLabel = el("span", { class: "preview__viewport" });
  previewHead.append(vpLabel);
  const frame = el("div", { class: "preview__frame" });
  const iframe = el("iframe", {
    attrs: { sandbox: "allow-same-origin", title: "プレビュー", "aria-label": "プレビュー" },
  }) as HTMLIFrameElement;
  frame.append(iframe);
  preview.append(previewHead, frame);

  const viz = el("div", { class: "viz" });
  viz.append(stage, preview);
  root.append(doc, viz);

  const sandbox: Sandbox = createSandbox(iframe);
  let visualizer: Visualizer | null = null;
  let current: Lesson | null = null;
  let hintsShown = 0;

  function clearBanner(): void {
    banner.className = "banner";
    banner.textContent = "";
  }

  function showBanner(pass: boolean, failures: readonly string[]): void {
    banner.className = `banner banner--show ${pass ? "banner--pass" : "banner--fail"}`;
    banner.textContent = "";
    if (pass) {
      banner.append(el("div", { text: "✓ クリア！ よくできました。" }));
    } else {
      banner.append(el("div", { text: "もう少し！ 次を確認しましょう:" }));
      const ul = el("ul");
      for (const f of failures) ul.append(el("li", { text: f }));
      banner.append(ul);
    }
  }

  const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

  function refreshViz(): void {
    if (!current) return;
    const snap = sandbox.snapshot(current.challenge.snapshot);
    visualizer?.update(snapshotToSignals(snap, current.viz));
  }

  const liveUpdate = debounce(() => {
    sandbox.setUserCSS(editor.getValue());
    requestAnimationFrame(refreshViz);
  }, 120);

  async function check(): Promise<void> {
    if (!current) return;
    const lesson = current;
    const { challenge } = lesson;
    sandbox.setUserCSS(editor.getValue());

    // Main state (at the lesson's viewport).
    sandbox.setViewport(challenge.viewport ?? null);
    await nextFrame();
    const mainSnap = sandbox.snapshot(challenge.snapshot);
    const failures = [...evaluate(challenge.validators, mainSnap).failures];
    visualizer?.update(snapshotToSignals(mainSnap, lesson.viz));

    // Extra states (other viewports) — e.g. proving a query is conditional.
    for (const state of challenge.states ?? []) {
      sandbox.setViewport(state.viewport);
      await nextFrame();
      const snap = sandbox.snapshot(challenge.snapshot);
      failures.push(...evaluate(state.validators, snap).failures);
    }
    if (challenge.states?.length) {
      sandbox.setViewport(challenge.viewport ?? null); // restore the preview
      await nextFrame();
    }

    const passed = failures.length === 0;
    showBanner(passed, failures);
    if (passed) {
      markComplete(store, lesson.id);
      callbacks.onComplete(lesson.id);
      nextBtn.classList.add("btn--primary");
    }
  }

  function revealHint(): void {
    if (!current) return;
    if (hintsShown < current.challenge.hints.length) {
      hints.append(el("div", { class: "hint", text: `💡 ${current.challenge.hints[hintsShown]}` }));
      hintsShown++;
    }
    if (hintsShown >= current.challenge.hints.length) hintBtn.disabled = true;
  }

  editor.onInput(liveUpdate);
  editor.onSubmit(() => void check());
  checkBtn.addEventListener("click", () => void check());
  resetBtn.addEventListener("click", () => {
    if (current) {
      editor.setValue(current.challenge.starterCSS);
      sandbox.setUserCSS(current.challenge.starterCSS);
      clearBanner();
      requestAnimationFrame(refreshViz);
    }
  });
  hintBtn.addEventListener("click", revealHint);
  solBtn.addEventListener("click", () => {
    if (current) {
      editor.setValue(current.challenge.solution);
      sandbox.setUserCSS(current.challenge.solution);
      requestAnimationFrame(refreshViz);
    }
  });
  nextBtn.addEventListener("click", () => {
    const n = current ? nextLesson(current.id) : undefined;
    if (n) callbacks.onOpen(n.id);
    else callbacks.onBack();
  });

  async function open(lessonId: string): Promise<void> {
    const lesson = lessonById(lessonId);
    if (!lesson) return;
    current = lesson;
    hintsShown = 0;
    hintBtn.disabled = false;
    nextBtn.classList.remove("btn--primary");
    clearBanner();
    hints.textContent = "";

    title.textContent = lesson.title;
    explain.innerHTML = lesson.explanation; // trusted, authored content
    task.innerHTML = `<span class="task__label">課題</span>${lesson.challenge.task}`;
    if (lesson.mdnPath) {
      mdn.textContent = "MDN でもっと学ぶ →";
      mdn.setAttribute("href", `https://developer.mozilla.org${lesson.mdnPath}`);
      mdn.classList.remove("hidden");
    } else {
      mdn.classList.add("hidden");
    }

    editor.setValue(lesson.challenge.starterCSS);
    badge.textContent =
      lesson.viz.concept === "none" ? "プレビュー" : `3D: ${lesson.viz.concept}`;

    // Move focus to the heading so screen-reader users get lesson context.
    title.tabIndex = -1;
    title.focus({ preventScroll: true });

    // Lazily attach the 3D visualizer — Three.js loads only for 3D lessons.
    if (lesson.viz.concept === "none") {
      stage.classList.add("hidden");
    } else {
      stage.classList.remove("hidden");
      if (!visualizer) {
        const { createVisualizer } = await import("./viz/index.js");
        visualizer = createVisualizer(canvas, callbacks.reducedMotion);
      }
      visualizer.setConcept(lesson.viz.concept);
    }

    await sandbox.load(lesson.challenge.starterHTML, lesson.challenge.starterCSS);
    sandbox.setViewport(lesson.challenge.viewport ?? null);
    vpLabel.textContent = lesson.challenge.viewport ? `${lesson.challenge.viewport}px` : "auto";
    requestAnimationFrame(refreshViz);
  }

  function dispose(): void {
    visualizer?.dispose();
    sandbox.destroy();
  }

  return { root, open, dispose };
}
