/** @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { findByRole, getByRole, getByText, queryByRole, queryByText, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { LESSONS, TRACKS } from "./engine/content/index.js";
import type { Lesson } from "./engine/content/types.js";
import type { AppCallbacks } from "./app.js";

// The lesson runtime (app.ts) is the heavy, lazily-imported chunk; here it is a
// recording double so the shell's routing, wayfinding and lazy-loading logic can
// be exercised end to end in jsdom.

const fakes = vi.hoisted(() => ({
  createApp: null as null | ((cb: AppCallbacks) => unknown),
  callbacks: null as AppCallbacks | null,
  opened: [] as string[],
  created: 0,
  root: null as HTMLElement | null,
  /** Make the next import of the runtime fail (offline, or a deploy removed it). */
  failRuntime: false,
}));

// Each track's lessons are their own lazily loaded chunk. Loads go through for
// real unless a test holds one (to see what is shown meanwhile) or fails it.
const tracks = vi.hoisted(() => ({
  holds: new Map<string, Promise<void>>(),
  failing: new Set<string>(),
}));

vi.mock("./app.js", () => ({
  createApp: (cb: AppCallbacks) => {
    if (fakes.failRuntime) throw new Error("failed to fetch the runtime");
    fakes.created++;
    fakes.callbacks = cb;
    const root = document.createElement("div");
    root.className = "lesson";
    root.textContent = "lesson runtime";
    fakes.root = root;
    return {
      root,
      open: async (lesson: Lesson) => {
        fakes.opened.push(lesson.id);
      },
      dispose: () => void 0,
    };
  },
}));

vi.mock("./engine/content/index.js", async (importOriginal) => {
  const real = await importOriginal<typeof import("./engine/content/index.js")>();
  return {
    ...real,
    loadLesson: async (id: string) => {
      await tracks.holds.get(id);
      if (tracks.failing.has(id)) throw new Error("failed to fetch the track");
      return real.loadLesson(id);
    },
  };
});

/** Hold the next load of `id` until the returned function is called. */
function hold(id: string): () => void {
  let release = (): void => void 0;
  tracks.holds.set(
    id,
    new Promise<void>((r) => {
      release = r;
    }),
  );
  return () => {
    tracks.holds.delete(id);
    release();
  };
}

const tick = (ms = 30): Promise<void> => new Promise((r) => setTimeout(r, ms));

const devRegister = vi.fn().mockResolvedValue(undefined);

const FIRST = LESSONS[0];
const FIRST_TRACK = TRACKS[0];

const app = (): HTMLElement => document.getElementById("app") as HTMLElement;
const mainEl = (): HTMLElement => app().querySelector("main") as HTMLElement;
const crumb = (): HTMLElement => getByRole(app(), "navigation", { name: "現在地" });

async function atCatalogue(): Promise<void> {
  await findByRole(mainEl(), "heading", { level: 1, name: "CSS Atelier" });
}

async function atLesson(id: string): Promise<void> {
  await waitFor(() => expect(fakes.opened.at(-1)).toBe(id));
}

beforeAll(async () => {
  // jsdom has no matchMedia; report "reduce" so the preference is observable below.
  window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") })) as typeof window.matchMedia;
  // A service worker API exists, so only the PROD guard keeps dev builds from registering.
  Object.defineProperty(navigator, "serviceWorker", { value: { register: devRegister }, configurable: true });
  document.body.innerHTML = '<div id="app"></div>';
  location.hash = "";
  await import("./main.js");
});

beforeEach(() => {
  fakes.opened = [];
  tracks.holds.clear();
  tracks.failing.clear();
});

afterEach(async () => {
  localStorage.clear();
  if (location.hash) {
    location.hash = "";
    await atCatalogue();
  }
});

