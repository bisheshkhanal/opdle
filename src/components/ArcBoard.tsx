"use client";

import { Character } from "@/lib/types";
import { ArcState } from "@/lib/arc";
import { Autocomplete } from "@/components/Autocomplete";

export interface ArcBoardProps {
  targetCharacter: Character;
  allCharacters: Character[];
  state: ArcState;
  onGuess: (guessId: string) => void;
}

function getDirectionEmoji(direction: string): string {
  switch (direction) {
    case "earlier":
      return "⬆️";
    case "later":
      return "⬇️";
    case "same":
      return "✅";
    default:
      return "❓";
  }
}

function getDistanceLabel(result: {
  direction: string;
  distance: number;
}): string {
  if (result.direction === "same") return "Same arc!";
  if (result.direction === "unknown") return "Unknown arc";
  return `${result.distance} arc${result.distance === 1 ? "" : "s"} away`;
}

export function ArcBoard({
  targetCharacter,
  allCharacters,
  state,
  onGuess,
}: ArcBoardProps) {
  const isFinished = state.isFinished;
  const isWon = state.isWon;

  return (
    <div data-testid="arc-board" className="mx-auto w-full max-w-lg space-y-6">
      <div className="text-center">
        <p className="font-pirata text-2xl text-navy-800 dark:text-gold-400">
          Guess the character by their debut arc!
        </p>
        <p className="mt-1 text-sm text-navy-600 dark:text-parchment-300">
          Each guess reveals the arc distance and direction.
        </p>
      </div>

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

      {state.arcGuesses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-center text-sm font-bold uppercase tracking-wider text-navy-600 dark:text-slate-300">
            Guesses ({state.arcGuesses.length} / 6)
          </h3>
          <div data-testid="arc-guess-list" className="flex flex-col gap-2">
            {state.arcGuesses.map((guess, idx) => (
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
                  <div>
                    <span className="font-pirata text-xl text-navy-800 dark:text-parchment-100">
                      {guess.characterName}
                    </span>
                    <span className="ml-2 text-xs text-navy-500 dark:text-parchment-400">
                      {guess.guessedArc}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-navy-600 dark:text-parchment-300">
                    {getDistanceLabel(guess)}
                  </span>
                  <span className="text-lg">
                    {getDirectionEmoji(guess.direction)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="animate-in fade-in zoom-in mt-6 text-center duration-500">
          <p className="font-pirata text-3xl text-navy-800 drop-shadow-sm dark:text-gold-400">
            {isWon ? "Correct!" : "Game Over!"}
          </p>
          <p className="font-alegreya mt-1 text-lg text-navy-600 dark:text-parchment-200">
            The character was{" "}
            <strong className="text-gold-600 dark:text-gold-400">
              {targetCharacter.name}
            </strong>{" "}
            from{" "}
            <strong className="text-gold-600 dark:text-gold-400">
              {targetCharacter.firstArc}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
