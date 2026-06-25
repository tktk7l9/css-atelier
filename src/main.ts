// Light bootstrap. The catalogue + shell ship in the initial bundle; the
// Three.js-heavy lesson runtime (app.ts) is dynamically imported and warmed on
// the first user interaction, keeping the cold load light.

import "./styles.css";
import { byId, el } from "./ui/dom.js";
import { renderCatalogue } from "./ui/catalogue.js";
import { lessonById, trackOf } from "./engine/content/index.js";
import type { ProgressStore } from "./engine/progress.js";
import type { AppController } from "./app.js";

// Vercel Web Analytics — production only. Script + beacon are same-origin
// (/_vercel/insights/*), so the strict CSP (script-src/connect-src 'self') is unaffected.
if (import.meta.env.PROD) {
  void import("@vercel/analytics").then(({ inject }) => inject());
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
const crumb = el("div", { class: "crumb" });
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

async function ensureApp(): Promise<AppController> {
  if (app) return app;
  if (!loading) {
    loading = import("./app.js").then((m) =>
      m.createApp({
        onComplete: () => void 0,
        onBack: () => navigateTo(null),
        onOpen: (id) => navigateTo(id),
        reducedMotion,
      }),
    );
  }
  app = await loading;
  return app;
}

function showCatalogue(): void {
  crumb.textContent = "";
  main.replaceChildren(renderCatalogue(store, (id) => navigateTo(id)));
}

async function showLesson(id: string): Promise<void> {
  const controller = await ensureApp();
  const lesson = lessonById(id);
  const track = trackOf(id);
  crumb.textContent = "";
  if (track && lesson) {
    crumb.append(
      document.createTextNode(`${track.title} › `),
      el("b", { text: lesson.title }),
    );
  }
  main.replaceChildren(controller.root);
  await controller.open(id);
}

/** Drive routing through the URL hash so lessons are deep-linkable. */
function navigateTo(lessonId: string | null): void {
  const next = lessonId ? `#${lessonId}` : "#";
  if (location.hash === next) void route();
  else location.hash = next;
}

async function route(): Promise<void> {
  const id = location.hash.replace(/^#/, "");
  if (id && lessonById(id)) await showLesson(id);
  else showCatalogue();
}

brand.addEventListener("click", () => navigateTo(null));
window.addEventListener("hashchange", () => void route());
void route();

// Warm the heavy chunk on first interaction (keeps the cold load light).
const warm = (): void => void ensureApp();
window.addEventListener("pointerdown", warm, { once: true });
window.addEventListener("keydown", warm, { once: true });

// Service worker for offline use (production only).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
