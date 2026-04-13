"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export type PushReminderPermission = NotificationPermission | "unsupported";

export type PushReminderSubscriptionStatus =
  | "not-subscribed"
  | "subscribed"
  | "denied"
  | "error";

export interface PushReminderRequestResult {
  ok: boolean;
  error?: string;
  permission?: PushReminderPermission;
  subscription?: PushSubscription | null;
}

function getPermissionState(): PushReminderPermission {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    typeof window.Notification === "undefined"
  ) {
    return "unsupported";
  }

  return window.Notification.permission;
}

function decodeBase64Url(input: string): Uint8Array {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function usePushReminders() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [permission, setPermission] = useState<PushReminderPermission>(() =>
    getPermissionState()
  );
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<PushReminderSubscriptionStatus>("not-subscribed");

  const hasPushSupport = useMemo(
    () => typeof window !== "undefined" && "Notification" in window,
    []
  );

  useEffect(() => {
    const currentPermission = getPermissionState();
    setPermission(currentPermission);

    if (currentPermission === "unsupported") {
      setSubscriptionStatus("error");
      return;
    }

    if (currentPermission === "denied") {
      setSubscriptionStatus("denied");
      return;
    }

    if (!isAuthenticated || !hasPushSupport || !navigator.serviceWorker) {
      setSubscriptionStatus("not-subscribed");
      return;
    }

    let cancelled = false;

    const syncSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (cancelled) return;

        setSubscriptionStatus(subscription ? "subscribed" : "not-subscribed");
      } catch {
        if (!cancelled) {
          setSubscriptionStatus("error");
        }
      }
    };

    void syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [hasPushSupport, isAuthenticated, session, status]);

  const requestPermission =
    useCallback(async (): Promise<PushReminderRequestResult> => {
      if (!isAuthenticated) {
        return { ok: false, error: "Sign in to enable reminders." };
      }

      if (
        typeof window === "undefined" ||
        !hasPushSupport ||
        !window.Notification
      ) {
        setPermission("unsupported");
        setSubscriptionStatus("error");
        return {
          ok: false,
          error: "Notifications are not supported in this browser.",
        };
      }

      try {
        const nextPermission = await window.Notification.requestPermission();
        setPermission(nextPermission);

        if (nextPermission === "denied") {
          setSubscriptionStatus("denied");
          return {
            ok: false,
            permission: nextPermission,
            error: "Notifications were blocked.",
          };
        }

        if (nextPermission !== "granted") {
          setSubscriptionStatus("not-subscribed");
          return {
            ok: false,
            permission: nextPermission,
            error: "Notification permission not granted.",
          };
        }

        if (!navigator.serviceWorker) {
          setSubscriptionStatus("error");
          return {
            ok: false,
            permission: nextPermission,
            error: "Service workers are unavailable.",
          };
        }

        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
        const applicationServerKey = decodeBase64Url(
          vapidPublicKey
        ) as BufferSource;
        const subscribeOptions: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
          ...(vapidPublicKey ? { applicationServerKey } : {}),
        };
        const subscription =
          await registration.pushManager.subscribe(subscribeOptions);

        setSubscriptionStatus(subscription ? "subscribed" : "not-subscribed");

        return {
          ok: true,
          permission: nextPermission,
          subscription,
        };
      } catch (error) {
        setSubscriptionStatus("error");
        return {
          ok: false,
          permission: permission,
          error:
            error instanceof Error
              ? error.message
              : "Failed to enable reminders.",
        };
      }
    }, [hasPushSupport, isAuthenticated, permission]);

  return {
    isAuthenticated,
    permission,
    subscriptionStatus,
    requestPermission,
  };
}
