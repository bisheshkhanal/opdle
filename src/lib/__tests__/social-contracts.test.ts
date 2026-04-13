import { describe, expect, it } from "vitest";
import type {
  ChallengeAttempt,
  ChallengeEntity,
  ChallengeHistoryRow,
  ChallengeLeaderboardRow,
  ChallengePack,
  DailyComparisonDTO,
  FactionMembership,
  ShareCardPayload,
  WeeklyFactionRankingRow,
} from "../types";
import {
  challengeAttemptSchema,
  challengeEntitySchema,
  challengeHistoryRowSchema,
  challengeLeaderboardRowSchema,
  challengePackSchema,
  dailyComparisonDtoSchema,
  factionMembershipSchema,
  shareCardPayloadSchema,
  weeklyFactionRankingRowSchema,
} from "../validators";

function isoWeekStartUtc(dateString: string): string {
  const date = new Date(dateString);
  const utcDay = (date.getUTCDay() + 6) % 7;
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  start.setUTCDate(start.getUTCDate() - utcDay);
  start.setUTCHours(0, 0, 0, 0);

  return start.toISOString();
}

function makeFactionMembership(): FactionMembership {
  return {
    userId: "user_1",
    username: "luffy",
    factionId: "straw-hat-pirates",
    factionName: "Straw Hat Pirates",
    factionSlug: "straw-hat-pirates",
    visibility: "public",
    joinedAtUtc: "2026-04-13T00:00:00.000Z",
    updatedAtUtc: "2026-04-13T00:00:00.000Z",
  };
}

function makeWeeklyRankingRow(
  overrides: Partial<WeeklyFactionRankingRow> = {}
): WeeklyFactionRankingRow {
  return {
    weekStartUtc: "2026-04-13T00:00:00.000Z",
    weekEndUtc: "2026-04-19T23:59:59.999Z",
    factionId: "straw-hat-pirates",
    factionName: "Straw Hat Pirates",
    factionSlug: "straw-hat-pirates",
    points: 120,
    avgGuesses: 3.4,
    participantCount: 18,
    rank: 1,
    percentile: 100,
    ...overrides,
  };
}

function makeShareCardPayload(): ShareCardPayload {
  return {
    title: "Onepiecedle",
    mode: "daily",
    runKind: "daily",
    ruleset: "classic",
    shareText: "🏴‍☠️ Onepiecedle Daily #1\n3/6 guesses",
    textFallback: "Onepiecedle Daily #1 — 3/6",
    shareUrl: "https://example.com/share/abc",
    createdAtUtc: "2026-04-13T00:00:00.000Z",
  };
}

function makeChallengeEntity(): ChallengeEntity {
  return {
    challengeId: "challenge-2026-04-13",
    packId: "weekly-pack-1",
    slug: "week-1-luffy",
    title: "Week 1: Luffy",
    targetCharacterId: "luffy",
    ruleset: "classic",
    runKind: "challenge",
    weekStartUtc: "2026-04-13T00:00:00.000Z",
    scheduledAtUtc: "2026-04-13T00:00:00.000Z",
    createdAtUtc: "2026-04-12T12:00:00.000Z",
    isActive: true,
    factionSnapshot: {
      factionId: "straw-hat-pirates",
      factionName: "Straw Hat Pirates",
      factionSlug: "straw-hat-pirates",
    },
  };
}

function makeChallengeAttempt(): ChallengeAttempt {
  return {
    attemptId: "attempt-1",
    challengeId: "challenge-2026-04-13",
    userId: "user_1",
    username: "luffy",
    guessCount: 3,
    isSolved: true,
    solvedAtUtc: "2026-04-13T00:10:00.000Z",
    completedAtUtc: "2026-04-13T00:10:00.000Z",
    factionSnapshot: {
      factionId: "straw-hat-pirates",
      factionName: "Straw Hat Pirates",
      factionSlug: "straw-hat-pirates",
    },
  };
}

function makeChallengePack(): ChallengePack {
  return {
    packId: "weekly-pack-1",
    slug: "week-1",
    title: "Week 1",
    description: "First challenge pack",
    challengeIds: ["challenge-2026-04-13"],
    startsAtUtc: "2026-04-13T00:00:00.000Z",
    endsAtUtc: "2026-04-19T23:59:59.999Z",
    publishedAtUtc: "2026-04-12T12:00:00.000Z",
    visibility: "public",
  };
}

function makeChallengeHistoryRow(): ChallengeHistoryRow {
  return {
    challengeId: "challenge-2026-04-13",
    userId: "user_1",
    username: "luffy",
    packId: "weekly-pack-1",
    result: "solved",
    guessCount: 3,
    solvedAtUtc: "2026-04-13T00:10:00.000Z",
    completedAtUtc: "2026-04-13T00:10:00.000Z",
    challengeStreak: 4,
    summaryVisibility: "public",
    factionSnapshot: {
      factionId: "straw-hat-pirates",
      factionName: "Straw Hat Pirates",
      factionSlug: "straw-hat-pirates",
    },
  };
}

