/**
 * localStorage persistence with schema versioning
 */

import type {
  DailyState,
  InfiniteState,
  StorageSchema,
  GuessResult,
  Tier,
  DailyStats,
  InfiniteStats,
  GameMode,
} from "./types";
import { getUTCDateString } from "./daily";
import { generateRoundId } from "./infinite";
import { getLocalCharacterImageUrl } from "./images";

const STORAGE_KEY = "onepiecedle_v2";
const CURRENT_VERSION = 3;

const ALL_TIERS: Tier[] = ["casual", "fan", "nakama"];

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

    // Version migration if needed
    if (parsed.version !== CURRENT_VERSION) {
      const migratedStorage = migrateStorage(
        parsed as unknown as Record<string, unknown>
      );
      saveStorage(migratedStorage);
      return migratedStorage;
    }

    const changed = normalizeStorageImages(parsed);
    if (changed) {
      saveStorage(parsed);
    }

    return parsed;
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
  storage.daily[key] = state;

  if (state.isFinished) {
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
 * Get all unique character IDs ever guessed across daily and infinite modes
 */
export function getAllDiscoveredIds(): string[] {
  const storage = loadStorage();
  const idSet = new Set<string>();

  for (const dailyState of Object.values(storage.daily)) {
    for (const id of dailyState.guessedIds) {
      idSet.add(id);
    }
  }

  for (const tier of ALL_TIERS) {
    const infiniteState = storage.infinite[tier];
    for (const id of infiniteState.guessedIds) {
      idSet.add(id);
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
