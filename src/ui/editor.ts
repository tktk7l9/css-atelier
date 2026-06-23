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
    focus: () => textarea.focus(),
  };
}
