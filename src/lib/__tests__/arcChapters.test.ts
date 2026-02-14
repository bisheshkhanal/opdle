import { describe, it, expect } from "vitest";
import { getArcFromChapter, validateArcRanges, ARC_CHAPTER_RANGES } from "../arcChapters";

describe("arcChapters.ts", () => {
  describe("getArcFromChapter", () => {
    it("should return correct arc for chapter boundaries", () => {
      // Romance Dawn boundaries
      expect(getArcFromChapter(1)).toBe("Romance Dawn");
      expect(getArcFromChapter(7)).toBe("Romance Dawn");

      // Orange Town boundaries
      expect(getArcFromChapter(8)).toBe("Orange Town");
      expect(getArcFromChapter(21)).toBe("Orange Town");

      // Water 7 boundaries
      expect(getArcFromChapter(322)).toBe("Water 7");
      expect(getArcFromChapter(374)).toBe("Water 7");
    });

    it("should return correct arc for known character debut chapters", () => {
      expect(getArcFromChapter(1)).toBe("Romance Dawn"); // Luffy
      expect(getArcFromChapter(3)).toBe("Romance Dawn"); // Zoro
      expect(getArcFromChapter(114)).toBe("Whisky Peak"); // Robin
      expect(getArcFromChapter(134)).toBe("Drum Island"); // Chopper
      expect(getArcFromChapter(329)).toBe("Water 7"); // Franky
      expect(getArcFromChapter(442)).toBe("Thriller Bark"); // Brook
    });

    it("should return null for chapters outside defined ranges", () => {
      expect(getArcFromChapter(0)).toBeNull();
      expect(getArcFromChapter(-1)).toBeNull();
      expect(getArcFromChapter(99999)).toBeNull();
    });

    it("should handle mid-arc chapters correctly", () => {
      expect(getArcFromChapter(50)).toBe("Baratie");
      expect(getArcFromChapter(200)).toBe("Arabasta");
      expect(getArcFromChapter(500)).toBe("Sabaody Archipelago");
    });
  });

  describe("validateArcRanges", () => {
    it("should validate that ranges have no gaps or overlaps", () => {
      const result = validateArcRanges();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should cover all arcs sequentially", () => {
      // Verify first arc starts at chapter 1
      expect(ARC_CHAPTER_RANGES[0].start).toBe(1);

      // Verify each arc follows the previous one
      for (let i = 1; i < ARC_CHAPTER_RANGES.length; i++) {
        const prev = ARC_CHAPTER_RANGES[i - 1];
        const current = ARC_CHAPTER_RANGES[i];
        expect(current.start).toBe(prev.end + 1);
      }
    });
  });
});
