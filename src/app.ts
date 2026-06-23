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
import { createVisualizer, type Visualizer } from "./viz/index.js";

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

  const banner = el("div", { class: "banner" });
  const hints = el("div", { class: "hints" });
  doc.append(title, explain, task, mdn, editor.root, actions, banner, hints);

  // ---- right: 3D stage + live preview ----
  const stage = el("div", { class: "viz__stage" });
  const canvas = el("canvas", { attrs: { id: "scene" } });
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

  function refreshViz(): void {
    if (!current) return;
    const snap = sandbox.snapshot(current.challenge.snapshot);
    visualizer?.update(snapshotToSignals(snap, current.viz));
  }

  const liveUpdate = debounce(() => {
    sandbox.setUserCSS(editor.getValue());
    requestAnimationFrame(refreshViz);
  }, 120);

  function check(): void {
    if (!current) return;
    sandbox.setUserCSS(editor.getValue());
    const lesson = current;
    requestAnimationFrame(() => {
      const snap = sandbox.snapshot(lesson.challenge.snapshot);
      const result = evaluate(lesson.challenge.validators, snap);
      showBanner(result.passed, result.failures);
      visualizer?.update(snapshotToSignals(snap, lesson.viz));
      if (result.passed) {
        markComplete(store, lesson.id);
        callbacks.onComplete(lesson.id);
        nextBtn.classList.add("btn--primary");
      }
    });
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
  checkBtn.addEventListener("click", check);
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

    // Lazily attach the 3D visualizer (skips the WebGL setup for "none" lessons).
    if (lesson.viz.concept === "none") {
      stage.classList.add("hidden");
    } else {
      stage.classList.remove("hidden");
      if (!visualizer) {
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
