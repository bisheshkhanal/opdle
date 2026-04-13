import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DailyComparison } from "../DailyComparison";
import React from "react";

// Mock useSession hook
vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

// We need a stable fetch mock
global.fetch = vi.fn();

describe("DailyComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    date: "2026-04-12",
    tier: "casual" as const,
    isWon: true,
    guessCount: 3,
    onSignInClick: vi.fn(),
  };

  it("renders anon state with sign-in prompt and global stats", async () => {
    const useSession = await import("@/lib/auth-client").then(
      (m) => m.useSession
    );
    (useSession as any).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        date: "2026-04-12",
        tier: "casual",
        sampleSize: 10,
        totalWins: 5,
        avgGuesses: 4.5,
        rank: null,
        percentile: null,
        userGuessCount: null,
        percentileMethod: "PERCENT_RANK",
        guessDistribution: [0, 0, 1, 2, 1, 1],
        trendWindowDays: 7,
        trendData: [],
        factionSlice: null,
      }),
    });

    render(<DailyComparison {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText("Today's Results")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to see your percentile and faction stats")
      ).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Players
      expect(screen.getByText("50%")).toBeInTheDocument(); // Win rate
    });

    // Check that distribution chart is rendered
    expect(screen.getByTestId("distribution-chart")).toBeInTheDocument();
  });

  it("renders low sample fallback when sample size < 5", async () => {
    const useSession = await import("@/lib/auth-client").then(
      (m) => m.useSession
    );
    (useSession as any).mockReturnValue({
      data: { user: { id: "user1" } },
      status: "authenticated",
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        date: "2026-04-12",
        tier: "casual",
        sampleSize: 3,
        totalWins: 3,
        avgGuesses: 2.0,
        rank: 1,
        percentile: 100,
        userGuessCount: 2,
        percentileMethod: "PERCENT_RANK",
        guessDistribution: [0, 1, 0, 0, 0, 0],
        trendWindowDays: 7,
        trendData: [],
        factionSlice: null,
      }),
    });

    render(<DailyComparison {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText("Today's Results")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Not enough data yet for charts and trends. Check back later!"
        )
      ).toBeInTheDocument();
    });

    // The charts should not be rendered
    expect(screen.queryByTestId("distribution-chart")).not.toBeInTheDocument();
  });

  it("renders charts and percentile for signed-in users with enough data", async () => {
    const useSession = await import("@/lib/auth-client").then(
      (m) => m.useSession
    );
    (useSession as any).mockReturnValue({
      data: { user: { id: "user1" } },
      status: "authenticated",
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        date: "2026-04-12",
        tier: "casual",
        sampleSize: 10,
        totalWins: 5,
        avgGuesses: 4.5,
        rank: 2,
        percentile: 88,
        userGuessCount: 3,
        percentileMethod: "PERCENT_RANK",
        guessDistribution: [0, 0, 1, 2, 1, 1],
        trendWindowDays: 7,
        trendData: [{ date: "2026-04-12", percentile: 88 }],
        factionSlice: {
          factionSlug: "pirates",
          sampleSize: 5,
          totalWins: 3,
          avgGuesses: 4.0,
          rank: null,
          percentile: null,
          guessDistribution: [0, 0, 1, 1, 1, 0],
        },
      }),
    });

    render(<DailyComparison {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("percentile-messaging")).toBeInTheDocument();
      expect(screen.getByText("You're in the top 88%!")).toBeInTheDocument();
    });

    // Check that distribution chart and user highlight are rendered
    expect(screen.getByTestId("distribution-chart")).toBeInTheDocument();
    expect(screen.getByTestId("dist-bar-3-highlight")).toBeInTheDocument();

    // Check faction slice
    expect(screen.getByTestId("faction-slice-row")).toBeInTheDocument();
    expect(screen.getByText("Pirates")).toBeInTheDocument();

    // Check trend section
    expect(screen.getByTestId("trend-section")).toBeInTheDocument();
  });
});
