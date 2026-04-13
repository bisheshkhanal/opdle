import type { MonthlyCollections, MonthlySeason } from "@/lib/types";
import { getUtcDayKey, getUtcMonthKey, getUtcDayNumber } from "./clock";
import { getMonthlyCollectible } from "./monthlyCatalog";

function createSeason(seasonKey: string): MonthlySeason {
  const collectible = getMonthlyCollectible(seasonKey);

  return {
    collectibleId: collectible.seasonKey,
    collectibleType: collectible.collectibleType,
    targetFragments: collectible.targetFragments,
    revealedDays: [],
    revealedFragmentIndexes: [],
  };
}

function cloneSeason(season: MonthlySeason): MonthlySeason {
  return {
    ...season,
    revealedDays: [...season.revealedDays],
    revealedFragmentIndexes: [...season.revealedFragmentIndexes],
  };
}

function getSeasonEntry(
  collections: MonthlyCollections,
  seasonKey: string
): MonthlySeason {
  return collections.seasons[seasonKey] ?? createSeason(seasonKey);
}

export function createEmptyMonthlyCollections(): MonthlyCollections {
  return {
    activeSeasonKey: "",
    seasons: {},
  };
}

export function recordDailyWinForMonthly(
  collections: MonthlyCollections,
  winDate: Date
): MonthlyCollections {
  const seasonKey = getUtcMonthKey(winDate);
  const dayKey = getUtcDayKey(winDate);
  const existingSeason = collections.seasons[seasonKey];

  if (existingSeason?.revealedDays.includes(dayKey)) {
    return collections;
  }

  const nextSeasons: Record<string, MonthlySeason> = {
    ...collections.seasons,
  };

  const currentSeason = cloneSeason(getSeasonEntry(collections, seasonKey));
  const fragmentIndex =
    getUtcDayNumber(winDate) % currentSeason.targetFragments;

  currentSeason.revealedDays.push(dayKey);

  if (!currentSeason.revealedFragmentIndexes.includes(fragmentIndex)) {
    currentSeason.revealedFragmentIndexes.push(fragmentIndex);
  }

  if (
    !currentSeason.completedAt &&
    currentSeason.revealedDays.length >= currentSeason.targetFragments
  ) {
    currentSeason.completedAt = winDate.toISOString();
  }

  nextSeasons[seasonKey] = currentSeason;

  return {
    activeSeasonKey: seasonKey,
    seasons: nextSeasons,
  };
}

export function getActiveSeason(
  collections: MonthlyCollections
): MonthlySeason | null {
  return collections.seasons[collections.activeSeasonKey] ?? null;
}

export function isMonthlyComplete(collections: MonthlyCollections): boolean {
  return Boolean(getActiveSeason(collections)?.completedAt);
}

export function getArchivedSeasons(
  collections: MonthlyCollections
): Array<{ seasonKey: string; season: MonthlySeason }> {
  return Object.entries(collections.seasons)
    .filter(([seasonKey]) => seasonKey !== collections.activeSeasonKey)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([seasonKey, season]) => ({ seasonKey, season }));
}
