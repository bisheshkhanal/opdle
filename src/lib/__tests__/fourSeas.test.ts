import { describe, it, expect } from "vitest";
import {
  initFourSeasState,
  applyFourSeasGuess,
  isFourSeasFinished,
  isFourSeasWon,
  getFourSeasTotalGuesses,
  getFourSeasShareData,
  serializeFourSeasState,
  deserializeFourSeasState,
  BOARD_ORDER,
  FOUR_SEAS_MAX_GUESSES,
} from "../fourSeas";
import type { Character } from "../types";
import { selectFourSeasTargets } from "../selectors";
import { runModeContractTests } from "./modeContract";
import sampleData from "../../data/characters.v2.json";

const characters = sampleData as Character[];

function findChar(id: string): Character {
  const c = characters.find((ch) => ch.id === id);
  if (!c) throw new Error(`Character ${id} not found`);
  return c;
}

function makeCharacter(
  id: string,
  overrides: Partial<Character> = {}
): Character {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    aliases: [],
    imageUrl: `/characters/${id}.png`,
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: [],
    bounty: null,
    heightCm: null,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
    ...overrides,
  };
}

const luffy = makeCharacter("luffy", { name: "Monkey D. Luffy" });
const zoro = makeCharacter("zoro", { name: "Roronoa Zoro" });
const nami = makeCharacter("nami", { name: "Nami" });
const usopp = makeCharacter("usopp", { name: "Usopp" });
const sanji = makeCharacter("sanji", { name: "Sanji" });

const fourTargets = [luffy, zoro, nami, usopp];

function makeTargetMap(targets: Character[]): Record<string, Character> {
  const map: Record<string, Character> = {};
  for (const c of targets) {
    map[c.id] = c;
  }
  return map;
}

