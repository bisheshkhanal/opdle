import { describe, expect, it } from "vitest";
import {
  challengeCreationSchema,
  challengeHistoryQueryParamsSchema,
  challengePackIdentifierSchema,
  challengePlaySubmissionSchema,
  dailyComparisonAnalyticsQueryParamsSchema,
  factionSelectionUpdateSchema,
  parseAuthenticatedMutation,
  weeklyLeaderboardFiltersSchema,
} from "../validators";

describe("social validator contracts", () => {
  it("parses the new social payloads and query params", () => {
    expect(
      factionSelectionUpdateSchema.parse({ factionSlug: "pirates" })
    ).toEqual({ factionSlug: "pirates" });

    expect(
      weeklyLeaderboardFiltersSchema.parse({
        weekKey: "2026-W01",
        factionSlug: "marines",
        tier: "nakama",
        limit: "25",
      })
    ).toEqual({
      weekKey: "2026-W01",
      factionSlug: "marines",
      tier: "nakama",
      limit: 25,
    });

    expect(
      challengeCreationSchema.parse({
        title: "Weekly raid",
        description: "Defeat the vice admiral",
        tierLevel: "fan",
        expiresAt: "2026-04-20T00:00:00.000Z",
      })
    ).toEqual({
      title: "Weekly raid",
      description: "Defeat the vice admiral",
      tierLevel: "fan",
      expiresAt: "2026-04-20T00:00:00.000Z",
    });

    expect(
      challengePlaySubmissionSchema.parse({
        challengeId: "550e8400-e29b-41d4-a716-446655440000",
        guessCount: 4,
        solvedAt: "2026-04-13T00:10:00.000Z",
        guessesSerialized: JSON.stringify([
          { characterId: "luffy", guessCount: 4 },
        ]),
      })
    ).toEqual({
      challengeId: "550e8400-e29b-41d4-a716-446655440000",
      guessCount: 4,
      solvedAt: "2026-04-13T00:10:00.000Z",
      guessesSerialized: JSON.stringify([
        { characterId: "luffy", guessCount: 4 },
      ]),
    });

    expect(
      challengeHistoryQueryParamsSchema.parse({
        userId: "user_1",
        challengeId: "challenge_1",
        packSlug: "spring-pack-1",
        solved: "true",
        cursor: "cursor_1",
        limit: "50",
      })
    ).toEqual({
      userId: "user_1",
      challengeId: "challenge_1",
      packSlug: "spring-pack-1",
      solved: true,
      cursor: "cursor_1",
      limit: 50,
    });

    expect(
      challengePackIdentifierSchema.parse({
        packSlug: "spring-pack-1",
        orderIndex: "7",
      })
    ).toEqual({
      packSlug: "spring-pack-1",
      orderIndex: 7,
    });

    expect(
      dailyComparisonAnalyticsQueryParamsSchema.parse({
        date: "2026-04-13",
        factionSlug: "warlords",
        includeHistoricalTrend: "false",
        trendWindowDays: "14",
      })
    ).toEqual({
      date: "2026-04-13",
      factionSlug: "warlords",
      includeHistoricalTrend: false,
      trendWindowDays: 14,
    });
  });

  it("applies the expected defaults for leaderboard and history filters", () => {
    expect(
      weeklyLeaderboardFiltersSchema.parse({ weekKey: "2026-W01" })
    ).toEqual({
      weekKey: "2026-W01",
      limit: 20,
    });

    expect(
      challengeHistoryQueryParamsSchema.parse({
        limit: "12",
      })
    ).toEqual({
      limit: 12,
    });
  });

  it("rejects invalid faction slugs and malformed week keys", () => {
    expect(
      factionSelectionUpdateSchema.safeParse({ factionSlug: "pirate" }).success
    ).toBe(false);

    expect(() =>
      weeklyLeaderboardFiltersSchema.parse({ weekKey: "2026-W99" })
    ).toThrow("Week key must be an ISO week between 01 and 53");
  });

  it("rejects anonymous mutation submissions", () => {
    const payload = {
      title: "Weekly raid",
      description: "Defeat the vice admiral",
      tierLevel: "fan" as const,
    };

    expect(() =>
      parseAuthenticatedMutation(challengeCreationSchema, payload, undefined)
    ).toThrow("Unauthorized");

    expect(() =>
      parseAuthenticatedMutation(challengeCreationSchema, payload, "")
    ).toThrow("Unauthorized");
  });

  it("handles challenge submission edge cases", () => {
    const validBase = {
      challengeId: "550e8400-e29b-41d4-a716-446655440000",
      solvedAt: "2026-04-13T00:10:00.000Z",
      guessesSerialized: JSON.stringify([{ id: "guess-1" }]),
    };

    expect(
      challengePlaySubmissionSchema.parse({
        ...validBase,
        guessCount: 1,
      }).guessCount
    ).toBe(1);

    expect(
      challengePlaySubmissionSchema.parse({
        ...validBase,
        guessCount: 10,
      }).guessCount
    ).toBe(10);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        challengeId: "not-a-uuid",
        guessCount: 4,
      }).success
    ).toBe(false);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        guessCount: 0,
      }).success
    ).toBe(false);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        guessCount: 11,
      }).success
    ).toBe(false);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        guessCount: 4,
        solvedAt: "2026-04-13",
      }).success
    ).toBe(false);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        guessCount: 4,
        guessesSerialized: "not-json",
      }).success
    ).toBe(false);

    expect(
      challengePlaySubmissionSchema.safeParse({
        ...validBase,
        guessCount: 4,
        guessesSerialized: JSON.stringify({ guess: 1 }),
      }).success
    ).toBe(false);
  });
});
