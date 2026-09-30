// A tiny change counter for async work that must not report on stale input.
// Pure (no DOM), so the "is this result still about the current code?" rule
// is unit-tested even though the check itself runs in the browser.

export interface Revision {
  /** Record a change (CSS edited, lesson switched). */
  bump(): void;
  /** Snapshot the current revision; the returned probe is true until the next bump. */
  ticket(): () => boolean;
}

export function createRevision(): Revision {
  let current = 0;
  return {
    bump() {
      current++;
    },
    ticket() {
      const at = current;
      return () => at === current;
    },
  };
}
