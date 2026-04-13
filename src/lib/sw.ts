export const SW_CACHE_VERSION = "v1";
export const STATIC_CACHE_NAME = `onepiecedle-static-${SW_CACHE_VERSION}`;
export const APP_SHELL_CACHE_NAME = `onepiecedle-shell-${SW_CACHE_VERSION}`;
export const SW_DATA_VERSION = "v1";
export const DATA_CACHE_NAME = "onepiecedle-data-v1";
export const IMAGE_CACHE_NAME = "onepiecedle-images-v1";
export const DATA_VERSION_CACHE_KEY = "/__sw-data-version__";

const CURRENT_CACHE_NAMES = [
  STATIC_CACHE_NAME,
  APP_SHELL_CACHE_NAME,
  DATA_CACHE_NAME,
  IMAGE_CACHE_NAME,
] as const;
const API_DENY_PREFIXES = ["/api/auth", "/api/stats"] as const;
const AUTH_DENY_PREFIXES = ["/profile"] as const;
const STATIC_PATH_PREFIXES = [
  "/_next/static/",
  "/_next/image",
  "/characters/",
  "/favicon",
  "/icon",
  "/manifest",
] as const;

function hasPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isDeniedPathname(pathname: string): boolean {
  return [...API_DENY_PREFIXES, ...AUTH_DENY_PREFIXES].some((prefix) =>
    hasPathPrefix(pathname, prefix)
  );
}

export function isStaticAssetRequest(request: Request): boolean {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  return (
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    ["script", "style", "image", "font", "worker"].includes(request.destination)
  );
}

export function isAppShellRequest(request: Request): boolean {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  return url.pathname === "/";
}

export function isCharactersDataRequest(request: Request): boolean {
  if (request.method !== "GET") {
    return false;
  }

  return new URL(request.url).pathname === "/api/characters";
}

export function isCharacterImageRequest(request: Request): boolean {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = new URL(request.url).pathname;

  return pathname.startsWith("/characters/") && pathname.endsWith(".png");
}

export function shouldBypassCache(request: Request): boolean {
  return isDeniedPathname(new URL(request.url).pathname);
}

export function shouldUseCacheFirst(request: Request): boolean {
  return isAppShellRequest(request) || isStaticAssetRequest(request);
}

export function getCacheNamesToDelete(cacheNames: string[]): string[] {
  return cacheNames.filter(
    (cacheName) =>
      !CURRENT_CACHE_NAMES.includes(
        cacheName as (typeof CURRENT_CACHE_NAMES)[number]
      )
  );
}

export async function cleanupOldCaches(): Promise<string[]> {
  const cacheNames = await caches.keys();
  const staleCacheNames = getCacheNamesToDelete(cacheNames);

  await Promise.all(
    staleCacheNames.map((cacheName) => caches.delete(cacheName))
  );

  return staleCacheNames;
}

async function writeDataCacheVersion(cache: Cache): Promise<void> {
  await cache.put(
    DATA_VERSION_CACHE_KEY,
    new Response(SW_DATA_VERSION, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

export async function cleanupDataCacheIfVersionChanged(): Promise<boolean> {
  const cache = await caches.open(DATA_CACHE_NAME);
  const versionResponse = await cache.match(DATA_VERSION_CACHE_KEY);
  const cachedVersion = versionResponse ? await versionResponse.text() : null;

  if (cachedVersion === SW_DATA_VERSION) {
    return false;
  }

  const keys = await cache.keys();

  await Promise.all(keys.map((request) => cache.delete(request)));
  await writeDataCacheVersion(cache);

  return true;
}

export function extractShellAssetUrls(html: string, baseUrl: string): string[] {
  const assetUrls = new Set<string>();
  const attributePattern = /(?:src|href)=(?:"([^"]+)"|'([^']+)')/g;

  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(html)) !== null) {
    const candidate = match[1] ?? match[2] ?? "";

    if (!candidate) {
      continue;
    }

    const absoluteUrl = new URL(candidate, baseUrl);

    if (absoluteUrl.origin !== new URL(baseUrl).origin) {
      continue;
    }

    if (
      absoluteUrl.pathname.startsWith("/_next/static/") ||
      absoluteUrl.pathname.startsWith("/_next/image") ||
      absoluteUrl.pathname.startsWith("/characters/")
    ) {
      assetUrls.add(absoluteUrl.toString());
    }
  }

  return Array.from(assetUrls);
}
