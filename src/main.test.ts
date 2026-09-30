/** @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { findByRole, getByRole, getByText, queryByText, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { LESSONS, TRACKS } from "./engine/content/index.js";
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
}));

vi.mock("./app.js", () => ({
  createApp: (cb: AppCallbacks) => {
    fakes.created++;
    fakes.callbacks = cb;
    const root = document.createElement("div");
    root.className = "lesson";
    root.textContent = "lesson runtime";
    fakes.root = root;
    return {
      root,
      open: async (id: string) => {
        fakes.opened.push(id);
      },
      dispose: () => void 0,
    };
  },
}));

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