describe("shell", () => {
  it("boots into the catalogue with brand, breadcrumb slot and footer", async () => {
    await atCatalogue();
    const brand = getByRole(app(), "button", { name: /CSS Atelier/ });
    expect(within(brand).getByText("手を動かして学ぶ CSS")).toBeTruthy();
    expect(crumb().textContent).toBe("");
    const repo = getByRole(app(), "link", { name: "GitHub" });
    expect(repo.getAttribute("href")).toBe("https://github.com/tktk7l9/css-atelier");
    expect(repo.getAttribute("rel")).toBe("noopener");
    expect(fakes.created).toBe(0);
  });

  it("explains a lesson that cannot be fetched, offers a reload and loads again next time", async () => {
    await atCatalogue();
    fakes.failRuntime = true;
    // The warm-up on first interaction fails quietly; the navigation reports it.
    window.dispatchEvent(new Event("pointerdown"));
    location.hash = `#${FIRST.id}`;
    const alert = await findByRole(mainEl(), "alert");
    const heading = within(alert).getByRole("heading", { level: 1, name: "レッスンを開けませんでした" });
    // The new view's heading takes focus, as a lesson's does.
    expect(document.activeElement).toBe(heading);
    expect(within(alert).getByText(/ページを読み込み直してください/)).toBeTruthy();
    // Reloading fetches the current page and its chunks (jsdom cannot navigate).
    expect(within(alert).getByRole("button", { name: "読み込み直す" })).toBeTruthy();
    // The way back stays (SHIG 60) and no lesson was opened.
    expect(within(crumb()).getByRole("link", { name: "← レッスン一覧" })).toBeTruthy();
    expect(fakes.opened).toEqual([]);
    expect(fakes.created).toBe(0);

    // A failed load does not stick: the next visit imports the runtime again.
    fakes.failRuntime = false;
    location.hash = "";
    await atCatalogue();
    location.hash = `#${FIRST.id}`;
    await atLesson(FIRST.id);
    expect(fakes.created).toBe(1);
  });

  it("opens a lesson from the catalogue, deep-links it and shows the way back", async () => {
    const user = userEvent.setup();
    await atCatalogue();
    await user.click(getByRole(mainEl(), "button", { name: `${FIRST.title}（未完了）` }));
    expect(location.hash).toBe(`#${FIRST.id}`);
    await atLesson(FIRST.id);
    expect(fakes.created).toBe(1);
    expect(fakes.callbacks?.reducedMotion).toBe(true);
    expect(mainEl().contains(fakes.root)).toBe(true);
    const nav = crumb();
    expect(within(nav).getByRole("link", { name: "← レッスン一覧" })).toBeTruthy();
    expect(within(nav).getByText(FIRST.title, { selector: "b" })).toBeTruthy();
    expect(nav.querySelector(".crumb__path")?.textContent).toBe(`${FIRST_TRACK.title} › ${FIRST.title}`);
    const pos = nav.querySelector(".crumb__pos") as HTMLElement;
    expect(pos.textContent).toBe(`1/${FIRST_TRACK.lessons.length}`);
    expect(pos.getAttribute("aria-hidden")).toBe("true");
    expect(
      within(nav).getByText(`${FIRST_TRACK.title}の${FIRST_TRACK.lessons.length}レッスン中1番目`),
    ).toBeTruthy();
  });

  it("the breadcrumb back link returns to the catalogue", async () => {
    const user = userEvent.setup();
    location.hash = `#${FIRST.id}`;
    await atLesson(FIRST.id);
    await user.click(within(crumb()).getByRole("link", { name: "← レッスン一覧" }));
    await atCatalogue();
    expect(location.hash).toBe("");
    expect(crumb().textContent).toBe("");
    expect(queryByText(mainEl(), "lesson runtime")).toBeNull();
  });

  it("the brand button returns to the catalogue", async () => {
    const user = userEvent.setup();
    location.hash = `#${LESSONS[1].id}`;
    await atLesson(LESSONS[1].id);
    await user.click(getByRole(app(), "button", { name: /CSS Atelier/ }));
    await atCatalogue();
  });

  it("keeps the current screen until the lesson's track has loaded, so it never flashes empty", async () => {
    await atCatalogue();
    const release = hold(LESSONS[3].id);
    location.hash = `#${LESSONS[3].id}`;
    await tick();
    expect(getByRole(mainEl(), "heading", { level: 1, name: "CSS Atelier" })).toBeTruthy();
    expect(crumb().textContent).toBe("");
    expect(fakes.opened).toEqual([]);
    release();
    await atLesson(LESSONS[3].id);
    expect(mainEl().contains(fakes.root)).toBe(true);
    expect(crumb().querySelector("b")?.textContent).toBe(LESSONS[3].title);
  });

  it("drops a lesson that finishes loading after the learner has moved on", async () => {
    const release = hold(FIRST.id);
    location.hash = `#${FIRST.id}`;
    await tick();
    location.hash = `#${LESSONS[1].id}`;
    await atLesson(LESSONS[1].id);
    release();
    await tick();
    expect(fakes.opened).toEqual([LESSONS[1].id]);
    expect(crumb().querySelector("b")?.textContent).toBe(LESSONS[1].title);
  });

  it("shows the error when a track cannot be fetched, but not after the learner has left", async () => {
    tracks.failing.add(LESSONS[4].id);
    location.hash = `#${LESSONS[4].id}`;
    expect(await findByRole(mainEl(), "alert")).toBeTruthy();
    expect(fakes.opened).toEqual([]);

    location.hash = "";
    await atCatalogue();
    const release = hold(LESSONS[4].id);
    location.hash = `#${LESSONS[4].id}`;
    await tick();
    location.hash = "";
    await atCatalogue();
    release();
    await tick();
    expect(queryByRole(mainEl(), "alert")).toBeNull();
    expect(getByRole(mainEl(), "heading", { level: 1, name: "CSS Atelier" })).toBeTruthy();
  });

  it("an unknown hash falls back to the catalogue", async () => {
    location.hash = "#no-such-lesson";
    await waitFor(() => expect(queryByText(mainEl(), "lesson runtime")).toBeNull());
    await atCatalogue();
    expect(fakes.opened).toEqual([]);
  });

  it("reuses one lesson runtime across lessons and routes its callbacks", async () => {
    location.hash = `#${FIRST.id}`;
    await atLesson(FIRST.id);
    const createdBefore = fakes.created;
    fakes.callbacks?.onOpen(LESSONS[2].id);
    await atLesson(LESSONS[2].id);
    expect(location.hash).toBe(`#${LESSONS[2].id}`);
    expect(fakes.created).toBe(createdBefore);
    expect(crumb().querySelector("b")?.textContent).toBe(LESSONS[2].title);
    fakes.callbacks?.onComplete(LESSONS[2].id); // no-op hook, must not throw
    fakes.callbacks?.onBack();
    await atCatalogue();
  });

  it("re-opens the current lesson when navigating to the hash already shown", async () => {
    location.hash = `#${FIRST.id}`;
    await atLesson(FIRST.id);
    // Drain hashchange events still queued from earlier navigations: route()
    // reads the current hash, so a late event would re-open FIRST by itself and
    // hide a broken same-hash path.
    await new Promise((r) => setTimeout(r, 50));
    fakes.opened = [];
    fakes.callbacks?.onOpen(FIRST.id);
    await waitFor(() => expect(fakes.opened).toEqual([FIRST.id]));
    expect(location.hash).toBe(`#${FIRST.id}`);
  });

  it("shows resume progress from the stored completion", async () => {
    localStorage.setItem("css-atelier:progress:v1", JSON.stringify([FIRST.id]));
    location.hash = `#${FIRST.id}`;
    await atLesson(FIRST.id);
    location.hash = "";
    await atCatalogue();
    expect(getByText(mainEl(), `1 / ${LESSONS.length} レッスン完了`)).toBeTruthy();
  });

  it("still renders when storage is unavailable", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      location.hash = `#${FIRST.id}`;
      await atLesson(FIRST.id);
      location.hash = "";
      await atCatalogue();
      expect(getByText(mainEl(), `0 / ${LESSONS.length} レッスン完了`)).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
  });

  it("development builds load neither the analytics beacon nor the service worker", () => {
    window.dispatchEvent(new Event("load"));
    expect(devRegister).not.toHaveBeenCalled();
    expect(document.head.querySelector('script[src*="cloudflareinsights"]')).toBeNull();
  });
});