describe("Four Seas Engine", () => {
  describe("initFourSeasState", () => {
    it("creates 4 boards from 4 characters", () => {
      const state = initFourSeasState(fourTargets);
      expect(Object.keys(state.boards)).toHaveLength(4);
      expect(state.boardOrder).toHaveLength(4);
    });

    it("assigns targets to correct boards in order", () => {
      const state = initFourSeasState(fourTargets);
      expect(state.boards.north.targetCharacterId).toBe("luffy");
      expect(state.boards.east.targetCharacterId).toBe("zoro");
      expect(state.boards.south.targetCharacterId).toBe("nami");
      expect(state.boards.west.targetCharacterId).toBe("usopp");
    });

    it("initializes all boards with empty guesses and not finished", () => {
      const state = initFourSeasState(fourTargets);
      for (const boardId of state.boardOrder) {
        const board = state.boards[boardId];
        expect(board.guesses).toEqual([]);
        expect(board.guessedIds).toEqual([]);
        expect(board.isFinished).toBe(false);
        expect(board.isWon).toBe(false);
      }
    });

    it("boardOrder matches BOARD_ORDER constant", () => {
      const state = initFourSeasState(fourTargets);
      expect(state.boardOrder).toEqual(BOARD_ORDER);
    });

    it("throws if not exactly 4 characters", () => {
      expect(() => initFourSeasState([luffy, zoro, nami])).toThrow(
        "Four Seas requires exactly 4 targets, got 3"
      );
      expect(() =>
        initFourSeasState([luffy, zoro, nami, usopp, sanji])
      ).toThrow("Four Seas requires exactly 4 targets, got 5");
      expect(() => initFourSeasState([])).toThrow(
        "Four Seas requires exactly 4 targets, got 0"
      );
    });
  });

  describe("applyFourSeasGuess — with real data", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const bigMom = findChar("big-mom");

    const alvida = findChar("alvida");
    const aokiji = findChar("aokiji");
    const apoo = findChar("apoo");

    it("correct guess on one board wins that board", () => {
      const targets = [ace, akainu, arlong, buggy];
      const state = initFourSeasState(targets);
      const targetMap = makeTargetMap(targets);
      const next = applyFourSeasGuess(state, "north", ace, targetMap);

      expect(next.boards.north.isFinished).toBe(true);
      expect(next.boards.north.isWon).toBe(true);
      expect(next.boards.north.guesses).toHaveLength(1);
      expect(next.boards.north.guesses[0].isCorrect).toBe(true);
    });

    it("guess on one board does not affect other boards", () => {
      const targets = [ace, akainu, arlong, buggy];
      const state = initFourSeasState(targets);
      const targetMap = makeTargetMap(targets);
      const next = applyFourSeasGuess(state, "north", bigMom, targetMap);

      expect(next.boards.north.guesses).toHaveLength(1);
      expect(next.boards.east.guesses).toHaveLength(0);
      expect(next.boards.south.guesses).toHaveLength(0);
      expect(next.boards.west.guesses).toHaveLength(0);
    });

    it("wrong guess does not finish the board", () => {
      const targets = [ace, akainu, arlong, buggy];
      const state = initFourSeasState(targets);
      const targetMap = makeTargetMap(targets);
      const next = applyFourSeasGuess(state, "north", bigMom, targetMap);

      expect(next.boards.north.isFinished).toBe(false);
      expect(next.boards.north.isWon).toBe(false);
      expect(next.boards.north.guesses[0].isCorrect).toBe(false);
    });

    it("max wrong guesses loses the board", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      const wrongGuesses: Character[] = [
        bigMom,
        alvida,
        aokiji,
        apoo,
        akainu,
        arlong,
      ];
      let state = initFourSeasState(targets);
      for (const wrongChar of wrongGuesses) {
        state = applyFourSeasGuess(state, "north", wrongChar, targetMap);
      }

      expect(state.boards.north.isFinished).toBe(true);
      expect(state.boards.north.isWon).toBe(false);
      expect(state.boards.north.guesses).toHaveLength(FOUR_SEAS_MAX_GUESSES);
    });

    it("duplicate guess on same board is ignored", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", bigMom, targetMap);
      state = applyFourSeasGuess(state, "north", bigMom, targetMap);

      expect(state.boards.north.guesses).toHaveLength(1);
    });

    it("guess after board is finished is ignored", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      expect(state.boards.north.isFinished).toBe(true);

      state = applyFourSeasGuess(state, "north", bigMom, targetMap);
      expect(state.boards.north.guesses).toHaveLength(1);
    });

    it("returns same state reference when board is finished", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      const state = initFourSeasState(targets);
      const won = applyFourSeasGuess(state, "north", ace, targetMap);
      const after = applyFourSeasGuess(won, "north", bigMom, targetMap);

      expect(after).toBe(won);
    });

    it("returns same state reference for duplicate guess", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      const state = initFourSeasState(targets);
      const first = applyFourSeasGuess(state, "north", bigMom, targetMap);
      const second = applyFourSeasGuess(first, "north", bigMom, targetMap);

      expect(second).toBe(first);
    });

    it("same character can be guessed on different boards", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", bigMom, targetMap);
      state = applyFourSeasGuess(state, "east", bigMom, targetMap);

      expect(state.boards.north.guesses).toHaveLength(1);
      expect(state.boards.east.guesses).toHaveLength(1);
      expect(state.boards.north.guessedIds).toContain("big-mom");
      expect(state.boards.east.guessedIds).toContain("big-mom");
    });

    it("uses classic evaluateGuess for category feedback", () => {
      const targets = [ace, akainu, arlong, buggy];
      const targetMap = makeTargetMap(targets);
      const state = initFourSeasState(targets);
      const next = applyFourSeasGuess(state, "north", bigMom, targetMap);

      const guessResult = next.boards.north.guesses[0];
      expect(guessResult.categories.length).toBeGreaterThan(0);
      expect(guessResult.characterId).toBe("big-mom");
    });
  });

  describe("isFourSeasFinished", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("returns false when no boards are finished", () => {
      const state = initFourSeasState(targets);
      expect(isFourSeasFinished(state)).toBe(false);
    });

    it("returns false when some but not all boards are finished", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);

      expect(isFourSeasFinished(state)).toBe(false);
    });

    it("returns true when all boards are won", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      state = applyFourSeasGuess(state, "east", akainu, targetMap);
      state = applyFourSeasGuess(state, "south", arlong, targetMap);
      state = applyFourSeasGuess(state, "west", buggy, targetMap);

      expect(isFourSeasFinished(state)).toBe(true);
    });

    it("returns true when all boards are lost", () => {
      const wrongPool = [
        findChar("big-mom"),
        findChar("alvida"),
        findChar("aokiji"),
        findChar("apoo"),
        findChar("blackbeard"),
        findChar("bellamy"),
      ];
      let state = initFourSeasState(targets);
      for (const boardId of BOARD_ORDER) {
        for (const wrongChar of wrongPool) {
          state = applyFourSeasGuess(state, boardId, wrongChar, targetMap);
        }
      }

      expect(isFourSeasFinished(state)).toBe(true);
    });
  });

  describe("isFourSeasWon", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("returns false when no boards are won", () => {
      const state = initFourSeasState(targets);
      expect(isFourSeasWon(state)).toBe(false);
    });

    it("returns false when some boards are won but not all", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(
        state,
        "north",
        findChar("big-mom"),
        targetMap
      );
      state = applyFourSeasGuess(state, "east", findChar("big-mom"), targetMap);

      expect(isFourSeasWon(state)).toBe(false);
    });

    it("returns true when all 4 boards are won", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      state = applyFourSeasGuess(state, "east", akainu, targetMap);
      state = applyFourSeasGuess(state, "south", arlong, targetMap);
      state = applyFourSeasGuess(state, "west", buggy, targetMap);

      expect(isFourSeasWon(state)).toBe(true);
    });

    it("returns false when boards are finished but not all won", () => {
      const wrongPool = [
        findChar("big-mom"),
        findChar("alvida"),
        findChar("aokiji"),
        findChar("apoo"),
        findChar("blackbeard"),
        findChar("bellamy"),
      ];
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      for (const wrongChar of wrongPool) {
        state = applyFourSeasGuess(state, "east", wrongChar, targetMap);
      }
      state = applyFourSeasGuess(state, "south", arlong, targetMap);
      for (const wrongChar of wrongPool) {
        state = applyFourSeasGuess(state, "west", wrongChar, targetMap);
      }

      expect(isFourSeasFinished(state)).toBe(true);
      expect(isFourSeasWon(state)).toBe(false);
    });
  });

  describe("getFourSeasTotalGuesses", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const bigMom = findChar("big-mom");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("returns 0 for initial state", () => {
      const state = initFourSeasState(targets);
      expect(getFourSeasTotalGuesses(state)).toBe(0);
    });

    it("sums guesses across all boards", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", bigMom, targetMap);
      state = applyFourSeasGuess(state, "east", bigMom, targetMap);
      state = applyFourSeasGuess(state, "east", ace, targetMap);

      expect(getFourSeasTotalGuesses(state)).toBe(3);
    });
  });

  describe("getFourSeasShareData", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const bigMom = findChar("big-mom");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("returns correct data for initial state", () => {
      const state = initFourSeasState(targets);
      const share = getFourSeasShareData(state);

      expect(share.boardsCompleted).toBe(0);
      expect(share.boardsWon).toBe(0);
      expect(share.totalGuesses).toBe(0);
      expect(share.boardResults).toHaveLength(4);
    });

    it("returns correct data after partial progress", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      state = applyFourSeasGuess(state, "east", bigMom, targetMap);

      const share = getFourSeasShareData(state);
      expect(share.boardsCompleted).toBe(1);
      expect(share.boardsWon).toBe(1);
      expect(share.totalGuesses).toBe(2);
      expect(share.boardResults.find((r) => r.boardId === "north")?.won).toBe(
        true
      );
      expect(share.boardResults.find((r) => r.boardId === "east")?.won).toBe(
        false
      );
    });

    it("returns correct data for full win", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", ace, targetMap);
      state = applyFourSeasGuess(state, "east", akainu, targetMap);
      state = applyFourSeasGuess(state, "south", arlong, targetMap);
      state = applyFourSeasGuess(state, "west", buggy, targetMap);

      const share = getFourSeasShareData(state);
      expect(share.boardsCompleted).toBe(4);
      expect(share.boardsWon).toBe(4);
      expect(share.totalGuesses).toBe(4);
    });
  });

  describe("serialization", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const bigMom = findChar("big-mom");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("round-trips through serialize/deserialize", () => {
      let state = initFourSeasState(targets);
      state = applyFourSeasGuess(state, "north", bigMom, targetMap);
      state = applyFourSeasGuess(state, "east", akainu, targetMap);

      const serialized = serializeFourSeasState(state);
      const restored = deserializeFourSeasState(serialized);

      expect(restored).toBeDefined();
      expect(restored!.boards.north.guesses).toHaveLength(1);
      expect(restored!.boards.east.guesses).toHaveLength(1);
      expect(restored!.boards.north.guessedIds).toEqual(["big-mom"]);
      expect(restored!.boards.east.isWon).toBe(true);
    });

    it("deserialize returns undefined for invalid data", () => {
      expect(deserializeFourSeasState(null)).toBeUndefined();
      expect(deserializeFourSeasState(undefined)).toBeUndefined();
      expect(deserializeFourSeasState("not an object")).toBeUndefined();
      expect(deserializeFourSeasState({})).toBeUndefined();
      expect(deserializeFourSeasState({ boardOrder: [] })).toBeUndefined();
    });

    it("deserialize returns undefined for missing board fields", () => {
      expect(
        deserializeFourSeasState({
          boardOrder: ["north"],
          boards: { north: { targetCharacterId: 123 } },
        })
      ).toBeUndefined();
    });
  });

  describe("determinism with selectFourSeasTargets", () => {
    const allChars = [luffy, zoro, nami, usopp, sanji];

    it("state from selector targets is deterministic", () => {
      const t1 = selectFourSeasTargets(allChars, "casual", "seed-x");
      const t2 = selectFourSeasTargets(allChars, "casual", "seed-x");

      const state1 = initFourSeasState(t1);
      const state2 = initFourSeasState(t2);

      const ids1 = state1.boardOrder.map(
        (b) => state1.boards[b].targetCharacterId
      );
      const ids2 = state2.boardOrder.map(
        (b) => state2.boards[b].targetCharacterId
      );

      expect(ids1).toEqual(ids2);
    });
  });

  describe("edge cases", () => {
    const ace = findChar("ace");
    const akainu = findChar("akainu");
    const arlong = findChar("arlong");
    const buggy = findChar("buggy");
    const bigMom = findChar("big-mom");
    const targets = [ace, akainu, arlong, buggy];
    const targetMap = makeTargetMap(targets);

    it("boards can be finished independently in any order", () => {
      let state = initFourSeasState(targets);

      state = applyFourSeasGuess(state, "west", buggy, targetMap);
      expect(state.boards.west.isWon).toBe(true);
      expect(isFourSeasFinished(state)).toBe(false);

      state = applyFourSeasGuess(state, "south", arlong, targetMap);
      expect(state.boards.south.isWon).toBe(true);
      expect(isFourSeasFinished(state)).toBe(false);

      state = applyFourSeasGuess(state, "east", akainu, targetMap);
      expect(state.boards.east.isWon).toBe(true);
      expect(isFourSeasFinished(state)).toBe(false);

      state = applyFourSeasGuess(state, "north", ace, targetMap);
      expect(state.boards.north.isWon).toBe(true);
      expect(isFourSeasFinished(state)).toBe(true);
      expect(isFourSeasWon(state)).toBe(true);
    });

    it("different boards can have different guess counts", () => {
      let state = initFourSeasState(targets);

      state = applyFourSeasGuess(state, "north", ace, targetMap);
      state = applyFourSeasGuess(state, "east", bigMom, targetMap);
      state = applyFourSeasGuess(state, "east", ace, targetMap);
      state = applyFourSeasGuess(state, "east", arlong, targetMap);

      expect(state.boards.north.guesses).toHaveLength(1);
      expect(state.boards.east.guesses).toHaveLength(3);
      expect(state.boards.south.guesses).toHaveLength(0);
      expect(state.boards.west.guesses).toHaveLength(0);
    });
  });
});

describe("four-seas contract", () => {
  runModeContractTests({
    ruleset: "four-seas",
    runKind: "daily",
    sampleCharacters: characters.slice(0, 10),
  });
});
