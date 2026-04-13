/**
 * localStorage persistence with schema versioning
 */

import type {
  AchievementProgress,
  DailyState,
  InfiniteState,
  StorageSchema,
  GuessResult,
  Tier,
  DailyStats,
  InfiniteStats,
  GameMode,
  Ruleset,
  RulesetDailyState,
  RulesetInfiniteState,
  LogPoseConsumption,
  MetaInboxEntry,
  MonthlyCollections,
  MonthlySeason,
  SagaProgress,
  TierLogPose,
  TierProgression,
} from "./types";
import type { AchievementId, SagaId } from "./progression/types";
import { ACHIEVEMENT_CATALOG } from "./progression/achievementCatalog";
import { SAGA_CATALOG } from "./progression/sagaCatalog";
import { getUTCDateString } from "./daily";
import { generateRoundId } from "./infinite";
import { getLocalCharacterImageUrl } from "./images";

const STORAGE_KEY = "onepiecedle_v2";
const CURRENT_VERSION = 4;

const ALL_TIERS: Tier[] = ["casual", "fan", "nakama"];
const ALL_SAGA_IDS = SAGA_CATALOG.map((saga) => saga.id);
const ALL_ACHIEVEMENT_IDS = ACHIEVEMENT_CATALOG.map(
  (achievement) => achievement.id
);

function getDefaultDailyStats(): DailyStats {
  return { streak: 0, maxStreak: 0, winDistribution: {} };
}

function getDefaultInfiniteStats(): InfiniteStats {
  return {
    totalWins: 0,
    totalGames: 0,
    streak: 0,
    maxStreak: 0,
    winDistribution: {},
  };
}

function getDefaultInfiniteState(): InfiniteState {
  return {
    roundId: generateRoundId(),
    seed: Date.now(),
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    hintUsed: false,
    totalWins: 0,
    totalGames: 0,
  };
}

function getDefaultSagaProgress(): SagaProgress {
  return { uniqueSolvedIds: [], progressCount: 0 };
}

function getDefaultTierProgression(): TierProgression {
  const sagas: Record<SagaId, SagaProgress> = {} as Record<
    SagaId,
    SagaProgress
  >;

  for (const sagaId of ALL_SAGA_IDS) {
    sagas[sagaId] = getDefaultSagaProgress();
  }

  return {
    sagas,
    completedSagaCount: 0,
  };
}

function getDefaultLogPose(): TierLogPose {
  return { charges: 0, earnedMilestones: [], consumptions: [] };
}

function getDefaultMonthlyCollections(): MonthlyCollections {
  return {
    activeSeasonKey: "",
    seasons: {},
  };
}

function getDefaultAchievementProgress(): Record<
  AchievementId,
  AchievementProgress
> {
  return {} as Record<AchievementId, AchievementProgress>;
}

