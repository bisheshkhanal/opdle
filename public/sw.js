const SW_CACHE_VERSION = "v1";
const STATIC_CACHE_NAME = `onepiecedle-static-${SW_CACHE_VERSION}`;
const APP_SHELL_CACHE_NAME = `onepiecedle-shell-${SW_CACHE_VERSION}`;
const SW_DATA_VERSION = "v1";
const DATA_CACHE_NAME = "onepiecedle-data-v1";
const IMAGE_CACHE_NAME = "onepiecedle-images-v1";
const DATA_VERSION_CACHE_KEY = "/__sw-data-version__";
const CURRENT_CACHE_NAMES = [
  STATIC_CACHE_NAME,
  APP_SHELL_CACHE_NAME,
  DATA_CACHE_NAME,
  IMAGE_CACHE_NAME,
];
const API_DENY_PREFIXES = ["/api/auth", "/api/stats"];
const AUTH_DENY_PREFIXES = ["/profile"];
const STATIC_PATH_PREFIXES = [
  "/_next/static/",
  "/_next/image",
  "/characters/",
  "/favicon",
  "/icon",
  "/manifest",
];

function hasPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isDeniedPathname(pathname) {
  return [...API_DENY_PREFIXES, ...AUTH_DENY_PREFIXES].some((prefix) =>
    hasPathPrefix(pathname, prefix)
  );
}

function isStaticAssetRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  return (
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    ["script", "style", "image", "font", "worker"].includes(request.destination)
  );
}

function isAppShellRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  return url.pathname === "/";
}

function isCharactersDataRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  return new URL(request.url).pathname === "/api/characters";
}

function isCharacterImageRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = new URL(request.url).pathname;

  return pathname.startsWith("/characters/") && pathname.endsWith(".png");
}

function shouldBypassCache(request) {
  return isDeniedPathname(new URL(request.url).pathname);
}

function shouldUseCacheFirst(request) {
  return isAppShellRequest(request) || isStaticAssetRequest(request);
}

function getCacheNamesToDelete(cacheNames) {
  return cacheNames.filter(
    (cacheName) => !CURRENT_CACHE_NAMES.includes(cacheName)
  );
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const staleCacheNames = getCacheNamesToDelete(cacheNames);

  await Promise.all(
    staleCacheNames.map((cacheName) => caches.delete(cacheName))
  );

  return staleCacheNames;
}

async function writeDataCacheVersion(cache) {
  await cache.put(
    DATA_VERSION_CACHE_KEY,
    new Response(SW_DATA_VERSION, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function cleanupDataCacheIfVersionChanged() {
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

async function cacheCharactersData() {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await fetch("/api/characters");

    if (response.ok) {
      await cache.put("/api/characters", response.clone());
      await writeDataCacheVersion(cache);
    }
  } catch {
    return;
  }
}

async function handleCharacterImageRequest(request) {
  const imageCache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await imageCache.match(request);

  if (cachedResponse) {
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          await imageCache.put(request, networkResponse.clone());
        }
      })
      .catch(() => undefined);

    return cachedResponse;
  }

  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const staticResponse = await staticCache.match(request);

  if (staticResponse) {
    await imageCache.put(request, staticResponse.clone());

    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          await imageCache.put(request, networkResponse.clone());
        }
      })
      .catch(() => undefined);

    return staticResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    await imageCache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

function extractShellAssetUrls(html, baseUrl) {
  const assetUrls = new Set();
  const attributePattern = /(?:src|href)=(?:"([^"]+)"|'([^']+)')/g;

  for (const match of html.matchAll(attributePattern)) {
    const candidate = match[1] || match[2] || "";

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

async function cacheAppShell(shellCache, staticCache) {
  const shellResponse = await fetch("/");
  const shellUrl = new URL("/", self.location.origin).toString();
  const shellResponseClone = shellResponse.clone();

  await shellCache.put(shellUrl, shellResponseClone);

  const shellHtml = await shellResponse.text();
  const assetUrls = extractShellAssetUrls(shellHtml, shellUrl);

  await Promise.all(
    assetUrls.map(async (assetUrl) => {
      const assetResponse = await fetch(assetUrl);

      if (assetResponse.ok) {
        await staticCache.put(assetUrl, assetResponse);
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(APP_SHELL_CACHE_NAME);
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      await cacheAppShell(shellCache, staticCache);
      await cacheCharactersData();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await cleanupOldCaches();
      await cleanupDataCacheIfVersionChanged();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || shouldBypassCache(request)) {
    return;
  }

  if (isCharactersDataRequest(request)) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          fetch(request)
            .then(async (networkResponse) => {
              if (networkResponse.ok) {
                await cache.put(request, networkResponse.clone());
                await writeDataCacheVersion(cache);
              }
            })
            .catch(() => undefined);

          return cachedResponse;
        }

        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
          await writeDataCacheVersion(cache);
        }

        return networkResponse;
      })
    );

    return;
  }

  if (isCharacterImageRequest(request)) {
    event.respondWith(handleCharacterImageRequest(request));

    return;
  }

  if (shouldUseCacheFirst(request)) {
    event.respondWith(
      caches
        .open(
          isAppShellRequest(request) ? APP_SHELL_CACHE_NAME : STATIC_CACHE_NAME
        )
        .then(async (cache) => {
          const cachedResponse = await cache.match(request);

          if (cachedResponse) {
            return cachedResponse;
          }

          const networkResponse = await fetch(request);

          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        })
    );

    return;
  }

  event.respondWith(fetch(request));
});
