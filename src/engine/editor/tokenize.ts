// A tiny CSS tokenizer for the editor's syntax-highlight overlay. It is a pure
// function and — crucially — every character of the input ends up in exactly one
// token (the concatenation of token texts equals the input), so the overlay can
// be laid out span-for-span over the textarea. The DOM rendering of these tokens
// is a thin, uncovered presentation shell (src/ui/editor.ts).

export type TokenType =
  | "comment"
  | "atword"
  | "selector"
  | "prop"
  | "value"
  | "number"
  | "punct"
  | "space";

export interface Token {
  readonly type: TokenType;
  readonly text: string;
}

const SPACE = /\s/;
const AT_IDENT = /[A-Za-z-]/;
const STRUCT = new Set(["{", "}", ";", "(", ")", ","]);

function isNumberStart(run: string): boolean {
  return /^-?\.?\d/.test(run);
}

export function tokenize(css: string): Token[] {
  const tokens: Token[] = [];
  const n = css.length;
  let i = 0;
  let depth = 0;
  let mode: "sel" | "prop" | "val" = "sel";

  // After a `}` or `;`, declaration context returns to expecting a property.
  const isPropColon = (): boolean => mode === "prop" && depth > 0;

  while (i < n) {
    const c = css[i];

    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      tokens.push({ type: "comment", text: css.slice(i, stop) });
      i = stop;
      continue;
    }

    if (SPACE.test(c)) {
      let j = i + 1;
      while (j < n && SPACE.test(css[j])) j++;
      tokens.push({ type: "space", text: css.slice(i, j) });
      i = j;
      continue;
    }

    if (c === "@") {
      let j = i + 1;
      while (j < n && AT_IDENT.test(css[j])) j++;
      tokens.push({ type: "atword", text: css.slice(i, j) });
      i = j;
      continue;
    }

    if (c === "{") {
      depth++;
      mode = "prop";
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }
    if (c === "}") {
      depth = Math.max(0, depth - 1);
      mode = depth > 0 ? "prop" : "sel";
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }
    if (c === ";") {
      if (depth > 0) mode = "prop";
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }
    if (c === ":" && isPropColon()) {
      mode = "val";
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }
    if (STRUCT.has(c)) {
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }

    // Word run: stop at whitespace, at-word, comment start, structural punct,
    // or a property colon.
    let j = i;
    while (j < n) {
      const d = css[j];
      if (SPACE.test(d)) break;
      if (d === "@") break;
      if (d === "/" && css[j + 1] === "*") break;
      if (STRUCT.has(d)) break;
      if (d === ":" && isPropColon()) break;
      j++;
    }
    const run = css.slice(i, j);
    const type: TokenType =
      mode === "sel"
        ? "selector"
        : mode === "prop"
          ? "prop"
          : isNumberStart(run)
            ? "number"
            : "value";
    tokens.push({ type, text: run });
    i = j;
  }

  return tokens;
}
