// A deliberately small CSS parser: it turns CSS text into a flat list of
// { selector, decls } rules so `declarationEquals` can check "did the learner
// actually write this declaration?" in Node. It is NOT a full CSS parser —
// geometry/computed validators carry most of the load — but it handles:
//   - line/block comments
//   - multiple comma selectors (split into one rule each)
//   - at-rules with rule blocks (@media/@supports/@container/@layer{…}) by
//     descending into them (the condition is ignored — responsive challenges
//     validate geometry per-viewport, not declarations)
//   - statement at-rules (`@import …;`, `@layer a, b;`) which are skipped
// Nested style rules (CSS nesting) are not expanded for declaration extraction;
// those lessons should validate via computed/geometry primitives instead.

import type { ParsedRule } from "./snapshot.js";

export function normalizeSelector(sel: string): string {
  return sel.trim().replace(/\s+/g, " ");
}

export function normalizeProp(prop: string): string {
  return prop.trim().toLowerCase();
}

/** Lowercase + collapse whitespace + drop a trailing `!important` and `;`. */
export function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/;+$/, "")
    .replace(/\s*!important\s*$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Split on top-level commas only (ignores commas inside parentheses). */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseDecls(block: string): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const part of splitTopLevel(block, ";")) {
    const seg = part.trim();
    // Skip empty segments and anything that looks like a nested rule.
    if (!seg || seg.includes("{") || seg.includes("}")) continue;
    const idx = seg.indexOf(":");
    if (idx <= 0) continue;
    // After trim(), seg[0] is non-whitespace and idx > 0, so the property is
    // guaranteed non-empty here.
    const prop = normalizeProp(seg.slice(0, idx));
    const value = normalizeValue(seg.slice(idx + 1));
    decls[prop] = value;
  }
  return decls;
}

interface Block {
  readonly body: string;
  readonly end: number; // index of the matching `}`
}

function readBlock(src: string, openIndex: number): Block {
  let depth = 0;
  for (let i = openIndex; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { body: src.slice(openIndex + 1, i), end: i };
    }
  }
  // Unbalanced — treat the rest as the block body.
  return { body: src.slice(openIndex + 1), end: src.length };
}

function parseRules(src: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  let prelude = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "{") {
      const { body, end } = readBlock(src, i);
      const pre = prelude.trim();
      if (pre.startsWith("@")) {
        // At-rule with a block — descend (ignore the condition).
        rules.push(...parseRules(body));
      } else if (pre) {
        const decls = parseDecls(body);
        for (const sel of splitTopLevel(pre, ",")) {
          const selector = normalizeSelector(sel);
          if (selector) rules.push({ selector, decls });
        }
      }
      prelude = "";
      i = end + 1;
    } else if (ch === ";" && prelude.trim().startsWith("@")) {
      // Statement at-rule (e.g. @import …;) — ignore.
      prelude = "";
      i++;
    } else {
      prelude += ch;
      i++;
    }
  }
  return rules;
}

export function parseCss(css: string): ParsedRule[] {
  return parseRules(stripComments(css));
}
