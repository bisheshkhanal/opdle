"use client";

import dynamic from "next/dynamic";
import type { Character, GameMode, Tier, GuessResult, DailyState } from "@/lib/types";
import type { UserSettings } from "@/lib/settings";
import { Autocomplete } from "@/components/Autocomplete";
import { GuessRow, GuessRowHeader } from "@/components/GuessRow";
import { HintImage } from "@/components/HintImage";
import { ResultsShare } from "@/components/ResultsShare";
import { AnswerReveal } from "@/components/AnswerReveal";
import { GameLegend } from "@/components/GameLegend";
import { HintButton } from "@/components/HintButton";
import { DailyComparison } from "@/components/DailyComparison";
import { getLocalCharacterImageUrl } from "@/lib/images";
import { getUTCDateString } from "@/lib/daily";
import { useCanvasEnabled } from "@/lib/hooks/useCanvasEnabled";

const CompassCanvas = dynamic(
  () => import("@/components/three/CompassCanvas"),
  { ssr: false }
);

const EmptyStateOrb = dynamic(
  () => import("@/components/three/EmptyStateOrb"),
  { ssr: false }
);

export interface GameBoardSectionProps {
  mode: GameMode;
  tier: Tier;
  targetCharacter: Character | null;
  dailyState: DailyState | null;
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  hintUsed: boolean;
  challengeMode: boolean;
  challengeLinkCopied: boolean;
  duplicateWarning: string | null;
  announcement: string;
  settings: UserSettings;
  countdown: { hours: number; minutes: number; seconds: number };
  wrongGuessCount: number;
  maxGuesses: number;
  characters: Character[];
  compassState: "idle" | "wrong-guess" | "correct-guess";
  handleGuess: (character: Character) => void;
  handlePlayAgain: () => void;
  handleHintUsed: () => void;
  handleChallengeShare: () => void;
  openAuthModal: () => void;
}

