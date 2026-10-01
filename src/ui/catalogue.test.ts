/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllByRole, getByRole, getByText, queryByRole } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { LESSONS, TRACKS } from "../engine/content/index.js";
import type { ProgressStore } from "../engine/progress.js";
import { renderCatalogue } from "./catalogue.js";

const KEY = "css-atelier:progress:v1";

function memStore(completed?: readonly string[] | string): ProgressStore {
  const map = new Map<string, string>();
  if (typeof completed === "string") map.set(KEY, completed);
  else if (completed) map.set(KEY, JSON.stringify(completed));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

function mount(store: ProgressStore): { root: HTMLElement; onOpen: ReturnType<typeof vi.fn> } {
  const onOpen = vi.fn();
  const root = renderCatalogue(store, onOpen);
  document.body.append(root);
  return { root, onOpen };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("renderCatalogue", () => {
  it("shows the title, the intro and one card per track", () => {
    const { root } = mount(memStore());
    expect(getByRole(root, "heading", { level: 1 }).textContent).toBe("CSS Atelier");
    expect(getByText(root, /解説を読み、エディタに CSS を書いて/)).toBeTruthy();
    expect(root.querySelectorAll(".track-card").length).toBe(TRACKS.length);
    // Track names sit one level under the page title (heading order, SHIG 59).
    expect(getAllByRole(root, "heading", { level: 2 }).map((h) => h.textContent)).toEqual(
      TRACKS.map((t) => t.title),
    );
    for (const track of TRACKS) {
      expect(getByText(root, track.title)).toBeTruthy();
      expect(getByText(root, track.summary)).toBeTruthy();
    }
  });

  it("offers the first lesson to a new learner", async () => {
    const user = userEvent.setup();
    const { root, onOpen } = mount(memStore());
    expect(getByText(root, `0 / ${LESSONS.length} レッスン完了`)).toBeTruthy();
    expect(getByText(root, `次は「${TRACKS[0].title} › ${LESSONS[0].title}」`)).toBeTruthy();
    await user.click(getByRole(root, "button", { name: "最初のレッスンを始める" }));
    expect(onOpen).toHaveBeenCalledWith(LESSONS[0].id);
  });

  it("resumes at the first unfinished lesson once some are done", async () => {
    const user = userEvent.setup();
    const done = [LESSONS[0].id, LESSONS[1].id];
    const { root, onOpen } = mount(memStore(done));
    expect(getByText(root, `2 / ${LESSONS.length} レッスン完了`)).toBeTruthy();
    await user.click(getByRole(root, "button", { name: "続きから学ぶ" }));
    expect(onOpen).toHaveBeenCalledWith(LESSONS[2].id);
  });

  it("congratulates when everything is complete and hides the resume button", () => {
    const { root } = mount(memStore(LESSONS.map((l) => l.id)));
    expect(getByText(root, "全レッスン完了です。")).toBeTruthy();
    expect(getByText(root, `${LESSONS.length} / ${LESSONS.length} レッスン完了`)).toBeTruthy();
    expect(queryByRole(root, "button", { name: /続きから学ぶ|最初のレッスンを始める/ })).toBeNull();
  });

  it("speaks completion state as words, not only as a mark", () => {
    const first = TRACKS[0].lessons[0];
    const second = TRACKS[0].lessons[1];
    const { root } = mount(memStore([first.id]));
    const doneRow = getByRole(root, "button", { name: `${first.title}（完了）` });
    const todoRow = getByRole(root, "button", { name: `${second.title}（未完了）` });
    expect(doneRow.classList.contains("is-done")).toBe(true);
    expect(todoRow.classList.contains("is-done")).toBe(false);
    expect(doneRow.querySelector(".lesson-row__mark")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("opens a lesson when its row is clicked", async () => {
    const user = userEvent.setup();
    const target = TRACKS[1].lessons[0];
    const { root, onOpen } = mount(memStore());
    await user.click(getByRole(root, "button", { name: `${target.title}（未完了）` }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(target.id);
  });

  it("exposes per-track progress as an accessible progressbar", () => {
    const track = TRACKS[0];
    const { root } = mount(memStore([track.lessons[0].id]));
    const bars = getAllByRole(root, "progressbar");
    expect(bars.length).toBe(TRACKS.length);
    const bar = getByRole(root, "progressbar", { name: `${track.title}の進捗` });
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe(String(track.lessons.length));
    expect(bar.getAttribute("aria-valuetext")).toBe(`${track.lessons.length}レッスン中1完了`);
    const fill = bar.querySelector("i") as HTMLElement;
    expect(fill.style.width).toBe(`${Math.round((1 / track.lessons.length) * 100)}%`);
    expect(getByText(root, `1/${track.lessons.length}`)).toBeTruthy();
  });

  it("tolerates corrupt progress data", () => {
    const { root } = mount(memStore("{not json"));
    expect(getByText(root, `0 / ${LESSONS.length} レッスン完了`)).toBeTruthy();
  });
});
