"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Character } from "@/lib/types";
import { WantedState } from "@/lib/wanted";
import { Autocomplete } from "@/components/Autocomplete";
import { getLocalCharacterImageUrl } from "@/lib/images";

export interface WantedBoardProps {
  targetCharacter: Character;
  allCharacters: Character[];
  state: WantedState;
  onGuess: (guessId: string) => void;
}

function getClipPathForStep(step: number): string {
  switch (step) {
    case 0:
      return "inset(35%)";
    case 1:
      return "inset(28%)";
    case 2:
      return "inset(21%)";
    case 3:
      return "inset(14%)";
    case 4:
      return "inset(7%)";
    case 5:
    default:
      return "inset(0%)";
  }
}

export function WantedBoard({
  targetCharacter,
  allCharacters,
  state,
  onGuess,
}: WantedBoardProps) {
  const isFinished = state.isFinished;
  const isWon = state.isWon;
  const revealStep = state.revealStep || 0;

  const targetImage = getLocalCharacterImageUrl(targetCharacter.id);

  const clipPathStyle =
    isWon || (isFinished && !isWon)
      ? "inset(0%)"
      : getClipPathForStep(revealStep);

  return (
    <div
      data-testid="wanted-board"
      role="region"
      aria-label="Wanted poster game board"
      className="mx-auto w-full max-w-lg space-y-6"
    >
      <div className="shadow-elevated relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border-4 border-parchment-300 bg-parchment-100 dark:border-slate-600 dark:bg-slate-800">
        {targetImage ? (
          <Image
            src={targetImage}
            alt="Wanted poster"
            data-testid="wanted-image"
            aria-label={`Wanted poster, step ${revealStep} of 6 revealed`}
            fill
            sizes="264px"
            quality={85}
            className="object-contain object-top transition-all duration-500 ease-in-out"
            style={{ clipPath: clipPathStyle }}
          />
        ) : (
          <div className="text-navy-400 dark:text-slate-400">No Image</div>
        )}
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
