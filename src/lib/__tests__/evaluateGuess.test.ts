import { describe, it, expect } from "vitest";
import { evaluateGuess, getArrowIndicator, getStatusColorClass } from "../evaluateGuess";
import type { Character } from "../types";

// Mock characters for testing with new schema
const targetCharacter: Character = {
  id: "luffy",
  name: "Monkey D. Luffy",
  aliases: ["Luffy", "Straw Hat"],
  imageUrl: "https://example.com/luffy.png",
  gender: "Male",
  affiliationPrimary: "Straw Hat Pirates",
  devilFruitType: "Paramecia",
  haki: ["O", "A", "C"],
  bounty: 3000000000,
  heightCm: 174,
  origin: "East Blue",
  firstArc: "Romance Dawn",
};

const exactMatchCharacter: Character = { ...targetCharacter };

const partialHakiCharacter: Character = {
  id: "sanji",
  name: "Vinsmoke Sanji",
  aliases: ["Sanji"],
  imageUrl: "https://example.com/sanji.png",
  gender: "Male",
  affiliationPrimary: "Straw Hat Pirates",
  devilFruitType: "None",
  haki: ["O", "A"], // Missing Conqueror - partial match
  bounty: 1032000000,
  heightCm: 180,
  origin: "North Blue",
  firstArc: "Baratie",
};

const noHakiCharacter: Character = {
  id: "nami",
  name: "Nami",
  aliases: [],
  imageUrl: "https://example.com/nami.png",
  gender: "Female",
  affiliationPrimary: "Straw Hat Pirates",
  devilFruitType: "None",
  haki: [], // No haki - wrong
  bounty: 366000000,
  heightCm: 170,
  origin: "East Blue",
  firstArc: "Orange Town",
};

const nullBountyCharacter: Character = {
  id: "garp",
  name: "Monkey D. Garp",
  aliases: ["Garp"],
  imageUrl: "https://example.com/garp.png",
  gender: "Male",
  affiliationPrimary: "Marines",
  devilFruitType: "None",
  haki: ["O", "A", "C"],
  bounty: null, // null bounty
  heightCm: 287,
  origin: "East Blue",
  firstArc: "Water 7",
};

