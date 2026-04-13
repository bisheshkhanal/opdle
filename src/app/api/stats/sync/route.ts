import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  monthlyCollections as monthlyCollectionsTable,
  userAchievements,
  userProgression,
  userStats,
} from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { statsSyncWithMetaSchema } from "@/lib/validators";

const TIERS = ["casual", "fan", "nakama"] as const;
const MODES = ["daily", "infinite"] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statsSyncWithMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    dailyStats,
    infiniteStats,
    metaProgression,
    achievementProgress,
    monthlyCollections,
  } = parsed.data;
  const userId = session.user.id;

  const rows = TIERS.flatMap((tier) =>
    MODES.map((mode) => {
      const stats = mode === "daily" ? dailyStats[tier] : infiniteStats[tier];
      return {
        userId,
        tier,
        mode,
        streak: stats.streak,
        maxStreak: stats.maxStreak,
        totalWins: mode === "infinite" ? infiniteStats[tier].totalWins : 0,
        totalGames: mode === "infinite" ? infiniteStats[tier].totalGames : 0,
        winDistribution: stats.winDistribution,
      };
    })
  );

  await db
    .insert(userStats)
    .values(rows)
    .onConflictDoUpdate({
      target: [userStats.userId, userStats.tier, userStats.mode],
      set: {
        streak: sql`GREATEST(user_stats.streak, EXCLUDED.streak)`,
        maxStreak: sql`GREATEST(user_stats.max_streak, EXCLUDED.max_streak)`,
        totalWins: sql`GREATEST(user_stats.total_wins, EXCLUDED.total_wins)`,
        totalGames: sql`GREATEST(user_stats.total_games, EXCLUDED.total_games)`,
        updatedAt: sql`now()`,
      },
    });

  if (metaProgression) {
    await db
      .insert(userProgression)
      .values({
        userId,
        progressionSnapshot: metaProgression.progressionSnapshot ?? {},
        completedSagaCount: metaProgression.completedSagaCount ?? 0,
        achievementCount: metaProgression.achievementCount ?? 0,
        completedCollectionCount: metaProgression.completedCollectionCount ?? 0,
      })
      .onConflictDoUpdate({
        target: userProgression.userId,
        set: {
          progressionSnapshot: sql`
            COALESCE(user_progression.progression_snapshot, '{}'::jsonb)
            || COALESCE(EXCLUDED.progression_snapshot, '{}'::jsonb)
          `,
          completedSagaCount: sql`GREATEST(user_progression.completed_saga_count, EXCLUDED.completed_saga_count)`,
          achievementCount: sql`GREATEST(user_progression.achievement_count, EXCLUDED.achievement_count)`,
          completedCollectionCount: sql`GREATEST(user_progression.completed_collection_count, EXCLUDED.completed_collection_count)`,
          updatedAt: sql`now()`,
        },
      });
  }

  if (achievementProgress) {
    const achievementRows = Object.entries(achievementProgress).map(
      ([achievementId, progress]) => ({
        userId,
        achievementId,
        seasonKey: progress.seasonKey ?? null,
        progress: progress.progress ?? 0,
        target: progress.target ?? 0,
        status: progress.status ?? "locked",
        unlockedAt: progress.unlockedAt ? new Date(progress.unlockedAt) : null,
        metadata: {
          lastUpdatedAt: progress.lastUpdatedAt,
        },
      })
    );

    if (achievementRows.length > 0) {
      await db
        .insert(userAchievements)
        .values(achievementRows)
        .onConflictDoUpdate({
          target: [userAchievements.userId, userAchievements.achievementId],
          set: {
            seasonKey: sql`COALESCE(EXCLUDED.season_key, user_achievements.season_key)`,
            progress: sql`GREATEST(user_achievements.progress, EXCLUDED.progress)`,
            target: sql`GREATEST(user_achievements.target, EXCLUDED.target)`,
            status: sql`
              CASE
                WHEN user_achievements.status = 'unlocked' OR EXCLUDED.status = 'unlocked' THEN 'unlocked'
                WHEN user_achievements.status = 'revealed' OR EXCLUDED.status = 'revealed' THEN 'revealed'
                ELSE COALESCE(EXCLUDED.status, user_achievements.status)
              END
            `,
            unlockedAt: sql`COALESCE(user_achievements.unlocked_at, EXCLUDED.unlocked_at)`,
            metadata: sql`
              COALESCE(user_achievements.metadata, '{}'::jsonb)
              || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
            `,
          },
        });
    }
  }

  if (monthlyCollections?.seasons) {
    const monthlyRows = Object.entries(monthlyCollections.seasons)
      .filter(([, season]) =>
        Boolean(season.collectibleId && season.collectibleType)
      )
      .map(([seasonKey, season]) => ({
        userId,
        seasonKey,
        collectibleId: season.collectibleId as string,
        collectibleType: season.collectibleType as
          | "bounty-poster"
          | "vivre-card",
        revealedDays: season.revealedDays ?? [],
        revealedFragmentIndexes: season.revealedFragmentIndexes ?? [],
        targetFragments: season.targetFragments ?? 24,
        completedAt: season.completedAt ? new Date(season.completedAt) : null,
      }));

    if (monthlyRows.length > 0) {
      await db
        .insert(monthlyCollectionsTable)
        .values(monthlyRows)
        .onConflictDoUpdate({
          target: [
            monthlyCollectionsTable.userId,
            monthlyCollectionsTable.seasonKey,
          ],
          set: {
            collectibleId: sql`COALESCE(EXCLUDED.collectible_id, monthly_collections.collectible_id)`,
            collectibleType: sql`COALESCE(EXCLUDED.collectible_type, monthly_collections.collectible_type)`,
            revealedDays: sql`
              (SELECT ARRAY(
                SELECT DISTINCT day
                FROM unnest(
                  COALESCE(monthly_collections.revealed_days, '{}'::text[])
                  || COALESCE(EXCLUDED.revealed_days, '{}'::text[])
                ) AS day
              ))
            `,
            revealedFragmentIndexes: sql`
              (SELECT ARRAY(
                SELECT DISTINCT fragment_index
                FROM unnest(
                  COALESCE(monthly_collections.revealed_fragment_indexes, '{}'::integer[])
                  || COALESCE(EXCLUDED.revealed_fragment_indexes, '{}'::integer[])
                ) AS fragment_index
              ))
            `,
            targetFragments: sql`GREATEST(monthly_collections.target_fragments, EXCLUDED.target_fragments)`,
            completedAt: sql`COALESCE(monthly_collections.completed_at, EXCLUDED.completed_at)`,
            updatedAt: sql`now()`,
          },
        });
    }
  }

  return NextResponse.json({ ok: true });
}
