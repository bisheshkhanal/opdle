import { beforeEach, describe, expect, it } from "vitest";
import {
  addInfiniteGuess,
  clearStorage,
  getInfiniteState,
  loadStorage,
} from "../storage";
import type { GuessResult, StorageSchema } from "../types";

const STORAGE_KEY = "onepiecedle_v2";

const mockGuess: GuessResult = {
  characterId: "test-guess",
  characterName: "Test Guess",
  imageUrl: "/characters/test-guess.webp",
  categories: [
    {
      key: "gender",
      label: "Gender",
      status: "wrong",
      value: "Male",
      displayValue: "Male",
    },
  ],
  isCorrect: false,
};

describe("storage.ts", () => {
  beforeEach(() => {
    clearStorage();
  });

  describe("loadStorage", () => {
    it("persists the default schema when storage is empty", () => {
      const firstState = getInfiniteState();
      const stored = localStorage.getItem(STORAGE_KEY);
      const secondState = getInfiniteState();

      expect(stored).not.toBeNull();
      expect(secondState.roundId).toBe(firstState.roundId);
    });

    it("persists migrated data after version mismatch", () => {
      const legacyStorage: StorageSchema = {
        version: 1,
        daily: {},
        infinite: {
          roundId: "legacy-round",
          seed: 123,
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStorage));

      const firstState = getInfiniteState();
      const secondState = getInfiniteState();
      const persisted = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      ) as StorageSchema;

      expect(secondState.roundId).toBe(firstState.roundId);
      expect(persisted.version).toBe(loadStorage().version);
      expect(persisted.version).not.toBe(legacyStorage.version);
    });

    it("persists a reset schema when stored JSON is invalid", () => {
      localStorage.setItem(STORAGE_KEY, "{invalid-json");

      const firstState = getInfiniteState();
      const secondState = getInfiniteState();

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(secondState.roundId).toBe(firstState.roundId);
    });
  });

  describe("addInfiniteGuess", () => {
    it("keeps the same roundId when the first guess is saved", () => {
      const initialState = getInfiniteState();
      const updatedState = addInfiniteGuess(mockGuess);
      const persistedState = getInfiniteState();

      expect(updatedState.roundId).toBe(initialState.roundId);
      expect(persistedState.roundId).toBe(initialState.roundId);
      expect(persistedState.guesses).toHaveLength(1);
      expect(persistedState.guessedIds).toContain(mockGuess.characterId);
    });
  });
});