function getDefaultMetaInbox(): MetaInboxEntry[] {
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidSagaProgress(value: unknown): value is SagaProgress {
  return (
    isRecord(value) &&
    Array.isArray(value.uniqueSolvedIds) &&
    value.uniqueSolvedIds.every((id) => typeof id === "string") &&
    typeof value.progressCount === "number" &&
    Number.isFinite(value.progressCount) &&
    (value.unlockedAt === undefined || typeof value.unlockedAt === "string") &&
    (value.completedAt === undefined || typeof value.completedAt === "string")
  );
}

function isValidTierProgression(value: unknown): value is TierProgression {
  if (!isRecord(value) || !isRecord(value.sagas)) return false;

  for (const sagaId of ALL_SAGA_IDS) {
    if (!isValidSagaProgress(value.sagas[sagaId])) return false;
  }

  return (
    typeof value.completedSagaCount === "number" &&
    Number.isFinite(value.completedSagaCount)
  );
}

function isValidLogPoseConsumption(
  value: unknown
): value is LogPoseConsumption {
  return (
    isRecord(value) &&
    typeof value.protectedDay === "string" &&
    typeof value.consumedAt === "string" &&
    value.source === "streak-7"
  );
}

function isValidLogPose(value: unknown): value is TierLogPose {
  return (
    isRecord(value) &&
    typeof value.charges === "number" &&
    Number.isFinite(value.charges) &&
    Array.isArray(value.earnedMilestones) &&
    value.earnedMilestones.every((milestone) => Number.isInteger(milestone)) &&
    (value.lastEarnedAt === undefined ||
      typeof value.lastEarnedAt === "string") &&
    Array.isArray(value.consumptions) &&
    value.consumptions.every(isValidLogPoseConsumption)
  );
}

function isValidAchievementProgress(
  value: unknown
): value is AchievementProgress {
  return (
    isRecord(value) &&
    typeof value.progress === "number" &&
    Number.isFinite(value.progress) &&
    typeof value.target === "number" &&
    Number.isFinite(value.target) &&
    (value.status === "locked" ||
      value.status === "revealed" ||
      value.status === "unlocked") &&
    (value.unlockedAt === undefined || typeof value.unlockedAt === "string") &&
    typeof value.lastUpdatedAt === "string" &&
    (value.seasonKey === undefined ||
      value.seasonKey === null ||
      typeof value.seasonKey === "string")
  );
}

function isValidMonthlySeason(value: unknown): value is MonthlySeason {
  return (
    isRecord(value) &&
    typeof value.collectibleId === "string" &&
    (value.collectibleType === "bounty-poster" ||
      value.collectibleType === "vivre-card") &&
    typeof value.targetFragments === "number" &&
    Number.isFinite(value.targetFragments) &&
    Array.isArray(value.revealedDays) &&
    value.revealedDays.every((day) => typeof day === "string") &&
    Array.isArray(value.revealedFragmentIndexes) &&
    value.revealedFragmentIndexes.every((index) => Number.isInteger(index)) &&
    (value.completedAt === undefined || typeof value.completedAt === "string")
  );
}

function isValidMonthlyCollections(
  value: unknown
): value is MonthlyCollections {
  if (
    !isRecord(value) ||
    typeof value.activeSeasonKey !== "string" ||
    !isRecord(value.seasons)
  ) {
    return false;
  }

  return Object.values(value.seasons).every(isValidMonthlySeason);
}

function isValidMetaInboxEntry(value: unknown): value is MetaInboxEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.type === "achievement" ||
      value.type === "saga" ||
      value.type === "monthly" ||
      value.type === "log-pose") &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    typeof value.createdAt === "string" &&
    (value.dismissedAt === undefined || typeof value.dismissedAt === "string")
  );
}

function ensureV4StorageSections(storage: StorageSchema): boolean {
  let changed = false;

  if (
    !storage.progressionByTier ||
    !ALL_TIERS.every((tier) =>
      isValidTierProgression(storage.progressionByTier?.[tier])
    )
  ) {
    storage.progressionByTier = {
      casual: getDefaultTierProgression(),
      fan: getDefaultTierProgression(),
      nakama: getDefaultTierProgression(),
    };
    changed = true;
  }

  if (
    !storage.logPoseByTier ||
    !ALL_TIERS.every((tier) => isValidLogPose(storage.logPoseByTier?.[tier]))
  ) {
    storage.logPoseByTier = {
      casual: getDefaultLogPose(),
      fan: getDefaultLogPose(),
      nakama: getDefaultLogPose(),
    };
    changed = true;
  }

  if (!storage.achievementProgress || !isRecord(storage.achievementProgress)) {
    storage.achievementProgress = getDefaultAchievementProgress();
    changed = true;
  } else {
    const keys = Object.keys(storage.achievementProgress);
    const invalidKey = keys.some(
      (key) => !ALL_ACHIEVEMENT_IDS.includes(key as AchievementId)
    );
    const invalidValue = keys.some(
      (key) =>
        !isValidAchievementProgress(
          storage.achievementProgress?.[key as AchievementId]
        )
    );

    if (invalidKey || invalidValue) {
      storage.achievementProgress = getDefaultAchievementProgress();
      changed = true;
    }
  }

  if (!isValidMonthlyCollections(storage.monthlyCollections)) {
    storage.monthlyCollections = getDefaultMonthlyCollections();
    changed = true;
  }

  if (
    !Array.isArray(storage.metaInbox) ||
    !storage.metaInbox.every(isValidMetaInboxEntry)
  ) {
    storage.metaInbox = getDefaultMetaInbox();
    changed = true;
  }

  return changed;
}

