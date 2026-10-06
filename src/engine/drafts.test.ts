import { describe, expect, it } from "vitest";
import { loadDraft, saveDraft } from "./drafts.js";
import type { ProgressStore } from "./progress.js";

const KEY = "css-atelier:drafts:v1";

function memStore(initial?: string): ProgressStore & { raw(): string | undefined } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(KEY, initial);
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    raw: () => map.get(KEY),
  };
}

describe("drafts", () => {
  it("returns undefined when nothing is stored", () => {
    expect(loadDraft(memStore(), "a")).toBeUndefined();
  });

  it("round-trips a draft per lesson", () => {
    const s = memStore();
    saveDraft(s, "a", "p { color: red }", "p {}");
    saveDraft(s, "b", "li {}", "");
    expect(loadDraft(s, "a")).toBe("p { color: red }");
    expect(loadDraft(s, "b")).toBe("li {}");
  });

  it("drops the draft when it equals the starter CSS", () => {
    const s = memStore();
    saveDraft(s, "a", "edited", "start");
    saveDraft(s, "a", "start", "start");
    expect(loadDraft(s, "a")).toBeUndefined();
    expect(JSON.parse(s.raw() ?? "{}")).toEqual({});
  });

  it("does not write when an unchanged starter has no draft", () => {
    const s = memStore();
    saveDraft(s, "a", "start", "start");
    expect(s.raw()).toBeUndefined();
  });

  it("tolerates corrupt or non-object data", () => {
    expect(loadDraft(memStore("{nope"), "a")).toBeUndefined();
    expect(loadDraft(memStore("[1,2]"), "a")).toBeUndefined();
    expect(loadDraft(memStore("null"), "a")).toBeUndefined();
    expect(loadDraft(memStore(JSON.stringify({ a: 3 })), "a")).toBeUndefined();
  });

  it("overwrites corrupt data on save", () => {
    const s = memStore("{nope");
    saveDraft(s, "a", "x", "");
    expect(loadDraft(s, "a")).toBe("x");
  });
});

describe("drafts with hostile stored JSON", () => {
  it("ignores keys that only exist on Object.prototype", () => {
    const s = memStore("{}");
    expect(loadDraft(s, "constructor")).toBeUndefined();
    expect(loadDraft(s, "toString")).toBeUndefined();
  });

  it("does not let a stored __proto__ key leak into other lessons", () => {
    const s = memStore('{"__proto__":{"a":"p { color: red }"}}');
    expect(loadDraft(s, "a")).toBeUndefined();
    expect(({} as Record<string, unknown>)["a"]).toBeUndefined();
  });
});
