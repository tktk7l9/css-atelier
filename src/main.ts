// Light bootstrap. The catalogue + shell ship in the initial bundle; the
// Three.js-heavy lesson runtime (app.ts) is dynamically imported and warmed on
// the first user interaction, and each track's lessons load with the lesson
// that needs them, keeping the cold load light.

import "./styles.css";
import { byId, el } from "./ui/dom.js";
import { renderCatalogue } from "./ui/catalogue.js";
import { lessonById, loadLesson, trackOf } from "./engine/content/index.js";
import type { Lesson } from "./engine/content/types.js";
import { lessonPosition } from "./engine/navigation.js";
import type { ProgressStore } from "./engine/progress.js";
import type { AppController } from "./app.js";

// Cloudflare Web Analytics — production only. The site token is a public
// identifier embedded in every page, not a secret.
if (import.meta.env.PROD) {
  const beacon = document.createElement("script");
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = '{"token": "cd156fbf0fd24da0a12e58fdb4e63828"}';
  document.head.appendChild(beacon);
}

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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- shell ----
const appRoot = byId("app");

const topbar = el("header", { class: "topbar" });
const brand = el("button", { class: "brand", attrs: { type: "button" } });
brand.append(el("img", { attrs: { src: "/favicon.svg", alt: "" } }));
brand.append(el("span", { text: "CSS Atelier" }));
brand.append(el("small", { text: "手を動かして学ぶ CSS" }));
const crumb = el("nav", { class: "crumb", attrs: { "aria-label": "現在地" } });
topbar.append(brand, el("div", { class: "topbar-spacer" }), crumb);

const main = el("main");

const foot = el("footer", { class: "foot" });
foot.append(el("span", { text: "CSS Atelier · MDN を片手に手を動かして学ぶ · " }));
const repo = el("a", {
  text: "GitHub",
  attrs: { href: "https://github.com/tktk7l9/css-atelier", target: "_blank", rel: "noopener" },
});
foot.append(repo);

appRoot.append(topbar, main, foot);

// ---- routing ----
let app: AppController | null = null;
let loading: Promise<AppController> | null = null;
// Bumped on every route, so a lesson that finishes loading after the learner
// has moved on does not replace the newer screen.
let routeSeq = 0;

async function ensureApp(): Promise<AppController> {
  if (app) return app;
  if (!loading) {
    const attempt = import("./app.js").then((m) =>
      m.createApp({
        onComplete: () => void 0,
        onBack: () => navigateTo(null),
        onOpen: (id) => navigateTo(id),
        reducedMotion,
      }),
    );
    // A failed load must not stick: the next attempt imports again.
    attempt.catch(() => {
      loading = null;
    });
    loading = attempt;
  }
  app = await loading;
  return app;
}

// Explicit way back: the installed PWA runs standalone with no browser back
// button (SHIG 59, 60, 82).
const backLink = (): HTMLElement =>
  el("a", { class: "crumb__back", text: "← レッスン一覧", attrs: { href: "#" } });

function showCatalogue(): void {
  crumb.textContent = "";
  main.replaceChildren(renderCatalogue(store, (id) => navigateTo(id)));
}

/**
 * The lesson could not be fetched: offline before it was cached, or a page
 * left open across a deploy. Say so in plain words with the fix (SHIG 55, 11);
 * the way back stays in the breadcrumb (SHIG 60).
 */
function showLoadError(): void {
  crumb.replaceChildren(backLink());
  const box = el("div", { class: "panel load-error", attrs: { role: "alert" } });
  const heading = el("h1", { text: "レッスンを開けませんでした", attrs: { tabindex: "-1" } });
  box.append(
    heading,
    el("p", {
      text: "通信が切れているか、アプリが更新された可能性があります。ページを読み込み直してください。",
    }),
  );
  const reload = el("button", {
    class: "btn btn--primary",
    text: "読み込み直す",
    attrs: { type: "button" },
  });
  reload.addEventListener("click", () => location.reload());
  box.append(reload);
  main.replaceChildren(box);
  // Like a lesson, the new view's heading takes focus (SHIG 94).
  heading.focus({ preventScroll: true });
}

async function showLesson(id: string, seq: number): Promise<void> {
  // The current screen stays until both the runtime and the lesson's track
  // have arrived (they load in parallel), so it never flashes empty.
  let controller: AppController;
  let lesson: Lesson;
  try {
    [controller, lesson] = await Promise.all([ensureApp(), loadLesson(id)]);
  } catch {
    if (seq === routeSeq) showLoadError();
    return;
  }
  if (seq !== routeSeq) return;
  const track = trackOf(id);
  crumb.replaceChildren(backLink());
  const pos = lessonPosition(id);
  if (track && pos) {
    const path = el("span", { class: "crumb__path" });
    path.append(document.createTextNode(`${track.title} › `), el("b", { text: lesson.title }));
    crumb.append(
      path,
      // aria-label is ignored on a plain span, so speak the position as
      // visually hidden text and hide the terse "1/3" from assistive tech.
      el("span", {
        class: "crumb__pos",
        text: `${pos.index}/${pos.total}`,
        attrs: { "aria-hidden": "true" },
      }),
      el("span", {
        class: "sr-only",
        text: `${track.title}の${pos.total}レッスン中${pos.index}番目`,
      }),
    );
  }
  main.replaceChildren(controller.root);
  await controller.open(lesson);
}

/** Drive routing through the URL hash so lessons are deep-linkable. */
function navigateTo(lessonId: string | null): void {
  const next = lessonId ? `#${lessonId}` : "#";
  if (location.hash === next) void route();
  else location.hash = next;
}

async function route(): Promise<void> {
  const seq = ++routeSeq;
  const id = location.hash.replace(/^#/, "");
  if (id && lessonById(id)) await showLesson(id, seq);
  else showCatalogue();
}

brand.addEventListener("click", () => navigateTo(null));
window.addEventListener("hashchange", () => void route());
void route();

// Warm the heavy chunk on first interaction (keeps the cold load light). A
// failure here is reported by the navigation that needs the chunk.
const warm = (): void => void ensureApp().catch(() => undefined);
window.addEventListener("pointerdown", warm, { once: true });
window.addEventListener("keydown", warm, { once: true });

// Service worker for offline use (production only).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
