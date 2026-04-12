import { describe, it, expect } from "vitest";
import { getCharacterClues } from "../clues";
import type { Character, CharacterClue } from "../types";

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: "test",
    name: "Test Character",
    aliases: [],
    imageUrl: "/characters/test.png",
    gender: "Male",
    affiliationPrimary: "Test Crew",
    devilFruitType: ["None"],
    haki: [],
    bounty: null,
    heightCm: null,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
    ...overrides,
  };
}

describe("getCharacterClues", () => {
  it("returns canonical clues when present", () => {
    const clues: CharacterClue[] = [
      { kind: "quote", text: "I am the test!" },
      { kind: "laugh", text: "Hahaha" },
    ];
    const char = makeChar({ clues });
    const result = getCharacterClues(char);
    expect(result).toEqual(clues);
    expect(result).toHaveLength(2);
  });

  it("returns fallback from aliases when no canonical clues", () => {
    const char = makeChar({ aliases: ["Iron Fist", "The Legend"] });
    const result = getCharacterClues(char);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((c) => c.kind === "alias")).toBe(true);
    expect(result[0].text).toBe("Iron Fist");
    expect(result[1].text).toBe("The Legend");
  });

  it("returns fallback from name when no aliases and no clues", () => {
    const char = makeChar({ aliases: [] });
    const result = getCharacterClues(char);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("epithet");
    expect(result[0].text).toBe("Test Character");
  });

  it("always returns at least 1 clue for any valid character", () => {
    const noAliasesNoClues = makeChar({ aliases: [] });
    const withAliases = makeChar({ aliases: ["Alias1"] });
    const withClues = makeChar({
      clues: [{ kind: "quote", text: "Hello" }],
    });

    expect(getCharacterClues(noAliasesNoClues).length).toBeGreaterThanOrEqual(
      1
    );
    expect(getCharacterClues(withAliases).length).toBeGreaterThanOrEqual(1);
    expect(getCharacterClues(withClues).length).toBeGreaterThanOrEqual(1);
  });

  it("all fallback records have valid kind and non-empty text", () => {
    const char = makeChar({ aliases: ["Alias A", "Alias B"] });
    const result = getCharacterClues(char);
    const validKinds = new Set(["quote", "laugh", "epithet", "alias"]);
    for (const clue of result) {
      expect(validKinds.has(clue.kind)).toBe(true);
      expect(clue.text.length).toBeGreaterThan(0);
    }
  });

  it("returns empty canonical clues as fallback", () => {
    const char = makeChar({ clues: [], aliases: ["Fallback Alias"] });
    const result = getCharacterClues(char);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("alias");
    expect(result[0].text).toBe("Fallback Alias");
  });
});
