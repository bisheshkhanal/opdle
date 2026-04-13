import type {
  AchievementProgress,
  DailyState,
  DailyStats,
  GuessResult,
  InfiniteState,
  InfiniteStats,
  MetaInboxEntry,
  MonthlyCollections,
  StorageSchema,
  Tier,
  TierLogPose,
  TierProgression,
  SagaProgress,
} from "@/lib/types";
import type { AchievementId, SagaId } from "@/lib/progression/types";

type TierStatsMap<T> = {
  casual?: Partial<T>;
  fan?: Partial<T>;
  nakama?: Partial<T>;
};

type SyncPayload = {
  dailyStats: Record<Tier, DailyStats>;
  infiniteStats: Record<Tier, InfiniteStats>;
};

export type SyncPayloadOverrides = {
  dailyStats?: TierStatsMap<DailyStats>;
  infiniteStats?: TierStatsMap<InfiniteStats>;
};

function createDailyStats(): DailyStats {
  return { streak: 0, maxStreak: 0, winDistribution: {} };
}

function createInfiniteStats(): InfiniteStats {
  return {
    totalWins: 0,
    totalGames: 0,
    streak: 0,
    maxStreak: 0,
    winDistribution: {},
  };
}

function createInfiniteState(): InfiniteState {
  return {
    roundId: "test",
    seed: 12345,
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    totalWins: 0,
    totalGames: 0,
  };
}

function createSagaProgress(): SagaProgress {
  return {
    uniqueSolvedIds: [],
    progressCount: 0,
  };
}

function createTierProgression(): TierProgression {
  const sagas = {
    "east-blue": createSagaProgress(),
    arabasta: createSagaProgress(),
    "sky-island": createSagaProgress(),
    "water-7": createSagaProgress(),
    "thriller-bark": createSagaProgress(),
    "summit-war": createSagaProgress(),
    "fish-man-island": createSagaProgress(),
    dressrosa: createSagaProgress(),
    "whole-cake-island": createSagaProgress(),
    "wano-country": createSagaProgress(),
    final: createSagaProgress(),
  } as Record<SagaId, SagaProgress>;

  return {
    sagas,
    completedSagaCount: 0,
  };
}

function createLogPose(): TierLogPose {
  return {
    charges: 0,
    earnedMilestones: [],
    consumptions: [],
  };
}

function createMonthlyCollections(): MonthlyCollections {
  return {
    activeSeasonKey: "",
    seasons: {},
  };
}

function createAchievementProgress(): Record<
  AchievementId,
  AchievementProgress
> {
  return {} as Record<AchievementId, AchievementProgress>;
}

function createMetaInbox(): MetaInboxEntry[] {
  return [];
}

function createDailyState(date: string): DailyState {
  return {
    date,
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    streak: 0,
    maxStreak: 0,
  };
}

function getDefaultTierStatsMap<T>(factory: () => T): Record<Tier, T> {
  return {
    casual: factory(),
    fan: factory(),
    nakama: factory(),
  };
}

function mergeTierStats<T extends object>(
  defaults: Record<Tier, T>,
  overrides?: TierStatsMap<T>
): Record<Tier, T> {
  return {
    casual: { ...defaults.casual, ...overrides?.casual },
    fan: { ...defaults.fan, ...overrides?.fan },
    nakama: { ...defaults.nakama, ...overrides?.nakama },
  };
}

export function createFakeGuess(overrides?: Partial<GuessResult>): GuessResult {
  return {
    characterId: "test-character",
    characterName: "Test Character",
    imageUrl: "/characters/test-character.png",
    categories: [],
    isCorrect: false,
    ...overrides,
  };
}

export function createCorrectGuess(
  characterId: string,
  characterName: string
): GuessResult {
  return createFakeGuess({
    characterId,
    characterName,
    isCorrect: true,
  });
}