export function GameBoardSection({
  mode,
  tier,
  targetCharacter,
  dailyState,
  guesses,
  guessedIds,
  isFinished,
  isWon,
  hintUsed,
  challengeMode,
  challengeLinkCopied,
  duplicateWarning,
  announcement,
  settings,
  countdown,
  wrongGuessCount,
  maxGuesses,
  characters,
  compassState,
  handleGuess,
  handlePlayAgain,
  handleHintUsed,
  handleChallengeShare,
  openAuthModal,
}: GameBoardSectionProps) {
  const canvasEnabled = useCanvasEnabled();

  const hintImageUrl = targetCharacter
    ? targetCharacter.imageUrl || getLocalCharacterImageUrl(targetCharacter.id)
    : "";

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          {/* Game area */}
          <div className="w-full min-w-0 max-w-5xl">
            <div className="game-stage">
              <div className="stage-overlay" aria-hidden="true" />
              {challengeMode && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gold-100 px-4 py-2.5 text-sm font-medium text-navy-800 ring-1 ring-gold-300/50 dark:bg-gold-900/30 dark:text-gold-200 dark:ring-gold-500/30">
                  <span className="text-lg">🎯</span>
                  <span>
                    Challenge from a friend! Can you guess the character?
                  </span>
                </div>
              )}
              {canvasEnabled ? (
                <CompassCanvas
                  className="stage-compass text-navy-700 dark:text-slate-300"
                  gameState={compassState}
                />
              ) : (
                <svg
                  className="stage-compass text-navy-700 dark:text-slate-300"
                  viewBox="0 0 200 200"
                  aria-hidden="true"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M100 20L118 82L180 100L118 118L100 180L82 118L20 100L82 82Z"
                    fill="currentColor"
                  />
                  <path
                    d="M100 42L110 90L158 100L110 110L100 158L90 110L42 100L90 90Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
              {/* Input area */}
              {!isFinished && (
                <div className="relative !z-20 mb-8 flex flex-col items-center gap-4">
                  <Autocomplete
                    characters={characters}
                    guessedIds={guessedIds}
                    onSelect={handleGuess}
                    disabled={isFinished}
                  />
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="rounded-full border border-parchment-300/70 bg-parchment-100/70 px-3 py-1 font-pirate text-[12px] font-medium text-navy-600 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-300">
                      Guess {guesses.length + 1} of {maxGuesses}
                    </span>
                    {duplicateWarning && (
                      <span
                        className="animate-scale-in rounded-full bg-gold-100/80 px-3 py-1.5 text-sm font-medium text-gold-800 ring-1 ring-gold-200/50 dark:bg-amber-900/60 dark:text-amber-200 dark:ring-amber-700/50"
                        role="alert"
                      >
                        {duplicateWarning}
                      </span>
                    )}
                  </div>
                  <div aria-live="polite" className="sr-only">
                    {announcement}
                  </div>
                  {guesses.length >= 3 && targetCharacter && (
                    <HintButton
                      targetCharacter={targetCharacter}
                      hintUsed={hintUsed}
                      onHintUsed={handleHintUsed}
                    />
                  )}
                  {settings.progressiveHints && wrongGuessCount >= 3 && (
                    <HintImage
                      imageUrl={hintImageUrl}
                      wrongGuessCount={wrongGuessCount}
                      isEnabled={settings.progressiveHints}
                    />
                  )}
                </div>
              )}

              {/* Guess grid */}
              {guesses.length > 0 && (
                <div
                  className="game-card scrollbar-thin mb-7 overflow-x-auto p-3 md:p-4"
                  role="grid"
                  aria-label="Guess history"
                >
                  <GuessRowHeader />
                  <div className="mt-2 space-y-2" role="rowgroup">
                    {guesses.map((guess, index) => (
                      <GuessRow
                        key={`${guess.characterId}-${index}`}
                        guess={guess}
                        isLatest={index === guesses.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {isFinished && targetCharacter && (
                <div className="flex flex-col items-center gap-6">
                  <AnswerReveal
                    character={targetCharacter}
                    isWon={isWon}
                    guessCount={guesses.length}
                    mode={mode}
                    silhouetteReveal={settings.silhouetteReveal}
                    onPlayAgain={
                      mode === "infinite" ? handlePlayAgain : undefined
                    }
                    streak={mode === "daily" ? dailyState?.streak : undefined}
                  />
                  <ResultsShare
                    guesses={guesses}
                    mode={mode}
                    isWon={isWon}
                    dateString={
                      mode === "daily" ? getUTCDateString() : undefined
                    }
                    streak={mode === "daily" ? dailyState?.streak : undefined}
                    hintUsed={hintUsed}
                  />
                  {!challengeMode && (
                    <div className="flex w-full max-w-xs flex-col items-center gap-2">
                      <button
                        onClick={handleChallengeShare}
                        className="btn-secondary flex w-full items-center justify-center gap-2"
                        aria-live="polite"
                      >
                        <span>🎯</span>
                        <span>
                          {challengeLinkCopied
                            ? "Challenge link copied!"
                            : "Challenge a Friend"}
                        </span>
                      </button>
                    </div>
                  )}
                  {mode === "daily" && !challengeMode && (
                    <DailyComparison
                      date={getUTCDateString()}
                      tier={tier}
                      isWon={isWon}
                      guessCount={guesses.length}
                      onSignInClick={openAuthModal}
                    />
                  )}
                  {mode === "daily" && !challengeMode && (
                    <div className="game-card px-6 py-5 text-center">
                      <p className="text-sm font-medium text-navy-500 dark:text-slate-400">
                        Next puzzle in
                      </p>
                      <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-navy-800 dark:text-slate-100">
                        {String(countdown.hours).padStart(2, "0")}:
                        {String(countdown.minutes).padStart(2, "0")}:
                        {String(countdown.seconds).padStart(2, "0")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {guesses.length === 0 && !isFinished && (
                <div className="game-card mx-auto max-w-lg p-7 text-center sm:p-8">
                  {canvasEnabled ? (
                    <EmptyStateOrb className="mb-5" />
                  ) : (
                    <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-100/70 ring-1 ring-navy-200/40 dark:bg-slate-700/70 dark:ring-slate-600/40">
                      <svg
                        className="h-8 w-8 text-navy-600 dark:text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  )}
                  <h2 className="mb-2.5 font-pirate text-xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 sm:text-2xl">
                    Start typing a character name
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-slate-400 sm:text-[15px]">
                    Each guess reveals clues about the mystery character
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tile-correct/10 px-3 py-1.5 text-xs font-medium text-tile-correct ring-1 ring-tile-correct/20 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-700/40">
                      <span className="h-2 w-2 rounded-full bg-tile-correct dark:bg-green-400" />
                      Correct
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tile-partial/10 px-3 py-1.5 text-xs font-medium text-tile-partial ring-1 ring-tile-partial/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/40">
                      <span className="h-2 w-2 rounded-full bg-tile-partial dark:bg-amber-400" />
                      Partial
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tile-wrong/10 px-3 py-1.5 text-xs font-medium text-tile-wrong ring-1 ring-tile-wrong/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/40">
                      <span className="h-2 w-2 rounded-full bg-tile-wrong dark:bg-red-400" />
                      Wrong
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100/70 px-3 py-1.5 text-xs font-medium text-navy-600 ring-1 ring-navy-200/40 dark:bg-slate-700/70 dark:text-slate-300 dark:ring-slate-600/40">
                      <span>↑↓</span>
                      Higher/Lower
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend - Desktop only */}
          <GameLegend />
        </div>
      </div>
    </div>
  );
}
