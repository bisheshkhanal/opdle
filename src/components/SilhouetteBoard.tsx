"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Character } from "@/lib/types";
import { SilhouetteState } from "@/lib/silhouette";
import { Autocomplete } from "@/components/Autocomplete";
import { getLocalCharacterImageUrl } from "@/lib/images";

export interface SilhouetteBoardProps {
  targetCharacter: Character;
  allCharacters: Character[];
  state: SilhouetteState;
  onGuess: (guessId: string) => void;
}

function getBlurForStep(step: number): string {
  // Step 0..5. Step 0 is most obscured, Step 5 is least.
  // We can also drop brightness down initially.
  switch (step) {
    case 0:
      return "brightness(0) blur(10px)";
    case 1:
      return "brightness(0) blur(4px)";
    case 2:
      return "brightness(0.3) blur(2px) grayscale(100%)";
    case 3:
      return "brightness(0.6) blur(1px) grayscale(50%)";
    case 4:
      return "brightness(0.8) blur(0px) sepia(20%)";
    case 5:
    default:
      return "brightness(1) blur(0px)";
  }
}

export function SilhouetteBoard({
  targetCharacter,
  allCharacters,
  state,
  onGuess,
}: SilhouetteBoardProps) {
  const isFinished = state.isFinished;
  const isWon = state.isWon;
  const revealStep = state.revealStep || 0;

  const targetImage = getLocalCharacterImageUrl(targetCharacter.id);

  const blurStyle =
    isWon || (isFinished && !isWon)
      ? "brightness(1) blur(0px)"
      : getBlurForStep(revealStep);

  return (
    <div
      data-testid="silhouette-board"
      role="region"
      aria-label="Silhouette game board"
      className="mx-auto w-full max-w-lg space-y-6"
    >
      {/* Target Silhouette Image */}
      <div className="shadow-elevated mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border-4 border-parchment-300 bg-parchment-100 dark:border-slate-600 dark:bg-slate-800">
        {targetImage ? (
          <img
            src={targetImage}
            alt="Character silhouette"
            data-testid="silhouette-image"
            aria-label={`Character silhouette, step ${revealStep} of 6 revealed`}
            className="h-full w-full object-cover transition-all duration-500 ease-in-out"
            style={{ filter: blurStyle }}
          />
        ) : (
          <div className="text-navy-400 dark:text-slate-400">No Image</div>
        )}
      </div>

      {/* Input */}
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

      {/* Guesses (Result Feedback) */}
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

      {/* Game Over Message */}
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
