import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupDataCacheIfVersionChanged,
  DATA_CACHE_NAME,
  DATA_VERSION_CACHE_KEY,
  IMAGE_CACHE_NAME,
  SW_DATA_VERSION,
} from "../sw";

describe("offline SW support", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("keeps the offline cache names explicit", () => {
    expect(SW_DATA_VERSION).toBe("v1");
    expect(DATA_CACHE_NAME).toBe("onepiecedle-data-v1");
    expect(IMAGE_CACHE_NAME).toBe("onepiecedle-images-v1");
    expect(DATA_VERSION_CACHE_KEY).toBe("/__sw-data-version__");
  });

  it("serves the characters dataset through the API route", async () => {
    const { GET } = await import("../../app/api/characters/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain(
      "stale-while-revalidate"
    );
    expect(response.headers.get("etag")).toBeTruthy();

    const payload = await response.json();

    expect(Array.isArray(payload.characters)).toBe(true);
    expect(payload.characters.length).toBeGreaterThan(0);
    expect(typeof payload.versionHash).toBe("string");
    expect(payload.versionHash.length).toBeGreaterThan(0);
  });

  it("clears the cached dataset when the stored version is stale", async () => {
    const deletedKeys: string[] = [];
    const putCalls: Array<[RequestInfo | URL, Response]> = [];

    Object.defineProperty(globalThis, "caches", {
      value: {
        open: vi.fn().mockResolvedValue({
          match: vi
            .fn()
            .mockImplementation(async (request: RequestInfo | URL) => {
              const key =
                typeof request === "string" ? request : request.toString();

              if (key.endsWith(DATA_VERSION_CACHE_KEY)) {
                return new Response("v0");
              }

              return null;
            }),
          keys: vi
            .fn()
            .mockResolvedValue([
              new Request("https://onepiecedle.com/api/characters"),
              new Request("https://onepiecedle.com/__sw-data-version__"),
            ]),
          delete: vi.fn().mockImplementation(async (request: Request) => {
            deletedKeys.push(request.url);
            return true;
          }),
          put: vi
            .fn()
            .mockImplementation(
              async (request: RequestInfo | URL, response: Response) => {
                putCalls.push([request, response]);
                return undefined;
              }
            ),
        }),
      },
      configurable: true,
    });

    const cleared = await cleanupDataCacheIfVersionChanged();

    expect(cleared).toBe(true);
    expect(deletedKeys).toEqual([
      "https://onepiecedle.com/api/characters",
      "https://onepiecedle.com/__sw-data-version__",
    ]);
    expect(putCalls).toHaveLength(1);
    expect(putCalls[0][0]).toBe(DATA_VERSION_CACHE_KEY);
    await expect(putCalls[0][1].text()).resolves.toBe(SW_DATA_VERSION);
  });
});
