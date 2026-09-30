/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getByLabelText, getByText, queryByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { createEditor, type Editor } from "./editor.js";

function mount(label?: string): { editor: Editor; textarea: HTMLTextAreaElement; pre: HTMLPreElement } {
  const editor = createEditor(label);
  document.body.append(editor.root);
  const textarea = editor.root.querySelector("textarea") as HTMLTextAreaElement;
  const pre = editor.root.querySelector("pre") as HTMLPreElement;
  return { editor, textarea, pre };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createEditor", () => {
  it("renders the label, the shortcut hint and a labelled textarea", () => {
    const { editor, textarea } = mount("CSS エディタ");
    expect(getByText(editor.root, "CSS エディタ")).toBeTruthy();
    expect(getByText(editor.root, "⌘/Ctrl + Enter でチェック")).toBeTruthy();
    expect(getByLabelText(editor.root, "CSS エディタ")).toBe(textarea);
    expect(textarea.getAttribute("spellcheck")).toBe("false");
  });

  it("defaults the label to CSS", () => {
    const { editor } = mount();
    expect(getByLabelText(editor.root, "CSS")).toBeTruthy();
  });

  it("round-trips the value and paints the highlight overlay", () => {
    const { editor, pre } = mount();
    editor.setValue(".card {\n  padding: 20px;\n}\n");
    expect(editor.getValue()).toBe(".card {\n  padding: 20px;\n}\n");
    expect(pre.textContent).toBe(".card {\n  padding: 20px;\n}\n");
    expect(pre.querySelector(".tok-sel")?.textContent).toBe(".card");
    expect(pre.querySelector(".tok-prop")?.textContent).toBe("padding");
    expect(pre.querySelector(".tok-num")?.textContent).toBe("20px");
    // Whitespace is plain text nodes, never a class-less span.
    expect(pre.querySelectorAll("span[class='']").length).toBe(0);
  });

  it("reports typed input and keeps the overlay in sync", async () => {
    const user = userEvent.setup();
    const { editor, textarea, pre } = mount();
    const seen: string[] = [];
    editor.onInput((v) => seen.push(v));
    await user.click(textarea);
    await user.keyboard("p {{}");
    expect(seen.at(-1)).toBe("p {}");
    expect(textarea.value).toBe("p {}");
    expect(pre.textContent).toBe("p {}");
  });

  it("fires submit on Meta+Enter and Control+Enter without inserting a newline", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    const submit = vi.fn();
    editor.onSubmit(submit);
    editor.setValue("a {}");
    await user.click(textarea);
    await user.keyboard("{Meta>}{Enter}{/Meta}");
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(submit).toHaveBeenCalledTimes(2);
    expect(textarea.value).toBe("a {}");
  });

  it("plain Enter inserts a newline and does not submit", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    const submit = vi.fn();
    editor.onSubmit(submit);
    await user.click(textarea);
    await user.keyboard("a{Enter}b");
    expect(submit).not.toHaveBeenCalled();
    expect(textarea.value).toBe("a\nb");
  });

  it("Tab inserts two spaces at the caret instead of moving focus", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    const seen: string[] = [];
    editor.onInput((v) => seen.push(v));
    editor.setValue("ab");
    await user.click(textarea);
    textarea.setSelectionRange(1, 1);
    await user.keyboard("{Tab}");
    expect(textarea.value).toBe("a  b");
    expect(textarea.selectionStart).toBe(3);
    expect(document.activeElement).toBe(textarea);
    expect(seen.at(-1)).toBe("a  b");
  });

  it("Tab replaces a selection with the indentation", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    editor.setValue("abcd");
    await user.click(textarea);
    textarea.setSelectionRange(1, 3);
    await user.keyboard("{Tab}");
    expect(textarea.value).toBe("a  d");
  });

  it("Shift+Tab removes up to two leading spaces of the current line", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    editor.setValue("a {\n  color: red;\n}");
    await user.click(textarea);
    // Caret inside the indented second line.
    const pos = "a {\n  col".length;
    textarea.setSelectionRange(pos, pos);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(textarea.value).toBe("a {\ncolor: red;\n}");
    expect(textarea.selectionStart).toBe(pos - 2);
  });

  it("Shift+Tab clamps the caret to the line start when it sat inside the indent", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    editor.setValue("x\n  y");
    await user.click(textarea);
    const lineStart = 2;
    textarea.setSelectionRange(lineStart + 1, lineStart + 1);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(textarea.value).toBe("x\ny");
    expect(textarea.selectionStart).toBe(lineStart);
  });

  it("Shift+Tab is a no-op on an unindented line", async () => {
    const user = userEvent.setup();
    const { editor, textarea } = mount();
    editor.setValue("a {}");
    await user.click(textarea);
    textarea.setSelectionRange(2, 2);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(textarea.value).toBe("a {}");
    expect(textarea.selectionStart).toBe(2);
  });

  it("Escape releases focus so keyboard users are not trapped", async () => {
    const user = userEvent.setup();
    const { textarea } = mount();
    await user.click(textarea);
    expect(document.activeElement).toBe(textarea);
    await user.keyboard("{Escape}");
    expect(document.activeElement).not.toBe(textarea);
  });

  it("focus() moves focus into the textarea", () => {
    const { editor, textarea } = mount();
    editor.focus();
    expect(document.activeElement).toBe(textarea);
  });

  it("mirrors the textarea scroll position onto the overlay", () => {
    const { textarea, pre } = mount();
    textarea.scrollTop = 40;
    textarea.scrollLeft = 12;
    textarea.dispatchEvent(new Event("scroll"));
    expect(pre.scrollTop).toBe(40);
    expect(pre.scrollLeft).toBe(12);
  });

  it("does not render the hint text into the textarea", () => {
    const { textarea } = mount();
    expect(queryByText(textarea, "⌘/Ctrl + Enter でチェック")).toBeNull();
  });
});
