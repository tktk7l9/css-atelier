/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { byId, el } from "./dom.js";

describe("el", () => {
  it("creates a bare element", () => {
    const node = el("div");
    expect(node.tagName).toBe("DIV");
    expect(node.className).toBe("");
    expect(node.textContent).toBe("");
  });

  it("applies class, text and attributes", () => {
    const node = el("button", {
      class: "btn btn--primary",
      text: "チェック",
      attrs: { type: "button", "aria-label": "check" },
    });
    expect(node.className).toBe("btn btn--primary");
    expect(node.textContent).toBe("チェック");
    expect(node.getAttribute("type")).toBe("button");
    expect(node.getAttribute("aria-label")).toBe("check");
  });

  it("sets innerHTML when html is given", () => {
    const node = el("p", { html: "<b>bold</b> text" });
    expect(node.querySelector("b")?.textContent).toBe("bold");
    expect(node.textContent).toBe("bold text");
  });

  it("treats an empty-string text as text (not as absent)", () => {
    const node = el("span", { text: "" });
    expect(node.textContent).toBe("");
  });
});

describe("byId", () => {
  it("returns the element with the id", () => {
    const target = el("div", { attrs: { id: "app" } });
    document.body.append(target);
    expect(byId("app")).toBe(target);
    target.remove();
  });

  it("throws a clear error when the id is missing", () => {
    expect(() => byId("nope")).toThrow("#nope missing");
  });
});
