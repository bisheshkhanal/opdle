/**
 * localStorage persistence with schema versioning
 */

import type { DailyState, InfiniteState, StorageSchema, GuessResult } from "./types";
import { getUTCDateString } from "./daily";
import { generateRoundId } from "./infinite";
import { getLocalCharacterImageUrl } from "./images";

const STORAGE_KEY = "onepiecedle_v2";
const CURRENT_VERSION = 2;

/**
 * Get default storage schema
 */
function getDefaultSchema(): StorageSchema {
  return {
    version: CURRENT_VERSION,
    daily: {},
    infinite: {
      roundId: generateRoundId(),
      seed: Date.now(),
      guesses: [],
      guessedIds: [],
      isFinished: false,
      isWon: false,
      totalWins: 0,
      totalGames: 0,
    },
    stats: {
      dailyStreak: 0,
      dailyMaxStreak: 0,
      infiniteTotalWins: 0,
      infiniteTotalGames: 0,
    },
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

  if (normalizeGuessImages(storage.infinite?.guesses)) {
    changed = true;
  }

  if (storage.daily) {
    for (const date of Object.keys(storage.daily)) {
      const dailyState = storage.daily[date];
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
      return getDefaultSchema();
    }

    const parsed = JSON.parse(stored) as StorageSchema;

    // Version migration if needed
    if (parsed.version !== CURRENT_VERSION) {
      return migrateStorage(parsed);
    }

    const changed = normalizeStorageImages(parsed);
    if (changed) {
      saveStorage(parsed);
    }

    return parsed;
  } catch {
    return getDefaultSchema();
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
function migrateStorage(old: StorageSchema): StorageSchema {
  // For now, just return default if version mismatch
  // Add migration logic here as versions evolve
  return getDefaultSchema();
}

/**
 * Get daily state for a specific date
 */
export function getDailyState(dateString?: string): DailyState {
  const date = dateString || getUTCDateString();
  const storage = loadStorage();

  if (storage.daily[date]) {
    return storage.daily[date];
  }

  return {
    date,
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    streak: storage.stats.dailyStreak,
    maxStreak: storage.stats.dailyMaxStreak,
  };
}

/**
 * Save daily state for a specific date
 */
export function saveDailyState(state: DailyState): void {
  const storage = loadStorage();
  storage.daily[state.date] = state;

  if (state.isFinished) {
    if (state.isWon) {
      storage.stats.dailyStreak = state.streak;
      storage.stats.dailyMaxStreak = Math.max(
        storage.stats.dailyMaxStreak,
        state.streak
      );
    } else {
      storage.stats.dailyStreak = 0;
    }
  }

  saveStorage(storage);
}

/**
 * Check if a character has already been guessed in daily mode
 */
export function isDailyDuplicate(characterId: string, dateString?: string): boolean {
  const state = getDailyState(dateString);
  return state.guessedIds.includes(characterId);
}

/**
 * Add a guess to daily state
 */
export function addDailyGuess(guess: GuessResult, dateString?: string): DailyState {
  const date = dateString || getUTCDateString();
  const state = getDailyState(date);

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

  saveDailyState(state);
  return state;
}

/**
 * Get infinite state
 */
export function getInfiniteState(): InfiniteState {
  const storage = loadStorage();
  return storage.infinite;
}

/**
 * Save infinite state
 */
export function saveInfiniteState(state: InfiniteState): void {
  const storage = loadStorage();
  storage.infinite = state;
  storage.stats.infiniteTotalWins = state.totalWins;
  storage.stats.infiniteTotalGames = state.totalGames;
  saveStorage(storage);
}

/**
 * Check if a character has already been guessed in infinite mode
 */
export function isInfiniteDuplicate(characterId: string): boolean {
  const state = getInfiniteState();
  return state.guessedIds.includes(characterId);
}

/**
 * Add a guess to infinite state
 */
export function addInfiniteGuess(guess: GuessResult): InfiniteState {
  const state = getInfiniteState();

  // Block duplicate
  if (state.guessedIds.includes(guess.characterId)) {
    return state;
  }

  state.guesses.push(guess);
  state.guessedIds.push(guess.characterId);

  if (guess.isCorrect) {
    state.isWon = true;
    state.isFinished = true;
    state.totalWins += 1;
    state.totalGames += 1;
  } else if (state.guesses.length >= 6) {
    state.isFinished = true;
    state.totalGames += 1;
  }

  saveInfiniteState(state);
  return state;
}

/**
 * Start a new infinite round
 */
export function startNewInfiniteRound(): InfiniteState {
  const currentState = getInfiniteState();

  const newState: InfiniteState = {
    roundId: generateRoundId(),
    seed: Date.now(),
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    totalWins: currentState.totalWins,
    totalGames: currentState.totalGames,
  };

  saveInfiniteState(newState);
  return newState;
}

/**
 * Get overall stats
 */
export function getStats(): StorageSchema["stats"] {
  const storage = loadStorage();
  return storage.stats;
}

/**
 * Clear all storage (for testing/reset)
 */
export function clearStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
