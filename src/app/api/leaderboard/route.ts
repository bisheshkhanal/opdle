import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userStats, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { tierSchema, modeSchema } from "@/lib/validators";

// 60-second revalidation via Next.js cache
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tierParsed = tierSchema.safeParse(searchParams.get("tier"));
  const modeParsed = modeSchema.safeParse(searchParams.get("mode"));

  if (!tierParsed.success || !modeParsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid tier or mode. tier: casual|fan|nakama, mode: daily|infinite",
      },
      { status: 400 }
    );
  }

  const rows = await db
    .select({
      username: users.username,
      maxStreak: userStats.maxStreak,
      totalWins: userStats.totalWins,
      totalGames: userStats.totalGames,
    })
    .from(userStats)
    .innerJoin(users, eq(users.id, userStats.userId))
    .where(
      and(
        eq(userStats.tier, tierParsed.data),
        eq(userStats.mode, modeParsed.data)
      )
    )
    .orderBy(desc(userStats.maxStreak), desc(userStats.totalWins))
    .limit(50);

  return NextResponse.json(rows);
}