/**
 * Get default storage schema
 */
function getDefaultSchema(): StorageSchema {
  const infinite: Record<Tier, InfiniteState> = {
    casual: getDefaultInfiniteState(),
    fan: getDefaultInfiniteState(),
    nakama: getDefaultInfiniteState(),
  };
  const dailyStats: Record<Tier, DailyStats> = {
    casual: getDefaultDailyStats(),
    fan: getDefaultDailyStats(),
    nakama: getDefaultDailyStats(),
  };
  const infiniteStats: Record<Tier, InfiniteStats> = {
    casual: getDefaultInfiniteStats(),
    fan: getDefaultInfiniteStats(),
    nakama: getDefaultInfiniteStats(),
  };

  return {
    version: CURRENT_VERSION,
    tier: "casual",
    hasSelectedTier: false,
    daily: {},
    infinite,
    dailyStats,
    infiniteStats,
    rulesetDaily: {},
    rulesetInfinite: {},
    progressionByTier: {
      casual: getDefaultTierProgression(),
      fan: getDefaultTierProgression(),
      nakama: getDefaultTierProgression(),
    },
    logPoseByTier: {
      casual: getDefaultLogPose(),
      fan: getDefaultLogPose(),
      nakama: getDefaultLogPose(),
    },
    achievementProgress: getDefaultAchievementProgress(),
    monthlyCollections: getDefaultMonthlyCollections(),
    metaInbox: getDefaultMetaInbox(),
  };
}

function normalizeGuessImages(guesses: GuessResult[] | undefined): boolean {
  if (!Array.isArray(guesses)) {
    return false;
  }

  let changed = false;
  for (const guess of guesses) {
    if (!guess || typeof guess.characterId !== "string") {
      continue;
    }

    const localUrl = getLocalCharacterImageUrl(guess.characterId);
    if (guess.imageUrl !== localUrl) {
      guess.imageUrl = localUrl;
      changed = true;
    }
  }

  return changed;
}

