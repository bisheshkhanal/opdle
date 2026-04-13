/**
 * Four Seas mode engine — multi-board state management.
 *
 * One seed selects 4 linked characters (via selectFourSeasTargets).
 * Each board has isolated guess history. One guess applies to exactly
 * ONE chosen board at a time.
 *
 * All functions are pure — no Date.now(), Math.random(), or side effects.
 */

import type { Character, GuessResult } from "./types";
import { evaluateGuess } from "./evaluateGuess";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Board identifiers — indexed 0–3. */
export type BoardId = "north" | "east" | "south" | "west";

/** Ordered board positions for consistent display. */
export const BOARD_ORDER: BoardId[] = ["north", "east", "south", "west"];

/** Max guesses per individual board. */
export const FOUR_SEAS_MAX_GUESSES = 6;

/**
 * Per-board state — fully isolated guess history and completion flags.
 */
export interface FourSeaBoard {
  boardId: BoardId;
  targetCharacterId: string;
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
}

/**
 * Normalized multi-board state for the Four Seas ruleset.
 *
 * Design: `boards` is a Record keyed by BoardId for O(1) lookup.
 * `boardOrder` preserves display ordering.
 */
export interface FourSeasState {
  boards: Record<BoardId, FourSeaBoard>;
  boardOrder: BoardId[];
}

/**
 * Compact share metadata for Four Seas results.
 */
export interface FourSeasShareData {
  boardsCompleted: number;
  boardsWon: number;
  totalGuesses: number;
  boardResults: Array<{
    boardId: BoardId;
    won: boolean;
    guessCount: number;
  }>;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Create initial FourSeasState from exactly 4 target characters.
 *
 * Characters are assigned to boards in order: characters[0] → north,
 * characters[1] → east, characters[2] → south, characters[3] → west.
 *
 * @throws Error if not exactly 4 characters are provided.
 */
export function initFourSeasState(targets: Character[]): FourSeasState {
  if (targets.length !== 4) {
    throw new Error(
      `Four Seas requires exactly 4 targets, got ${targets.length}`
    );
  }

  const boards: Record<BoardId, FourSeaBoard> = {} as Record<
    BoardId,
    FourSeaBoard
  >;

  for (let i = 0; i < 4; i++) {
    const boardId = BOARD_ORDER[i];
    boards[boardId] = {
      boardId,
      targetCharacterId: targets[i].id,
      guesses: [],
      guessedIds: [],
      isFinished: false,
      isWon: false,
    };
  }

  return {
    boards,
    boardOrder: [...BOARD_ORDER],
  };
}

// ---------------------------------------------------------------------------
// Guess application
// ---------------------------------------------------------------------------

/**
 * Apply a guess to a specific board. Only the specified board is updated;
 * all other boards remain unchanged.
 *
 * Uses classic category evaluation (evaluateGuess) for per-board feedback.
 *
 * @param state - Current FourSeasState (immutable — returns new state).
 * @param boardId - Which board to apply the guess to.
 * @param guess - The character being guessed.
 * @param targetCharacters - Map of character IDs to full Character objects
 *   for the 4 targets (used to evaluate the guess against the correct target).
 * @param maxGuesses - Maximum guesses per board (default: 6).
 * @returns New FourSeasState with the updated board.
 */
export function applyFourSeasGuess(
  state: FourSeasState,
  boardId: BoardId,
  guess: Character,
  targetCharacters: Record<string, Character>,
  maxGuesses: number = FOUR_SEAS_MAX_GUESSES
): FourSeasState {
  const board = state.boards[boardId];

  // If this board is already finished, no-op
  if (board.isFinished) {
    return state;
  }

  // Duplicate guess on same board — no-op
  if (board.guessedIds.includes(guess.id)) {
    return state;
  }

  const target = targetCharacters[board.targetCharacterId];
  if (!target) {
    return state;
  }

  const guessResult = evaluateGuess(guess, target);
  const newGuesses = [...board.guesses, guessResult];
  const newGuessedIds = [...board.guessedIds, guess.id];
  const isCorrect = guessResult.isCorrect;
  const isFinished = isCorrect || newGuesses.length >= maxGuesses;

  const updatedBoard: FourSeaBoard = {
    boardId,
    targetCharacterId: board.targetCharacterId,
    guesses: newGuesses,
    guessedIds: newGuessedIds,
    isFinished,
    isWon: isCorrect,
  };

  return {
    ...state,
    boards: {
      ...state.boards,
      [boardId]: updatedBoard,
    },
  };
}

// ---------------------------------------------------------------------------
// Completion checks
// ---------------------------------------------------------------------------

/**
 * True when ALL four boards are finished (each either won or exhausted guesses).
 */
export function isFourSeasFinished(state: FourSeasState): boolean {
  return state.boardOrder.every((boardId) => state.boards[boardId].isFinished);
}

/**
 * True when ALL four boards are won (every target guessed correctly).
 */
export function isFourSeasWon(state: FourSeasState): boolean {
  return state.boardOrder.every((boardId) => state.boards[boardId].isWon);
}

/**
 * Get the total number of guesses across all boards.
 */
export function getFourSeasTotalGuesses(state: FourSeasState): number {
  return state.boardOrder.reduce(
    (sum, boardId) => sum + state.boards[boardId].guesses.length,
    0
  );
}

// ---------------------------------------------------------------------------
// Share data
// ---------------------------------------------------------------------------

/**
 * Generate compact metadata for share output.
 */
export function getFourSeasShareData(state: FourSeasState): FourSeasShareData {
  const boardResults = state.boardOrder.map((boardId) => {
    const board = state.boards[boardId];
    return {
      boardId,
      won: board.isWon,
      guessCount: board.guesses.length,
    };
  });

  return {
    boardsCompleted: boardResults.filter((r) => r.won).length,
    boardsWon: boardResults.filter((r) => r.won).length,
    totalGuesses: getFourSeasTotalGuesses(state),
    boardResults,
  };
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

/**
 * Serialized form for localStorage — targets stored as IDs only.
 */
export interface FourSeasSerialized {
  boardOrder: BoardId[];
  boards: Record<
    BoardId,
    {
      boardId: BoardId;
      targetCharacterId: string;
      guesses: GuessResult[];
      guessedIds: string[];
      isFinished: boolean;
      isWon: boolean;
    }
  >;
}

/**
 * Serialize state for persistence (lossless — just removes methods).
 */
export function serializeFourSeasState(
  state: FourSeasState
): FourSeasSerialized {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Restore state from serialized form.
 * Validates structure and returns undefined if corrupted.
 */
export function deserializeFourSeasState(
  data: unknown
): FourSeasState | undefined {
  if (typeof data !== "object" || data === null) return undefined;

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.boardOrder)) return undefined;
  if (typeof obj.boards !== "object" || obj.boards === null) return undefined;

  const boards = obj.boards as Record<string, unknown>;

  for (const boardId of obj.boardOrder as BoardId[]) {
    const board = boards[boardId];
    if (typeof board !== "object" || board === null) return undefined;
    const b = board as Record<string, unknown>;

    if (typeof b.targetCharacterId !== "string") return undefined;
    if (!Array.isArray(b.guesses)) return undefined;
    if (!Array.isArray(b.guessedIds)) return undefined;
    if (typeof b.isFinished !== "boolean") return undefined;
    if (typeof b.isWon !== "boolean") return undefined;
  }

  return data as unknown as FourSeasState;
}
