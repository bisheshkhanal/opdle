import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockStorage = {
  dailyStats: {
    casual: { streak: 3, maxStreak: 5, winDistribution: {} },
    fan: { streak: 0, maxStreak: 0, winDistribution: {} },
    nakama: { streak: 0, maxStreak: 0, winDistribution: {} },
  },
  infiniteStats: {
    casual: {
      totalWins: 10,
      totalGames: 15,
      streak: 2,
      maxStreak: 4,
      winDistribution: {},
    },
    fan: {
      totalWins: 0,
      totalGames: 0,
      streak: 0,
      maxStreak: 0,
      winDistribution: {},
    },
    nakama: {
      totalWins: 0,
      totalGames: 0,
      streak: 0,
      maxStreak: 0,
      winDistribution: {},
    },
  },
};

const { mockUseSession, mockLoadStorage } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockLoadStorage: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: mockUseSession,
}));

vi.mock("@/lib/storage", () => ({
  loadStorage: mockLoadStorage,
}));

describe("useAuthSync", () => {
  let fetchSpy = vi.fn<() => Promise<Response>>();

  beforeEach(() => {
    mockLoadStorage.mockReturnValue(mockStorage);
    fetchSpy = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not sync when status is unauthenticated", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    renderHook(() => useAuthSync());

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it("does not sync when status is loading", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });

    const { useAuthSync } = await import("../useAuthSync");
    renderHook(() => useAuthSync());

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it("syncs once when status becomes authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "uuid-1", name: "luffy" }, expires: "" },
      status: "authenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    renderHook(() => useAuthSync());

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/stats/sync",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("syncDailyResult does nothing when not authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    const { result } = renderHook(() => useAuthSync());

    act(() => {
      result.current.syncDailyResult({
        date: "2026-03-30",
        tier: "casual",
        guessCount: 3,
        isWon: true,
        hintUsed: false,
      });
    });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      "/api/stats/daily-result",
      expect.anything()
    );
  });

  it("syncDailyResult calls /api/stats/daily-result when authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "uuid-1", name: "luffy" }, expires: "" },
      status: "authenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    const { result } = renderHook(() => useAuthSync());

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/stats/sync",
        expect.anything()
      );
    });

    fetchSpy.mockClear();

    act(() => {
      result.current.syncDailyResult({
        date: "2026-03-30",
        tier: "casual",
        guessCount: 3,
        isWon: true,
        hintUsed: false,
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stats/daily-result",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          date: "2026-03-30",
          tier: "casual",
          guessCount: 3,
          isWon: true,
          hintUsed: false,
        }),
      })
    );
  });

  it("syncDailyResult stays silent for signed-out sessions even with stale user data", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "uuid-1", name: "luffy" }, expires: "" },
      status: "unauthenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    const { result } = renderHook(() => useAuthSync());

    act(() => {
      result.current.syncDailyResult({
        date: "2026-03-30",
        tier: "casual",
        guessCount: 3,
        isWon: true,
        hintUsed: false,
      });
    });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      "/api/stats/daily-result",
      expect.anything()
    );
  });

  it("swallows fetch errors silently", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "uuid-1", name: "luffy" }, expires: "" },
      status: "authenticated",
    });
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const { useAuthSync } = await import("../useAuthSync");

    expect(() => renderHook(() => useAuthSync())).not.toThrow();
  });

  it("isAuthenticated returns true when authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "uuid-1", name: "luffy" }, expires: "" },
      status: "authenticated",
    });

    const { useAuthSync } = await import("../useAuthSync");
    const { result } = renderHook(() => useAuthSync());

    expect(result.current.isAuthenticated).toBe(true);
  });
});