function normalizeStorageImages(storage: StorageSchema): boolean {
  let changed = false;

  for (const tier of ALL_TIERS) {
    if (normalizeGuessImages(storage.infinite[tier]?.guesses)) {
      changed = true;
    }
  }

  if (storage.daily) {
    for (const key of Object.keys(storage.daily)) {
      const dailyState = storage.daily[key];
      if (dailyState && normalizeGuessImages(dailyState.guesses)) {
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Load storage from localStorage
 */
export function loadStorage(): StorageSchema {
  if (typeof window === "undefined") {
    return getDefaultSchema();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultStorage = getDefaultSchema();
      saveStorage(defaultStorage);
      return defaultStorage;
    }

    const parsed = JSON.parse(stored) as StorageSchema;
    const normalizedStorage =
      parsed.version !== CURRENT_VERSION
        ? migrateStorage(parsed as unknown as Record<string, unknown>)
        : parsed;

    const changed =
      parsed.version !== CURRENT_VERSION ||
      normalizeStorageImages(normalizedStorage) ||
      ensureV4StorageSections(normalizedStorage);

    if (changed) {
      saveStorage(normalizedStorage);
    }

    return normalizedStorage;
  } catch {
    const defaultStorage = getDefaultSchema();
    saveStorage(defaultStorage);
    return defaultStorage;
  }
}

/**
 * Save storage to localStorage
 */
export function saveStorage(data: StorageSchema): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save storage:", e);
  }
}

/**
 * Migrate storage from older versions
 */
function migrateStorage(old: Record<string, unknown>): StorageSchema {
  const version = old.version as number;

  if (version < 3) {
    // V2 → V3 migration: preserve daily data, convert to per-tier structure
    const oldDaily = (old.daily || {}) as Record<string, DailyState>;
    const oldInfinite = old.infinite as InfiniteState | undefined;
    const oldStats = old.stats as {
      dailyStreak?: number;
      dailyMaxStreak?: number;
      infiniteTotalWins?: number;
      infiniteTotalGames?: number;
      winDistribution?: Record<number, number>;
    } | null;

    // Remap daily keys from "YYYY-MM-DD" to "casual:YYYY-MM-DD"
    const migratedDaily: Record<string, DailyState> = {};
    for (const [dateKey, dailyState] of Object.entries(oldDaily)) {
      if (!dateKey.includes(":")) {
        migratedDaily[`casual:${dateKey}`] = dailyState;
      } else {
        migratedDaily[dateKey] = dailyState;
      }
    }

    // Convert old infinite state into the casual tier slot
    const baseInfinite = oldInfinite || getDefaultInfiniteState();
    const infinite: Record<Tier, InfiniteState> = {
      casual: { ...baseInfinite },
      fan: getDefaultInfiniteState(),
      nakama: getDefaultInfiniteState(),
    };

    // Convert old stats into casual tier stats
    const migratedDailyStats: Record<Tier, DailyStats> = {
      casual: {
        streak: oldStats?.dailyStreak ?? 0,
        maxStreak: oldStats?.dailyMaxStreak ?? 0,
        winDistribution: oldStats?.winDistribution ?? {},
      },
      fan: getDefaultDailyStats(),
      nakama: getDefaultDailyStats(),
    };

    const migratedInfiniteStats: Record<Tier, InfiniteStats> = {
      casual: {
        totalWins: oldStats?.infiniteTotalWins ?? 0,
        totalGames: oldStats?.infiniteTotalGames ?? 0,
        streak: 0,
        maxStreak: 0,
        winDistribution: {},
      },
      fan: getDefaultInfiniteStats(),
      nakama: getDefaultInfiniteStats(),
    };

    return {
      version: CURRENT_VERSION,
      tier: "casual",
      hasSelectedTier: false,
      daily: migratedDaily,
      infinite,
      dailyStats: migratedDailyStats,
      infiniteStats: migratedInfiniteStats,
      rulesetDaily: {},
      rulesetInfinite: {},
      progressionByTier: {
        casual: getDefaultTierProgression(),
        fan: getDefaultTierProgression(),
        nakama: getDefaultTierProgression(),
      },
      logPoseByTier: {
        casual: getDefaultLogPose(),
        fan: getDefaultLogPose(),
        nakama: getDefaultLogPose(),
      },
      achievementProgress: getDefaultAchievementProgress(),
      monthlyCollections: getDefaultMonthlyCollections(),
      metaInbox: getDefaultMetaInbox(),
    };
  }

  if (version < 4) {
    const v3Storage = old as unknown as StorageSchema;

    return {
      ...v3Storage,
      version: CURRENT_VERSION,
      progressionByTier: {
        casual: getDefaultTierProgression(),
        fan: getDefaultTierProgression(),
        nakama: getDefaultTierProgression(),
      },
      logPoseByTier: {
        casual: getDefaultLogPose(),
        fan: getDefaultLogPose(),
        nakama: getDefaultLogPose(),
      },
      achievementProgress: getDefaultAchievementProgress(),
      monthlyCollections: getDefaultMonthlyCollections(),
      metaInbox: [],
      rulesetDaily: v3Storage.rulesetDaily ?? {},
      rulesetInfinite: v3Storage.rulesetInfinite ?? {},
    };
  }

  return getDefaultSchema();
}

/**
 * Build the tier-scoped daily key from a date and tier
 */
function getDailyKey(tier: Tier, dateString: string): string {
  return `${tier}:${dateString}`;
}

/**
 * Get the current selected tier from storage
 */
export function getSelectedTier(): Tier {
  const storage = loadStorage();
  return storage.tier;
}

/**
 * Set the selected tier in storage
 */
export function setSelectedTier(tier: Tier): void {
  const storage = loadStorage();
  storage.tier = tier;
  storage.hasSelectedTier = true;
  saveStorage(storage);
}

/**
 * Get daily state for a specific date and tier
 */
export function getDailyState(tier: Tier, dateString?: string): DailyState {
  const date = dateString || getUTCDateString();
  const key = getDailyKey(tier, date);
  const storage = loadStorage();

  if (storage.daily[key]) {
    return storage.daily[key];
  }

  const tierStats = storage.dailyStats[tier];
  return {
    date,
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    streak: tierStats.streak,
    maxStreak: tierStats.maxStreak,
  };
}

/**
 * Save daily state for a specific date and tier
 */
export function saveDailyState(state: DailyState, tier: Tier): void {
  const storage = loadStorage();
  const date = state.date;
  const key = getDailyKey(tier, date);
  const wasAlreadyFinished = storage.daily[key]?.isFinished === true;
  storage.daily[key] = state;

  if (state.isFinished && !wasAlreadyFinished) {
    const tierStats = storage.dailyStats[tier];
    if (state.isWon) {
      tierStats.streak = state.streak;
      tierStats.maxStreak = Math.max(tierStats.maxStreak, state.streak);
      const guessCount = state.guesses.length;
      tierStats.winDistribution[guessCount] =
        (tierStats.winDistribution[guessCount] ?? 0) + 1;
    } else {
      tierStats.streak = 0;
    }
  }

  saveStorage(storage);
}

/**
 * Check if a character has already been guessed in daily mode
 */
export function isDailyDuplicate(
  characterId: string,
  tier: Tier,
  dateString?: string
): boolean {
  const state = getDailyState(tier, dateString);
  return state.guessedIds.includes(characterId);
}

/**
 * Add a guess to daily state
 */
export function addDailyGuess(
  guess: GuessResult,
  tier: Tier,
  dateString?: string
): DailyState {
  const date = dateString || getUTCDateString();
  const state = getDailyState(tier, date);

  // Block duplicate
  if (state.guessedIds.includes(guess.characterId)) {
    return state;
  }

  state.guesses.push(guess);
  state.guessedIds.push(guess.characterId);

  if (guess.isCorrect) {
    state.isWon = true;
    state.isFinished = true;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
  } else if (state.guesses.length >= 6) {
    state.isFinished = true;
    state.streak = 0;
  }

  saveDailyState(state, tier);
  return state;
}

/**
 * Get infinite state for a specific tier
 */
export function getInfiniteState(tier: Tier): InfiniteState {
  const storage = loadStorage();
  return storage.infinite[tier] || getDefaultInfiniteState();
}

/**
 * Save infinite state for a specific tier
 */
export function saveInfiniteState(state: InfiniteState, tier: Tier): void {
  const storage = loadStorage();
  storage.infinite[tier] = state;
  storage.infiniteStats[tier].totalWins = state.totalWins;
  storage.infiniteStats[tier].totalGames = state.totalGames;
  saveStorage(storage);
}

/**
 * Mark that a hint has been used for the current round
 */
export function markHintUsed(
  tier: Tier,
  mode: GameMode,
  dateString?: string
): void {
  const storage = loadStorage();

  if (mode === "daily") {
    const date = dateString || getUTCDateString();
    const key = getDailyKey(tier, date);
    if (storage.daily[key]) {
      storage.daily[key].hintUsed = true;
    } else {
      const tierStats = storage.dailyStats[tier];
      storage.daily[key] = {
        date,
        guesses: [],
        guessedIds: [],
        isFinished: false,
        isWon: false,
        hintUsed: true,
        streak: tierStats.streak,
        maxStreak: tierStats.maxStreak,
      };
    }
  } else {
    if (!storage.infinite[tier]) {
      storage.infinite[tier] = getDefaultInfiniteState();
    }
    storage.infinite[tier].hintUsed = true;
  }

  saveStorage(storage);
}

/**
 * Check if a character has already been guessed in infinite mode
 */
export function isInfiniteDuplicate(characterId: string, tier: Tier): boolean {
  const state = getInfiniteState(tier);
  return state.guessedIds.includes(characterId);
}

/**
 * Add a guess to infinite state
 */
export function addInfiniteGuess(
  guess: GuessResult,
  tier: Tier
): InfiniteState {
  const storage = loadStorage();
  const state = storage.infinite[tier] || getDefaultInfiniteState();

  // Block duplicate
  if (state.guessedIds.includes(guess.characterId)) {
    return state;
  }

  state.guesses.push(guess);
  state.guessedIds.push(guess.characterId);

  const tierStats = storage.infiniteStats[tier];

  if (guess.isCorrect) {
    state.isWon = true;
    state.isFinished = true;
    state.totalWins += 1;
    state.totalGames += 1;
    tierStats.totalWins = state.totalWins;
    tierStats.totalGames = state.totalGames;
    tierStats.streak += 1;
    tierStats.maxStreak = Math.max(tierStats.maxStreak, tierStats.streak);
    const guessCount = state.guesses.length;
    tierStats.winDistribution[guessCount] =
      (tierStats.winDistribution[guessCount] ?? 0) + 1;
  } else if (state.guesses.length >= 6) {
    state.isFinished = true;
    state.totalGames += 1;
    tierStats.totalGames = state.totalGames;
    tierStats.streak = 0;
  }

  storage.infinite[tier] = state;
  saveStorage(storage);
  return state;
}

/**
 * Start a new infinite round for a specific tier
 */
export function startNewInfiniteRound(tier: Tier): InfiniteState {
  const currentState = getInfiniteState(tier);

  const newState: InfiniteState = {
    roundId: generateRoundId(),
    seed: Date.now(),
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    hintUsed: false,
    totalWins: currentState.totalWins,
    totalGames: currentState.totalGames,
  };

  saveInfiniteState(newState, tier);
  return newState;
}

/**
 * Get daily stats for a specific tier
 */
export function getDailyStats(tier: Tier): DailyStats {
  const storage = loadStorage();
  return storage.dailyStats[tier] || getDefaultDailyStats();
}

/**
 * Get infinite stats for a specific tier
 */
export function getInfiniteStats(tier: Tier): InfiniteStats {
  const storage = loadStorage();
  return { ...getDefaultInfiniteStats(), ...storage.infiniteStats[tier] };
}

/**
 * Get all unique character IDs ever correctly guessed across daily and infinite modes
 */
export function getAllDiscoveredIds(): string[] {
  const storage = loadStorage();
  const idSet = new Set<string>();

  for (const dailyState of Object.values(storage.daily)) {
    for (const guess of dailyState.guesses) {
      if (guess.isCorrect) {
        idSet.add(guess.characterId);
      }
    }
  }

  for (const tier of ALL_TIERS) {
    const infiniteState = storage.infinite[tier];
    for (const guess of infiniteState.guesses) {
      if (guess.isCorrect) {
        idSet.add(guess.characterId);
      }
    }
  }

  return Array.from(idSet);
}

/**
 * Clear all storage (for testing/reset)
 */
export function clearStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function buildRulesetDailyKey(
  tier: Tier,
  ruleset: Ruleset,
  date: string
): string {
  return `${tier}:${ruleset}:${date}`;
}

export function buildRulesetInfiniteKey(tier: Tier, ruleset: Ruleset): string {
  return `${tier}:${ruleset}`;
}

export function getRulesetDailyState(
  tier: Tier,
  ruleset: Ruleset,
  dateString?: string
): RulesetDailyState {
  const date = dateString || getUTCDateString();
  const key = buildRulesetDailyKey(tier, ruleset, date);
  const storage = loadStorage();

  if (storage.rulesetDaily?.[key]) {
    return storage.rulesetDaily[key];
  }

  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
  };
}

