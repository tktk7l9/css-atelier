/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSandbox } from "./sandbox.js";

// jsdom neither parses `srcdoc` nor implements constructable stylesheets, so the
// test harness fills both gaps on a real <iframe>: the srcdoc setter writes the
// body markup into the frame document and fires `load`, and the frame realm
// gets a recording CSSStyleSheet double.

class FakeSheet {
  static instances: FakeSheet[] = [];
  readonly calls: string[] = [];
  constructor() {
    FakeSheet.instances.push(this);
  }
  replaceSync(css: string): void {
    if (css.includes("@import")) throw new Error("not allowed");
    this.calls.push(css);
  }
}

/**
 * `freshDocuments` makes every srcdoc load bring a new document, as a real
 * browser does; by default the harness reuses the frame's one document.
 */
function mountFrame({ freshDocuments = false } = {}): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);
  const win = iframe.contentWindow as unknown as { CSSStyleSheet: typeof FakeSheet };
  win.CSSStyleSheet = FakeSheet;
  if (freshDocuments) {
    let current = document.implementation.createHTMLDocument("");
    Object.defineProperty(iframe, "contentDocument", { get: () => current });
    iframe.addEventListener("srcdoc-set", () => (current = document.implementation.createHTMLDocument("")));
  }
  let srcdoc = "";
  Object.defineProperty(iframe, "srcdoc", {
    get: () => srcdoc,
    set: (v: string) => {
      srcdoc = v;
      iframe.dispatchEvent(new Event("srcdoc-set"));
      const doc = iframe.contentDocument;
      const body = /<body>([\s\S]*)<\/body>/.exec(v)?.[1] ?? "";
      if (doc) doc.body.innerHTML = body;
      setTimeout(() => iframe.dispatchEvent(new Event("load")), 0);
    },
  });
  return iframe;
}

/** The frame document's element with this data-id. */
function frameEl(iframe: HTMLIFrameElement, id: string): HTMLElement {
  const node = iframe.contentDocument?.querySelector<HTMLElement>(`[data-id="${id}"]`);
  if (!node) throw new Error(`no [data-id="${id}"] in the frame`);
  return node;
}

/** Dispatch a cancelable event; true when the default action was cancelled. */
function cancelled(node: Element, event: Event): boolean {
  return !node.dispatchEvent(event);
}

const mouse = (type = "click"): MouseEvent => new MouseEvent(type, { bubbles: true, cancelable: true });
const key = (init: KeyboardEventInit): KeyboardEvent =>
  new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });

afterEach(() => {
  document.body.innerHTML = "";
  FakeSheet.instances = [];
});

