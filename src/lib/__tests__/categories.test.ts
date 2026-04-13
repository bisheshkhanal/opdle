import { describe, it, expect } from "vitest";
import { categories, evaluateCharacter } from "../categories";
import type { Character, CategoryResult } from "../types";

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

function getCategory(key: keyof Character) {
  const category = categories.find((c) => c.key === key);
  if (!category) {
    throw new Error(`Missing category for key: ${String(key)}`);
  }

  return category;
}

describe("categories.ts", () => {
  describe("compareSet (via devilFruitType)", () => {
    const devilFruitCategory = getCategory("devilFruitType");

    it("returns correct for exact match", () => {
      expect(devilFruitCategory.evaluate(["Paramecia"], ["Paramecia"])).toBe(
        "correct"
      );
    });

    it("returns partial for overlapping sets", () => {
      expect(
        devilFruitCategory.evaluate(["Paramecia"], ["Paramecia", "Zoan"])
      ).toBe("partial");
    });

    it("returns wrong for disjoint sets", () => {
      expect(devilFruitCategory.evaluate(["Paramecia"], ["Zoan"])).toBe(
        "wrong"
      );
    });

    it("returns correct when both sets are empty", () => {
      expect(devilFruitCategory.evaluate([], [])).toBe("correct");
    });

    it("returns correct for empty guess versus ['None'] target", () => {
      expect(devilFruitCategory.evaluate([], ["None"])).toBe("correct");
    });

    it("returns correct for ['None'] guess versus empty target", () => {
      expect(devilFruitCategory.evaluate(["None"], [])).toBe("correct");
    });

    it("returns correct for ['None'] versus ['None']", () => {
      expect(devilFruitCategory.evaluate(["None"], ["None"])).toBe("correct");
    });

    it("returns wrong for ['None'] versus ['Paramecia']", () => {
      expect(devilFruitCategory.evaluate(["None"], ["Paramecia"])).toBe(
        "wrong"
      );
    });

    it("returns partial for multi-type overlap", () => {
      expect(
        devilFruitCategory.evaluate(["Logia", "Paramecia"], ["Logia"])
      ).toBe("partial");
    });
  });

  describe("compareNumber (via bounty)", () => {
    const bountyCategory = getCategory("bounty");

    it("returns correct when both values are null", () => {
      expect(bountyCategory.evaluate(null, null)).toBe("correct");
    });

    it("returns unknown when guess is null and target is a number", () => {
      expect(bountyCategory.evaluate(null, 100)).toBe("unknown");
    });

    it("returns unknown when guess is a number and target is null", () => {
      expect(bountyCategory.evaluate(100, null)).toBe("unknown");
    });

    it("returns higher when guess is lower than target", () => {
      expect(bountyCategory.evaluate(100, 200)).toBe("higher");
    });

    it("returns lower when guess is higher than target", () => {
      expect(bountyCategory.evaluate(200, 100)).toBe("lower");
    });

    it("returns correct for exact numeric match", () => {
      expect(bountyCategory.evaluate(100, 100)).toBe("correct");
    });

    it("returns correct for zero versus zero", () => {
      expect(bountyCategory.evaluate(0, 0)).toBe("correct");
    });

    it("returns correct for zero versus null", () => {
      expect(bountyCategory.evaluate(0, null)).toBe("correct");
    });

    it("returns correct for null versus zero", () => {
      expect(bountyCategory.evaluate(null, 0)).toBe("correct");
    });
  });

  describe("compareNumber (via height)", () => {
    const heightCategory = getCategory("heightCm");

    it("keeps height zero versus null as unknown", () => {
      expect(heightCategory.evaluate(0, null)).toBe("unknown");
    });
  });

  describe("evaluateCharacter", () => {
    it("returns exactly 8 category results", () => {
      const results = evaluateCharacter(baseCharacter, baseCharacter);
      expect(results).toHaveLength(8);
    });

    it("returns key, label, status, value, and displayValue for each result", () => {
      const results = evaluateCharacter(baseCharacter, baseCharacter);

      results.forEach((result) => {
        expect(result).toHaveProperty("key");
        expect(result).toHaveProperty("label");
        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("value");
        expect(result).toHaveProperty("displayValue");
      });
    });

    it("applies expected statuses for a clearly non-matching guess", () => {
      const guess: Character = {
        ...baseCharacter,
        gender: "Female",
        affiliationPrimary: "Marines",
        devilFruitType: ["Zoan"],
        haki: ["C"],
        bounty: 200000000,
        heightCm: 170,
        origin: "North Blue",
        firstArc: "Marineford",
      };

      const target: Character = {
        ...baseCharacter,
        gender: "Male",
        affiliationPrimary: "Straw Hat Pirates",
        devilFruitType: ["Paramecia"],
        haki: ["O", "A"],
        bounty: 100000000,
        heightCm: 180,
        origin: "East Blue",
        firstArc: "Romance Dawn",
      };

      const resultByKey = new Map<string, CategoryResult>(
        evaluateCharacter(guess, target).map((r) => [r.key, r])
      );

      expect(resultByKey.get("gender")?.status).toBe("wrong");
      expect(resultByKey.get("affiliationPrimary")?.status).toBe("wrong");
      expect(resultByKey.get("devilFruitType")?.status).toBe("wrong");
      expect(resultByKey.get("haki")?.status).toBe("wrong");
      expect(resultByKey.get("bounty")?.status).toBe("lower");
      expect(resultByKey.get("heightCm")?.status).toBe("higher");
      expect(resultByKey.get("origin")?.status).toBe("wrong");
      expect(resultByKey.get("firstArc")?.status).toBe("lower");
    });
  });

  describe("formatBounty", () => {
    const bountyCategory = getCategory("bounty");

    it("formats null as '?'", () => {
      expect(bountyCategory.renderValue(null)).toBe("?");
    });

    it("formats 0 as 'None'", () => {
      expect(bountyCategory.renderValue(0)).toBe("None");
    });

    it("formats billions with B suffix", () => {
      expect(bountyCategory.renderValue(1_500_000_000)).toBe("1.5B");
    });

    it("formats millions with M suffix", () => {
      expect(bountyCategory.renderValue(500_000_000)).toBe("500M");
    });

    it("formats thousands with K suffix", () => {
      expect(bountyCategory.renderValue(50_000)).toBe("50K");
    });

    it("formats small numbers as plain strings", () => {
      expect(bountyCategory.renderValue(999)).toBe("999");
    });
  });

  describe("formatHaki", () => {
    const hakiCategory = getCategory("haki");

    it("formats empty array as 'None'", () => {
      expect(hakiCategory.renderValue([])).toBe("None");
    });

    it("formats haki initials as comma-separated", () => {
      expect(hakiCategory.renderValue(["O", "A", "C"])).toBe("O, A, C");
    });
  });

  describe("formatDevilFruit", () => {
    const devilFruitCategory = getCategory("devilFruitType");

    it("formats empty array as 'None'", () => {
      expect(devilFruitCategory.renderValue([])).toBe("None");
    });

    it("formats a single type", () => {
      expect(devilFruitCategory.renderValue(["Paramecia"])).toBe("Paramecia");
    });

    it("formats multiple types as comma-separated", () => {
      expect(devilFruitCategory.renderValue(["Logia", "Paramecia"])).toBe(
        "Logia, Paramecia"
      );
    });
  });
});