function makeChallengeLeaderboardRow(): ChallengeLeaderboardRow {
  return {
    challengeId: "challenge-2026-04-13",
    userId: "user_1",
    username: "luffy",
    factionSnapshot: {
      factionId: "straw-hat-pirates",
      factionName: "Straw Hat Pirates",
      factionSlug: "straw-hat-pirates",
    },
    points: 50,
    avgGuesses: 3.2,
    participantCount: 18,
    rank: 1,
    percentile: 100,
  };
}

function makeDailyComparisonDto(): DailyComparisonDTO {
  return {
    date: "2026-04-13",
    tier: "casual",
    totalPlayers: 24,
    totalWins: 18,
    avgGuesses: 3.4,
    userRank: 5,
    userGuessCount: 4,
    percentRank: 75,
  };
}

describe("social contracts", () => {
  it("treats the UTC week boundary as Monday 00:00:00Z", () => {
    expect(isoWeekStartUtc("2026-04-13T12:34:56.000Z")).toBe(
      "2026-04-13T00:00:00.000Z"
    );
    expect(isoWeekStartUtc("2026-04-12T23:59:59.000Z")).toBe(
      "2026-04-06T00:00:00.000Z"
    );
  });

  it("keeps text-share fallback available for share cards", () => {
    const payload = makeShareCardPayload();

    expect(shareCardPayloadSchema.parse(payload)).toEqual(payload);
    expect(
      shareCardPayloadSchema.safeParse({
        ...payload,
        textFallback: "",
      }).success
    ).toBe(false);
  });

  it("requires authenticated competitive records to carry a user identity and faction snapshot", () => {
    const membership = makeFactionMembership();
    const attempt = makeChallengeAttempt();

    expect(factionMembershipSchema.parse(membership)).toEqual(membership);
    expect(challengeAttemptSchema.parse(attempt)).toEqual(attempt);
    expect(
      challengeAttemptSchema.safeParse({
        ...attempt,
        userId: "",
      }).success
    ).toBe(false);
  });

  it("keeps faction membership public and challenge summaries public", () => {
    expect(
      factionMembershipSchema.parse(makeFactionMembership()).visibility
    ).toBe("public");
    expect(
      challengeHistoryRowSchema.parse(makeChallengeHistoryRow())
        .summaryVisibility
    ).toBe("public");
  });

  it("locks competitive rows to immutable faction snapshots", () => {
    const entity = makeChallengeEntity();
    const history = makeChallengeHistoryRow();
    const leaderboard = makeChallengeLeaderboardRow();

    expect(challengeEntitySchema.parse(entity)).toEqual(entity);
    expect(challengeHistoryRowSchema.parse(history)).toEqual(history);
    expect(challengeLeaderboardRowSchema.parse(leaderboard)).toEqual(
      leaderboard
    );
  });

  it("sorts faction rankings by points, then avg guesses, then participant count, then name", () => {
    const rows = [
      makeWeeklyRankingRow({
        factionName: "Alpha",
        points: 120,
        avgGuesses: 3.2,
        participantCount: 15,
      }),
      makeWeeklyRankingRow({
        factionName: "Bravo",
        points: 120,
        avgGuesses: 3.2,
        participantCount: 10,
      }),
      makeWeeklyRankingRow({
        factionName: "Charlie",
        points: 120,
        avgGuesses: 3.2,
        participantCount: 15,
      }),
      makeWeeklyRankingRow({
        factionName: "Delta",
        points: 115,
        avgGuesses: 2.8,
        participantCount: 30,
      }),
    ];

    const sorted = [...rows].sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (left.avgGuesses !== right.avgGuesses) {
        return (
          (left.avgGuesses ?? Number.POSITIVE_INFINITY) -
          (right.avgGuesses ?? Number.POSITIVE_INFINITY)
        );
      }

      if (right.participantCount !== left.participantCount) {
        return right.participantCount - left.participantCount;
      }

      return left.factionName.localeCompare(right.factionName);
    });

    expect(sorted.map((row) => row.factionName)).toEqual([
      "Alpha",
      "Charlie",
      "Bravo",
      "Delta",
    ]);
  });

  it("represents percent rank on a 0 to 100 inclusive scale", () => {
    const dto = makeDailyComparisonDto();

    expect(dailyComparisonDtoSchema.parse(dto)).toEqual(dto);
    expect(
      dailyComparisonDtoSchema.safeParse({
        ...dto,
        percentRank: 101,
      }).success
    ).toBe(false);
    expect(
      weeklyFactionRankingRowSchema.parse(
        makeWeeklyRankingRow({ percentile: 0 })
      ).percentile
    ).toBe(0);
  });

  it("accepts challenge packs and history rows as public profile summaries", () => {
    expect(challengePackSchema.parse(makeChallengePack())).toEqual(
      makeChallengePack()
    );
    expect(challengeHistoryRowSchema.parse(makeChallengeHistoryRow())).toEqual(
      makeChallengeHistoryRow()
    );
  });
});
