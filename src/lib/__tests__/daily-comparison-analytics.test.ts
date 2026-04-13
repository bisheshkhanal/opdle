import { describe, expect, it } from "vitest";
import {
  buildDailyComparisonAnalytics,
  type DailyComparisonAnalyticsInput,
  type DailyComparisonResultFact,
} from "../daily-comparison-analytics";

function makeFact(
  overrides: Partial<DailyComparisonResultFact> = {}
): DailyComparisonResultFact {
  return {
    userId: "user-1",
    date: "2026-04-13",
    tier: "casual",
    guessCount: 4,
    isWon: true,
    factionSlug: null,
    completedAtUtc: "2026-04-13T00:10:00.000Z",
    ...overrides,
  };
}

function makeInput(
  overrides: Partial<DailyComparisonAnalyticsInput> = {}
): DailyComparisonAnalyticsInput {
  return {
    date: "2026-04-13",
    tier: "casual",
    results: [],
    viewerUserId: null,
    factionSlug: null,
    trendWindowDays: 3,
    percentileMethod: "PERCENT_RANK",
    ...overrides,
  };
}

describe("buildDailyComparisonAnalytics", () => {
  it("computes rank, percentile, distribution, and personal context for a signed-in viewer", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        viewerUserId: "user-3",
        results: [
          makeFact({ userId: "user-1", guessCount: 2 }),
          makeFact({ userId: "user-2", guessCount: 4 }),
          makeFact({ userId: "user-3", guessCount: 5 }),
          makeFact({ userId: "user-4", guessCount: 5 }),
          makeFact({ userId: "user-5", guessCount: 6, isWon: false }),
        ],
      })
    );

    expect(result.sampleSize).toBe(5);
    expect(result.rank).toBe(3);
    expect(result.percentile).toBe(33);
    expect(result.userGuessCount).toBe(5);
    expect(result.guessDistribution).toEqual([0, 1, 0, 1, 2, 0]);
    expect(result.percentileMethod).toBe("PERCENT_RANK");
    expect(result.factionSlice).toBeNull();
    expect(result.trendData).toEqual([
      {
        date: "2026-04-11",
        sampleSize: 0,
        totalWins: 0,
        avgGuesses: null,
        guessDistribution: [0, 0, 0, 0, 0, 0],
        percentile: null,
      },
      {
        date: "2026-04-12",
        sampleSize: 0,
        totalWins: 0,
        avgGuesses: null,
        guessDistribution: [0, 0, 0, 0, 0, 0],
        percentile: null,
      },
      {
        date: "2026-04-13",
        sampleSize: 5,
        totalWins: 4,
        avgGuesses: 4.0,
        guessDistribution: [0, 1, 0, 1, 2, 0],
        percentile: 100,
      },
    ]);
  });

  it("handles an all-loss cohort gracefully", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        results: [
          makeFact({ userId: "user-1", isWon: false, guessCount: 6 }),
          makeFact({ userId: "user-2", isWon: false, guessCount: 6 }),
        ],
      })
    );

    expect(result.sampleSize).toBe(2);
    expect(result.totalWins).toBe(0);
    expect(result.rank).toBeNull();
    expect(result.percentile).toBeNull();
    expect(result.userGuessCount).toBeNull();
    expect(result.guessDistribution).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("returns stable values for tiny samples", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        viewerUserId: "user-1",
        results: [makeFact({ userId: "user-1", guessCount: 1 })],
      })
    );

    expect(result.sampleSize).toBe(1);
    expect(result.rank).toBe(1);
    expect(result.percentile).toBe(100);
    expect(result.avgGuesses).toBe(1);
    expect(result.guessDistribution).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it("keeps tied ranks aligned with PERCENT_RANK semantics", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        viewerUserId: "user-2",
        results: [
          makeFact({ userId: "user-1", guessCount: 2 }),
          makeFact({ userId: "user-2", guessCount: 2 }),
          makeFact({ userId: "user-3", guessCount: 6, isWon: false }),
        ],
      })
    );

    expect(result.rank).toBe(1);
    expect(result.percentile).toBe(100);
    expect(result.guessDistribution).toEqual([0, 2, 0, 0, 0, 0]);
  });

  it("omits personal rank context for anonymous viewers while keeping cohort stats", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        results: [
          makeFact({ userId: "user-1", guessCount: 3 }),
          makeFact({ userId: "user-2", guessCount: 5 }),
        ],
      })
    );

    expect(result.rank).toBeNull();
    expect(result.percentile).toBeNull();
    expect(result.userGuessCount).toBeNull();
    expect(result.sampleSize).toBe(2);
    expect(result.totalWins).toBe(2);
  });

  it("filters a faction slice without changing the broader cohort view", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        viewerUserId: "user-3",
        factionSlug: "pirates",
        results: [
          makeFact({ userId: "user-1", factionSlug: "pirates", guessCount: 2 }),
          makeFact({ userId: "user-2", factionSlug: "marines", guessCount: 4 }),
          makeFact({ userId: "user-3", factionSlug: "pirates", guessCount: 5 }),
          makeFact({
            userId: "user-4",
            factionSlug: "pirates",
            guessCount: 6,
            isWon: false,
          }),
        ],
      })
    );

    expect(result.sampleSize).toBe(4);
    expect(result.rank).toBe(3);
    expect(result.factionSlice).toEqual({
      factionSlug: "pirates",
      sampleSize: 3,
      totalWins: 2,
      rank: 2,
      percentile: 0,
      avgGuesses: 3.5,
      guessDistribution: [0, 1, 0, 0, 1, 0],
    });
  });

  it("returns an empty-state payload when no cohort data exists", () => {
    const result = buildDailyComparisonAnalytics(makeInput());

    expect(result).toEqual({
      date: "2026-04-13",
      tier: "casual",
      sampleSize: 0,
      totalWins: 0,
      avgGuesses: null,
      rank: null,
      percentile: null,
      userGuessCount: null,
      percentileMethod: "PERCENT_RANK",
      guessDistribution: [0, 0, 0, 0, 0, 0],
      trendWindowDays: 3,
      trendData: [
        {
          date: "2026-04-11",
          sampleSize: 0,
          totalWins: 0,
          avgGuesses: null,
          guessDistribution: [0, 0, 0, 0, 0, 0],
          percentile: null,
        },
        {
          date: "2026-04-12",
          sampleSize: 0,
          totalWins: 0,
          avgGuesses: null,
          guessDistribution: [0, 0, 0, 0, 0, 0],
          percentile: null,
        },
        {
          date: "2026-04-13",
          sampleSize: 0,
          totalWins: 0,
          avgGuesses: null,
          guessDistribution: [0, 0, 0, 0, 0, 0],
          percentile: null,
        },
      ],
      factionSlice: null,
    });
  });

  it("builds a historical trend window from immutable daily results", () => {
    const result = buildDailyComparisonAnalytics(
      makeInput({
        trendWindowDays: 4,
        results: [
          makeFact({ date: "2026-04-10", userId: "user-1", guessCount: 6 }),
          makeFact({ date: "2026-04-11", userId: "user-1", guessCount: 5 }),
          makeFact({ date: "2026-04-11", userId: "user-2", guessCount: 4 }),
          makeFact({ date: "2026-04-13", userId: "user-3", guessCount: 2 }),
        ],
      })
    );

    expect(result.trendWindowDays).toBe(4);
    expect(result.trendData).toEqual([
      {
        date: "2026-04-10",
        sampleSize: 1,
        totalWins: 1,
        avgGuesses: 6,
        guessDistribution: [0, 0, 0, 0, 0, 1],
        percentile: 100,
      },
      {
        date: "2026-04-11",
        sampleSize: 2,
        totalWins: 2,
        avgGuesses: 4.5,
        guessDistribution: [0, 0, 0, 1, 1, 0],
        percentile: 100,
      },
      {
        date: "2026-04-12",
        sampleSize: 0,
        totalWins: 0,
        avgGuesses: null,
        guessDistribution: [0, 0, 0, 0, 0, 0],
        percentile: null,
      },
      {
        date: "2026-04-13",
        sampleSize: 1,
        totalWins: 1,
        avgGuesses: 2,
        guessDistribution: [0, 1, 0, 0, 0, 0],
        percentile: 100,
      },
    ]);
  });
});
