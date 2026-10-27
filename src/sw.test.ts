import SW_SOURCE from "./sw.js?raw";
import { beforeEach, describe, expect, it, vi } from "vitest";

// src/sw.js is the service worker template the build fills in. It runs here as
// a function body over a fake Cache API and a fake origin server, so the
// caching rules (what is precached, what may become the offline shell, what is
// never stored) are pinned without a browser.

const ORIGIN = "https://css-atelier.test";
const CACHE = "css-atelier-v1";

type Listener = (event: never) => void;

/** The fake origin: a path → response factory. Unknown paths are 404. */
type Server = Record<string, () => Response>;

function page(body: string): Response {
  return new Response(body, { status: 200, headers: { "content-type": "text/html" } });
}

/** What fetch() yields after following a redirect: ok, but flagged. */
function redirected(body: string): Response {
  const res = page(body);
  Object.defineProperty(res, "redirected", { value: true });
  return res;
}

function pathOf(key: string | Request): string {
  return new URL(typeof key === "string" ? key : key.url, ORIGIN).pathname;
}

function bootWorker(server: Server) {
  const listeners = new Map<string, Listener>();
  const store = new Map<string, Response>();
  const fetched: string[] = [];
  const fetch = vi.fn(async (req: Request | string) => {
    const path = pathOf(req);
    fetched.push(path);
    const hit = server[path];
    if (!hit) return new Response("not found", { status: 404 });
    return hit();
  });
  const cache = {
    addAll: async (keys: string[]) => {
      for (const key of keys) {
        const res = await fetch(new Request(new URL(key, ORIGIN)));
        if (!res.ok) throw new TypeError(`addAll: ${key} is ${res.status}`);
        store.set(pathOf(key), res);
      }
    },
    put: async (key: string | Request, res: Response) => void store.set(pathOf(key), res),
    match: async (key: string | Request) => store.get(pathOf(key)),
    keys: async () => [...store.keys()].map((k) => new Request(new URL(k, ORIGIN))),
    delete: async (key: string | Request) => store.delete(pathOf(key)),
  };
  const caches = {
    open: vi.fn(async () => cache),
    match: cache.match,
    keys: vi.fn(async () => [CACHE, "css-atelier-v0"]),
    delete: vi.fn(async () => true),
  };
  const self = {
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  new Function("self", "caches", "fetch", "location", SW_SOURCE)(self, caches, fetch, { origin: ORIGIN });

  const lifecycle = async (type: "install" | "activate"): Promise<void> => {
    let pending: Promise<unknown> = Promise.resolve();
    listeners.get(type)?.({ waitUntil: (p: Promise<unknown>) => (pending = p) } as never);
    await pending;
  };
  const request = async (
    path: string,
    init: { mode?: string; method?: string } = {},
  ): Promise<Response | undefined> => {
    const req = new Request(new URL(path, ORIGIN), { method: init.method ?? "GET" });
    if (init.mode) Object.defineProperty(req, "mode", { value: init.mode });
    let answer: Promise<Response | undefined> | undefined;
    listeners.get("fetch")?.({ request: req, respondWith: (p: Promise<Response>) => (answer = p) } as never);
    const res = await answer;
    // Let the fire-and-forget cache.put behind a response settle.
    await new Promise((r) => setTimeout(r, 0));
    return res;
  };
  const cached = (path: string): Response | undefined => store.get(path);

  return { lifecycle, request, cached, store, fetched, caches, self };
}

let server: Server;

beforeEach(() => {
  server = {
    "/": () => page("shell"),
    // Workers static assets redirect /index.html to /.
    "/index.html": () => redirected("shell via redirect"),
    "/favicon.svg": () => new Response("<svg/>", { status: 200 }),
    "/manifest.webmanifest": () => new Response("{}", { status: 200 }),
    "/assets/app-new.js": () => new Response("js", { status: 200 }),
  };
});

describe("service worker template", () => {
  it("keeps the slots the build fills in", () => {
    expect(SW_SOURCE).toContain("const PRECACHE = [];");
    expect(SW_SOURCE).toContain("const ASSETS = [];");
  });

  it("precaches the shell under / and never asks for /index.html, which the host redirects", async () => {
    const sw = bootWorker(server);
    await sw.lifecycle("install");
    expect(sw.fetched).toEqual(["/", "/favicon.svg", "/manifest.webmanifest"]);
    expect(sw.cached("/")?.redirected).toBe(false);
    expect(sw.cached("/index.html")).toBeUndefined();
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });

  it("serves navigations from the network and falls back to the cached shell offline", async () => {
    const sw = bootWorker(server);
    await sw.lifecycle("install");
    server["/"] = () => page("fresh shell");
    const online = await sw.request("/#lesson", { mode: "navigate" });
    expect(await online?.text()).toBe("fresh shell");
    expect(await sw.cached("/")?.clone().text()).toBe("fresh shell");

    server["/"] = () => {
      throw new TypeError("offline");
    };
    const offline = await sw.request("/", { mode: "navigate" });
    expect(await offline?.text()).toBe("fresh shell");
    expect(offline?.redirected).toBe(false);
  });

  it("never lets an error page replace the offline shell", async () => {
    const sw = bootWorker(server);
    await sw.lifecycle("install");
    server["/"] = () => new Response("maintenance", { status: 503 });
    const res = await sw.request("/", { mode: "navigate" });
    expect(res?.status).toBe(503);
    expect(await sw.cached("/")?.clone().text()).toBe("shell");
  });

  it("caches other same-origin GETs only when they succeed, then serves them cache-first", async () => {
    const sw = bootWorker(server);
    await sw.lifecycle("install");
    const miss = await sw.request("/assets/missing.js");
    expect(miss?.status).toBe(404);
    expect(sw.cached("/assets/missing.js")).toBeUndefined();

    expect((await sw.request("/assets/app-new.js"))?.status).toBe(200);
    expect(sw.cached("/assets/app-new.js")).toBeDefined();
    const before = sw.fetched.length;
    await sw.request("/assets/app-new.js");
    expect(sw.fetched.length).toBe(before);
  });

  it("leaves cross-origin and non-GET requests to the browser", async () => {
    const sw = bootWorker(server);
    expect(await sw.request("https://static.cloudflareinsights.com/beacon.min.js")).toBeUndefined();
    expect(await sw.request("/", { method: "POST" })).toBeUndefined();
    expect(sw.fetched).toEqual([]);
  });

  it("drops old caches and the previous build's hashed assets on activate", async () => {
    const sw = bootWorker(server);
    await sw.lifecycle("install");
    sw.store.set("/assets/app-old.js", new Response("old"));
    await sw.lifecycle("activate");
    expect(sw.caches.delete).toHaveBeenCalledWith("css-atelier-v0");
    expect(sw.caches.delete).not.toHaveBeenCalledWith(CACHE);
    expect(sw.cached("/assets/app-old.js")).toBeUndefined();
    expect(sw.cached("/")).toBeDefined();
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });
});
