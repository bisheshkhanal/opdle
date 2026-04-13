import { describe, it, expect } from "vitest";
import { validateCharacter } from "../types";
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

function makeCharacterRecord(): Record<string, unknown> {
  return { ...baseCharacter };
}

describe("validateCharacter", () => {
  describe("accepts valid characters", () => {
    it("accepts a fully populated valid character", () => {
      expect(validateCharacter(baseCharacter)).toBe(true);
    });

    it("accepts character with null bounty", () => {
      expect(validateCharacter({ ...baseCharacter, bounty: null })).toBe(true);
    });

    it("accepts character with null heightCm", () => {
      expect(validateCharacter({ ...baseCharacter, heightCm: null })).toBe(
        true
      );
    });

    it("accepts character with empty aliases", () => {
      expect(validateCharacter({ ...baseCharacter, aliases: [] })).toBe(true);
    });

    it("accepts character with empty haki", () => {
      expect(validateCharacter({ ...baseCharacter, haki: [] })).toBe(true);
    });

    it("accepts character with devilFruitType ['None']", () => {
      expect(
        validateCharacter({ ...baseCharacter, devilFruitType: ["None"] })
      ).toBe(true);
    });
  });

  describe("rejects invalid characters", () => {
    it("rejects null", () => {
      expect(validateCharacter(null)).toBe(false);
    });

    it("rejects non-object values", () => {
      expect(validateCharacter("not-object")).toBe(false);
      expect(validateCharacter(123)).toBe(false);
    });

    it("rejects missing id", () => {
      const obj = makeCharacterRecord();
      delete obj.id;
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects empty string id", () => {
      expect(validateCharacter({ ...baseCharacter, id: "" })).toBe(false);
    });

    it("rejects missing name", () => {
      const obj = makeCharacterRecord();
      delete obj.name;
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects invalid gender", () => {
      expect(
        validateCharacter({ ...baseCharacter, gender: "Robot" as "Male" })
      ).toBe(false);
    });

    it("rejects invalid devilFruitType values", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        devilFruitType: ["Paramecia", "Mythic"],
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects invalid haki values", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        haki: ["O", "X"],
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects invalid tier", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        minTier: "legendary",
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects invalid firstArc", () => {
      expect(
        validateCharacter({ ...baseCharacter, firstArc: "Not A Real Arc" })
      ).toBe(false);
    });

    it("rejects non-array aliases", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        aliases: "Test",
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects bounty as string", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        bounty: "100000000",
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects heightCm as string", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        heightCm: "180",
      };
      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects missing required string fields", () => {
      const requiredFields = [
        "id",
        "name",
        "imageUrl",
        "affiliationPrimary",
        "origin",
        "firstArc",
      ] as const;

      requiredFields.forEach((field) => {
        const obj = makeCharacterRecord();
        delete obj[field];
        expect(validateCharacter(obj)).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("currently accepts aliases arrays with non-string elements (known validator gap)", () => {
      // Known gap: validator only checks aliases is an array, not element types.
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        aliases: ["Test", 123],
      };

      expect(validateCharacter(obj)).toBe(true);
    });

    it("rejects NaN bounty", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        bounty: Number.NaN,
      };

      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects Infinity bounty", () => {
      expect(validateCharacter({ ...baseCharacter, bounty: Infinity })).toBe(
        false
      );
    });

    it("rejects -Infinity bounty", () => {
      expect(validateCharacter({ ...baseCharacter, bounty: -Infinity })).toBe(
        false
      );
    });

    it("rejects NaN heightCm", () => {
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        heightCm: Number.NaN,
      };

      expect(validateCharacter(obj)).toBe(false);
    });

    it("rejects Infinity heightCm", () => {
      expect(validateCharacter({ ...baseCharacter, heightCm: Infinity })).toBe(
        false
      );
    });

    it("rejects -Infinity heightCm", () => {
      expect(validateCharacter({ ...baseCharacter, heightCm: -Infinity })).toBe(
        false
      );
    });

    it("accepts bounty of 0", () => {
      expect(validateCharacter({ ...baseCharacter, bounty: 0 })).toBe(true);
    });

    it("accepts heightCm of 0", () => {
      expect(validateCharacter({ ...baseCharacter, heightCm: 0 })).toBe(true);
    });

    it("currently accepts negative bounty (known validator gap)", () => {
      // Known gap: validator does not enforce non-negative numeric values.
      const obj: Record<string, unknown> = {
        ...baseCharacter,
        bounty: -1,
      };

      expect(validateCharacter(obj)).toBe(true);
    });
  });
});
