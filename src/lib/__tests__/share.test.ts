import { describe, it, expect } from "vitest";
import { formatShareText } from "../share";
import type { GuessResult, TileStatus } from "../types";

// Helper to create mock guess results
function createMockGuess(
  id: string,
  name: string,
  statuses: TileStatus[]
): GuessResult {
  return {
    characterId: id,
    characterName: name,
    imageUrl: `https://example.com/${id}.png`,
    categories: statuses.map((status, i) => ({
      key: `cat${i}`,
      status,
      value: "test",
      displayValue: "test",
    })),
    isCorrect: statuses.every((s) => s === "correct"),
  };
}

describe("share.ts", () => {
  describe("formatShareText", () => {
    it("should format daily win correctly", () => {
      const guesses = [
        createMockGuess("zoro", "Zoro", [
          "correct",
          "correct",
          "wrong",
          "partial",
          "higher",
          "lower",
          "correct",
          "correct",
        ]),
        createMockGuess("luffy", "Luffy", [
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
        ]),
      ];

      const text = formatShareText(guesses, "daily", true, "2024-06-15");

      expect(text).toContain("OnePiecedle #");
      expect(text).toContain("2/6");
      expect(text).toContain("https://onepiecedle.com");
    });

    it("should format daily loss correctly", () => {
      const guesses = Array(6).fill(
        createMockGuess("test", "Test", [
          "wrong",
          "wrong",
          "wrong",
          "wrong",
          "wrong",
          "wrong",
          "wrong",
          "wrong",
        ])
      );

      const text = formatShareText(guesses, "daily", false, "2024-06-15");

      expect(text).toContain("OnePiecedle #");
      expect(text).toContain("X/6");
    });

    it("should format infinite mode correctly", () => {
      const guesses = [
        createMockGuess("luffy", "Luffy", [
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
        ]),
      ];

      const text = formatShareText(guesses, "infinite", true);

      expect(text).toContain("OnePiecedle (Infinite)");
      expect(text).toContain("1/6");
    });

    it("should include correct emojis for different statuses", () => {
      const guess = createMockGuess("test", "Test", [
        "correct",
        "partial",
        "wrong",
        "higher",
        "lower",
        "unknown",
        "correct",
        "wrong",
      ]);

      const text = formatShareText([guess], "daily", false, "2024-06-15");

      expect(text).toContain("🟩"); // correct
      expect(text).toContain("🟨"); // partial
      expect(text).toContain("🟥"); // wrong/unknown
      expect(text).toContain("🔺"); // higher
      expect(text).toContain("🔻"); // lower
    });

    it("should include game URL", () => {
      const guesses = [
        createMockGuess("luffy", "Luffy", ["correct", "correct"]),
      ];

      const text = formatShareText(guesses, "daily", true, "2024-06-15");

      expect(text).toContain("https://onepiecedle.com");
    });

    it("should format header with correct guess count", () => {
      const guesses = [
        createMockGuess("luffy", "Luffy", [
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
        ]),
      ];

      const text = formatShareText(guesses, "daily", true, "2024-06-15");

      expect(text).toContain("1/6");
    });

    it("should work with empty guesses", () => {
      const text = formatShareText([], "daily", false, "2024-06-15");
      expect(text).toContain("OnePiecedle");
    });
  });
});
