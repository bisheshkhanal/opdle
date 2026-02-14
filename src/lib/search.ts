/**
 * Character search - name and alias lookup
 */

import type { Character } from "./types";

/**
 * Normalize a string for searching (lowercase, remove special chars)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Check if a query matches a character name or alias
 */
function matchesCharacter(character: Character, query: string): boolean {
  const normalizedQuery = normalize(query);

  // Check main name
  if (normalize(character.name).includes(normalizedQuery)) {
    return true;
  }

  // Check aliases
  for (const alias of character.aliases) {
    if (normalize(alias).includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * Score a match for sorting (higher = better match)
 */
function scoreMatch(character: Character, query: string): number {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(character.name);

  // Exact match gets highest score
  if (normalizedName === normalizedQuery) {
    return 100;
  }

  // Name starts with query
  if (normalizedName.startsWith(normalizedQuery)) {
    return 90;
  }

  // Name contains query
  if (normalizedName.includes(normalizedQuery)) {
    return 80;
  }

  // Check aliases
  for (const alias of character.aliases) {
    const normalizedAlias = normalize(alias);
    if (normalizedAlias === normalizedQuery) {
      return 70;
    }
    if (normalizedAlias.startsWith(normalizedQuery)) {
      return 60;
    }
    if (normalizedAlias.includes(normalizedQuery)) {
      return 50;
    }
  }

  return 0;
}

/**
 * Search characters by name or alias
 * Returns sorted results with best matches first
 */
export function searchCharacters(
  characters: Character[],
  query: string,
  limit: number = 10
): Character[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const matches = characters
    .filter((c) => matchesCharacter(c, query))
    .map((c) => ({ character: c, score: scoreMatch(c, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.character);

  return matches;
}

/**
 * Find a character by exact name match
 */
export function findCharacterByName(
  characters: Character[],
  name: string
): Character | undefined {
  const normalizedName = normalize(name);
  return characters.find(
    (c) =>
      normalize(c.name) === normalizedName ||
      c.aliases.some((a) => normalize(a) === normalizedName)
  );
}

/**
 * Find a character by ID
 */
export function findCharacterById(
  characters: Character[],
  id: string
): Character | undefined {
  return characters.find((c) => c.id === id);
}

/**
 * Get all unique aliases for a character (including name)
 */
export function getAllNames(character: Character): string[] {
  return [character.name, ...character.aliases];
}
