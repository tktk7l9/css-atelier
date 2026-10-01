// The lesson catalogue (light — no Three.js). Renders tracks as cards, each
// listing its lessons with completion marks and a progress bar.

import { LESSONS, TRACKS, trackOf } from "../engine/content/index.js";
import { resumeLesson } from "../engine/navigation.js";
import { completion, loadCompleted, type ProgressStore } from "../engine/progress.js";
import { el } from "./dom.js";

export function renderCatalogue(
  store: ProgressStore,
  onOpen: (lessonId: string) => void,
): HTMLElement {
  const completed = loadCompleted(store);
  const completedSet = new Set(completed);
  const wrap = el("div");

  const intro = el("div", { class: "intro" });
  intro.append(el("h1", { text: "CSS Atelier" }));
  intro.append(
    el("p", {
      text:
        "解説を読み、エディタに CSS を書いてチャレンジをクリアしよう。Flexbox / Grid から :has() や container queries まで、3D の概念図とライブプレビューで学べます。",
    }),
  );
  wrap.append(intro);

  // Resume where the learner left off — the most frequent entry (SHIG 20, 12).
  const all = completion(completed, LESSONS.map((l) => l.id));
  const next = resumeLesson(completed);
  const resume = el("div", { class: "resume" });
  const resumeText = el("div", { class: "resume__text" });
  resumeText.append(
    el("span", { class: "resume__count", text: `${all.done} / ${all.total} レッスン完了` }),
  );
  if (next) {
    resumeText.append(
      el("span", {
        class: "resume__next",
        text: `次は「${trackOf(next.id)?.title ?? ""} › ${next.title}」`,
      }),
    );
    const go = el("button", {
      class: "btn btn--primary resume__go",
      text: all.done === 0 ? "最初のレッスンを始める" : "続きから学ぶ",
      attrs: { type: "button" },
    });
    go.addEventListener("click", () => onOpen(next.id));
    resume.append(resumeText, go);
  } else {
    resumeText.append(el("span", { class: "resume__next", text: "全レッスン完了です。" }));
    resume.append(resumeText);
  }
  wrap.append(resume);

  const grid = el("div", { class: "track-grid" });
  for (const track of TRACKS) {
    const ids = track.lessons.map((l) => l.id);
    const prog = completion(completed, ids);

    const card = el("div", { class: "track-card" });
    const head = el("div", { class: "track-card__head" });
    head.append(el("span", { class: "track-card__emoji", text: track.emoji }));
    head.append(el("h2", { class: "track-card__title", text: track.title }));
    card.append(head);
    card.append(el("div", { class: "track-card__summary", text: track.summary }));

    const list = el("div", { class: "lesson-list" });
    for (const lesson of track.lessons) {
      const done = completedSet.has(lesson.id);
      const row = el("button", {
        class: `lesson-row${done ? " is-done" : ""}`,
        attrs: { type: "button" },
      });
      // The mark is decorative; state is spoken as words (SHIG 70, 96, 94).
      row.append(
        el("span", {
          class: "lesson-row__mark",
          text: done ? "✓" : "",
          attrs: { "aria-hidden": "true" },
        }),
      );
      row.append(el("span", { text: lesson.title }));
      row.append(el("span", { class: "sr-only", text: done ? "（完了）" : "（未完了）" }));
      row.addEventListener("click", () => onOpen(lesson.id));
      list.append(row);
    }
    card.append(list);

    const meta = el("div", { class: "track-card__meta" });
    const bar = el("div", {
      class: "track-card__bar",
      attrs: {
        role: "progressbar",
        "aria-label": `${track.title}の進捗`,
        "aria-valuemin": "0",
        "aria-valuemax": String(prog.total),
        "aria-valuenow": String(prog.done),
        "aria-valuetext": `${prog.total}レッスン中${prog.done}完了`,
      },
    });
    const fillEl = el("i");
    fillEl.style.width = `${Math.round(prog.ratio * 100)}%`;
    bar.append(fillEl);
    meta.append(bar);
    meta.append(el("span", { text: `${prog.done}/${prog.total}` }));
    card.append(meta);

    grid.append(card);
  }
  wrap.append(grid);
  return wrap;
}
