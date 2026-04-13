import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: mockUseSession,
}));

type NotificationMock = {
  permission: NotificationPermission;
  requestPermission: ReturnType<
    typeof vi.fn<() => Promise<NotificationPermission>>
  >;
};

describe("usePushReminders", () => {
  let originalNotification: PropertyDescriptor | undefined;
  let originalServiceWorker: PropertyDescriptor | undefined;
  let notificationMock: NotificationMock;
  let requestPermissionSpy: ReturnType<typeof vi.fn>;
  let pushSubscription: PushSubscription;
  let pushManager: {
    getSubscription: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockUseSession.mockReset();
    originalNotification = Object.getOwnPropertyDescriptor(
      window,
      "Notification"
    );
    originalServiceWorker = Object.getOwnPropertyDescriptor(
      window.navigator,
      "serviceWorker"
    );

    requestPermissionSpy = vi.fn();
    pushSubscription = {
      endpoint: "https://example.com/push",
    } as PushSubscription;
    pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(pushSubscription),
    };

    notificationMock = {
      permission: "default",
      requestPermission: requestPermissionSpy,
    };

    Object.defineProperty(window, "Notification", {
      value: notificationMock,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(window.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({ pushManager }),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalNotification) {
      Object.defineProperty(window, "Notification", originalNotification);
    } else {
      Object.defineProperty(window, "Notification", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }

    if (originalServiceWorker) {
      Object.defineProperty(
        window.navigator,
        "serviceWorker",
        originalServiceWorker
      );
    }

    vi.restoreAllMocks();
  });

  it("returns unsupported when window.Notification is absent", async () => {
    Object.defineProperty(window, "Notification", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

    const { usePushReminders } = await import("../usePushReminders");
    const { result } = renderHook(() => usePushReminders());

    expect(result.current.permission).toBe("unsupported");
  });

  it("returns an auth error when requestPermission is called unauthenticated", async () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

    const { usePushReminders } = await import("../usePushReminders");
    const { result } = renderHook(() => usePushReminders());

    const response = await act(async () => result.current.requestPermission());

    expect(response.ok).toBe(false);
    expect(response.error).toBe("Sign in to enable reminders.");
    expect(requestPermissionSpy).not.toHaveBeenCalled();
  });

  it("transitions through permission and subscription states", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user-1" }, expires: "" },
      status: "authenticated",
    });

    requestPermissionSpy.mockResolvedValue("granted");

    const { usePushReminders } = await import("../usePushReminders");
    const { result } = renderHook(() => usePushReminders());

    await waitFor(() => {
      expect(result.current.permission).toBe("default");
      expect(result.current.subscriptionStatus).toBe("not-subscribed");
    });

    const response = await act(async () => result.current.requestPermission());

    expect(response.ok).toBe(true);
    expect(response.permission).toBe("granted");

    await waitFor(() => {
      expect(result.current.permission).toBe("granted");
      expect(result.current.subscriptionStatus).toBe("subscribed");
    });

    expect(requestPermissionSpy).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
  });

  it("does not auto-request permission on mount", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user-1" }, expires: "" },
      status: "authenticated",
    });

    const { usePushReminders } = await import("../usePushReminders");

    renderHook(() => usePushReminders());

    expect(requestPermissionSpy).not.toHaveBeenCalled();
  });
});