export function createEmptyStorage(): StorageSchema {
  return {
    version: 3,
    tier: "casual",
    hasSelectedTier: true,
    daily: {},
    infinite: getDefaultTierStatsMap(createInfiniteState),
    dailyStats: getDefaultTierStatsMap(createDailyStats),
    infiniteStats: getDefaultTierStatsMap(createInfiniteStats),
  };
}

export function createEmptyStorageV4(): StorageSchema {
  return {
    version: 4,
    tier: "casual",
    hasSelectedTier: true,
    daily: {},
    infinite: getDefaultTierStatsMap(createInfiniteState),
    dailyStats: getDefaultTierStatsMap(createDailyStats),
    infiniteStats: getDefaultTierStatsMap(createInfiniteStats),
    rulesetDaily: {},
    rulesetInfinite: {},
    progressionByTier: {
      casual: createTierProgression(),
      fan: createTierProgression(),
      nakama: createTierProgression(),
    },
    logPoseByTier: {
      casual: createLogPose(),
      fan: createLogPose(),
      nakama: createLogPose(),
    },
    achievementProgress: createAchievementProgress(),
    monthlyCollections: createMonthlyCollections(),
    metaInbox: createMetaInbox(),
  };
}

export function createStorageWithDailyWin(
  tier: Tier,
  dateString: string,
  targetId: string,
  streak: number = 1
): StorageSchema {
  const storage = createEmptyStorage();
  const guess = createCorrectGuess(targetId, `Character ${targetId}`);
  const dailyState = createDailyState(dateString);

  storage.daily[`${tier}:${dateString}`] = {
    ...dailyState,
    guesses: [guess],
    guessedIds: [targetId],
    isFinished: true,
    isWon: true,
    streak,
    maxStreak: streak,
  };

  storage.dailyStats[tier] = {
    streak,
    maxStreak: streak,
    winDistribution: { 1: 1 },
  };

  return storage;
}

export function createStorageWithStreak(
  tier: Tier,
  streakDays: number,
  startDate: string
): StorageSchema {
  const storage = createEmptyStorage();
  const start = new Date(startDate);

  for (let i = 0; i < streakDays; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const targetId = `streak-char-${i}`;
    const dailyState = createDailyState(dateStr);

    storage.daily[`${tier}:${dateStr}`] = {
      ...dailyState,
      guesses: [createCorrectGuess(targetId, `Streak Char ${i}`)],
      guessedIds: [targetId],
      isFinished: true,
      isWon: true,
      streak: i + 1,
      maxStreak: i + 1,
    };
  }

  storage.dailyStats[tier] = {
    streak: streakDays,
    maxStreak: streakDays,
    winDistribution: { 1: streakDays },
  };

  return storage;
}

export function createStorageWithMissedDays(
  tier: Tier,
  solvedDates: string[]
): StorageSchema {
  const storage = createEmptyStorage();

  solvedDates.forEach((dateString, index) => {
    const targetId = `missed-char-${index}`;
    const dailyState = createDailyState(dateString);
    storage.daily[`${tier}:${dateString}`] = {
      ...dailyState,
      guesses: [createCorrectGuess(targetId, `Missed Char ${index}`)],
      guessedIds: [targetId],
      isFinished: true,
      isWon: true,
      streak: 1,
      maxStreak: 1,
    };
  });

  storage.dailyStats[tier] = {
    streak: solvedDates.length > 0 ? 1 : 0,
    maxStreak: solvedDates.length > 0 ? 1 : 0,
    winDistribution: solvedDates.length > 0 ? { 1: solvedDates.length } : {},
  };

  return storage;
}

export function createSyncPayload(
  overrides?: SyncPayloadOverrides
): SyncPayload {
  return {
    dailyStats: mergeTierStats(
      getDefaultTierStatsMap(createDailyStats),
      overrides?.dailyStats
    ),
    infiniteStats: mergeTierStats(
      getDefaultTierStatsMap(createInfiniteStats),
      overrides?.infiniteStats
    ),
  };
}
