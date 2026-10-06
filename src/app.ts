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
import { isComplete, markComplete, type ProgressStore } from "./engine/progress.js";
import { loadDraft, saveDraft } from "./engine/drafts.js";
import { createRevision } from "./engine/revision.js";
import { conceptLabel, hintButtonLabel, viewportLabel } from "./engine/navigation.js";
// Three.js lives in viz/index.js — imported dynamically only for 3D lessons so
// the (majority of) lessons without a 3D concept never pull the Three chunk.
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
  const heading = el("div", { class: "lesson__heading" });
  const title = el("h1");
  // The lesson shows its own completion state, so a revisit does not depend on
  // remembering the catalogue (SHIG 25, 12).
  const doneTag = el("span", { class: "lesson__done hidden", text: "完了済み" });
  heading.append(title, doneTag);
  const explain = el("div", { class: "explain" });
  const task = el("div", { class: "task" });
  const mdn = el("a", { class: "mdn-link", attrs: { target: "_blank", rel: "noopener" } });
  const editor: Editor = createEditor("CSS エディタ");

  const btn = (cls: string, text: string): HTMLButtonElement =>
    el("button", { class: cls, text, attrs: { type: "button" } });
  const checkBtn = btn("btn btn--primary", "チェック");
  checkBtn.setAttribute("aria-keyshortcuts", "Meta+Enter Control+Enter");
  const nextBtn = btn("btn", "次のレッスン →");
  const hintBtn = btn("btn btn--ghost", "ヒント");
  const resetBtn = btn("btn btn--ghost", "リセット");
  const solBtn = btn("btn btn--ghost", "解答を見る");
  // Main actions first; the ones that overwrite the learner's CSS sit in a
  // separate group away from "check" (SHIG 16, 13).
  const actions = el("div", { class: "actions" });
  const mainActions = el("div", { class: "actions__main" });
  mainActions.append(checkBtn, nextBtn);
  const subActions = el("div", { class: "actions__sub" });
  subActions.append(hintBtn, resetBtn, solBtn);
  actions.append(mainActions, subActions);

  // Undo notice for reset / show-solution (SHIG 57, 54: act, then allow undo).
  // The live region stays in the DOM; only the inner box is shown/hidden, so
  // screen readers reliably announce the message when it appears.
  const undoNote = el("div", { attrs: { role: "status" } });
  const undoBox = el("div", { class: "undo hidden" });
  const undoText = el("span");
  const undoBtn = btn("undo__btn", "元に戻す");
  undoBox.append(undoText, undoBtn);
  undoNote.append(undoBox);

  const banner = el("div", { class: "banner", attrs: { role: "status", "aria-live": "polite" } });
  const hints = el("div", { class: "hints" });
  doc.append(heading, explain, task, mdn, editor.root, actions, undoNote, banner, hints);

  // ---- right: 3D stage + live preview ----
  const stage = el("div", { class: "viz__stage" });
  const canvas = el("canvas", { attrs: { id: "scene", "aria-hidden": "true" } });
  const badge = el("div", { class: "viz__badge" });
  stage.append(canvas, badge);

  const preview = el("div", { class: "preview" });
  const previewHead = el("div", { class: "preview__head", text: "プレビュー" });
  const vpLabel = el("span", { class: "preview__viewport" });
  previewHead.append(vpLabel);
  // The frame scrolls when a lesson viewport is wider than the column, so it
  // must be reachable by keyboard (WCAG 2.1.1).
  const frame = el("div", {
    class: "preview__frame",
    attrs: { tabindex: "0", role: "group", "aria-label": "プレビューの表示領域" },
  });
  const iframe = el("iframe", {
    attrs: { sandbox: "allow-same-origin", title: "プレビュー", "aria-label": "プレビュー" },
  });
  frame.append(iframe);
  preview.append(previewHead, frame);

  const viz = el("div", { class: "viz" });
  viz.append(stage, preview);
  root.append(doc, viz);

  const sandbox: Sandbox = createSandbox(iframe);
  let visualizer: Visualizer | null = null;
  let current: Lesson | null = null;
  let hintsShown = 0;
  let undoCSS: string | null = null;
  let checking = false;
  // Bumped on every CSS change and lesson switch, so a check that finishes
  // afterwards is dropped instead of reporting on code that is gone (SHIG 25).
  const revision = createRevision();

  /** Bring freshly added feedback into view without yanking the page (SHIG 65, 66). */
  function reveal(node: HTMLElement): void {
    node.scrollIntoView({
      block: "nearest",
      behavior: callbacks.reducedMotion ? "instant" : "smooth",
    });
  }

  /**
   * The CSS changed, so the last result no longer describes it: drop the
   * banner and make "check" the one primary action again (SHIG 25, 15, 74).
   */
  function markDirty(): void {
    revision.bump();
    clearBanner();
    checkBtn.classList.add("btn--primary");
    nextBtn.classList.remove("btn--primary");
  }

  function hideUndo(): void {
    undoCSS = null;
    undoBox.classList.add("hidden");
    undoText.textContent = "";
  }

  /** Replace the editor contents, keeping the previous CSS for one undo. */
  function replaceCSS(css: string, message: string): void {
    if (!current) return;
    const previous = editor.getValue();
    applyCSS(css);
    markDirty();
    if (previous === css) {
      hideUndo();
      return;
    }
    undoCSS = previous;
    undoBox.classList.remove("hidden");
    undoText.textContent = message;
  }

  function applyCSS(css: string): void {
    if (!current) return;
    editor.setValue(css);
    sandbox.setUserCSS(css);
    saveDraft(store, current.id, css, current.challenge.starterCSS);
    requestAnimationFrame(refreshViz);
  }

  function updateHintBtn(): void {
    const total = current?.challenge.hints.length ?? 0;
    hintBtn.textContent = hintButtonLabel(hintsShown, total);
    hintBtn.disabled = hintsShown >= total;
  }

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
    // A check spans several frames and toggles the preview width; a second
    // run in the middle would race the first over the viewport (SHIG 15).
    if (!current || checking) return;
    checking = true;
    try {
      await runCheck(current);
    } finally {
      checking = false;
    }
  }

  async function runCheck(lesson: Lesson): Promise<void> {
    const { challenge } = lesson;
    const fresh = revision.ticket();
    // After a lesson switch the iframe belongs to the new lesson: stop without
    // touching its viewport or visualizer.
    const switched = (): boolean => current !== lesson;
    sandbox.setUserCSS(editor.getValue());

    // Main state (at the lesson's viewport).
    sandbox.setViewport(challenge.viewport ?? null);
    await nextFrame();
    if (switched()) return;
    const mainSnap = sandbox.snapshot(challenge.snapshot);
    const failures = [...evaluate(challenge.validators, mainSnap).failures];
    visualizer?.update(snapshotToSignals(mainSnap, lesson.viz));

    // Extra states (other viewports) — e.g. proving a query is conditional.
    for (const state of challenge.states ?? []) {
      sandbox.setViewport(state.viewport);
      await nextFrame();
      if (switched()) return;
      const snap = sandbox.snapshot(challenge.snapshot);
      failures.push(...evaluate(state.validators, snap).failures);
    }
    if (challenge.states?.length) {
      sandbox.setViewport(challenge.viewport ?? null); // restore the preview
      await nextFrame();
    }
    // The CSS was edited while the check ran: this result is already stale.
    if (!fresh()) return;

    const passed = failures.length === 0;
    showBanner(passed, failures);
    reveal(banner);
    if (passed) {
      markComplete(store, lesson.id);
      callbacks.onComplete(lesson.id);
      doneTag.classList.remove("hidden");
      // One next step: "next lesson" takes over as the single primary (SHIG 47, 74, 41).
      nextBtn.classList.add("btn--primary");
      checkBtn.classList.remove("btn--primary");
    }
  }

  function revealHint(): void {
    if (!current) return;
    if (hintsShown < current.challenge.hints.length) {
      const hint = el("div", { class: "hint", text: `💡 ${current.challenge.hints[hintsShown]}` });
      hints.append(hint);
      hintsShown++;
      reveal(hint);
    }
    updateHintBtn();
  }

  editor.onInput((css) => {
    hideUndo();
    markDirty();
    // Save right away (not debounced) so a reload or navigation within the
    // debounce window cannot drop the last keystrokes.
    if (current) saveDraft(store, current.id, css, current.challenge.starterCSS);
    liveUpdate();
  });
  editor.onSubmit(() => void check());
  checkBtn.addEventListener("click", () => void check());
  resetBtn.addEventListener("click", () => {
    if (!current) return;
    replaceCSS(current.challenge.starterCSS, "最初の状態に戻しました。");
  });
  hintBtn.addEventListener("click", revealHint);
  solBtn.addEventListener("click", () => {
    if (!current) return;
    replaceCSS(current.challenge.solution, "解答を表示しました。");
  });
  undoBtn.addEventListener("click", () => {
    if (undoCSS === null) return;
    applyCSS(undoCSS);
    markDirty();
    hideUndo();
    editor.focus();
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
    updateHintBtn();
    hideUndo();
    markDirty();
    doneTag.classList.toggle("hidden", !isComplete(store, lesson.id));
    nextBtn.textContent = nextLesson(lesson.id) ? "次のレッスン →" : "レッスン一覧へ";
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

    const css = loadDraft(store, lesson.id) ?? lesson.challenge.starterCSS;
    editor.setValue(css);
    badge.textContent = conceptLabel(lesson.viz.concept);

    // Move focus to the heading so screen-reader users get lesson context.
    title.tabIndex = -1;
    title.focus({ preventScroll: true });

    // Lazily attach the 3D visualizer — Three.js loads only for 3D lessons.
    if (lesson.viz.concept === "none") {
      stage.classList.add("hidden");
      // Tear the previous concept down too; otherwise the hidden canvas keeps
      // animating and re-rendering a stale scene from the last 3D lesson.
      visualizer?.setConcept("none");
    } else {
      stage.classList.remove("hidden");
      if (!visualizer) {
        const { createVisualizer } = await import("./viz/index.js");
        visualizer = createVisualizer(canvas, callbacks.reducedMotion);
      }
      visualizer.setConcept(lesson.viz.concept);
    }

    await sandbox.load(lesson.challenge.starterHTML, css);
    sandbox.setViewport(lesson.challenge.viewport ?? null);
    vpLabel.textContent = viewportLabel(lesson.challenge.viewport);
    requestAnimationFrame(refreshViz);
  }

  function dispose(): void {
    visualizer?.dispose();
    sandbox.destroy();
  }

  return { root, open, dispose };
}
