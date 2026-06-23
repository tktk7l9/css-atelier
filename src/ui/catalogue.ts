// The lesson catalogue (light — no Three.js). Renders tracks as cards, each
// listing its lessons with completion marks and a progress bar.

import { TRACKS } from "../engine/content/index.js";
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

  const grid = el("div", { class: "track-grid" });
  for (const track of TRACKS) {
    const ids = track.lessons.map((l) => l.id);
    const prog = completion(completed, ids);

    const card = el("div", { class: "track-card" });
    const head = el("div", { class: "track-card__head" });
    head.append(el("span", { class: "track-card__emoji", text: track.emoji }));
    head.append(el("span", { class: "track-card__title", text: track.title }));
    card.append(head);
    card.append(el("div", { class: "track-card__summary", text: track.summary }));

    const list = el("div", { class: "lesson-list" });
    for (const lesson of track.lessons) {
      const done = completedSet.has(lesson.id);
      const row = el("button", { class: `lesson-row${done ? " is-done" : ""}` });
      row.append(el("span", { class: "lesson-row__mark", text: done ? "✓" : "○" }));
      row.append(el("span", { text: lesson.title }));
      row.addEventListener("click", () => onOpen(lesson.id));
      list.append(row);
    }
    card.append(list);

    const meta = el("div", { class: "track-card__meta" });
    const bar = el("div", { class: "track-card__bar" });
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
