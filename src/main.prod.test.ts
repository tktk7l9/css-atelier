/** @vitest-environment jsdom */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { findByRole } from "@testing-library/dom";

// Production-only wiring of the shell: the analytics beacon and the service
// worker registration. The lesson runtime is never reached here.

vi.mock("./app.js", () => ({
  createApp: () => {
    throw new Error("must not load the lesson runtime on the catalogue");
  },
}));

const register = vi.fn().mockResolvedValue(undefined);

beforeAll(async () => {
  vi.stubEnv("PROD", true);
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
  document.body.innerHTML = '<div id="app"></div>';
  location.hash = "";
  await import("./main.js");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("shell in production", () => {
  it("injects the Cloudflare Web Analytics beacon as a module script", async () => {
    await findByRole(document.body, "heading", { level: 1, name: "CSS Atelier" });
    const beacon = document.head.querySelector<HTMLScriptElement>(
      'script[src="https://static.cloudflareinsights.com/beacon.min.js"]',
    );
    expect(beacon?.type).toBe("module");
    expect(beacon?.dataset.cfBeacon).toContain('"token"');
  });

  it("registers the service worker once the page has loaded", () => {
    expect(register).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("load"));
    expect(register).toHaveBeenCalledWith("/sw.js");
  });
});
