/**
 * Infinite mode utilities - PRNG and selection logic for infinite rounds
 */

import type { Character } from "./types";
import { seededRandom } from "./daily";

/**
 * Generate a new round ID based on timestamp and random component
 */
export function generateRoundId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
}

/**
 * Extract seed from round ID for deterministic character selection
 */
export function roundIdToSeed(roundId: string): number {
  let hash = 0;
  for (let i = 0; i < roundId.length; i++) {
    const char = roundId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Select a character for infinite mode based on round seed
 * Deterministic - same roundId always returns same character
 */
export function selectInfiniteCharacter(
  characters: Character[],
  roundId: string
): Character {
  const seed = roundIdToSeed(roundId);
  const rng = seededRandom(seed);
  const index = Math.floor(rng() * characters.length);
  return characters[index];
}

/**
 * Create a sequence of characters from a seed
 * Useful for testing PRNG consistency
 */
export function createCharacterSequence(
  characters: Character[],
  seed: number,
  count: number
): Character[] {
  const rng = seededRandom(seed);
  const sequence: Character[] = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(rng() * characters.length);
    sequence.push(characters[index]);
  }

  return sequence;
}

/**
 * Get next seed from current seed (for sequential rounds if needed)
 */
export function getNextSeed(currentSeed: number): number {
  const rng = seededRandom(currentSeed);
  return Math.floor(rng() * 2147483647);
}
