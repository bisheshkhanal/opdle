// Service worker global types not included in the "dom" lib.
// Declared here to avoid adding "webworker" to tsconfig (which conflicts with DOM).
interface ExtendableEvent extends Event {
  waitUntil(f: Promise<unknown>): void;
}

interface PushMessageData {
  json(): unknown;
  text(): string;
}

interface PushEvent extends ExtendableEvent {
  readonly data: PushMessageData | null;
}

interface Notification {
  readonly data: Record<string, unknown> | null;
  close(): void;
}

interface NotificationEvent extends ExtendableEvent {
  readonly notification: Notification;
}

interface Client {
  readonly id: string;
  readonly url: string;
  focus?(): Promise<WindowClient>;
}

interface WindowClient extends Client {
  readonly focused: boolean;
  readonly visibilityState: "hidden" | "visible" | "prerender";
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient>;
}

interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client | undefined>;
  matchAll(options?: {
    type?: string;
    includeUncontrolled?: boolean;
  }): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | undefined>;
}

declare const clients: Clients;

interface ServiceWorkerGlobalRegistration {
  showNotification(
    title: string,
    options?: Record<string, unknown>
  ): Promise<void>;
}

declare global {
  interface Window {
    registration: ServiceWorkerGlobalRegistration;
  }
}

export const SW_CACHE_VERSION = "v1";
export const STATIC_CACHE_NAME = `onepiecedle-static-${SW_CACHE_VERSION}`;
export const APP_SHELL_CACHE_NAME = `onepiecedle-shell-${SW_CACHE_VERSION}`;
export const SW_DATA_VERSION = "v1";
export const DATA_CACHE_NAME = "onepiecedle-data-v1";
export const IMAGE_CACHE_NAME = "onepiecedle-images-v1";
export const DATA_VERSION_CACHE_KEY = "/__sw-data-version__";
export const NOTIFICATION_ICON = "/icon-192x192.png";
export const NOTIFICATION_BADGE = "/icon-192x192.png";

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

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
}

type PushEventData =
  | {
      text?: () => string;
    }
  | null
  | undefined;

function isPushNotificationPayload(
  value: unknown
): value is PushNotificationPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PushNotificationPayload).title === "string" &&
    typeof (value as PushNotificationPayload).body === "string" &&
    typeof (value as PushNotificationPayload).url === "string"
  );
}

export function normalizeNotificationUrl(url: string): string {
  return new URL(url, self.location.origin).toString();
}

export function parsePushNotificationPayload(
  data: PushEventData
): PushNotificationPayload | null {
  if (!data) {
    console.warn("[sw] Dropping malformed push payload: missing data");
    return null;
  }

  try {
    const rawPayload =
      typeof (data as { text?: () => string }).text === "function"
        ? (data as { text: () => string }).text()
        : JSON.stringify(data);
    const parsedPayload = JSON.parse(rawPayload) as unknown;

    if (!isPushNotificationPayload(parsedPayload)) {
      console.warn("[sw] Dropping malformed push payload: invalid shape");
      return null;
    }

    return {
      title: parsedPayload.title,
      body: parsedPayload.body,
      url: normalizeNotificationUrl(parsedPayload.url),
    };
  } catch (error) {
    console.warn("[sw] Dropping malformed push payload", error);
    return null;
  }
}

export function handlePushEvent(event: PushEvent): void {
  event.waitUntil(
    (async () => {
      const payload = parsePushNotificationPayload(event.data);

      if (!payload) {
        return;
      }

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
        data: { url: payload.url },
      });
    })()
  );
}

export function handleNotificationClickEvent(event: NotificationEvent): void {
  event.waitUntil(
    (async () => {
      const notificationUrl =
        typeof event.notification.data?.url === "string"
          ? normalizeNotificationUrl(event.notification.data.url)
          : self.location.origin;

      event.notification.close();

      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const existingClient = windowClients.find(
        (client): client is WindowClient => typeof client.focus === "function"
      );

      if (existingClient) {
        if (typeof existingClient.navigate === "function") {
          await existingClient.navigate(notificationUrl);
        }
        await existingClient.focus();
        return;
      }

      await clients.openWindow(notificationUrl);
    })()
  );
}
