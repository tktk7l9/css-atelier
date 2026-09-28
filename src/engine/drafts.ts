// Per-lesson CSS drafts, so a learner's work survives navigation and reloads
// (SHIG 38: what the user typed belongs to the user). Same injected-store
// pattern as progress.ts, so this stays pure and 100% testable in Node.

import type { ProgressStore } from "./progress.js";

const KEY = "css-atelier:drafts:v1";

function loadAll(store: ProgressStore): Record<string, string> {
  const raw = store.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

/** The saved draft for a lesson, or undefined when none (or corrupt). */
export function loadDraft(store: ProgressStore, lessonId: string): string | undefined {
  const v = loadAll(store)[lessonId];
  return typeof v === "string" ? v : undefined;
}

/** Save a draft; an unedited starter is not a draft and clears any saved one. */
export function saveDraft(
  store: ProgressStore,
  lessonId: string,
  css: string,
  starterCSS: string,
): void {
  const all = loadAll(store);
  if (css === starterCSS) {
    if (!(lessonId in all)) return;
    delete all[lessonId];
  } else {
    all[lessonId] = css;
  }
  store.setItem(KEY, JSON.stringify(all));
}
