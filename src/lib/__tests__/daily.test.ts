import { describe, it, expect } from "vitest";
import {
  getUTCDateString,
  dateToSeed,
  seededRandom,
  selectDailyCharacter,
  getDailyGameNumber,
  isToday,
  getTimeUntilReset,
} from "../daily";
import type { Character } from "../types";

// Mock characters for testing with new schema
const mockCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy", "Straw Hat"],
    imageUrl: "https://example.com/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Zoro", "Pirate Hunter"],
    imageUrl: "https://example.com/zoro.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: ["O", "A", "C"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "nami",
    name: "Nami",
    aliases: ["Cat Burglar"],
    imageUrl: "https://example.com/nami.png",
    gender: "Female",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: [],
    bounty: 366000000,
    heightCm: 170,
    origin: "East Blue",
    firstArc: "Orange Town",
    minTier: "casual",
  },
];

describe("daily.ts", () => {
  describe("getUTCDateString", () => {
    it("should return date in YYYY-MM-DD format", () => {
      const date = new Date("2024-06-15T12:30:00Z");
      expect(getUTCDateString(date)).toBe("2024-06-15");
    });

    it("should handle different timezones correctly", () => {
      const date = new Date("2024-06-15T23:59:59Z");
      expect(getUTCDateString(date)).toBe("2024-06-15");
    });
  });

  describe("dateToSeed", () => {
    it("should return same seed for same date", () => {
      const seed1 = dateToSeed("2024-06-15");
      const seed2 = dateToSeed("2024-06-15");
      expect(seed1).toBe(seed2);
    });

    it("should return different seeds for different dates", () => {
      const seed1 = dateToSeed("2024-06-15");
      const seed2 = dateToSeed("2024-06-16");
      expect(seed1).not.toBe(seed2);
    });

    it("should return a positive number", () => {
      const seed = dateToSeed("2024-06-15");
      expect(seed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("seededRandom", () => {
    it("should produce same sequence for same seed", () => {
      const rng1 = seededRandom(12345);
      const rng2 = seededRandom(12345);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it("should produce different sequences for different seeds", () => {
      const rng1 = seededRandom(12345);
      const rng2 = seededRandom(54321);

      const val1 = rng1();
      const val2 = rng2();

      expect(val1).not.toBe(val2);
    });

    it("should produce numbers between 0 and 1", () => {
      const rng = seededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe("selectDailyCharacter", () => {
    it("should return same character for same date", () => {
      const char1 = selectDailyCharacter(mockCharacters, "2024-06-15");
      const char2 = selectDailyCharacter(mockCharacters, "2024-06-15");

      expect(char1.id).toBe(char2.id);
    });

    it("should return a valid character from the list", () => {
      const char = selectDailyCharacter(mockCharacters, "2024-06-15");
      expect(mockCharacters.some((c) => c.id === char.id)).toBe(true);
    });

    it("should select different characters for different dates (with high probability)", () => {
      const dates = ["2024-01-01", "2024-02-14", "2024-07-04", "2024-12-25"];
      const selections = dates.map(
        (d) => selectDailyCharacter(mockCharacters, d).id
      );

      const uniqueSelections = new Set(selections);
      expect(uniqueSelections.size).toBeGreaterThan(1);
    });

    describe("selectDailyCharacter - tier-based selection", () => {
      it("returns different character for same date with different tiers", () => {
        const casual = selectDailyCharacter(
          mockCharacters,
          "2024-06-15",
          "casual"
        );
        const nakama = selectDailyCharacter(
          mockCharacters,
          "2024-06-15",
          "nakama"
        );

        expect(casual.id).not.toBe(nakama.id);
      });

      it("returns same character for same date and same tier", () => {
        const first = selectDailyCharacter(
          mockCharacters,
          "2024-06-15",
          "casual"
        );
        const second = selectDailyCharacter(
          mockCharacters,
          "2024-06-15",
          "casual"
        );

        expect(first.id).toBe(second.id);
      });
    });

    describe("selectDailyCharacter - edge cases", () => {
      it("singleton array always returns the only character", () => {
        const singleCharacter = [mockCharacters[0]];
        const result = selectDailyCharacter(singleCharacter, "2024-06-15");

        expect(result.id).toBe(mockCharacters[0].id);
      });

      it("does not crash on repeated calls", () => {
        expect(() => {
          for (let i = 0; i < 100; i++) {
            selectDailyCharacter(mockCharacters, "2024-06-15");
          }
        }).not.toThrow();
      });
    });
  });

  describe("isToday", () => {
    it("returns true for current UTC date string", () => {
      const today = getUTCDateString();
      expect(isToday(today)).toBe(true);
    });

    it("returns false for yesterday UTC date string", () => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - 1);
      const yesterday = getUTCDateString(date);

      expect(isToday(yesterday)).toBe(false);
    });

    it("returns false for tomorrow UTC date string", () => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + 1);
      const tomorrow = getUTCDateString(date);

      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe("getTimeUntilReset", () => {
    it("returns object with hours, minutes, and seconds", () => {
      const result = getTimeUntilReset();

      expect(result).toHaveProperty("hours");
      expect(result).toHaveProperty("minutes");
      expect(result).toHaveProperty("seconds");
    });

    it("returns non-negative values", () => {
      const result = getTimeUntilReset();

      expect(result.hours).toBeGreaterThanOrEqual(0);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
      expect(result.seconds).toBeGreaterThanOrEqual(0);
    });

    it("returns values in valid ranges", () => {
      const result = getTimeUntilReset();

      expect(result.hours).toBeLessThan(24);
      expect(result.minutes).toBeLessThan(60);
      expect(result.seconds).toBeLessThan(60);
    });
  });

  describe("getDailyGameNumber", () => {
    it("should return positive number for dates after reference", () => {
      const gameNum = getDailyGameNumber("2024-06-15");
      expect(gameNum).toBeGreaterThan(0);
    });

    it("should increase by 1 for consecutive days", () => {
      const num1 = getDailyGameNumber("2024-06-15");
      const num2 = getDailyGameNumber("2024-06-16");
      expect(num2 - num1).toBe(1);
    });

    it("should return 1 for reference date", () => {
      const num = getDailyGameNumber("2024-01-01");
      expect(num).toBe(1);
    });

    describe("getDailyGameNumber - edge cases", () => {
      it("dates before reference date return zero or negative", () => {
        const gameNum = getDailyGameNumber("2023-12-31");
        expect(gameNum).toBeLessThanOrEqual(0);
      });

      it("consecutive dates increment by exactly 1", () => {
        const num1 = getDailyGameNumber("2024-02-10");
        const num2 = getDailyGameNumber("2024-02-11");

        expect(num2 - num1).toBe(1);
      });
    });
  });
});
