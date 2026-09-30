import { describe, expect, it } from "vitest";
import { createRevision } from "./revision.js";

describe("createRevision", () => {
  it("keeps a ticket fresh while nothing changes", () => {
    const rev = createRevision();
    const fresh = rev.ticket();
    expect(fresh()).toBe(true);
    expect(fresh()).toBe(true);
  });
  it("makes earlier tickets stale after a bump", () => {
    const rev = createRevision();
    const before = rev.ticket();
    rev.bump();
    expect(before()).toBe(false);
    expect(rev.ticket()()).toBe(true);
  });
  it("does not revive a stale ticket on later bumps", () => {
    const rev = createRevision();
    const before = rev.ticket();
    rev.bump();
    rev.bump();
    expect(before()).toBe(false);
  });
  it("keeps separate instances independent", () => {
    const a = createRevision();
    const b = createRevision();
    const ticket = a.ticket();
    b.bump();
    expect(ticket()).toBe(true);
  });
});
