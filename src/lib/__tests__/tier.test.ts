import { describe, it, expect } from "vitest";
import { getCharactersForTier } from "../tier";
import type { Character } from "../types";

const baseCharacter: Character = {
  id: "test-char",
  name: "Test Character",
  aliases: ["Test"],
  imageUrl: "/characters/test-char.png",
  gender: "Male",
  affiliationPrimary: "Test Crew",
  devilFruitType: ["Paramecia"],
  haki: ["O", "A"],
  bounty: 100000000,
  heightCm: 180,
  origin: "East Blue",
  firstArc: "Romance Dawn",
  minTier: "casual",
};

const mockCharacters: Character[] = [
  { ...baseCharacter, id: "a", minTier: "casual" },
  { ...baseCharacter, id: "b", minTier: "fan" },
  { ...baseCharacter, id: "c", minTier: "nakama" },
];

describe("tier.ts", () => {
  describe("getCharactersForTier", () => {
    it("returns only casual characters for casual tier", () => {
      const result = getCharactersForTier(mockCharacters, "casual");
      expect(result.map((c) => c.id)).toEqual(["a"]);
    });

    it("returns casual and fan characters for fan tier", () => {
      const result = getCharactersForTier(mockCharacters, "fan");
      expect(result.map((c) => c.id)).toEqual(["a", "b"]);
    });

    it("returns all characters for nakama tier", () => {
      const result = getCharactersForTier(mockCharacters, "nakama");
      expect(result.map((c) => c.id)).toEqual(["a", "b", "c"]);
    });

    it("returns empty arrays for all tiers when input is empty", () => {
      expect(getCharactersForTier([], "casual")).toEqual([]);
      expect(getCharactersForTier([], "fan")).toEqual([]);
      expect(getCharactersForTier([], "nakama")).toEqual([]);
    });

    it("handles lists where all characters have the same tier", () => {
      const allFan: Character[] = [
        { ...baseCharacter, id: "f1", minTier: "fan" },
        { ...baseCharacter, id: "f2", minTier: "fan" },
      ];

      expect(getCharactersForTier(allFan, "casual")).toEqual([]);
      expect(getCharactersForTier(allFan, "fan").map((c) => c.id)).toEqual([
        "f1",
        "f2",
      ]);
      expect(getCharactersForTier(allFan, "nakama").map((c) => c.id)).toEqual([
        "f1",
        "f2",
      ]);
    });
  });
});
