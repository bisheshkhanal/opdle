import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDailyGuess,
  addInfiniteGuess,
  clearStorage,
  getDailyState,
  getAllDiscoveredIds,
  getInfiniteState,
  getInfiniteStats,
  getSelectedTier,
  isDailyDuplicate,
  isInfiniteDuplicate,
  loadStorage,
  markHintUsed,
  saveDailyState,
  saveStorage,
  setSelectedTier,
  startNewInfiniteRound,
  buildRulesetDailyKey,
  buildRulesetInfiniteKey,
  getRulesetDailyState,
  saveRulesetDailyState,
  getRulesetInfiniteState,
  saveRulesetInfiniteState,
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

function createGuess(characterId: string, isCorrect: boolean): GuessResult {
  return {
    ...mockGuess,
    characterId,
    characterName: characterId,
    imageUrl: `/characters/${characterId}.png`,
    isCorrect,
  };
}

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
          "casual:2026-01-01": {
            date: "2026-01-01",
            guesses: [createGuess("luffy", true), createGuess("zoro", true)],
            guessedIds: ["luffy", "zoro"],
            isFinished: false,
            isWon: false,
            streak: 0,
            maxStreak: 0,
          },
          "casual:2026-01-02": {
            date: "2026-01-02",
            guesses: [createGuess("nami", true), createGuess("luffy", true)],
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
            guesses: [createGuess("sanji", true)],
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
          "casual:2026-01-01": {
            date: "2026-01-01",
            guesses: [createGuess("luffy", true), createGuess("zoro", true)],
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
            guesses: [createGuess("luffy", true)],
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

  describe("storage.ts - additional coverage", () => {
    describe("daily guess persistence", () => {
      it("addDailyGuess persists guess and guessedId", () => {
        const date = "2026-04-01";
        const guess = createGuess("usopp", false);

        const state = addDailyGuess(guess, "casual", date);
        const persisted = getDailyState("casual", date);

        expect(state.guesses).toHaveLength(1);
        expect(state.guessedIds).toEqual(["usopp"]);
        expect(persisted.guesses).toHaveLength(1);
        expect(persisted.guessedIds).toEqual(["usopp"]);
      });

      it("addDailyGuess for correct guess sets isWon=true, isFinished=true, increments streak", () => {
        const date = "2026-04-02";
        const state = addDailyGuess(createGuess("luffy", true), "casual", date);

        expect(state.isWon).toBe(true);
        expect(state.isFinished).toBe(true);
        expect(state.streak).toBe(1);

        const persisted = getDailyState("casual", date);
        expect(persisted.streak).toBe(1);
      });

      it("addDailyGuess for wrong guess after 6 total sets isFinished=true, streak=0", () => {
        const date = "2026-04-03";
        for (let i = 0; i < 6; i++) {
          addDailyGuess(createGuess(`wrong-${i}`, false), "casual", date);
        }

        const state = getDailyState("casual", date);
        expect(state.isFinished).toBe(true);
        expect(state.streak).toBe(0);
        expect(state.isWon).toBe(false);
      });

      it("getDailyState returns default for non-existent date", () => {
        const state = getDailyState("casual", "2099-01-01");

        expect(state.date).toBe("2099-01-01");
        expect(state.guesses).toEqual([]);
        expect(state.guessedIds).toEqual([]);
        expect(state.isFinished).toBe(false);
        expect(state.isWon).toBe(false);
      });
    });

    describe("duplicate blocking", () => {
      it("addDailyGuess blocks duplicate character ID", () => {
        const date = "2026-04-04";
        addDailyGuess(createGuess("ace", false), "casual", date);
        addDailyGuess(createGuess("ace", true), "casual", date);

        const state = getDailyState("casual", date);
        expect(state.guesses).toHaveLength(1);
        expect(state.guessedIds).toEqual(["ace"]);
      });

      it("addInfiniteGuess blocks duplicate character ID", () => {
        addInfiniteGuess(createGuess("law", false), "casual");
        addInfiniteGuess(createGuess("law", true), "casual");

        const state = getInfiniteState("casual");
        expect(state.guesses).toHaveLength(1);
        expect(state.guessedIds).toEqual(["law"]);
      });

      it("isDailyDuplicate returns true for guessed character", () => {
        const date = "2026-04-05";
        addDailyGuess(createGuess("zoro", false), "casual", date);

        expect(isDailyDuplicate("zoro", "casual", date)).toBe(true);
      });

      it("isInfiniteDuplicate returns true for guessed character", () => {
        addInfiniteGuess(createGuess("sanji", false), "casual");

        expect(isInfiniteDuplicate("sanji", "casual")).toBe(true);
      });
    });

    describe("startNewInfiniteRound", () => {
      it("resets guesses and guessedIds to empty", () => {
        addInfiniteGuess(createGuess("brook", false), "casual");
        const next = startNewInfiniteRound("casual");

        expect(next.guesses).toEqual([]);
        expect(next.guessedIds).toEqual([]);
      });

      it("preserves totalWins and totalGames", () => {
        addInfiniteGuess(createGuess("luffy", true), "casual");
        const before = getInfiniteState("casual");

        const next = startNewInfiniteRound("casual");
        expect(next.totalWins).toBe(before.totalWins);
        expect(next.totalGames).toBe(before.totalGames);
      });

      it("generates new roundId", () => {
        const before = getInfiniteState("casual");
        const next = startNewInfiniteRound("casual");

        expect(next.roundId).not.toBe(before.roundId);
      });

      it("sets isFinished=false, isWon=false", () => {
        addInfiniteGuess(createGuess("roger", true), "casual");
        const next = startNewInfiniteRound("casual");

        expect(next.isFinished).toBe(false);
        expect(next.isWon).toBe(false);
      });
    });

    describe("clearStorage", () => {
      it("removes the storage key entirely", () => {
        void loadStorage();
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

        clearStorage();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });
    });

    describe("tier selection", () => {
      it('getSelectedTier returns default "casual"', () => {
        expect(getSelectedTier()).toBe("casual");
      });

      it("setSelectedTier changes the tier", () => {
        setSelectedTier("fan");
        expect(getSelectedTier()).toBe("fan");
      });
    });

    describe("hint tracking", () => {
      it("markHintUsed sets hintUsed=true for daily", () => {
        markHintUsed("casual", "daily", "2026-04-06");
        const state = getDailyState("casual", "2026-04-06");

        expect(state.hintUsed).toBe(true);
      });

      it("markHintUsed sets hintUsed=true for infinite", () => {
        markHintUsed("casual", "infinite");
        const state = getInfiniteState("casual");

        expect(state.hintUsed).toBe(true);
      });
    });

    describe("idempotency", () => {
      it("saveDailyState called twice on same finished win does NOT double-count stats", () => {
        const state = {
          date: "2026-04-07",
          guesses: [createGuess("jinbe", true)],
          guessedIds: ["jinbe"],
          isFinished: true,
          isWon: true,
          streak: 1,
          maxStreak: 1,
        };

        saveDailyState(state, "casual");
        saveDailyState(state, "casual");

        const storage = loadStorage();
        const stats = storage.dailyStats.casual;
        expect(stats.streak).toBe(1);
        expect(stats.maxStreak).toBe(1);
        expect(stats.winDistribution[1]).toBe(1);
      });
    });
  });

  describe("ruleset key builders", () => {
    it("buildRulesetDailyKey produces tier:ruleset:date format", () => {
      expect(buildRulesetDailyKey("casual", "wanted", "2026-04-12")).toBe(
        "casual:wanted:2026-04-12"
      );
    });

    it("buildRulesetInfiniteKey produces tier:ruleset format", () => {
      expect(buildRulesetInfiniteKey("fan", "four-seas")).toBe("fan:four-seas");
    });
  });

  describe("ruleset daily state", () => {
    it("returns default state when no ruleset daily exists", () => {
      const state = getRulesetDailyState("casual", "wanted", "2026-04-12");
      expect(state.guesses).toEqual([]);
      expect(state.guessedIds).toEqual([]);
      expect(state.isFinished).toBe(false);
      expect(state.isWon).toBe(false);
    });

    it("saves and loads wanted daily state", () => {
      const date = "2026-04-12";
      const guess = createGuess("luffy", true);
      const state = {
        guesses: [guess],
        guessedIds: ["luffy"],
        isFinished: true,
        isWon: true,
        revealStep: 3,
      };

      saveRulesetDailyState(state, "casual", "wanted", date);
      const loaded = getRulesetDailyState("casual", "wanted", date);

      expect(loaded.guesses).toHaveLength(1);
      expect(loaded.guessedIds).toEqual(["luffy"]);
      expect(loaded.isFinished).toBe(true);
      expect(loaded.isWon).toBe(true);
      expect(loaded.revealStep).toBe(3);
    });

    it("saves and loads four-seas daily state independently", () => {
      const date = "2026-04-12";
      const state = {
        guesses: [createGuess("zoro", false)],
        guessedIds: ["zoro"],
        isFinished: false,
        isWon: false,
        clueIndex: 2,
      };

      saveRulesetDailyState(state, "fan", "four-seas", date);
      const loaded = getRulesetDailyState("fan", "four-seas", date);

      expect(loaded.guessedIds).toEqual(["zoro"]);
      expect(loaded.clueIndex).toBe(2);
    });

    it("isolates ruleset daily from classic daily", () => {
      const date = "2026-04-12";
      addDailyGuess(createGuess("nami", true), "casual", date);

      const rulesetState = getRulesetDailyState("casual", "wanted", date);
      expect(rulesetState.guesses).toEqual([]);
      expect(rulesetState.isWon).toBe(false);
    });
  });

  describe("ruleset infinite state", () => {
    it("returns default state when no ruleset infinite exists", () => {
      const state = getRulesetInfiniteState("casual", "wanted");
      expect(state.guesses).toEqual([]);
      expect(state.guessedIds).toEqual([]);
      expect(state.isFinished).toBe(false);
      expect(state.isWon).toBe(false);
    });

    it("saves and loads wanted infinite state", () => {
      const state = {
        guesses: [createGuess("sanji", true)],
        guessedIds: ["sanji"],
        isFinished: true,
        isWon: true,
        revealStep: 5,
      };

      saveRulesetInfiniteState(state, "casual", "wanted");
      const loaded = getRulesetInfiniteState("casual", "wanted");

      expect(loaded.guesses).toHaveLength(1);
      expect(loaded.guessedIds).toEqual(["sanji"]);
      expect(loaded.isWon).toBe(true);
      expect(loaded.revealStep).toBe(5);
    });

    it("saves and loads four-seas infinite state independently", () => {
      const state = {
        guesses: [createGuess("robin", false)],
        guessedIds: ["robin"],
        isFinished: false,
        isWon: false,
        clueIndex: 1,
      };

      saveRulesetInfiniteState(state, "nakama", "four-seas");
      const loaded = getRulesetInfiniteState("nakama", "four-seas");

      expect(loaded.guessedIds).toEqual(["robin"]);
      expect(loaded.clueIndex).toBe(1);
    });

    it("isolates ruleset infinite from classic infinite", () => {
      addInfiniteGuess(createGuess("chopper", true), "casual");

      const rulesetState = getRulesetInfiniteState("casual", "wanted");
      expect(rulesetState.guesses).toEqual([]);
      expect(rulesetState.isWon).toBe(false);
    });

    it("different rulesets for same tier have independent state", () => {
      const wantedState = {
        guesses: [createGuess("brook", true)],
        guessedIds: ["brook"],
        isFinished: true,
        isWon: true,
      };
      const quoteState = {
        guesses: [createGuess("franky", false)],
        guessedIds: ["franky"],
        isFinished: false,
        isWon: false,
      };

      saveRulesetInfiniteState(wantedState, "casual", "wanted");
      saveRulesetInfiniteState(quoteState, "casual", "quote");

      const loadedWanted = getRulesetInfiniteState("casual", "wanted");
      const loadedQuote = getRulesetInfiniteState("casual", "quote");

      expect(loadedWanted.guessedIds).toEqual(["brook"]);
      expect(loadedQuote.guessedIds).toEqual(["franky"]);
    });
  });
});
