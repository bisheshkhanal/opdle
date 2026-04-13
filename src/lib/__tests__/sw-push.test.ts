import { beforeEach, describe, expect, it, vi } from "vitest";

type SwMock = {
  location: { origin: string };
  registration: {
    showNotification: ReturnType<typeof vi.fn>;
  };
};

type ClientsMock = {
  matchAll: ReturnType<typeof vi.fn>;
  openWindow: ReturnType<typeof vi.fn>;
};

let swMock: SwMock;
let clientsMock: ClientsMock;

describe("service worker push handling", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();

    swMock = {
      location: { origin: "https://onepiecedle.com" },
      registration: {
        showNotification: vi.fn(),
      },
    };

    clientsMock = {
      matchAll: vi.fn(),
      openWindow: vi.fn(),
    };

    Object.defineProperty(globalThis, "self", {
      value: swMock,
      configurable: true,
    });

    Object.defineProperty(globalThis, "clients", {
      value: clientsMock,
      configurable: true,
    });
  });

  it("shows a notification for a valid push payload", async () => {
    const { handlePushEvent } = await import("../sw");
    let pending: Promise<unknown> | undefined;

    const event = {
      data: {
        text: () =>
          JSON.stringify({
            title: "Daily challenge ready",
            body: "Your new puzzle is live.",
            url: "/?mode=daily&tier=fan",
          }),
      },
      waitUntil: vi.fn((promise: Promise<unknown>) => {
        pending = promise;
      }),
    };

    handlePushEvent(event as never);

    await pending;

    expect(swMock.registration.showNotification).toHaveBeenCalledWith(
      "Daily challenge ready",
      {
        body: "Your new puzzle is live.",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: { url: "https://onepiecedle.com/?mode=daily&tier=fan" },
      }
    );
  });

  it.each([
    ["invalid JSON", "not-json"],
    [
      "missing required fields",
      JSON.stringify({ title: "Only title", body: "Missing url" }),
    ],
  ])("drops %s payloads without showing a notification", async (_, payload) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { handlePushEvent } = await import("../sw");
    let pending: Promise<unknown> | undefined;

    const event = {
      data: {
        text: () => payload,
      },
      waitUntil: vi.fn((promise: Promise<unknown>) => {
        pending = promise;
      }),
    };

    handlePushEvent(event as never);

    await pending;

    expect(swMock.registration.showNotification).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("focuses an existing client on notification click", async () => {
    const existingClient = {
      focus: vi.fn().mockResolvedValue(undefined),
    };
    const { handleNotificationClickEvent } = await import("../sw");
    let pending: Promise<unknown> | undefined;

    clientsMock.matchAll.mockResolvedValue([existingClient]);

    const event = {
      notification: {
        close: vi.fn(),
        data: { url: "/?mode=daily&tier=casual" },
      },
      waitUntil: vi.fn((promise: Promise<unknown>) => {
        pending = promise;
      }),
    };

    handleNotificationClickEvent(event as never);

    await pending;

    expect(event.notification.close).toHaveBeenCalledTimes(1);
    expect(existingClient.focus).toHaveBeenCalledTimes(1);
    expect(clientsMock.openWindow).not.toHaveBeenCalled();
  });

  it("opens a new window when no app client is available", async () => {
    const { handleNotificationClickEvent } = await import("../sw");
    let pending: Promise<unknown> | undefined;

    clientsMock.matchAll.mockResolvedValue([]);
    clientsMock.openWindow.mockResolvedValue(undefined);

    const event = {
      notification: {
        close: vi.fn(),
        data: { url: "/?mode=infinite" },
      },
      waitUntil: vi.fn((promise: Promise<unknown>) => {
        pending = promise;
      }),
    };

    handleNotificationClickEvent(event as never);

    await pending;

    expect(event.notification.close).toHaveBeenCalledTimes(1);
    expect(clientsMock.matchAll).toHaveBeenCalledWith({
      type: "window",
      includeUncontrolled: true,
    });
    expect(clientsMock.openWindow).toHaveBeenCalledWith(
      "https://onepiecedle.com/?mode=infinite"
    );
  });
});
