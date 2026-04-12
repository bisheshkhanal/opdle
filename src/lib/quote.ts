import {
  Character,
  CharacterClue,
  GuessResult,
  RulesetDailyState,
} from "./types";
import { evaluateGuess } from "./evaluateGuess";
import { getCharacterClues } from "./clues";
import { categories } from "./categories";

export interface QuoteState extends RulesetDailyState {
  clueIndex: number;
}

export interface AttributeClue {
  key: string;
  label: string;
  value: string;
}

export interface VisibleClues {
  starterClue: CharacterClue;
  attributeClues: AttributeClue[];
}

/**
 * Fixed order of attribute clues revealed progressively after wrong guesses.
 */
export const ATTRIBUTE_CLUE_ORDER: (keyof Character)[] = [
  "gender",
  "origin",
  "firstArc",
  "devilFruitType",
  "haki",
  "affiliationPrimary",
  "bounty",
  "heightCm",
];

const ATTRIBUTE_CLUE_MAX = ATTRIBUTE_CLUE_ORDER.length;

export function initQuoteState(): QuoteState {
  return {
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    clueIndex: 0,
  };
}

export function applyQuoteGuess(
  state: QuoteState,
  guess: Character,
  target: Character,
  maxGuesses: number = 6
): QuoteState {
  if (state.isFinished) {
    return state;
  }

  const guessResult = evaluateGuess(guess, target);
  const isCorrect = guessResult.isCorrect;
  const newGuesses = [...state.guesses, guessResult];
  const newGuessedIds = [...state.guessedIds, guess.id];
  const isFinished = isCorrect || newGuesses.length >= maxGuesses;

  let newClueIndex = state.clueIndex;
  if (!isFinished && !isCorrect) {
    newClueIndex = Math.min(newClueIndex + 1, ATTRIBUTE_CLUE_MAX);
  }

  return {
    guesses: newGuesses,
    guessedIds: newGuessedIds,
    isFinished,
    isWon: isCorrect,
    clueIndex: newClueIndex,
  };
}

function getAttributeClueValue(
  target: Character,
  key: keyof Character
): string {
  const raw = target[key];
  if (raw === null || raw === undefined) {
    return "Unknown";
  }

  const catConfig = categories.find((c) => c.key === key);
  if (catConfig) {
    return catConfig.renderValue(raw);
  }

  return String(raw);
}

function getAttributeClueLabel(key: string): string {
  const catConfig = categories.find((c) => c.key === key);
  return catConfig ? catConfig.label : key;
}

export function getVisibleClues(
  target: Character,
  state: QuoteState
): VisibleClues {
  const allClues = getCharacterClues(target);
  const starterClue = allClues[0];

  const attributeClues: AttributeClue[] = [];
  for (let i = 0; i < state.clueIndex && i < ATTRIBUTE_CLUE_MAX; i++) {
    const key = ATTRIBUTE_CLUE_ORDER[i];
    attributeClues.push({
      key: key as string,
      label: getAttributeClueLabel(key as string),
      value: getAttributeClueValue(target, key),
    });
  }

  return { starterClue, attributeClues };
}

export function isQuoteComplete(state: QuoteState): boolean {
  return state.isFinished;
}
