import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyResults } from "@/lib/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { tierSchema } from "@/lib/validators";
import { z } from "zod";

export const revalidate = 60;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParsed = dateSchema.safeParse(searchParams.get("date"));
  const tierParsed = tierSchema.safeParse(searchParams.get("tier"));

  if (!dateParsed.success || !tierParsed.success) {
    return NextResponse.json(
      { error: "Invalid date or tier" },
      { status: 400 }
    );
  }

  const session = await auth();
  const date = dateParsed.data;
  const tier = tierParsed.data;

  const [aggregate] = await db
    .select({
      totalPlayers: count(),
      totalWins: sql<number>`SUM(CASE WHEN ${dailyResults.isWon} THEN 1 ELSE 0 END)::int`,
      avgGuesses: sql<string>`AVG(${dailyResults.guessCount}) FILTER (WHERE ${dailyResults.isWon})`,
    })
    .from(dailyResults)
    .where(and(eq(dailyResults.date, date), eq(dailyResults.tier, tier)));

  let userRank: number | null = null;
  let userGuessCount: number | null = null;

  if (session?.user?.id) {
    const [userResult] = await db
      .select({ guessCount: dailyResults.guessCount })
      .from(dailyResults)
      .where(
        and(
          eq(dailyResults.userId, session.user.id),
          eq(dailyResults.date, date),
          eq(dailyResults.tier, tier)
        )
      );

    if (userResult) {
      userGuessCount = userResult.guessCount;
      const [rankResult] = await db
        .select({ rank: count() })
        .from(dailyResults)
        .where(
          and(
            eq(dailyResults.date, date),
            eq(dailyResults.tier, tier),
            eq(dailyResults.isWon, true),
            sql`${dailyResults.guessCount} < ${userResult.guessCount}`
          )
        );
      userRank = (rankResult?.rank ?? 0) + 1;
    }
  }

  return NextResponse.json({
    totalPlayers: aggregate?.totalPlayers ?? 0,
    totalWins: aggregate?.totalWins ?? 0,
    avgGuesses: aggregate?.avgGuesses
      ? Number(aggregate.avgGuesses).toFixed(1)
      : null,
    userRank,
    userGuessCount,
  });
}
