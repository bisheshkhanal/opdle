import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addInfiniteGuess,
  clearStorage,
  getAllDiscoveredIds,
  getInfiniteState,
  getInfiniteStats,
  loadStorage,
  markHintUsed,
  saveStorage,
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
    vi.unstubAllGlobals();
    clearStorage();
  });

  describe("loadStorage", () => {
    it("persists the default schema when storage is empty", () => {
      const firstState = getInfiniteState("casual");
      const stored = localStorage.getItem(STORAGE_KEY);
      const secondState = getInfiniteState("casual");

      expect(stored).not.toBeNull();
      expect(secondState.roundId).toBe(firstState.roundId);
    });

    it("persists migrated data after version mismatch", () => {
      const legacyStorage = {
        version: 1,
        daily: {},
        infinite: {},
        stats: {
          dailyStreak: 0,
          dailyMaxStreak: 0,
          infiniteTotalWins: 0,
          infiniteTotalGames: 0,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStorage));

      const firstState = getInfiniteState("casual");
      const secondState = getInfiniteState("casual");
      const persisted = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      ) as StorageSchema;

      expect(secondState.roundId).toBe(firstState.roundId);
      expect(persisted.version).toBe(loadStorage().version);
      expect(persisted.version).not.toBe(legacyStorage.version);
    });

    it("persists a reset schema when stored JSON is invalid", () => {
      localStorage.setItem(STORAGE_KEY, "{invalid-json");

      const firstState = getInfiniteState("casual");
      const secondState = getInfiniteState("casual");

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(secondState.roundId).toBe(firstState.roundId);
    });
  });

  describe("addInfiniteGuess", () => {
    beforeEach(() => {
      clearStorage();
    });

    it("keeps the same roundId when the first guess is saved", () => {
      const initialState = getInfiniteState("casual");
      const updatedState = addInfiniteGuess(mockGuess, "casual");
      const persistedState = getInfiniteState("casual");

      expect(updatedState.roundId).toBe(initialState.roundId);
      expect(persistedState.roundId).toBe(initialState.roundId);
      expect(persistedState.guesses).toHaveLength(1);
      expect(persistedState.guessedIds).toContain(mockGuess.characterId);
    });
  });

  describe("getAllDiscoveredIds", () => {
    const emptyInfiniteTier = {
      roundId: "",
      seed: 0,
      guesses: [] as GuessResult[],
      guessedIds: [] as string[],
      isFinished: false,
      isWon: false,
      totalWins: 0,
      totalGames: 0,
      hintUsed: false,
    };

    beforeEach(() => {
      clearStorage();
    });

    function seedStorage(data: Partial<StorageSchema>): void {
      const base = loadStorage();
      const merged = { ...base, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }

    it("returns an empty array when no guesses exist", () => {
      seedStorage({});
      expect(getAllDiscoveredIds()).toEqual([]);
    });

    it("returns unique IDs from daily guesses", () => {
      seedStorage({
        daily: {
          "2026-01-01": {
            date: "2026-01-01",
            guesses: [],
            guessedIds: ["luffy", "zoro"],
            isFinished: false,
            isWon: false,
            streak: 0,
            maxStreak: 0,
          },
          "2026-01-02": {
            date: "2026-01-02",
            guesses: [],
            guessedIds: ["nami", "luffy"],
            isFinished: false,
            isWon: false,
            streak: 0,
            maxStreak: 0,
          },
        },
      });

      const ids = getAllDiscoveredIds();
      expect(ids.sort()).toEqual(["luffy", "nami", "zoro"]);
    });

    it("includes IDs from infinite state", () => {
      seedStorage({
        infinite: {
          casual: {
            ...emptyInfiniteTier,
            roundId: "test-round",
            guessedIds: ["sanji"],
          },
          fan: emptyInfiniteTier,
          nakama: emptyInfiniteTier,
        },
      });

      const ids = getAllDiscoveredIds();
      expect(ids).toContain("sanji");
      expect(ids).toHaveLength(1);
    });

    it("deduplicates IDs appearing in both daily and infinite", () => {
      seedStorage({
        daily: {
          "2026-01-01": {
            date: "2026-01-01",
            guesses: [],
            guessedIds: ["luffy", "zoro"],
            isFinished: false,
            isWon: false,
            streak: 0,
            maxStreak: 0,
          },
        },
        infinite: {
          casual: {
            ...emptyInfiniteTier,
            roundId: "test-round",
            guessedIds: ["luffy"],
          },
          fan: emptyInfiniteTier,
          nakama: emptyInfiniteTier,
        },
      });

      const ids = getAllDiscoveredIds();
      const luffyCount = ids.filter((id) => id === "luffy").length;
      expect(luffyCount).toBe(1);
      expect(ids.sort()).toEqual(["luffy", "zoro"]);
    });
  });

  describe("markHintUsed", () => {
    it("persists hintUsed for daily mode", () => {
      markHintUsed("casual", "daily", "2026-03-30");

      const storage = loadStorage();
      const dailyState = storage.daily["casual:2026-03-30"];
      expect(dailyState).toBeDefined();
      expect(dailyState.hintUsed).toBe(true);
    });

    it("persists hintUsed for infinite mode", () => {
      markHintUsed("casual", "infinite");

      const state = getInfiniteState("casual");
      expect(state.hintUsed).toBe(true);
    });

    it("does not throw when called twice and keeps hintUsed true", () => {
      markHintUsed("casual", "infinite");
      expect(() => markHintUsed("casual", "infinite")).not.toThrow();

      const state = getInfiniteState("casual");
      expect(state.hintUsed).toBe(true);
    });
  });

  describe("infinite stats tracking", () => {
    it("returns defaults for a fresh tier", () => {
      const stats = getInfiniteStats("casual");
      expect(stats.streak).toBe(0);
      expect(stats.maxStreak).toBe(0);
      expect(stats.winDistribution).toEqual({});
    });

    it("increments streak to 1 on a correct guess", () => {
      const correctGuess: GuessResult = {
        ...mockGuess,
        isCorrect: true,
      };
      addInfiniteGuess(correctGuess, "casual");

      const stats = getInfiniteStats("casual");
      expect(stats.streak).toBe(1);
    });

    it("records winDistribution for a single-win round", () => {
      const correctGuess: GuessResult = {
        ...mockGuess,
        isCorrect: true,
      };
      addInfiniteGuess(correctGuess, "casual");

      const stats = getInfiniteStats("casual");
      expect(stats.winDistribution[1]).toBe(1);
    });

    it("tracks two consecutive wins with streak 2 and maxStreak 2", () => {
      const correctGuess: GuessResult = {
        ...mockGuess,
        isCorrect: true,
        characterId: "round1-char",
      };
      addInfiniteGuess(correctGuess, "casual");

      const currentState = getInfiniteState("casual");
      const freshRound: typeof currentState = {
        ...currentState,
        roundId: "test-round-2",
        guesses: [],
        guessedIds: [],
        isFinished: false,
        isWon: false,
      };
      saveStorage({
        ...loadStorage(),
        infinite: {
          ...loadStorage().infinite,
          casual: freshRound,
        },
      });

      const correctGuess2: GuessResult = {
        ...mockGuess,
        isCorrect: true,
        characterId: "round2-char",
      };
      addInfiniteGuess(correctGuess2, "casual");

      const stats = getInfiniteStats("casual");
      expect(stats.streak).toBe(2);
      expect(stats.maxStreak).toBe(2);
    });

    it("resets streak on a loss while preserving maxStreak", () => {
      const correctGuess: GuessResult = {
        ...mockGuess,
        isCorrect: true,
      };
      addInfiniteGuess(correctGuess, "casual");

      const currentState = getInfiniteState("casual");
      const freshRound: typeof currentState = {
        ...currentState,
        roundId: "test-round-2",
        guesses: [],
        guessedIds: [],
        isFinished: false,
        isWon: false,
      };
      saveStorage({
        ...loadStorage(),
        infinite: {
          ...loadStorage().infinite,
          casual: freshRound,
        },
      });

      const wrongGuess: GuessResult = {
        ...mockGuess,
        isCorrect: false,
        characterId: "wrong1",
      };
      for (let i = 0; i < 6; i++) {
        addInfiniteGuess(
          { ...wrongGuess, characterId: `wrong-${i}` },
          "casual"
        );
      }

      const stats = getInfiniteStats("casual");
      expect(stats.streak).toBe(0);
      expect(stats.maxStreak).toBe(1);
    });

    it("includes hintUsed: false in default infinite state", () => {
      const state = getInfiniteState("casual");
      expect(state.hintUsed).toBe(false);
    });
  });
});
