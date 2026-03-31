import { describe, it, expect } from "vitest";
import { getValidArcs } from "../arcs";
import { validateCharacter } from "../types";
import charactersData from "../../data/characters.v2.json";

describe("Roster validation", () => {
  const characters = charactersData as unknown[];
  const characterIds = new Set(
    characters
      .filter(
        (character): character is { id: string } =>
          typeof character === "object" &&
          character !== null &&
          "id" in character &&
          typeof character.id === "string"
      )
      .map((character) => character.id)
  );
  const validArcs = getValidArcs();

  it("should have at least one character", () => {
    expect(characters.length).toBeGreaterThan(0);
  });

  it("should have unique character IDs", () => {
    expect(characterIds.size).toBe(characters.length);
  });

  it("should have valid firstArc for all characters", () => {
    const invalidArcs: string[] = [];

    for (const char of characters.filter(validateCharacter)) {
      const arc = char.firstArc;
      if (arc !== "?" && !validArcs.includes(arc)) {
        invalidArcs.push(`${char.name}: ${arc}`);
      }
    }

    expect(invalidArcs).toEqual([]);
  });

  it("should pass runtime schema validation for every character", () => {
    const invalidCharacters = characters.filter(
      (character) => !validateCharacter(character)
    );

    expect(invalidCharacters).toEqual([]);
  });
});
