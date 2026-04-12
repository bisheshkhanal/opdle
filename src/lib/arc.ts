/**
 * Arc Proximity mode engine — a single-board ruleset where the primary
 * feedback after each guess is the arc distance between the guessed
 * character's firstArc and the target's firstArc, plus a directional
 * hint ("earlier", "later", or "same").
 */

import type { Character, GuessResult, RulesetDailyState } from "./types";
import { compareArcs, getArcIndex } from "./arcs";
import { getLocalCharacterImageUrl } from "./images";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArcGuessResult {
  characterId: string;
  characterName: string;
  imageUrl: string;
  guessedArc: string;
  targetArc: string;
  distance: number;
  direction: "earlier" | "later" | "same" | "unknown";
  isCorrect: boolean;
}

/**
 * Extends RulesetDailyState for contract-test compatibility.
 * `guesses` holds lightweight GuessResult entries; `arcGuesses`
 * holds the arc-specific rich feedback.
 */
export interface ArcState extends RulesetDailyState {
  arcGuesses: ArcGuessResult[];
}

// ---------------------------------------------------------------------------
// Arc distance
// ---------------------------------------------------------------------------

/**
 * Compute arc distance and direction from a guess arc to a target arc.
 *
 * - "same"     — both arcs match
 * - "earlier"  — target's arc comes BEFORE guess's arc (player should guess earlier)
 * - "later"    — target's arc comes AFTER guess's arc  (player should guess later)
 * - "unknown"  — either arc is missing from ARC_ORDER
 *
 * distance = absolute index difference, 0 for same, -1 for unknown.
 */
export function getArcDistance(
  guessArc: string,
  targetArc: string
): { distance: number; direction: "earlier" | "later" | "same" | "unknown" } {
  const guessIdx = getArcIndex(guessArc);
  const targetIdx = getArcIndex(targetArc);

  if (guessIdx === -1 || targetIdx === -1) {
    return { distance: -1, direction: "unknown" };
  }

  if (guessIdx === targetIdx) {
    return { distance: 0, direction: "same" };
  }

  // compareArcs returns "higher" when guessIndex < targetIndex (target is later)
  // and "lower" when guessIndex > targetIndex (target is earlier).
  const comparison = compareArcs(guessArc, targetArc);

  if (comparison === "higher") {
    // Target arc comes after guess arc — player should guess LATER
    return {
      distance: Math.abs(targetIdx - guessIdx),
      direction: "later",
    };
  }

  // comparison === "lower" — target arc comes before guess arc — guess EARLIER
  return {
    distance: Math.abs(guessIdx - targetIdx),
    direction: "earlier",
  };
}

// ---------------------------------------------------------------------------
// Engine functions
// ---------------------------------------------------------------------------

export function initArcState(): ArcState {
  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    arcGuesses: [],
  };
}

export function applyArcGuess(
  state: ArcState,
  guess: Character,
  target: Character,
  maxGuesses: number = 6
): ArcState {
  if (state.isFinished) {
    return state;
  }

  const { distance, direction } = getArcDistance(
    guess.firstArc,
    target.firstArc
  );
  const isCorrect = direction === "same";

  const arcResult: ArcGuessResult = {
    characterId: guess.id,
    characterName: guess.name,
    imageUrl: getLocalCharacterImageUrl(guess.id),
    guessedArc: guess.firstArc,
    targetArc: target.firstArc,
    distance,
    direction,
    isCorrect,
  };

  const guessResult: GuessResult = {
    characterId: guess.id,
    characterName: guess.name,
    imageUrl: getLocalCharacterImageUrl(guess.id),
    categories: [],
    isCorrect,
  };

  const newArcGuesses = [...state.arcGuesses, arcResult];
  const newGuesses = [...state.guesses, guessResult];
  const newGuessedIds = [...state.guessedIds, guess.id];
  const isFinished = isCorrect || newGuesses.length >= maxGuesses;

  return {
    guesses: newGuesses,
    guessedIds: newGuessedIds,
    isFinished,
    isWon: isCorrect,
    arcGuesses: newArcGuesses,
  };
}

export function isArcComplete(state: ArcState): boolean {
  return state.isFinished;
}
