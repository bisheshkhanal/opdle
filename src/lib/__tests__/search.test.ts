import { describe, it, expect } from "vitest";
import {
  searchCharacters,
  findCharacterByName,
  findCharacterById,
  getAllNames,
} from "../search";
import type { Character } from "../types";

// Mock characters for testing with new schema
const mockCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy", "Straw Hat", "Mugiwara"],
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
    aliases: ["Zoro", "Pirate Hunter"],
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
    aliases: ["Cat Burglar"],
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
  {
    id: "law",
    name: "Trafalgar D. Water Law",
    aliases: ["Law", "Surgeon of Death"],
    imageUrl: "https://example.com/law.png",
    gender: "Male",
    affiliationPrimary: "Heart Pirates",
    devilFruitType: "Paramecia",
    haki: ["O", "A"],
    bounty: 3000000000,
    heightCm: 191,
    origin: "North Blue",
    firstArc: "Sabaody Archipelago",
  },
];

describe("search.ts", () => {
  describe("searchCharacters", () => {
    it("should return empty array for empty query", () => {
      expect(searchCharacters(mockCharacters, "")).toEqual([]);
      expect(searchCharacters(mockCharacters, "  ")).toEqual([]);
    });

    it("should find character by exact name", () => {
      const results = searchCharacters(mockCharacters, "Nami");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("Nami");
    });

    it("should find character by partial name", () => {
      const results = searchCharacters(mockCharacters, "luf");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("Monkey D. Luffy");
    });

    it("should find character by alias", () => {
      const results = searchCharacters(mockCharacters, "Straw Hat");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("luffy");
    });

    it("should find character by partial alias", () => {
      const results = searchCharacters(mockCharacters, "Pirate Hunt");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("zoro");
    });

    it("should be case insensitive", () => {
      const results1 = searchCharacters(mockCharacters, "LUFFY");
      const results2 = searchCharacters(mockCharacters, "luffy");
      const results3 = searchCharacters(mockCharacters, "LuFfY");

      expect(results1[0]?.id).toBe("luffy");
      expect(results2[0]?.id).toBe("luffy");
      expect(results3[0]?.id).toBe("luffy");
    });

    it("should respect limit parameter", () => {
      const results = searchCharacters(mockCharacters, "a", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should prioritize exact name matches", () => {
      const results = searchCharacters(mockCharacters, "Nami");
      expect(results[0].name).toBe("Nami");
    });

    it("should return multiple matches when applicable", () => {
      const results = searchCharacters(mockCharacters, "a");
      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe("findCharacterByName", () => {
    it("should find character by exact name", () => {
      const char = findCharacterByName(mockCharacters, "Nami");
      expect(char?.id).toBe("nami");
    });

    it("should find character by alias", () => {
      const char = findCharacterByName(mockCharacters, "Straw Hat");
      expect(char?.id).toBe("luffy");
    });

    it("should be case insensitive", () => {
      const char = findCharacterByName(mockCharacters, "nami");
      expect(char?.id).toBe("nami");
    });

    it("should return undefined for non-existent character", () => {
      const char = findCharacterByName(mockCharacters, "Kaido");
      expect(char).toBeUndefined();
    });

    it("should find full name match", () => {
      const char = findCharacterByName(mockCharacters, "Monkey D. Luffy");
      expect(char?.id).toBe("luffy");
    });
  });

  describe("findCharacterById", () => {
    it("should find character by id", () => {
      const char = findCharacterById(mockCharacters, "luffy");
      expect(char?.name).toBe("Monkey D. Luffy");
    });

    it("should return undefined for non-existent id", () => {
      const char = findCharacterById(mockCharacters, "nonexistent");
      expect(char).toBeUndefined();
    });

    it("should be case sensitive for id", () => {
      const char = findCharacterById(mockCharacters, "LUFFY");
      expect(char).toBeUndefined();
    });
  });

  describe("getAllNames", () => {
    it("should return name and all aliases", () => {
      const luffy = mockCharacters[0];
      const names = getAllNames(luffy);

      expect(names).toContain("Monkey D. Luffy");
      expect(names).toContain("Luffy");
      expect(names).toContain("Straw Hat");
      expect(names).toContain("Mugiwara");
    });

    it("should return array with just name if no aliases", () => {
      const charNoAliases: Character = {
        ...mockCharacters[0],
        aliases: [],
      };
      const names = getAllNames(charNoAliases);

      expect(names.length).toBe(1);
      expect(names[0]).toBe("Monkey D. Luffy");
    });
  });
});
