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

function mountFrame(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);
  const win = iframe.contentWindow as unknown as { CSSStyleSheet: typeof FakeSheet };
  win.CSSStyleSheet = FakeSheet;
  let srcdoc = "";
  Object.defineProperty(iframe, "srcdoc", {
    get: () => srcdoc,
    set: (v: string) => {
      srcdoc = v;
      const doc = iframe.contentDocument;
      const body = /<body>([\s\S]*)<\/body>/.exec(v)?.[1] ?? "";
      if (doc) doc.body.innerHTML = body;
      setTimeout(() => iframe.dispatchEvent(new Event("load")), 0);
    },
  });
  return iframe;
}

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
