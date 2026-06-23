import { beforeEach, describe, expect, it } from "vitest";
import {
  completion,
  isComplete,
  loadCompleted,
  markComplete,
  type ProgressStore,
} from "./progress.js";

function memStore(initial?: string): ProgressStore {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set("css-atelier:progress:v1", initial);
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("loadCompleted", () => {
  it("returns [] when nothing is stored", () => {
    expect(loadCompleted(memStore())).toEqual([]);
  });
  it("returns the stored array, filtering non-strings", () => {
    expect(loadCompleted(memStore(JSON.stringify(["a", 1, "b"])))).toEqual(["a", "b"]);
  });
  it("returns [] for non-array JSON", () => {
    expect(loadCompleted(memStore(JSON.stringify({ a: 1 })))).toEqual([]);
  });
  it("returns [] for corrupt JSON", () => {
    expect(loadCompleted(memStore("{not json"))).toEqual([]);
  });
});

describe("markComplete / isComplete", () => {
  let store: ProgressStore;
  beforeEach(() => {
    store = memStore();
  });
  it("marks a lesson and is idempotent", () => {
    expect(markComplete(store, "l1")).toEqual(["l1"]);
    expect(markComplete(store, "l1")).toEqual(["l1"]);
    expect(markComplete(store, "l2")).toEqual(["l1", "l2"]);
  });
  it("reports completion state", () => {
    expect(isComplete(store, "l1")).toBe(false);
    markComplete(store, "l1");
    expect(isComplete(store, "l1")).toBe(true);
  });
});

describe("completion", () => {
  it("counts how many lessons are done", () => {
    expect(completion(["a", "c"], ["a", "b", "c"])).toEqual({ done: 2, total: 3, ratio: 2 / 3 });
  });
  it("is 0 when there are no lessons", () => {
    expect(completion(["a"], [])).toEqual({ done: 0, total: 0, ratio: 0 });
  });
});