export function saveRulesetDailyState(
  state: RulesetDailyState,
  tier: Tier,
  ruleset: Ruleset,
  dateString?: string
): void {
  const storage = loadStorage();
  const date = dateString || getUTCDateString();
  const key = buildRulesetDailyKey(tier, ruleset, date);
  if (!storage.rulesetDaily) {
    storage.rulesetDaily = {};
  }
  storage.rulesetDaily[key] = state;
  saveStorage(storage);
}

export function getRulesetInfiniteState(
  tier: Tier,
  ruleset: Ruleset
): RulesetInfiniteState {
  const key = buildRulesetInfiniteKey(tier, ruleset);
  const storage = loadStorage();

  if (storage.rulesetInfinite?.[key]) {
    return storage.rulesetInfinite[key];
  }

  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
  };
}

export function saveRulesetInfiniteState(
  state: RulesetInfiniteState,
  tier: Tier,
  ruleset: Ruleset
): void {
  const storage = loadStorage();
  const key = buildRulesetInfiniteKey(tier, ruleset);
  if (!storage.rulesetInfinite) {
    storage.rulesetInfinite = {};
  }
  storage.rulesetInfinite[key] = state;
  saveStorage(storage);
}

export function clearRulesetInfiniteState(tier: Tier, ruleset: Ruleset): void {
  const storage = loadStorage();
  const key = buildRulesetInfiniteKey(tier, ruleset);

  if (!storage.rulesetInfinite?.[key]) {
    return;
  }

  delete storage.rulesetInfinite[key];
  saveStorage(storage);
}

