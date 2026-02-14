"use client";

import type { Character, GameMode } from "@/lib/types";

interface AnswerRevealProps {
  character: Character;
  isWon: boolean;
  guessCount: number;
  mode: GameMode;
  onPlayAgain?: () => void;
  streak?: number;
}

export function AnswerReveal({
  character,
  isWon,
  guessCount,
  mode,
  onPlayAgain,
  streak,
}: AnswerRevealProps) {
  return (
    <div className="game-card w-full max-w-sm p-7 sm:p-8 win-celebrate">
      {/* Result message */}
      <div className="mb-6 text-center">
        {isWon ? (
          <>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-tile-correct/20 ring-4 ring-tile-correct/30 shadow-tile-correct">
              <svg
                className="h-9 w-9 text-tile-correct"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-pirate text-4xl tracking-wide text-tile-correct sm:text-5xl">
              Victory!
            </h2>
            <p className="mt-2 text-[15px] font-medium text-navy-600">
              Found in {guessCount} {guessCount === 1 ? "guess" : "guesses"}
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-tile-wrong/20 ring-4 ring-tile-wrong/30 shadow-tile-wrong">
              <svg
                className="h-9 w-9 text-tile-wrong"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="font-pirate text-4xl tracking-wide text-tile-wrong sm:text-5xl">
              Defeated
            </h2>
            <p className="mt-2 text-[15px] font-medium text-navy-600">
              The target was:
            </p>
          </>
        )}
      </div>

      {/* Character card with treasure frame */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative">
          <div
            className={`rounded-[28px] p-4 shadow-card ${
              isWon
                ? "bg-gradient-to-br from-gold-100 to-gold-200/80 ring-4 ring-gold-400/60"
                : "bg-parchment-100/80 ring-4 ring-parchment-400/60"
            }`}
          >
            <img
              src={character.imageUrl}
              alt={character.name}
              className={`h-36 w-36 rounded-2xl bg-parchment-50/90 object-contain object-top ${
                isWon ? "ring-4 ring-gold-500/50" : "ring-4 ring-parchment-300/70"
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/144?text=?";
              }}
            />
          </div>
          {isWon && (
            <div className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-tile-correct text-white shadow-tile-correct ring-4 ring-parchment-50">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <h3 className="mt-5 font-pirate text-3xl tracking-wide text-navy-800">
          {character.name}
        </h3>
        {character.aliases.length > 0 && (
          <p className="mt-1.5 text-[15px] italic text-navy-500">
            &ldquo;{character.aliases.slice(0, 2).join(", ")}&rdquo;
          </p>
        )}
      </div>

      {/* Stats with treasure-themed styling */}
      <div className="mb-6 flex justify-center gap-12">
        {mode === "daily" && streak !== undefined && (
          <div className="text-center">
            <div className="text-treasure text-4xl font-bold tracking-tight">
              {streak}
            </div>
            <div className="mt-1.5 text-xs font-bold uppercase tracking-wider text-navy-500">
              Streak
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="text-4xl font-bold tracking-tight text-navy-700">
            {guessCount}/6
          </div>
          <div className="mt-1.5 text-xs font-bold uppercase tracking-wider text-navy-500">
            Guesses
          </div>
        </div>
      </div>

      {/* Play again button (infinite mode only) */}
      {mode === "infinite" && onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="btn-primary w-full text-base font-bold"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Set Sail Again
        </button>
      )}
    </div>
  );
}
