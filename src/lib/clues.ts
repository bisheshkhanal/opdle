import type { Character, CharacterClue } from "./types";

/**
 * Returns canonical clues for a character, or generates fallback records
 * from aliases/epithets when no canonical clues exist.
 * ALWAYS returns ≥1 clue for any valid character.
 */
export function getCharacterClues(character: Character): CharacterClue[] {
  if (character.clues && character.clues.length > 0) {
    return character.clues;
  }

  if (character.aliases.length > 0) {
    return character.aliases.map((alias) => ({
      kind: "alias" as const,
      text: alias,
    }));
  }

  return [{ kind: "epithet" as const, text: character.name }];
}
