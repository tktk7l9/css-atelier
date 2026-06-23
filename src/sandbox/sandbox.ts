// The sandbox is the impure I/O boundary. It renders a challenge in a
// same-origin <iframe srcdoc> and injects the learner's CSS via a CONSTRUCTABLE
// stylesheet (adoptedStyleSheets + replaceSync). Per MDN this is NOT blocked by
// a strict CSP `style-src 'self'` (no 'unsafe-inline' / 'unsafe-eval' needed) —
// so the app keeps its A+ posture while live-applying arbitrary user CSS. The
// iframe gives faithful CSS semantics (body/*/@media/@container against a real
// viewport) and, being same-origin, lets us read computed styles + rects to
// build the pure Snapshot the validators consume.

import { parseCss } from "../engine/validate/css-parse.js";
import type { ElementSnapshot, Snapshot, SnapshotRequest } from "../engine/validate/snapshot.js";

// Trusted reset that makes geometry deterministic across machines. Applied as a
// constructable sheet (an inline <style> in srcdoc would be CSP-blocked).
const BASE_RESET = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font: 16px/1.4 system-ui, -apple-system, "Hiragino Sans", sans-serif; color: #18203a; }
`;

export interface Sandbox {
  /** Seed challenge markup, then apply the starter CSS. Resolves on iframe load. */
  load(html: string, css: string): Promise<void>;
  /** Recompile the user stylesheet (called live as the learner types). */
  setUserCSS(css: string): void;
  /** Read a pure Snapshot for the requested computed properties. */
  snapshot(req: SnapshotRequest): Snapshot;
  /** Resize the iframe (responsive challenges). Pass null to reset to default. */
  setViewport(width: number | null): void;
  destroy(): void;
}

export function createSandbox(iframe: HTMLIFrameElement): Sandbox {
  let userSheet: CSSStyleSheet | null = null;
  let lastCss = "";

  function load(html: string, css: string): Promise<void> {
    lastCss = css;
    return new Promise((resolve) => {
      iframe.addEventListener(
        "load",
        () => {
          const win = iframe.contentWindow as (Window & typeof globalThis) | null;
          const doc = iframe.contentDocument;
          if (!win || !doc) return resolve();
          // The constructable sheet must be created in the iframe's own realm.
          const Sheet = win.CSSStyleSheet;
          const base = new Sheet();
          base.replaceSync(BASE_RESET);
          const user = new Sheet();
          userSheet = user;
          applyCss(css);
          doc.adoptedStyleSheets = [base, user];
          resolve();
        },
        { once: true },
      );
      iframe.srcdoc = `<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    });
  }

  function applyCss(css: string): void {
    if (!userSheet) return;
    try {
      userSheet.replaceSync(css);
    } catch {
      // Invalid CSS (e.g. an @import) — keep the last valid rules.
    }
  }

  function setUserCSS(css: string): void {
    lastCss = css;
    applyCss(css);
  }

  function snapshot(req: SnapshotRequest): Snapshot {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      return { viewport: { w: 0, h: 0 }, elements: [], declarations: parseCss(lastCss), css: lastCss };
    }
    const nodes = Array.from(doc.querySelectorAll<HTMLElement>("[data-id]"));
    const elements: ElementSnapshot[] = nodes.map((node, index) => {
      const r = node.getBoundingClientRect();
      const cs = win.getComputedStyle(node);
      const computed: Record<string, string> = {};
      for (const p of req.props) computed[p] = cs.getPropertyValue(p).trim();
      let parentId: string | null = null;
      for (let anc = node.parentElement; anc; anc = anc.parentElement) {
        if (anc.dataset.id) {
          parentId = anc.dataset.id;
          break;
        }
      }
      return {
        id: node.dataset.id ?? "",
        tag: node.tagName.toLowerCase(),
        rect: { x: r.left, y: r.top, w: r.width, h: r.height },
        computed,
        parentId,
        order: index,
      };
    });
    return {
      viewport: { w: win.innerWidth, h: win.innerHeight },
      elements,
      declarations: parseCss(lastCss),
      css: lastCss,
    };
  }

  function setViewport(width: number | null): void {
    iframe.style.width = width == null ? "" : `${width}px`;
  }

  function destroy(): void {
    iframe.srcdoc = "";
    userSheet = null;
  }

  return { load, setUserCSS, snapshot, setViewport, destroy };
}
