import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyFactionAggregates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getCurrentWeekKey,
  getWeekWindow,
  rankWeeklyFactionRows,
} from "@/lib/factions";
import { weeklyLeaderboardQuerySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {
    weekKey: searchParams.get("weekKey") ?? getCurrentWeekKey(),
    limit: searchParams.get("limit") ?? "20",
  };

  const factionSlug = searchParams.get("factionSlug");
  const tier = searchParams.get("tier");
  if (factionSlug) {
    query.factionSlug = factionSlug;
  }

  if (tier) {
    query.tier = tier;
  }

  const parsed = weeklyLeaderboardQuerySchema.safeParse(query);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid weekly leaderboard query" },
      { status: 400 }
    );
  }

  const rows = await db
    .select({
      weekKey: weeklyFactionAggregates.weekKey,
      factionSlug: weeklyFactionAggregates.factionSlug,
      totalPoints: weeklyFactionAggregates.totalPoints,
      avgGuesses: weeklyFactionAggregates.avgGuesses,
      participantCount: weeklyFactionAggregates.participantCount,
    })
    .from(weeklyFactionAggregates)
    .where(eq(weeklyFactionAggregates.weekKey, parsed.data.weekKey));

  const filteredRows = parsed.data.factionSlug
    ? rows.filter((row) => row.factionSlug === parsed.data.factionSlug)
    : rows;

  const rankings = rankWeeklyFactionRows(
    filteredRows,
    parsed.data.weekKey
  ).slice(0, parsed.data.limit);

  return NextResponse.json(
    {
      weekKey: parsed.data.weekKey,
      ...getWeekWindow(parsed.data.weekKey),
      rankings,
    },
    {
      headers: CACHE_HEADERS,
    }
  );
}