export function getProgressionByTier(tier: Tier): TierProgression {
  const storage = loadStorage();
  return storage.progressionByTier?.[tier] || getDefaultTierProgression();
}

export function saveProgressionByTier(tier: Tier, data: TierProgression): void {
  const storage = loadStorage();

  if (!storage.progressionByTier) {
    storage.progressionByTier = {
      casual: getDefaultTierProgression(),
      fan: getDefaultTierProgression(),
      nakama: getDefaultTierProgression(),
    };
  }

  storage.progressionByTier[tier] = data;
  saveStorage(storage);
}

export function getLogPose(tier: Tier): TierLogPose {
  const storage = loadStorage();
  return storage.logPoseByTier?.[tier] || getDefaultLogPose();
}

export function saveLogPose(tier: Tier, data: TierLogPose): void {
  const storage = loadStorage();

  if (!storage.logPoseByTier) {
    storage.logPoseByTier = {
      casual: getDefaultLogPose(),
      fan: getDefaultLogPose(),
      nakama: getDefaultLogPose(),
    };
  }

  storage.logPoseByTier[tier] = data;
  saveStorage(storage);
}

export function getAchievementProgress(): Record<
  AchievementId,
  AchievementProgress
> {
  const storage = loadStorage();
  return storage.achievementProgress || getDefaultAchievementProgress();
}

export function saveAchievementProgress(
  data: Record<AchievementId, AchievementProgress>
): void {
  const storage = loadStorage();
  storage.achievementProgress = data;
  saveStorage(storage);
}

export function getMonthlyCollections(): MonthlyCollections {
  const storage = loadStorage();
  return storage.monthlyCollections || getDefaultMonthlyCollections();
}

export function saveMonthlyCollections(data: MonthlyCollections): void {
  const storage = loadStorage();
  storage.monthlyCollections = data;
  saveStorage(storage);
}

export function getMetaInbox(): MetaInboxEntry[] {
  const storage = loadStorage();
  return storage.metaInbox || [];
}

export function saveMetaInbox(data: MetaInboxEntry[]): void {
  const storage = loadStorage();
  storage.metaInbox = data;
  saveStorage(storage);
}
