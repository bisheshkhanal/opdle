import { Character, GuessResult, RulesetDailyState } from "./types";
import { evaluateGuess } from "./evaluateGuess";

export interface WantedState extends RulesetDailyState {
  revealStep: number;
}

export function initWantedState(): WantedState {
  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    revealStep: 0,
  };
}

export function applyWantedGuess(
  state: WantedState,
  guess: Character,
  target: Character,
  maxGuesses: number = 6
): WantedState {
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
  } else if (isFinished) {
    newRevealStep = maxGuesses - 1;
  }

  return {
    guesses: newGuesses,
    guessedIds: newGuessedIds,
    isFinished,
    isWon: isCorrect,
    revealStep: newRevealStep,
  };
}

export function getWantedRevealStep(state: WantedState): number {
  return state.revealStep || 0;
}

export function isWantedComplete(state: WantedState): boolean {
  return state.isFinished;
}
