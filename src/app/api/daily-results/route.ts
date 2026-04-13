import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyResults, factionMemberships } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { tierSchema } from "@/lib/validators";
import { z } from "zod";
import {
  buildDailyComparisonAnalytics,
  type DailyComparisonResultFact,
} from "@/lib/daily-comparison-analytics";
import type { Tier } from "@/lib/types";

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
  const tier = tierParsed.data as Tier;
  const viewerUserId = session?.user?.id ?? null;

  const trendWindowDays = 7;
  const windowSize = Math.max(1, Math.floor(trendWindowDays));
  const startOffset = 1 - windowSize; // -6
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + startOffset);
  const startDate = value.toISOString().slice(0, 10);

  const rows = await db
    .select({
      userId: dailyResults.userId,
      date: dailyResults.date,
      tier: dailyResults.tier,
      guessCount: dailyResults.guessCount,
      isWon: dailyResults.isWon,
      completedAtUtc: dailyResults.completedAt,
      factionSlug: factionMemberships.factionSlug,
    })
    .from(dailyResults)
    .leftJoin(
      factionMemberships,
      eq(dailyResults.userId, factionMemberships.userId)
    )
    .where(
      and(
        gte(dailyResults.date, startDate),
        lte(dailyResults.date, date),
        eq(dailyResults.tier, tier)
      )
    );

  const facts: DailyComparisonResultFact[] = rows.map((r) => ({
    userId: r.userId,
    date: r.date,
    tier: r.tier as Tier,
    guessCount: r.guessCount,
    isWon: r.isWon,
    factionSlug: r.factionSlug,
    completedAtUtc: r.completedAtUtc.toISOString(),
  }));

  let viewerFactionSlug: string | null = null;
  if (viewerUserId) {
    const viewerFact = facts.find((f) => f.userId === viewerUserId);
    if (viewerFact?.factionSlug) {
      viewerFactionSlug = viewerFact.factionSlug;
    } else {
      const [membership] = await db
        .select({ factionSlug: factionMemberships.factionSlug })
        .from(factionMemberships)
        .where(eq(factionMemberships.userId, viewerUserId));
      if (membership) {
        viewerFactionSlug = membership.factionSlug;
      }
    }
  }

  const analytics = buildDailyComparisonAnalytics({
    date,
    tier,
    results: facts,
    viewerUserId,
    factionSlug: viewerFactionSlug,
    trendWindowDays,
    percentileMethod: "PERCENT_RANK",
  });

  return NextResponse.json(analytics);
}
