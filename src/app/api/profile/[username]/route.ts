import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  challengeAttempts,
  challengePackEntries,
  challengePacks,
  factionMemberships,
  monthlyCollections,
  userAchievements,
  userProgression,
  userStats,
  users,
  weeklyFactionAggregates,
} from "@/lib/db/schema";
import { getCurrentWeekKey, getFactionBySlug } from "@/lib/factions";
import { computeChallengeStreak } from "@/lib/faction-challenge.service";
import type {
  ChallengeHistoryRow,
  ChallengeSummary,
  FactionSummary,
} from "@/lib/types";
import { getAchievementDef } from "@/lib/progression/achievementCatalog";

export const dynamic = "force-dynamic";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function buildFactionSummary(options: {
  factionSlug: string;
  joinedAt: Date | string;
  weeklyContribution: { points: number; avgGuesses: number | null } | null;
}): FactionSummary {
  const faction = getFactionBySlug(options.factionSlug);

  return {
    factionSlug: options.factionSlug,
    displayName: faction?.factionName ?? options.factionSlug,
    weeklyContribution: options.weeklyContribution,
    memberSince: toIsoString(options.joinedAt) ?? "",
  };
}

function buildChallengeSummary(options: {
  attempts: Array<{
    challengeId: string;
    guessCount: number;
    solvedAt: Date | string | null;
    createdAt: Date | string;
  }>;
  factionSlug: string | null;
  packCompletions: number;
}): ChallengeSummary {
  const orderedAttempts = [...options.attempts].sort((left, right) => {
    const leftCompletedAt = toIsoString(left.createdAt) ?? "";
    const rightCompletedAt = toIsoString(right.createdAt) ?? "";

    if (leftCompletedAt !== rightCompletedAt) {
      return leftCompletedAt.localeCompare(rightCompletedAt);
    }

    return left.challengeId.localeCompare(right.challengeId);
  });

  const faction = options.factionSlug
    ? getFactionBySlug(options.factionSlug)
    : null;
  const factionSnapshot = faction
    ? {
        factionId: faction.factionId,
        factionName: faction.factionName,
        factionSlug: faction.factionSlug,
      }
    : {
        factionId: "unknown",
        factionName: "Unknown",
        factionSlug: "unknown",
      };

  const projectedRows: ChallengeHistoryRow[] = orderedAttempts.map(
    (attempt) => ({
      challengeId: attempt.challengeId,
      packId: "public-profile",
      userId: "public-profile",
      username: "public-profile",
      result: attempt.solvedAt ? "solved" : "failed",
      guessCount: attempt.guessCount,
      solvedAtUtc: toIsoString(attempt.solvedAt),
      completedAtUtc: toIsoString(attempt.createdAt) ?? "",
      challengeStreak: 0,
      summaryVisibility: "public",
      factionSnapshot,
    })
  );

  let bestStreak = 0;
  let currentRun = 0;
  for (const row of projectedRows) {
    if (row.result === "solved") {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return {
    totalChallenges: options.attempts.length,
    wins: options.attempts.filter((attempt) => Boolean(attempt.solvedAt))
      .length,
    currentStreak: computeChallengeStreak(projectedRows),
    bestStreak,
    packCompletions: options.packCompletions,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  const [userRow] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username));

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = {
    id: userRow.id,
    username: userRow.username,
    createdAt: userRow.createdAt,
  };

  const stats = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, user.id));

  const [progressionRow] = await db
    .select({
      completedSagaCount: userProgression.completedSagaCount,
      achievementCount: userProgression.achievementCount,
      completedCollectionCount: userProgression.completedCollectionCount,
    })
    .from(users)
    .leftJoin(userProgression, eq(users.id, userProgression.userId))
    .where(eq(users.username, username));

  const recentAchievementRows = await db
    .select({
      id: userAchievements.achievementId,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(users)
    .leftJoin(userAchievements, eq(users.id, userAchievements.userId))
    .where(eq(users.username, username))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(5);

  const completedCollectionRows = await db
    .select({
      seasonKey: monthlyCollections.seasonKey,
      collectibleType: monthlyCollections.collectibleType,
      completedAt: monthlyCollections.completedAt,
    })
    .from(users)
    .leftJoin(monthlyCollections, eq(users.id, monthlyCollections.userId))
    .where(eq(users.username, username))
    .orderBy(desc(monthlyCollections.completedAt));

  const recentAchievements = recentAchievementRows.flatMap((row) => {
    if (!row.id || !row.unlockedAt) {
      return [];
    }

    const achievement = getAchievementDef(row.id);

    return [
      {
        id: row.id,
        label: achievement?.label ?? row.id,
        unlockedAt: toIsoString(row.unlockedAt) ?? "",
      },
    ];
  });

  const completedCollections = completedCollectionRows
    .filter((row) => row.seasonKey && row.completedAt)
    .map((row) => ({
      seasonKey: row.seasonKey,
      collectibleType: row.collectibleType,
      completedAt: toIsoString(row.completedAt) ?? "",
    }));

  const [membershipRow] = await db
    .select({
      factionSlug: factionMemberships.factionSlug,
      joinedAt: factionMemberships.joinedAt,
    })
    .from(factionMemberships)
    .where(eq(factionMemberships.userId, user.id));

  let factionSummary: FactionSummary | null = null;
  if (membershipRow) {
    const [weeklyContributionRow] = await db
      .select({
        points: weeklyFactionAggregates.totalPoints,
        avgGuesses: weeklyFactionAggregates.avgGuesses,
      })
      .from(weeklyFactionAggregates)
      .where(
        and(
          eq(weeklyFactionAggregates.weekKey, getCurrentWeekKey()),
          eq(weeklyFactionAggregates.factionSlug, membershipRow.factionSlug)
        )
      );

    factionSummary = buildFactionSummary({
      factionSlug: membershipRow.factionSlug,
      joinedAt: membershipRow.joinedAt,
      weeklyContribution: weeklyContributionRow
        ? {
            points: weeklyContributionRow.points,
            avgGuesses: weeklyContributionRow.avgGuesses,
          }
        : null,
    });
  }

  const challengeAttemptRows = await db
    .select({
      challengeId: challengeAttempts.challengeId,
      guessCount: challengeAttempts.guessCount,
      solvedAt: challengeAttempts.solvedAt,
      createdAt: challengeAttempts.createdAt,
    })
    .from(challengeAttempts)
    .where(eq(challengeAttempts.userId, user.id))
    .orderBy(desc(challengeAttempts.createdAt));

  let challengeSummary: ChallengeSummary | null = null;
  if (challengeAttemptRows.length > 0) {
    const [packRows, packEntryRows] = await Promise.all([
      db.select().from(challengePacks),
      db.select().from(challengePackEntries),
    ]);

    const solvedChallengeIds = new Set(
      challengeAttemptRows
        .filter((row) => row.solvedAt)
        .map((row) => row.challengeId)
    );

    const packEntriesByPackId = new Map<string, string[]>();
    for (const entryRow of packEntryRows) {
      const entries = packEntriesByPackId.get(entryRow.packId);

      if (entries) {
        entries.push(entryRow.challengeId);
      } else {
        packEntriesByPackId.set(entryRow.packId, [entryRow.challengeId]);
      }
    }

    const packCompletions = packRows.filter((packRow) => {
      const challengeIds = packEntriesByPackId.get(packRow.id) ?? [];

      return (
        challengeIds.length > 0 &&
        challengeIds.every((challengeId) => solvedChallengeIds.has(challengeId))
      );
    }).length;

    challengeSummary = buildChallengeSummary({
      attempts: challengeAttemptRows,
      factionSlug: membershipRow?.factionSlug ?? null,
      packCompletions,
    });
  }

  return NextResponse.json({
    user: {
      ...user,
      faction: factionSummary
        ? {
            factionId:
              getFactionBySlug(factionSummary.factionSlug)?.factionId ??
              factionSummary.factionSlug,
            factionName: factionSummary.displayName,
            factionSlug: factionSummary.factionSlug,
          }
        : null,
    },
    stats,
    meta: {
      completedSagaCount: progressionRow?.completedSagaCount ?? 0,
      achievementCount: progressionRow?.achievementCount ?? 0,
      completedCollectionCount: progressionRow?.completedCollectionCount ?? 0,
      recentAchievements,
      completedCollections,
    },
    factionSummary,
    challengeSummary,
  });
}