describe("evaluateGuess.ts", () => {
  describe("evaluateGuess", () => {
    it("should return isCorrect true for exact match", () => {
      const result = evaluateGuess(exactMatchCharacter, targetCharacter);
      expect(result.isCorrect).toBe(true);
      expect(result.characterId).toBe(targetCharacter.id);
      expect(result.characterName).toBe(targetCharacter.name);
    });

    it("should return all correct statuses for exact match", () => {
      const result = evaluateGuess(exactMatchCharacter, targetCharacter);
      for (const cat of result.categories) {
        expect(cat.status).toBe("correct");
      }
    });

    it("should return partial for haki with overlap but not equal", () => {
      const result = evaluateGuess(partialHakiCharacter, targetCharacter);
      const hakiResult = result.categories.find((c) => c.key === "haki");
      expect(hakiResult?.status).toBe("partial");
    });

    it("should return wrong for haki with no overlap (empty vs full)", () => {
      const result = evaluateGuess(noHakiCharacter, targetCharacter);
      const hakiResult = result.categories.find((c) => c.key === "haki");
      expect(hakiResult?.status).toBe("wrong");
    });

    it("should return correct for haki when both are empty", () => {
      const emptyHakiTarget: Character = { ...targetCharacter, haki: [] };
      const result = evaluateGuess(noHakiCharacter, emptyHakiTarget);
      const hakiResult = result.categories.find((c) => c.key === "haki");
      expect(hakiResult?.status).toBe("correct");
    });

    it("should return higher when guess bounty < target bounty", () => {
      const result = evaluateGuess(partialHakiCharacter, targetCharacter);
      const bountyResult = result.categories.find((c) => c.key === "bounty");
      // Sanji's bounty (1.032B) < Luffy's (3B)
      expect(bountyResult?.status).toBe("higher");
    });

    it("should return lower when guess bounty > target bounty", () => {
      const higherBountyChar: Character = {
        ...partialHakiCharacter,
        bounty: 5000000000,
      };
      const result = evaluateGuess(higherBountyChar, targetCharacter);
      const bountyResult = result.categories.find((c) => c.key === "bounty");
      expect(bountyResult?.status).toBe("lower");
    });

    it("should return unknown when guess bounty is null", () => {
      const result = evaluateGuess(nullBountyCharacter, targetCharacter);
      const bountyResult = result.categories.find((c) => c.key === "bounty");
      expect(bountyResult?.status).toBe("unknown");
      expect(bountyResult?.displayValue).toBe("?");
    });

    it("should return unknown when target bounty is null", () => {
      const result = evaluateGuess(targetCharacter, nullBountyCharacter);
      const bountyResult = result.categories.find((c) => c.key === "bounty");
      expect(bountyResult?.status).toBe("unknown");
    });

    it("should return correct when both bounty values are null", () => {
      const nullBountyTarget: Character = { ...targetCharacter, bounty: null };
      const result = evaluateGuess(nullBountyCharacter, nullBountyTarget);
      const bountyResult = result.categories.find((c) => c.key === "bounty");
      expect(bountyResult?.status).toBe("correct");
      expect(bountyResult?.displayValue).toBe("?"); // Still displays "?"
    });

    it("should return correct when both height values are null", () => {
      const nullHeightGuess: Character = { ...targetCharacter, heightCm: null };
      const nullHeightTarget: Character = { ...targetCharacter, heightCm: null };
      const result = evaluateGuess(nullHeightGuess, nullHeightTarget);
      const heightResult = result.categories.find((c) => c.key === "heightCm");
      expect(heightResult?.status).toBe("correct");
      expect(heightResult?.displayValue).toBe("?");
    });

    it("should return isCorrect true when all categories match including null bounty/height", () => {
      // Buffalo-like character: all same except bounty and height are null
      const nullNumericTarget: Character = {
        ...targetCharacter,
        bounty: null,
        heightCm: null,
      };
      const nullNumericGuess: Character = { ...nullNumericTarget };

      const result = evaluateGuess(nullNumericGuess, nullNumericTarget);

      // All categories should be correct
      for (const cat of result.categories) {
        expect(cat.status).toBe("correct");
      }

      // Should trigger win
      expect(result.isCorrect).toBe(true);
    });

    it("should return higher when guess height < target height", () => {
      const result = evaluateGuess(noHakiCharacter, targetCharacter);
      const heightResult = result.categories.find((c) => c.key === "heightCm");
      // Nami's height (170) < Luffy's (174)
      expect(heightResult?.status).toBe("higher");
    });

    it("should return lower when guess height > target height", () => {
      const result = evaluateGuess(partialHakiCharacter, targetCharacter);
      const heightResult = result.categories.find((c) => c.key === "heightCm");
      // Sanji's height (180) > Luffy's (174)
      expect(heightResult?.status).toBe("lower");
    });

    it("should return wrong for different affiliations", () => {
      const result = evaluateGuess(nullBountyCharacter, targetCharacter);
      const affiliationResult = result.categories.find(
        (c) => c.key === "affiliationPrimary"
      );
      expect(affiliationResult?.status).toBe("wrong");
    });

    it("should return wrong for different devil fruit types", () => {
      const result = evaluateGuess(partialHakiCharacter, targetCharacter);
      const dfResult = result.categories.find((c) => c.key === "devilFruitType");
      expect(dfResult?.status).toBe("wrong");
    });
  });

  describe("getArrowIndicator", () => {
    it("should return up arrow for higher status", () => {
      expect(getArrowIndicator("higher")).toBe("↑");
    });

    it("should return down arrow for lower status", () => {
      expect(getArrowIndicator("lower")).toBe("↓");
    });

    it("should return empty string for other statuses", () => {
      expect(getArrowIndicator("correct")).toBe("");
      expect(getArrowIndicator("partial")).toBe("");
      expect(getArrowIndicator("wrong")).toBe("");
      expect(getArrowIndicator("unknown")).toBe("");
    });
  });

  describe("getStatusColorClass", () => {
    it("should return tile-correct class for correct status", () => {
      expect(getStatusColorClass("correct")).toContain("tile-correct");
    });

    it("should return tile-partial class for partial status", () => {
      expect(getStatusColorClass("partial")).toContain("tile-partial");
    });

    it("should return tile-wrong class for wrong/higher/lower statuses", () => {
      expect(getStatusColorClass("wrong")).toContain("tile-wrong");
      expect(getStatusColorClass("higher")).toContain("tile-wrong");
      expect(getStatusColorClass("lower")).toContain("tile-wrong");
    });

    it("should return tile-unknown class for unknown status", () => {
      expect(getStatusColorClass("unknown")).toContain("tile-unknown");
    });
  });
});
