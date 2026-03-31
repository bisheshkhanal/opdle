import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userStats } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { statsSyncSchema } from "@/lib/validators";

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

  const parsed = statsSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { dailyStats, infiniteStats } = parsed.data;
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

  return NextResponse.json({ ok: true });
}
