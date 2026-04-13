import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  factionMemberships,
  userStats,
  users,
  userProgression,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { tierSchema, modeSchema } from "@/lib/validators";
import { getFactionBySlug } from "@/lib/factions";

// 60-second revalidation via Next.js cache
export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tierParsed = tierSchema.safeParse(searchParams.get("tier"));
  const modeParsed = modeSchema.safeParse(searchParams.get("mode"));
  const includeFaction = searchParams.get("includeFaction") === "true";

  if (!tierParsed.success || !modeParsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid tier or mode. tier: casual|fan|nakama, mode: daily|infinite",
      },
      { status: 400 }
    );
  }

  const rows = includeFaction
    ? await db
        .select({
          username: users.username,
          maxStreak: userStats.maxStreak,
          totalWins: userStats.totalWins,
          totalGames: userStats.totalGames,
          achievementCount: userProgression.achievementCount,
          completedSagaCount: userProgression.completedSagaCount,
          completedCollectionCount: userProgression.completedCollectionCount,
          factionSlug: factionMemberships.factionSlug,
        })
        .from(userStats)
        .innerJoin(users, eq(users.id, userStats.userId))
        .leftJoin(userProgression, eq(users.id, userProgression.userId))
        .leftJoin(factionMemberships, eq(users.id, factionMemberships.userId))
        .where(
          and(
            eq(userStats.tier, tierParsed.data),
            eq(userStats.mode, modeParsed.data)
          )
        )
        .orderBy(desc(userStats.maxStreak), desc(userStats.totalWins))
        .limit(50)
    : await db
        .select({
          username: users.username,
          maxStreak: userStats.maxStreak,
          totalWins: userStats.totalWins,
          totalGames: userStats.totalGames,
          achievementCount: userProgression.achievementCount,
          completedSagaCount: userProgression.completedSagaCount,
          completedCollectionCount: userProgression.completedCollectionCount,
        })
        .from(userStats)
        .innerJoin(users, eq(users.id, userStats.userId))
        .leftJoin(userProgression, eq(users.id, userProgression.userId))
        .where(
          and(
            eq(userStats.tier, tierParsed.data),
            eq(userStats.mode, modeParsed.data)
          )
        )
        .orderBy(desc(userStats.maxStreak), desc(userStats.totalWins))
        .limit(50);

  return NextResponse.json(
    rows.map((row) => {
      const baseRow = {
        username: row.username,
        maxStreak: row.maxStreak,
        totalWins: row.totalWins,
        totalGames: row.totalGames,
        achievementCount: row.achievementCount ?? 0,
        completedSagaCount: row.completedSagaCount ?? 0,
        completedCollectionCount: row.completedCollectionCount ?? 0,
      };

      if (!includeFaction) {
        return baseRow;
      }

      const factionRow = row as typeof row & { factionSlug?: string | null };
      const faction = factionRow.factionSlug
        ? getFactionBySlug(factionRow.factionSlug)
        : undefined;

      return {
        ...baseRow,
        factionMembership: factionRow.factionSlug
          ? {
              factionId: faction?.factionId ?? factionRow.factionSlug,
              factionName: faction?.factionName ?? factionRow.factionSlug,
              factionSlug: factionRow.factionSlug,
            }
          : null,
      };
    }),
    {
      headers: CACHE_HEADERS,
    }
  );
}
