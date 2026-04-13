export interface ServiceWorkerRegistrationContext {
  env?: string;
  protocol?: string;
  hasServiceWorker?: boolean;
}

export const SERVICE_WORKER_PATH = "/sw.js";

export function canRegisterServiceWorker(
  context: ServiceWorkerRegistrationContext = {}
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hasServiceWorker =
    context.hasServiceWorker ?? "serviceWorker" in navigator;

  if (!hasServiceWorker) {
    return false;
  }

  const env = context.env ?? process.env.NODE_ENV;
  const protocol = context.protocol ?? window.location.protocol;

  return env === "production" || protocol === "https:";
}

export async function registerServiceWorker(
  context: ServiceWorkerRegistrationContext = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!canRegisterServiceWorker(context)) {
    return null;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
}
