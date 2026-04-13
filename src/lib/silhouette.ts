import { Character, GuessResult, RulesetDailyState } from "./types";
import { evaluateGuess } from "./evaluateGuess";

export interface SilhouetteState extends RulesetDailyState {
  revealStep: number;
}

export function initSilhouetteState(): SilhouetteState {
  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    revealStep: 0,
  };
}

export function applySilhouetteGuess(
  state: SilhouetteState,
  guess: Character,
  target: Character,
  maxGuesses: number = 6
): SilhouetteState {
  if (state.isFinished) {
    return state;
  }

  const guessResult = evaluateGuess(guess, target);
  const isCorrect = guessResult.isCorrect;
  const newGuesses = [...state.guesses, guessResult];
  const newGuessedIds = [...state.guessedIds, guess.id];
  const isFinished = isCorrect || newGuesses.length >= maxGuesses;

  let newRevealStep = state.revealStep;
  if (!isFinished && !isCorrect) {
    newRevealStep = Math.min(newRevealStep + 1, maxGuesses - 1);
  }

  return {
    guesses: newGuesses,
    guessedIds: newGuessedIds,
    isFinished,
    isWon: isCorrect,
    revealStep: newRevealStep,
  };
}

export function getSilhouetteRevealStep(state: SilhouetteState): number {
  return state.revealStep || 0;
}

export function isSilhouetteComplete(state: SilhouetteState): boolean {
  return state.isFinished;
}
