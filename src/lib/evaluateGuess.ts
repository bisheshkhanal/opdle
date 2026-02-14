/**
 * Guess evaluation engine - compares guessed character to target
 */

import type { Character, GuessResult, TileStatus } from "./types";
import { evaluateCharacter } from "./categories";
import { getLocalCharacterImageUrl } from "./images";

/**
 * Evaluate a guess against the target character
 * Returns detailed results for each category
 */
export function evaluateGuess(
  guess: Character,
  target: Character
): GuessResult {
  const categoryResults = evaluateCharacter(guess, target);
  const isCorrect = categoryResults.every((r) => r.status === "correct");

  return {
    characterId: guess.id,
    characterName: guess.name,
    imageUrl: getLocalCharacterImageUrl(guess.id),
    categories: categoryResults,
    isCorrect,
  };
}

/**
 * Check if all category results are correct
 */
export function isWinningGuess(result: GuessResult): boolean {
  return result.isCorrect;
}

/**
 * Get the status color class for a category result
 * Uses literal Tailwind classes for proper compilation
 * Note: GuessRow now uses CSS component classes from globals.css
 * This function is kept for backwards compatibility and tests
 */
export function getStatusColorClass(status: TileStatus): string {
  switch (status) {
    case "correct":
      return "bg-tile-correct text-white border-tile-correctBorder";
    case "partial":
      return "bg-tile-partial text-white border-tile-partialBorder";
    case "wrong":
      return "bg-tile-wrong text-white border-tile-wrongBorder";
    case "higher":
      return "bg-tile-wrong text-white border-tile-wrongBorder";
    case "lower":
      return "bg-tile-wrong text-white border-tile-wrongBorder";
    case "unknown":
      return "bg-tile-unknown text-white border-tile-unknownBorder";
    default:
      return "bg-tile-wrong text-white border-tile-wrongBorder";
  }
}

/**
 * Get arrow indicator for numeric comparisons
 * ↑ if guess < answer (target is higher)
 * ↓ if guess > answer (target is lower)
 */
export function getArrowIndicator(status: TileStatus): string {
  switch (status) {
    case "higher":
      return "↑";
    case "lower":
      return "↓";
    default:
      return "";
  }
}
