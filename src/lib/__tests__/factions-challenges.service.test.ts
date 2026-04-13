import { describe, expect, it } from "vitest";
import type {
  ChallengeAttempt,
  ChallengeEntity,
  ChallengePack,
  FactionMembership,
} from "../types";
import {
  buildWeeklyFactionRankings,
  computeChallengeStreak,
  getUtcWeekWindow,
  projectChallengeHistory,
  projectChallengeLeaderboard,
  projectChallengePackProgress,
  recordChallengeAttempt,
  resolveFactionSnapshot,
} from "../faction-challenge.service";

function makeFactionMembership(
  overrides: Partial<FactionMembership> = {}
): FactionMembership {
  return {
    userId: "user-1",
    username: "luffy",
    factionId: "marines-1",
    factionName: "Marines",
    factionSlug: "marines",
    visibility: "public",
    joinedAtUtc: "2026-04-13T00:00:00.000Z",
    updatedAtUtc: "2026-04-13T00:00:00.000Z",
    ...overrides,
  };
}

function makeChallengeEntity(
  overrides: Partial<ChallengeEntity> = {}
): ChallengeEntity {
  return {
    challengeId: "challenge-1",
    packId: "pack-1",
    slug: "week-1",
    title: "Week 1",
    targetCharacterId: "luffy",
    ruleset: "classic",
    runKind: "challenge",
    weekStartUtc: "2026-04-13T00:00:00.000Z",
    scheduledAtUtc: "2026-04-13T00:00:00.000Z",
    createdAtUtc: "2026-04-12T12:00:00.000Z",
    isActive: true,
    factionSnapshot: {
      factionId: "alpha-1",
      factionName: "Alpha",
      factionSlug: "alpha",
    },
    ...overrides,
  };
}

function makeChallengePack(
  overrides: Partial<ChallengePack> = {}
): ChallengePack {
  return {
    packId: "pack-1",
    slug: "season-1",
    title: "Season 1",
    description: "Opening pack",
    challengeIds: ["challenge-1", "challenge-2", "challenge-3"],
    startsAtUtc: "2026-04-13T00:00:00.000Z",
    endsAtUtc: "2026-04-19T23:59:59.999Z",
    publishedAtUtc: "2026-04-12T12:00:00.000Z",
    visibility: "public",
    ...overrides,
  };
}

