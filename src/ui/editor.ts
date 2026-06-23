// A dependency-free CSS editor: a <textarea> (transparent text, visible caret)
// over a <pre> highlight overlay. The pure tokenizer (engine/editor/tokenize)
// drives the overlay; we only ever set className / textContent / scroll — never
// cssText or style attributes — so it stays CSP-strict.

import { tokenize, type TokenType } from "../engine/editor/tokenize.js";
import { el } from "./dom.js";

const CLASS: Record<TokenType, string> = {
  comment: "tok-comment",
  atword: "tok-atrule",
  selector: "tok-sel",
  prop: "tok-prop",
  value: "tok-val",
  number: "tok-num",
  punct: "tok-punc",
  space: "",
};

export interface Editor {
  readonly root: HTMLElement;
  getValue(): string;
  setValue(v: string): void;
  onInput(cb: (v: string) => void): void;
  /** Fired on Cmd/Ctrl+Enter (a "submit/check" shortcut). */
  onSubmit(cb: () => void): void;
  focus(): void;
}

export function createEditor(label = "CSS"): Editor {
  const root = el("div", { class: "editor-wrap" });
  root.append(el("div", { class: "editor-label", text: label }));

  const stack = el("div", { class: "editor-stack" });
  const pre = el("pre", { attrs: { "aria-hidden": "true" } });
  const textarea = el("textarea", {
    attrs: {
      spellcheck: "false",
      autocapitalize: "off",
      autocomplete: "off",
      autocorrect: "off",
      "aria-label": `${label} エディタ`,
    },
  });
  stack.append(pre, textarea);
  root.append(stack);

  let listener: ((v: string) => void) | null = null;
  let submitListener: (() => void) | null = null;

  function highlight(css: string): void {
    pre.textContent = "";
    for (const tok of tokenize(css)) {
      if (tok.type === "space") {
        pre.append(document.createTextNode(tok.text));
      } else {
        pre.append(el("span", { class: CLASS[tok.type], text: tok.text }));
      }
    }
  }

  function render(): void {
    highlight(textarea.value);
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener("input", () => {
    render();
    listener?.(textarea.value);
  });
  textarea.addEventListener("scroll", () => {
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  });

  textarea.addEventListener("keydown", (e) => {
    // Cmd/Ctrl+Enter = check.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitListener?.();
      return;
    }
    // Escape releases the editor so keyboard users aren't trapped by Tab-indent.
    if (e.key === "Escape") {
      textarea.blur();
      return;
    }
    // Tab inserts/removes two-space indentation instead of moving focus.
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const v = textarea.value;
      const lineStart = v.lastIndexOf("\n", start - 1) + 1;
      if (e.shiftKey) {
        const lead = v.slice(lineStart).match(/^ {1,2}/);
        if (lead) {
          const n = lead[0].length;
          textarea.value = v.slice(0, lineStart) + v.slice(lineStart + n);
          textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - n);
        }
      } else {
        textarea.value = v.slice(0, start) + "  " + v.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
      render();
      listener?.(textarea.value);
    }
  });

  return {
    root,
    getValue: () => textarea.value,
    setValue(v) {
      textarea.value = v;
      render();
    },
    onInput(cb) {
      listener = cb;
    },
    onSubmit(cb) {
      submitListener = cb;
    },
    focus: () => textarea.focus(),
  };
}
