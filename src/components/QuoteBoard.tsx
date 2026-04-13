"use client";

import { useMemo } from "react";
import { Character } from "@/lib/types";
import { QuoteState, getVisibleClues } from "@/lib/quote";
import { Autocomplete } from "@/components/Autocomplete";

export interface QuoteBoardProps {
  targetCharacter: Character;
  allCharacters: Character[];
  state: QuoteState;
  onGuess: (guessId: string) => void;
}

function clueKindLabel(kind: string): string {
  switch (kind) {
    case "quote":
      return "Quote";
    case "laugh":
      return "Laugh";
    case "epithet":
      return "Epithet";
    case "alias":
      return "Alias";
    default:
      return "Clue";
  }
}

export function QuoteBoard({
  targetCharacter,
  allCharacters,
  state,
  onGuess,
}: QuoteBoardProps) {
  const isFinished = state.isFinished;
  const isWon = state.isWon;

  const { starterClue, attributeClues } = useMemo(
    () => getVisibleClues(targetCharacter, state),
    [targetCharacter, state]
  );

  return (
    <div
      data-testid="quote-board"
      role="region"
      aria-label="Quote game board"
      className="mx-auto w-full max-w-lg space-y-6"
    >
      <div
        data-testid="starter-clue"
        role="note"
        aria-label="Starting clue"
        className="shadow-elevated rounded-xl border-2 border-gold-400 bg-parchment-100 p-4 dark:border-gold-500 dark:bg-slate-800"
      >
        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
          {clueKindLabel(starterClue.kind)}
        </span>
        <blockquote className="font-alegreya text-lg italic text-navy-800 dark:text-parchment-100">
          &ldquo;{starterClue.text}&rdquo;
        </blockquote>
      </div>

      {attributeClues.length > 0 && (
        <div data-testid="attribute-clues" className="space-y-2">
          <h3 className="text-center text-sm font-bold uppercase tracking-wider text-navy-600 dark:text-slate-300">
            Revealed Clues
          </h3>
          <div className="flex flex-col gap-2">
            {attributeClues.map((clue) => (
              <div
                key={clue.key}
                className="flex items-center justify-between rounded-lg border border-parchment-300 bg-parchment-50 px-4 py-2 shadow-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <span className="text-sm font-semibold text-navy-600 dark:text-slate-300">
                  {clue.label}
                </span>
                <span className="text-sm font-medium text-navy-800 dark:text-parchment-100">
                  {clue.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFinished && (
        <div className="mx-auto max-w-sm">
          <Autocomplete
            characters={allCharacters}
            guessedIds={state.guessedIds}
            onSelect={(char) => onGuess(char.id)}
            disabled={isFinished}
          />
        </div>
      )}

      {state.guesses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-center text-sm font-bold uppercase tracking-wider text-navy-600 dark:text-slate-300">
            Guesses ({state.guesses.length} / 6)
          </h3>
          <div className="flex flex-col gap-2">
            {state.guesses.map((guess, idx) => (
              <div
                key={`${guess.characterId}-${idx}`}
                className={`flex items-center justify-between rounded-lg px-4 py-3 shadow-sm ${
                  guess.isCorrect
                    ? "border border-tile-correct bg-tile-correct/20"
                    : "border border-tile-wrong/30 bg-tile-wrong/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-parchment-300 dark:border-slate-600">
                    <img
                      src={guess.imageUrl}
                      alt={guess.characterName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-pirata text-xl text-navy-800 dark:text-parchment-100">
                    {guess.characterName}
                  </span>
                </div>
                <div className="text-lg">{guess.isCorrect ? "✅" : "❌"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div
          aria-live="polite"
          className="animate-in fade-in zoom-in mt-6 text-center duration-500"
        >
          <p className="font-pirata text-3xl text-navy-800 drop-shadow-sm dark:text-gold-400">
            {isWon ? "Correct!" : "Game Over!"}
          </p>
          <p className="font-alegreya mt-1 text-lg text-navy-600 dark:text-parchment-200">
            The character was{" "}
            <strong className="text-gold-600 dark:text-gold-400">
              {targetCharacter.name}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
