import type { FactionMembership, WeeklyFactionRankingRow } from "./types";

export const FACTIONS = [
  { factionId: "marines", factionName: "Marines", factionSlug: "marines" },
  { factionId: "pirates", factionName: "Pirates", factionSlug: "pirates" },
  {
    factionId: "revolutionary",
    factionName: "Revolutionary Army",
    factionSlug: "revolutionary",
  },
  {
    factionId: "warlords",
    factionName: "Warlords",
    factionSlug: "warlords",
  },
  {
    factionId: "cipher_pol",
    factionName: "Cipher Pol",
    factionSlug: "cipher_pol",
  },
] as const;

export type FactionSlug = (typeof FACTIONS)[number]["factionSlug"];

export function getFactionBySlug(factionSlug: string) {
  return FACTIONS.find((faction) => faction.factionSlug === factionSlug);
}

export function getCurrentWeekKey(date = new Date()): string {
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const utcDay = (utcDate.getUTCDay() + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - utcDay + 3);

  const firstThursday = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);

  const weekNumber =
    1 +
    Math.round(
      (utcDate.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

  return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getWeekWindow(weekKey: string): {
  weekStartUtc: string;
  weekEndUtc: string;
} {
  const [yearPart, weekPart] = weekKey.split("-W");
  const year = Number(yearPart);
  const weekNumber = Number(weekPart);
  const week1Anchor = new Date(Date.UTC(year, 0, 4));
  const week1Day = (week1Anchor.getUTCDay() + 6) % 7;

  week1Anchor.setUTCDate(week1Anchor.getUTCDate() - week1Day);
  week1Anchor.setUTCHours(0, 0, 0, 0);

  const weekStart = new Date(week1Anchor);
  weekStart.setUTCDate(weekStart.getUTCDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return {
    weekStartUtc: weekStart.toISOString(),
    weekEndUtc: weekEnd.toISOString(),
  };
}

export function buildFactionMembershipResponse(options: {
  userId: string;
  username: string;
  factionSlug: string;
  joinedAt: Date;
  updatedAt: Date;
}): FactionMembership {
  const faction = getFactionBySlug(options.factionSlug);

  return {
    userId: options.userId,
    username: options.username,
    factionId: faction?.factionId ?? options.factionSlug,
    factionName: faction?.factionName ?? options.factionSlug,
    factionSlug: options.factionSlug,
    visibility: "public",
    joinedAtUtc: options.joinedAt.toISOString(),
    updatedAtUtc: options.updatedAt.toISOString(),
  };
}

export function rankWeeklyFactionRows(
  rows: Array<{
    factionSlug: string;
    totalPoints: number;
    avgGuesses: number | null;
    participantCount: number;
  }>,
  weekKey: string
): WeeklyFactionRankingRow[] {
  const { weekStartUtc, weekEndUtc } = getWeekWindow(weekKey);

  const ranked = [...rows]
    .map((row) => {
      const faction = getFactionBySlug(row.factionSlug);

      return {
        weekStartUtc,
        weekEndUtc,
        factionId: faction?.factionId ?? row.factionSlug,
        factionName: faction?.factionName ?? row.factionSlug,
        factionSlug: row.factionSlug,
        points: row.totalPoints,
        avgGuesses: row.avgGuesses,
        participantCount: row.participantCount,
        rank: 0,
        percentile: null as number | null,
      } satisfies WeeklyFactionRankingRow;
    })
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (
        (left.avgGuesses ?? Number.POSITIVE_INFINITY) !==
        (right.avgGuesses ?? Number.POSITIVE_INFINITY)
      ) {
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

  const total = ranked.length;

  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
    percentile:
      total <= 1
        ? total === 1
          ? 100
          : null
        : 100 - (index / (total - 1)) * 100,
  }));
}
