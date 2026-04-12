/**
 * Character search - name and alias lookup with bounded fuzzy fallback
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
    .replace(/[-']/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
 * Bounded Damerau-Levenshtein distance (substitution, insertion, deletion, transposition).
 * Returns early with maxDistance + 1 if the distance is guaranteed to exceed maxDistance.
 */
function damerauLevenshteinDistance(
  a: string,
  b: string,
  maxDistance: number = 1
): number {
  const lenA = a.length;
  const lenB = b.length;

  // Quick reject: length difference alone exceeds maxDistance
  if (Math.abs(lenA - lenB) > maxDistance) {
    return maxDistance + 1;
  }

  // Use the shorter string as columns to minimize memory
  if (lenA < lenB) {
    return damerauLevenshteinDistance(b, a, maxDistance);
  }

  // Single-row DP with previous row for transposition lookback
  let prevRow = new Array(lenB + 1);
  const currRow = new Array(lenB + 1);
  let prevPrevRow: number[] | null = null;

  // Initialize first row
  for (let j = 0; j <= lenB; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    currRow[0] = i;
    let rowMin = currRow[0];

    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        currRow[j - 1] + 1, // insertion
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + cost // substitution
      );

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1] &&
        prevPrevRow !== null
      ) {
        val = Math.min(val, prevPrevRow[j - 2] + cost);
      }

      currRow[j] = val;
      if (val < rowMin) {
        rowMin = val;
      }
    }

    // Early termination: if minimum value in this row exceeds maxDistance
    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    // Rotate rows
    prevPrevRow = prevRow.slice();
    prevRow = currRow.slice();
  }

  return prevRow[lenB] > maxDistance ? maxDistance + 1 : prevRow[lenB];
}

const FUZZY_THRESHOLD = 1;
const FUZZY_MIN_QUERY_LENGTH = 4;

function fuzzyScore(
  character: Character,
  normalizedQuery: string
): { distance: number; matchLength: number } | null {
  const normalizedName = normalize(character.name);
  const nameDistance = damerauLevenshteinDistance(
    normalizedQuery,
    normalizedName,
    FUZZY_THRESHOLD
  );
  if (nameDistance <= FUZZY_THRESHOLD) {
    return { distance: nameDistance, matchLength: normalizedName.length };
  }

  // Check aliases
  for (const alias of character.aliases) {
    const normalizedAlias = normalize(alias);
    const aliasDistance = damerauLevenshteinDistance(
      normalizedQuery,
      normalizedAlias,
      FUZZY_THRESHOLD
    );
    if (aliasDistance <= FUZZY_THRESHOLD) {
      return { distance: aliasDistance, matchLength: normalizedAlias.length };
    }
  }

  return null;
}

/**
 * Search characters by name or alias
 * Returns sorted results with best matches first.
 * Ranking: exact → prefix → contains → fuzzy (bounded Damerau-Levenshtein)
 */
export function searchCharacters(
  characters: Character[],
  query: string,
  limit: number = 10
): Character[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const literalMatchedIds = new Set<string>();
  const literalMatches: Array<{ character: Character; score: number }> = [];

  for (const c of characters) {
    const score = scoreMatch(c, query);
    if (score > 0) {
      literalMatches.push({ character: c, score });
      literalMatchedIds.add(c.id);
    }
  }

  literalMatches.sort((a, b) => b.score - a.score);

  const fuzzyMatches: Array<{
    character: Character;
    distance: number;
    matchLength: number;
  }> = [];

  if (normalizedQuery.length >= FUZZY_MIN_QUERY_LENGTH) {
    for (const c of characters) {
      if (literalMatchedIds.has(c.id)) {
        continue;
      }

      const result = fuzzyScore(c, normalizedQuery);
      if (result !== null) {
        fuzzyMatches.push({
          character: c,
          distance: result.distance,
          matchLength: result.matchLength,
        });
      }
    }

    fuzzyMatches.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.matchLength !== b.matchLength) return a.matchLength - b.matchLength;
      return a.character.name.localeCompare(b.character.name);
    });
  }

  const combined = [
    ...literalMatches.map((m) => m.character),
    ...fuzzyMatches.map((m) => m.character),
  ];

  return combined.slice(0, limit);
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
