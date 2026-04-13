import type { Tier } from "./types";

export type PercentileMethod = "PERCENT_RANK";

export interface DailyComparisonResultFact {
  userId: string;
  date: string;
  tier: Tier;
  guessCount: number;
  isWon: boolean;
  factionSlug: string | null;
  completedAtUtc: string;
}

export interface DailyComparisonAnalyticsInput {
  date: string;
  tier: Tier;
  results: DailyComparisonResultFact[];
  viewerUserId: string | null;
  factionSlug: string | null;
  trendWindowDays: number;
  percentileMethod: PercentileMethod;
}

export interface DailyComparisonTrendData {
  date: string;
  sampleSize: number;
  totalWins: number;
  avgGuesses: number | null;
  guessDistribution: number[];
  percentile: number | null;
}

export interface DailyComparisonFactionSlice {
  factionSlug: string;
  sampleSize: number;
  totalWins: number;
  avgGuesses: number | null;
  rank: number | null;
  percentile: number | null;
  guessDistribution: number[];
}

export interface DailyComparisonAnalyticsResult {
  date: string;
  tier: Tier;
  sampleSize: number;
  totalWins: number;
  avgGuesses: number | null;
  rank: number | null;
  percentile: number | null;
  userGuessCount: number | null;
  percentileMethod: PercentileMethod;
  guessDistribution: number[];
  trendWindowDays: number;
  trendData: DailyComparisonTrendData[];
  factionSlice: DailyComparisonFactionSlice | null;
}

const GUESSES_PER_GAME = 6;

function createDistribution(): number[] {
  return Array.from({ length: GUESSES_PER_GAME }, () => 0);
}

function addUtcDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function filterByDateAndTier(
  results: DailyComparisonResultFact[],
  date: string,
  tier: Tier
): DailyComparisonResultFact[] {
  return results.filter(
    (result) => result.date === date && result.tier === tier
  );
}

function filterByFactionSlug(
  results: DailyComparisonResultFact[],
  factionSlug: string
): DailyComparisonResultFact[] {
  return results.filter((result) => result.factionSlug === factionSlug);
}

function getWins(
  results: DailyComparisonResultFact[]
): DailyComparisonResultFact[] {
  return results.filter((result) => result.isWon);
}

function buildGuessDistribution(
  results: DailyComparisonResultFact[]
): number[] {
  const distribution = createDistribution();

  for (const result of results) {
    if (!result.isWon) {
      continue;
    }

    if (result.guessCount < 1 || result.guessCount > GUESSES_PER_GAME) {
      continue;
    }

    distribution[result.guessCount - 1] += 1;
  }

  return distribution;
}

function averageGuessCount(
  results: DailyComparisonResultFact[]
): number | null {
  const wins = getWins(results);

  if (wins.length === 0) {
    return null;
  }

  const total = wins.reduce((sum, result) => sum + result.guessCount, 0);

  return Number((total / wins.length).toFixed(1));
}

function computePercentile(
  rank: number | null,
  sampleSize: number
): number | null {
  if (rank === null) {
    return null;
  }

  if (sampleSize <= 1) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(((sampleSize - rank) / (sampleSize - 1)) * 100))
  );
}

function computeRank(
  results: DailyComparisonResultFact[],
  userGuessCount: number
): number {
  return (
    getWins(results).filter((result) => result.guessCount < userGuessCount)
      .length + 1
  );
}

function summarizeCohort(
  results: DailyComparisonResultFact[],
  viewerUserId: string | null
): {
  sampleSize: number;
  totalWins: number;
  avgGuesses: number | null;
  rank: number | null;
  percentile: number | null;
  userGuessCount: number | null;
  guessDistribution: number[];
} {
  const sampleSize = results.length;
  const wins = getWins(results);
  const totalWins = wins.length;
  const avgGuesses = averageGuessCount(results);
  const guessDistribution = buildGuessDistribution(results);

  const viewerResult =
    viewerUserId === null
      ? null
      : (results.find((result) => result.userId === viewerUserId) ?? null);

  const userGuessCount = viewerResult ? viewerResult.guessCount : null;
  const rank =
    viewerResult && viewerResult.isWon
      ? computeRank(results, viewerResult.guessCount)
      : null;
  const percentile = computePercentile(rank, totalWins);

  return {
    sampleSize,
    totalWins,
    avgGuesses,
    rank,
    percentile,
    userGuessCount,
    guessDistribution,
  };
}

function buildTrendData(
  results: DailyComparisonResultFact[],
  date: string,
  tier: Tier,
  trendWindowDays: number
): DailyComparisonTrendData[] {
  const windowSize = Math.max(1, Math.floor(trendWindowDays));
  const startOffset = 1 - windowSize;

  return Array.from({ length: windowSize }, (_, index) => {
    const windowDate = addUtcDays(date, startOffset + index);
    const windowResults = filterByDateAndTier(results, windowDate, tier);
    const wins = getWins(windowResults);

    return {
      date: windowDate,
      sampleSize: windowResults.length,
      totalWins: wins.length,
      avgGuesses: averageGuessCount(windowResults),
      guessDistribution: buildGuessDistribution(windowResults),
      percentile: null,
    };
  });
}

function buildFactionSlice(
  results: DailyComparisonResultFact[],
  factionSlug: string,
  viewerUserId: string | null
): DailyComparisonFactionSlice | null {
  const factionResults = filterByFactionSlug(results, factionSlug);

  if (factionResults.length === 0) {
    return null;
  }

  const summary = summarizeCohort(factionResults, viewerUserId);

  return {
    factionSlug,
    sampleSize: summary.sampleSize,
    totalWins: summary.totalWins,
    avgGuesses: summary.avgGuesses,
    rank: summary.rank,
    percentile: summary.percentile,
    guessDistribution: summary.guessDistribution,
  };
}

export function buildDailyComparisonAnalytics(
  input: DailyComparisonAnalyticsInput
): DailyComparisonAnalyticsResult {
  const cohortResults = filterByDateAndTier(
    input.results,
    input.date,
    input.tier
  );
  const summary = summarizeCohort(cohortResults, input.viewerUserId);

  const factionSlice =
    input.factionSlug === null
      ? null
      : buildFactionSlice(cohortResults, input.factionSlug, input.viewerUserId);

  return {
    date: input.date,
    tier: input.tier,
    sampleSize: summary.sampleSize,
    totalWins: summary.totalWins,
    avgGuesses: summary.avgGuesses,
    rank: summary.rank,
    percentile: summary.percentile,
    userGuessCount: summary.userGuessCount,
    percentileMethod: input.percentileMethod,
    guessDistribution: summary.guessDistribution,
    trendWindowDays: Math.max(1, Math.floor(input.trendWindowDays)),
    trendData: buildTrendData(
      input.results,
      input.date,
      input.tier,
      input.trendWindowDays
    ),
    factionSlice,
  };
}
