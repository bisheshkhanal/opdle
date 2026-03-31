import { describe, it, expect } from "vitest";
import { formatShareText, getFlavorTitle } from "../share";
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
      label: `Category ${i + 1}`,
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

  describe("getFlavorTitle", () => {
    it("should return 'Pirate King' for 1 guess", () => {
      expect(getFlavorTitle(1)).toBe("Pirate King");
    });

    it("should return 'Yonko' for 2 guesses", () => {
      expect(getFlavorTitle(2)).toBe("Yonko");
    });

    it("should return 'Warlord' for 3 guesses", () => {
      expect(getFlavorTitle(3)).toBe("Warlord");
    });

    it("should return 'Super Rookie' for 4 guesses", () => {
      expect(getFlavorTitle(4)).toBe("Super Rookie");
    });

    it("should return 'Pirate' for 5 guesses", () => {
      expect(getFlavorTitle(5)).toBe("Pirate");
    });

    it("should return 'Rookie' for 6 guesses", () => {
      expect(getFlavorTitle(6)).toBe("Rookie");
    });

    it("should return null for 0 guesses", () => {
      expect(getFlavorTitle(0)).toBeNull();
    });

    it("should return null for 7 guesses", () => {
      expect(getFlavorTitle(7)).toBeNull();
    });
  });

  describe("formatShareText with flavor title", () => {
    it("should include 'Pirate King' when winning in 1 guess", () => {
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
      expect(text).toContain("Pirate King");
    });

    it("should not include flavor title on loss", () => {
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
      expect(text).not.toContain("Pirate King");
      expect(text).not.toContain("Yonko");
      expect(text).not.toContain("Warlord");
      expect(text).not.toContain("Super Rookie");
      expect(text).not.toContain("Rookie");
    });
  });

  describe("formatShareText with streak", () => {
    it("should include streak in daily mode when streak > 0", () => {
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
      const text = formatShareText(guesses, "daily", true, "2024-06-15", 5);
      expect(text).toContain("🔥 Streak: 5");
    });

    it("should not include streak when streak is 0", () => {
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
      const text = formatShareText(guesses, "daily", true, "2024-06-15", 0);
      expect(text).not.toContain("🔥 Streak:");
    });

    it("should not include streak when streak is undefined", () => {
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
      expect(text).not.toContain("🔥 Streak:");
    });

    it("should not include streak in infinite mode even if provided", () => {
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
      const text = formatShareText(guesses, "infinite", true, undefined, 5);
      expect(text).not.toContain("🔥 Streak:");
    });

    it("should not include streak on loss", () => {
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
      const text = formatShareText(guesses, "daily", false, "2024-06-15", 5);
      expect(text).not.toContain("🔥 Streak:");
    });

    it("should include both flavor title and streak on daily win", () => {
      const guesses = [
        createMockGuess("zoro", "Zoro", ["wrong", "wrong"]),
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
      const text = formatShareText(guesses, "daily", true, "2024-06-15", 10);
      expect(text).toContain("Yonko");
      expect(text).toContain("🔥 Streak: 10");
    });
  });

  describe("formatShareText with hintUsed", () => {
    it("should include 💡 in header when hintUsed is true", () => {
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
      const text = formatShareText(
        guesses,
        "daily",
        true,
        "2024-06-15",
        undefined,
        true
      );
      const headerLine = text.split("\n")[0];
      expect(headerLine).toContain("💡");
    });

    it("should not include 💡 when hintUsed is false", () => {
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
      const text = formatShareText(
        guesses,
        "daily",
        true,
        "2024-06-15",
        undefined,
        false
      );
      expect(text).not.toContain("💡");
    });

    it("should not include 💡 when hintUsed is undefined", () => {
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
      const text = formatShareText(
        guesses,
        "daily",
        true,
        "2024-06-15",
        undefined,
        undefined
      );
      expect(text).not.toContain("💡");
    });

    it("should include 💡 in header on loss when hintUsed is true", () => {
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
      const text = formatShareText(
        guesses,
        "daily",
        false,
        "2024-06-15",
        undefined,
        true
      );
      const headerLine = text.split("\n")[0];
      expect(headerLine).toContain("💡");
    });

    it("should include 💡 only in the header line, not in emoji grid rows", () => {
      const guesses = [
        createMockGuess("zoro", "Zoro", ["wrong", "wrong"]),
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
      const text = formatShareText(
        guesses,
        "daily",
        true,
        "2024-06-15",
        undefined,
        true
      );
      const lines = text.split("\n");
      // First line is the header — should contain 💡
      expect(lines[0]).toContain("💡");
      // All other lines should NOT contain 💡
      const nonHeaderLines = lines.slice(1);
      for (const line of nonHeaderLines) {
        expect(line).not.toContain("💡");
      }
    });
  });
});