describe("createSandbox", () => {
  it("seeds the markup, adopts base + user sheets and applies the starter CSS", async () => {
    const iframe = mountFrame();
    const sandbox = createSandbox(iframe);
    await sandbox.load('<div data-id="card">hi</div>', ".card { color: red }");
    expect(iframe.srcdoc).toContain('<html lang="ja">');
    expect(iframe.contentDocument?.querySelector("[data-id=card]")?.textContent).toBe("hi");
    expect(FakeSheet.instances.length).toBe(2);
    const [base, user] = FakeSheet.instances;
    expect(base.calls[0]).toContain("box-sizing: border-box");
    expect(user.calls).toEqual([".card { color: red }"]);
    const adopted = (iframe.contentDocument as unknown as { adoptedStyleSheets: unknown[] })
      .adoptedStyleSheets;
    expect(adopted).toEqual([base, user]);
  });

  it("recompiles the user sheet on setUserCSS and keeps the last valid rules on a parse error", async () => {
    const sandbox = createSandbox(mountFrame());
    await sandbox.load("<p></p>", "p { color: red }");
    const user = FakeSheet.instances[1];
    sandbox.setUserCSS("p { color: blue }");
    expect(user.calls.at(-1)).toBe("p { color: blue }");
    expect(() => sandbox.setUserCSS('@import "x.css";')).not.toThrow();
    expect(user.calls.at(-1)).toBe("p { color: blue }");
    // The raw text is still what the learner typed, for source checks.
    expect(sandbox.snapshot({ props: [] }).css).toBe('@import "x.css";');
  });

  it("ignores setUserCSS before the frame has loaded", () => {
    const sandbox = createSandbox(mountFrame());
    sandbox.setUserCSS("p {}");
    expect(FakeSheet.instances.length).toBe(0);
  });

  it("snapshots data-id elements with computed props, parent links and order", async () => {
    const sandbox = createSandbox(mountFrame());
    await sandbox.load(
      '<div data-id="row" style="display:flex"><span data-id="a">1</span><b><i data-id="b" style="color:rgb(1, 2, 3)">2</i></b></div><p>no id</p>',
      ".row { gap: 4px }",
    );
    const snap = sandbox.snapshot({ props: ["display", "color"] });
    expect(snap.elements.map((e) => e.id)).toEqual(["row", "a", "b"]);
    expect(snap.elements.map((e) => e.order)).toEqual([0, 1, 2]);
    expect(snap.elements.map((e) => e.parentId)).toEqual([null, "row", "row"]);
    expect(snap.elements.map((e) => e.tag)).toEqual(["div", "span", "i"]);
    expect(snap.elements[0].computed.display).toBe("flex");
    expect(snap.elements[2].computed.color).toBe("rgb(1, 2, 3)");
    expect(snap.elements[0].rect).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    expect(snap.viewport.w).toBeGreaterThan(0);
    expect(snap.css).toBe(".row { gap: 4px }");
    expect(snap.declarations).toEqual([{ selector: ".row", decls: { gap: "4px" } }]);
  });

  it("links each element to its nearest data-id ancestor, not an outer one", async () => {
    const sandbox = createSandbox(mountFrame());
    await sandbox.load(
      '<div data-id="outer"><section data-id="inner"><p><span data-id="leaf">x</span></p></section></div>',
      "",
    );
    const snap = sandbox.snapshot({ props: [] });
    expect(snap.elements.map((e) => [e.id, e.parentId])).toEqual([
      ["outer", null],
      ["inner", "outer"],
      ["leaf", "inner"],
    ]);
  });

  it("returns an empty snapshot when the frame has no document", () => {
    const iframe = document.createElement("iframe");
    const sandbox = createSandbox(iframe);
    expect(iframe.contentWindow).toBeNull();
    const snap = sandbox.snapshot({ props: ["display"] });
    expect(snap).toEqual({ viewport: { w: 0, h: 0 }, elements: [], declarations: [], css: "" });
  });

  it("resolves load without sheets when the frame document is unavailable", async () => {
    const iframe = mountFrame();
    Object.defineProperty(iframe, "contentDocument", { get: () => null });
    const sandbox = createSandbox(iframe);
    await expect(sandbox.load("<p></p>", "p {}")).resolves.toBeUndefined();
    expect(FakeSheet.instances.length).toBe(0);
  });

  it("resizes the frame for responsive challenges and resets with null", async () => {
    const iframe = mountFrame();
    const sandbox = createSandbox(iframe);
    sandbox.setViewport(380);
    expect(iframe.style.width).toBe("380px");
    sandbox.setViewport(null);
    expect(iframe.style.width).toBe("");
  });

  it("destroy clears the frame and drops the user sheet", async () => {
    const iframe = mountFrame();
    const sandbox = createSandbox(iframe);
    await sandbox.load("<p></p>", "p {}");
    const user = FakeSheet.instances[1];
    sandbox.destroy();
    expect(iframe.srcdoc).toBe("");
    sandbox.setUserCSS("p { color: red }");
    expect(user.calls).toEqual(["p {}"]);
  });

  it("keeps links in the preview from taking the frame away from the lesson", async () => {
    const iframe = mountFrame();
    await createSandbox(iframe).load(
      '<a data-id="hash" href="#">続きを読む</a><a href="/next"><b data-id="inside">中の文字</b></a>' +
        '<map name="m"><area data-id="area" href="#" alt="領域"></map>' +
        '<a data-id="plain">href なし</a><p data-id="text">本文</p>',
      "",
    );
    expect(cancelled(frameEl(iframe, "hash"), mouse())).toBe(true);
    // A click on the link's text still follows the link, so it is cancelled too.
    expect(cancelled(frameEl(iframe, "inside"), mouse())).toBe(true);
    expect(cancelled(frameEl(iframe, "area"), mouse())).toBe(true);
    // A middle click would open the link in a new tab.
    expect(cancelled(frameEl(iframe, "hash"), mouse("auxclick"))).toBe(true);
    // Nothing else is touched: an anchor without href goes nowhere.
    expect(cancelled(frameEl(iframe, "plain"), mouse())).toBe(false);
    expect(cancelled(frameEl(iframe, "text"), mouse())).toBe(false);
    // Events aimed at the document itself have no element to look at.
    const doc = iframe.contentDocument!;
    expect(!doc.dispatchEvent(mouse())).toBe(false);
    expect(!doc.dispatchEvent(key({ key: "Enter" }))).toBe(false);
  });

  it("keeps forms in the preview from submitting, and leaves the other controls working", async () => {
    const iframe = mountFrame();
    await createSandbox(iframe).load(
      '<form data-id="form"><input data-id="field"><textarea data-id="notes"></textarea>' +
        '<input data-id="check" type="checkbox"><button data-id="submit">送る</button>' +
        '<input data-id="image" type="image" alt="送る"><input data-id="send" type="submit">' +
        '<button data-id="plain" type="button">ただのボタン</button></form>' +
        '<input data-id="lone"><button data-id="lone-button">フォームの外</button>',
      "",
    );
    expect(cancelled(frameEl(iframe, "submit"), mouse())).toBe(true);
    expect(cancelled(frameEl(iframe, "image"), mouse())).toBe(true);
    expect(cancelled(frameEl(iframe, "send"), mouse())).toBe(true);
    expect(cancelled(frameEl(iframe, "form"), new Event("submit", { bubbles: true, cancelable: true }))).toBe(true);
    // Enter in a form's field submits it (implicit submission).
    expect(cancelled(frameEl(iframe, "field"), key({ key: "Enter" }))).toBe(true);

    // Typing, confirming an IME conversion and new lines in a textarea stay as they are.
    expect(cancelled(frameEl(iframe, "field"), key({ key: "a" }))).toBe(false);
    expect(cancelled(frameEl(iframe, "field"), key({ key: "Enter", isComposing: true }))).toBe(false);
    expect(cancelled(frameEl(iframe, "notes"), key({ key: "Enter" }))).toBe(false);
    // Controls that submit nothing keep working: the checkbox still toggles.
    const check = frameEl(iframe, "check") as HTMLInputElement;
    expect(cancelled(check, mouse())).toBe(false);
    expect(check.checked).toBe(true);
    expect(cancelled(frameEl(iframe, "plain"), mouse())).toBe(false);
    // Outside a form there is nothing to submit.
    expect(cancelled(frameEl(iframe, "lone"), key({ key: "Enter" }))).toBe(false);
    expect(cancelled(frameEl(iframe, "lone-button"), mouse())).toBe(false);
  });

  it("guards the new document that every srcdoc load brings", async () => {
    const iframe = mountFrame({ freshDocuments: true });
    const sandbox = createSandbox(iframe);
    await sandbox.load('<a data-id="first" href="#">1</a>', "");
    const firstDoc = iframe.contentDocument;
    await sandbox.load('<a data-id="second" href="#">2</a>', "");
    expect(iframe.contentDocument).not.toBe(firstDoc);
    expect(cancelled(frameEl(iframe, "second"), mouse())).toBe(true);
  });

  it("creates fresh sheets per load so a new lesson never inherits old rules", async () => {
    const sandbox = createSandbox(mountFrame());
    await sandbox.load("<p></p>", "p { color: red }");
    await sandbox.load("<b></b>", "b { color: blue }");
    expect(FakeSheet.instances.length).toBe(4);
    expect(FakeSheet.instances[3].calls).toEqual(["b { color: blue }"]);
    const spy = vi.spyOn(FakeSheet.instances[1], "replaceSync");
    sandbox.setUserCSS("b {}");
    expect(spy).not.toHaveBeenCalled();
    expect(FakeSheet.instances[3].calls.at(-1)).toBe("b {}");
  });
});
