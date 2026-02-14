import { describe, it, expect } from "vitest";
import {
  generateRoundId,
  roundIdToSeed,
  selectInfiniteCharacter,
  createCharacterSequence,
  getNextSeed,
} from "../infinite";
import type { Character } from "../types";

// Mock characters for testing with new schema
const mockCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy"],
    imageUrl: "https://example.com/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "Paramecia",
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Zoro"],
    imageUrl: "https://example.com/zoro.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "None",
    haki: ["O", "A", "C"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Romance Dawn",
  },
  {
    id: "nami",
    name: "Nami",
    aliases: [],
    imageUrl: "https://example.com/nami.png",
    gender: "Female",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "None",
    haki: [],
    bounty: 366000000,
    heightCm: 170,
    origin: "East Blue",
    firstArc: "Orange Town",
  },
];

describe("infinite.ts", () => {
  describe("generateRoundId", () => {
    it("should generate unique round IDs", () => {
      const id1 = generateRoundId();
      const id2 = generateRoundId();
      expect(id1).not.toBe(id2);
    });

    it("should contain timestamp and random component", () => {
      const id = generateRoundId();
      expect(id).toMatch(/^\d+-\d+$/);
    });
  });

  describe("roundIdToSeed", () => {
    it("should return same seed for same roundId", () => {
      const roundId = "1234567890-123456";
      const seed1 = roundIdToSeed(roundId);
      const seed2 = roundIdToSeed(roundId);
      expect(seed1).toBe(seed2);
    });

    it("should return different seeds for different roundIds", () => {
      const seed1 = roundIdToSeed("1234567890-123456");
      const seed2 = roundIdToSeed("1234567890-654321");
      expect(seed1).not.toBe(seed2);
    });

    it("should return a positive number", () => {
      const seed = roundIdToSeed("1234567890-123456");
      expect(seed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("selectInfiniteCharacter", () => {
    it("should return same character for same roundId", () => {
      const roundId = "1234567890-123456";
      const char1 = selectInfiniteCharacter(mockCharacters, roundId);
      const char2 = selectInfiniteCharacter(mockCharacters, roundId);
      expect(char1.id).toBe(char2.id);
    });

    it("should return a valid character from the list", () => {
      const roundId = "1234567890-123456";
      const char = selectInfiniteCharacter(mockCharacters, roundId);
      expect(mockCharacters.some((c) => c.id === char.id)).toBe(true);
    });

    it("should select different characters for different roundIds (with high probability)", () => {
      const roundIds = [
        "1-1",
        "2-2",
        "3-3",
        "4-4",
        "5-5",
        "6-6",
        "7-7",
        "8-8",
      ];
      const selections = roundIds.map(
        (id) => selectInfiniteCharacter(mockCharacters, id).id
      );

      const uniqueSelections = new Set(selections);
      expect(uniqueSelections.size).toBeGreaterThan(1);
    });
  });

  describe("createCharacterSequence", () => {
    it("should return same sequence for same seed", () => {
      const seq1 = createCharacterSequence(mockCharacters, 12345, 5);
      const seq2 = createCharacterSequence(mockCharacters, 12345, 5);

      const ids1 = seq1.map((c) => c.id);
      const ids2 = seq2.map((c) => c.id);

      expect(ids1).toEqual(ids2);
    });

    it("should return different sequences for different seeds", () => {
      const seq1 = createCharacterSequence(mockCharacters, 12345, 5);
      const seq2 = createCharacterSequence(mockCharacters, 54321, 5);

      const ids1 = seq1.map((c) => c.id);
      const ids2 = seq2.map((c) => c.id);

      expect(ids1).not.toEqual(ids2);
    });

    it("should return the requested number of characters", () => {
      const seq = createCharacterSequence(mockCharacters, 12345, 10);
      expect(seq.length).toBe(10);
    });

    it("should only contain valid characters", () => {
      const seq = createCharacterSequence(mockCharacters, 12345, 20);
      const validIds = new Set(mockCharacters.map((c) => c.id));

      for (const char of seq) {
        expect(validIds.has(char.id)).toBe(true);
      }
    });
  });

  describe("getNextSeed", () => {
    it("should return same next seed for same current seed", () => {
      const next1 = getNextSeed(12345);
      const next2 = getNextSeed(12345);
      expect(next1).toBe(next2);
    });

    it("should return different seed from input", () => {
      const current = 12345;
      const next = getNextSeed(current);
      expect(next).not.toBe(current);
    });

    it("should return positive number", () => {
      const next = getNextSeed(12345);
      expect(next).toBeGreaterThan(0);
    });
  });
});