describe("faction-challenge.service", () => {
  it("uses Monday 00:00:00Z as the UTC week bucket start", () => {
    expect(getUtcWeekWindow("2026-04-15T12:34:56.000Z")).toEqual({
      weekStartUtc: "2026-04-13T00:00:00.000Z",
      weekEndUtc: "2026-04-19T23:59:59.999Z",
      weekKey: "2026-W16",
    });
  });

  it("prefers the competitive fact faction snapshot over the current membership", () => {
    const membership = makeFactionMembership({
      factionId: "pirates-9",
      factionName: "Pirates",
      factionSlug: "pirates",
    });

    expect(
      resolveFactionSnapshot(
        {
          factionId: "revolutionaries-1",
          factionName: "Revolutionaries",
          factionSlug: "revolutionary",
        },
        membership
      )
    ).toEqual({
      factionId: "revolutionaries-1",
      factionName: "Revolutionaries",
      factionSlug: "revolutionary",
    });
  });

  it("ranks weekly factions by points, average guesses, participants, then name", () => {
    const rows = buildWeeklyFactionRankings([
      {
        userId: "u-1",
        username: "alpha",
        factionSnapshot: {
          factionId: "alpha-1",
          factionName: "Alpha",
          factionSlug: "alpha",
        },
        guessCount: 2,
        isSolved: true,
        points: 4,
        completedAtUtc: "2026-04-13T00:10:00.000Z",
      },
      {
        userId: "u-5",
        username: "alpha-2",
        factionSnapshot: {
          factionId: "alpha-1",
          factionName: "Alpha",
          factionSlug: "alpha",
        },
        guessCount: 2,
        isSolved: true,
        points: 4,
        completedAtUtc: "2026-04-14T00:10:00.000Z",
      },
      {
        userId: "u-2",
        username: "bravo",
        factionSnapshot: {
          factionId: "bravo-1",
          factionName: "Bravo",
          factionSlug: "bravo",
        },
        guessCount: 2,
        isSolved: true,
        points: 8,
        completedAtUtc: "2026-04-14T00:10:00.000Z",
      },
      {
        userId: "u-3",
        username: "charlie",
        factionSnapshot: {
          factionId: "charlie-1",
          factionName: "Charlie",
          factionSlug: "charlie",
        },
        guessCount: 2,
        isSolved: true,
        points: 8,
        completedAtUtc: "2026-04-14T12:10:00.000Z",
      },
      {
        userId: "u-4",
        username: "delta",
        factionSnapshot: {
          factionId: "delta-1",
          factionName: "Delta",
          factionSlug: "delta",
        },
        guessCount: 4,
        isSolved: true,
        points: 12,
        completedAtUtc: "2026-04-15T00:10:00.000Z",
      },
    ]);

    expect(rows.map((row) => row.factionName)).toEqual([
      "Delta",
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(rows[0].percentile).toBe(100);
    expect(rows[3].participantCount).toBe(1);
  });

  it("projects challenge history with skipped entries that do not break streaks", () => {
    const challengeMap = {
      "challenge-1": makeChallengeEntity({
        challengeId: "challenge-1",
        createdAtUtc: "2026-04-13T00:00:00.000Z",
      }),
      "challenge-2": makeChallengeEntity({
        challengeId: "challenge-2",
        scheduledAtUtc: "2026-04-14T00:00:00.000Z",
        createdAtUtc: "2026-04-13T00:00:00.000Z",
      }),
      "challenge-3": makeChallengeEntity({
        challengeId: "challenge-3",
        scheduledAtUtc: "2026-04-15T00:00:00.000Z",
        createdAtUtc: "2026-04-13T00:00:00.000Z",
      }),
    };

    const history = projectChallengeHistory({
      userId: "user-1",
      username: "luffy",
      challenges: Object.values(challengeMap),
      attempts: [
        {
          challengeId: "challenge-1",
          userId: "user-1",
          username: "luffy",
          guessCount: 3,
          isSolved: true,
          solvedAtUtc: "2026-04-13T00:10:00.000Z",
          completedAtUtc: "2026-04-13T00:10:00.000Z",
          factionSnapshot: {
            factionId: "alpha-1",
            factionName: "Alpha",
            factionSlug: "alpha",
          },
        },
        {
          challengeId: "challenge-3",
          userId: "user-1",
          username: "luffy",
          guessCount: 2,
          isSolved: true,
          solvedAtUtc: "2026-04-15T00:10:00.000Z",
          completedAtUtc: "2026-04-15T00:10:00.000Z",
          factionSnapshot: {
            factionId: "alpha-1",
            factionName: "Alpha",
            factionSlug: "alpha",
          },
        },
      ],
    });

    expect(history.map((row) => row.result)).toEqual([
      "solved",
      "skipped",
      "solved",
    ]);
    expect(history.map((row) => row.challengeStreak)).toEqual([1, 1, 2]);
    expect(computeChallengeStreak(history)).toBe(2);
  });

  it("records challenge attempts with the submit-time faction snapshot", () => {
    const attempt: ChallengeAttempt = recordChallengeAttempt({
      attemptId: "attempt-1",
      challengeId: "challenge-1",
      userId: "user-1",
      username: "luffy",
      guessCount: 4,
      isSolved: true,
      solvedAtUtc: "2026-04-13T00:10:00.000Z",
      completedAtUtc: "2026-04-13T00:10:00.000Z",
      factionSnapshot: {
        factionId: "alpha-1",
        factionName: "Alpha",
        factionSlug: "alpha",
      },
    });

    expect(attempt.factionSnapshot).toEqual({
      factionId: "alpha-1",
      factionName: "Alpha",
      factionSlug: "alpha",
    });
    expect(attempt.isSolved).toBe(true);
  });

  it("projects pack progression and challenge leaderboard rows deterministically", () => {
    const pack = makeChallengePack();
    const challenges = [
      makeChallengeEntity({
        challengeId: "challenge-1",
        packId: pack.packId,
        scheduledAtUtc: "2026-04-13T00:00:00.000Z",
      }),
      makeChallengeEntity({
        challengeId: "challenge-2",
        packId: pack.packId,
        scheduledAtUtc: "2026-04-14T00:00:00.000Z",
      }),
      makeChallengeEntity({
        challengeId: "challenge-3",
        packId: pack.packId,
        scheduledAtUtc: "2026-04-15T00:00:00.000Z",
      }),
    ];

    const attempts = [
      {
        attemptId: "attempt-1",
        challengeId: "challenge-1",
        userId: "user-1",
        username: "luffy",
        guessCount: 2,
        isSolved: true,
        solvedAtUtc: "2026-04-13T00:10:00.000Z",
        completedAtUtc: "2026-04-13T00:10:00.000Z",
        factionSnapshot: {
          factionId: "alpha-1",
          factionName: "Alpha",
          factionSlug: "alpha",
        },
      },
      {
        attemptId: "attempt-2",
        challengeId: "challenge-1",
        userId: "user-2",
        username: "zoro",
        guessCount: 5,
        isSolved: true,
        solvedAtUtc: "2026-04-13T00:30:00.000Z",
        completedAtUtc: "2026-04-13T00:30:00.000Z",
        factionSnapshot: {
          factionId: "bravo-1",
          factionName: "Bravo",
          factionSlug: "bravo",
        },
      },
      {
        attemptId: "attempt-3",
        challengeId: "challenge-1",
        userId: "user-3",
        username: "ace",
        guessCount: 0,
        isSolved: false,
        solvedAtUtc: null,
        completedAtUtc: "2026-04-13T01:00:00.000Z",
        factionSnapshot: {
          factionId: "charlie-1",
          factionName: "Charlie",
          factionSlug: "charlie",
        },
      },
    ];

    const progress = projectChallengePackProgress({
      pack,
      challenges,
      attempts,
      userId: "user-1",
    });

    expect(progress.completedCount).toBe(1);
    expect(progress.totalCount).toBe(3);
    expect(progress.nextChallengeId).toBe("challenge-2");
    expect(progress.isComplete).toBe(false);

    const leaderboard = projectChallengeLeaderboard({
      challenge: challenges[0],
      attempts,
    });

    expect(leaderboard.map((row) => row.username)).toEqual([
      "luffy",
      "zoro",
      "ace",
    ]);
    expect(leaderboard[0].points).toBeGreaterThan(leaderboard[1].points);
    expect(leaderboard[0].participantCount).toBe(3);
  });
});
