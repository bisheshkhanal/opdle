import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SERVICE_WORKER_PATH,
  canRegisterServiceWorker,
  registerServiceWorker,
} from "../serviceWorker";
import {
  APP_SHELL_CACHE_NAME,
  STATIC_CACHE_NAME,
  cleanupOldCaches,
  extractShellAssetUrls,
  getCacheNamesToDelete,
  isAppShellRequest,
  isDeniedPathname,
  isStaticAssetRequest,
  shouldUseCacheFirst,
} from "../sw";

describe("service worker helpers", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  describe("registration guardrails", () => {
    it("rejects registration outside production on http", () => {
      expect(
        canRegisterServiceWorker({ env: "development", protocol: "http:" })
      ).toBe(false);
    });

    it("allows registration in production", () => {
      expect(
        canRegisterServiceWorker({
          env: "production",
          protocol: "http:",
          hasServiceWorker: true,
        })
      ).toBe(true);
    });

    it("allows registration on https", () => {
      expect(
        canRegisterServiceWorker({
          env: "development",
          protocol: "https:",
          hasServiceWorker: true,
        })
      ).toBe(true);
    });

    it("registers the root-scoped worker when eligible", async () => {
      const register = vi.fn().mockResolvedValue({ scope: "/" });

      Object.defineProperty(navigator, "serviceWorker", {
        value: { register },
        configurable: true,
      });

      const registration = await registerServiceWorker({
        env: "production",
        protocol: "http:",
      });

      expect(register).toHaveBeenCalledWith(SERVICE_WORKER_PATH);
      expect(registration).toEqual({ scope: "/" });
    });
  });

  describe("cache allow/deny logic", () => {
    it("denies auth, stats, and profile paths", () => {
      expect(isDeniedPathname("/api/auth/signin")).toBe(true);
      expect(isDeniedPathname("/api/stats/sync")).toBe(true);
      expect(isDeniedPathname("/profile/luffy")).toBe(true);
      expect(isDeniedPathname("/_next/static/chunks/main.js")).toBe(false);
    });

    it("treats static assets as cache-first", () => {
      expect(
        isStaticAssetRequest(
          new Request("https://onepiecedle.com/_next/static/chunks/app.js")
        )
      ).toBe(true);
      expect(
        isStaticAssetRequest(
          new Request("https://onepiecedle.com/api/stats/sync")
        )
      ).toBe(false);
      expect(shouldUseCacheFirst(new Request("https://onepiecedle.com/"))).toBe(
        true
      );
      expect(
        shouldUseCacheFirst(
          new Request("https://onepiecedle.com/api/auth/session")
        )
      ).toBe(false);
    });

    it("detects the app shell route", () => {
      expect(isAppShellRequest(new Request("https://onepiecedle.com/"))).toBe(
        true
      );
      expect(
        isAppShellRequest(new Request("https://onepiecedle.com/about"))
      ).toBe(false);
    });

    it("extracts same-origin shell assets from Next HTML", () => {
      const assets = extractShellAssetUrls(
        '<html><head><link rel="stylesheet" href="/_next/static/css/app.css" /><script src="/_next/static/chunks/app.js"></script></head></html>',
        "https://onepiecedle.com/"
      );

      expect(assets).toEqual([
        "https://onepiecedle.com/_next/static/css/app.css",
        "https://onepiecedle.com/_next/static/chunks/app.js",
      ]);
    });

    it("returns stale cache names for cleanup", () => {
      expect(
        getCacheNamesToDelete([
          STATIC_CACHE_NAME,
          APP_SHELL_CACHE_NAME,
          "legacy-cache-v0",
        ])
      ).toEqual(["legacy-cache-v0"]);
    });
  });

  describe("old cache cleanup", () => {
    it("deletes cache versions that are not current", async () => {
      const deleted = new Set<string>();

      Object.defineProperty(globalThis, "caches", {
        value: {
          keys: vi
            .fn()
            .mockResolvedValue([
              STATIC_CACHE_NAME,
              APP_SHELL_CACHE_NAME,
              "onepiecedle-static-v0",
              "other-cache",
            ]),
          delete: vi.fn().mockImplementation(async (cacheName: string) => {
            deleted.add(cacheName);
            return true;
          }),
        },
        configurable: true,
      });

      const staleCacheNames = await cleanupOldCaches();

      expect(staleCacheNames).toEqual(["onepiecedle-static-v0", "other-cache"]);
      expect(deleted.has("onepiecedle-static-v0")).toBe(true);
      expect(deleted.has("other-cache")).toBe(true);
    });
  });

  describe("install shell caching", () => {
    it("parses shell assets from html before caching", () => {
      const html = `
        <html>
          <head>
            <link rel="stylesheet" href="/_next/static/css/app.css" />
            <script src="/_next/static/chunks/main.js"></script>
            <script src="https://example.com/external.js"></script>
          </head>
        </html>
      `;

      expect(extractShellAssetUrls(html, "https://onepiecedle.com/")).toEqual([
        "https://onepiecedle.com/_next/static/css/app.css",
        "https://onepiecedle.com/_next/static/chunks/main.js",
      ]);
    });

    it("keeps cache names explicit for version bumps", () => {
      expect(STATIC_CACHE_NAME).toBe("onepiecedle-static-v1");
      expect(APP_SHELL_CACHE_NAME).toBe("onepiecedle-shell-v1");
    });
  });
});
