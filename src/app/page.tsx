"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  Character,
  GameMode,
  GuessResult,
  DailyState,
  InfiniteState,
} from "@/lib/types";
import { validateCharacter } from "@/lib/types";
import { normalizeCharacterImage } from "@/lib/images";
import { ModeTabs } from "@/components/ModeTabs";
import { Autocomplete } from "@/components/Autocomplete";
import { GuessRow, GuessRowHeader } from "@/components/GuessRow";
import { ResultsShare } from "@/components/ResultsShare";
import { AnswerReveal } from "@/components/AnswerReveal";
import { GameLegend } from "@/components/GameLegend";
import { ThemeToggle } from "@/components/ThemeToggle";
import { evaluateGuess } from "@/lib/evaluateGuess";
import {
  selectDailyCharacter,
  getUTCDateString,
  getTimeUntilReset,
  getDailyGameNumber,
} from "@/lib/daily";
import { selectInfiniteCharacter } from "@/lib/infinite";
import {
  getDailyState,
  addDailyGuess,
  getInfiniteState,
  addInfiniteGuess,
  startNewInfiniteRound,
  isDailyDuplicate,
  isInfiniteDuplicate,
} from "@/lib/storage";
import charactersData from "@/data/characters.v2.json";

// Validate and type characters
const characters: Character[] = (charactersData as unknown[])
  .filter(validateCharacter)
  .map((character) => normalizeCharacterImage(character)) as Character[];

const MAX_GUESSES = 6;

export default function Home() {
  const [mode, setMode] = useState<GameMode>("daily");
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [infiniteState, setInfiniteState] = useState<InfiniteState | null>(
    null
  );
  const [targetCharacter, setTargetCharacter] = useState<Character | null>(
    null
  );
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Initialize game state
  useEffect(() => {
    const dateString = getUTCDateString();
    const daily = getDailyState(dateString);
    const infinite = getInfiniteState();

    setDailyState(daily);
    setInfiniteState(infinite);
    setIsLoaded(true);
  }, []);

  // Update target character when mode changes or game is initialized
  useEffect(() => {
    if (!isLoaded) return;

    if (mode === "daily") {
      const target = selectDailyCharacter(characters);
      setTargetCharacter(target);
    } else if (infiniteState) {
      const target = selectInfiniteCharacter(characters, infiniteState.roundId);
      setTargetCharacter(target);
    }
  }, [mode, isLoaded, infiniteState]);

  // Countdown timer for daily mode
  useEffect(() => {
    if (mode !== "daily") return;

    const updateCountdown = () => {
      setCountdown(getTimeUntilReset());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const currentState = mode === "daily" ? dailyState : infiniteState;
  const guesses = currentState?.guesses || [];
  const guessedIds = currentState?.guessedIds || [];
  const isFinished = currentState?.isFinished || false;
  const isWon = currentState?.isWon || false;

  const handleGuess = useCallback(
    (character: Character) => {
      if (!targetCharacter || isFinished) return;

      // Check for duplicate
      const isDuplicate =
        mode === "daily"
          ? isDailyDuplicate(character.id)
          : isInfiniteDuplicate(character.id);

      if (isDuplicate) {
        setDuplicateWarning(`You already guessed ${character.name}!`);
        setTimeout(() => setDuplicateWarning(null), 3000);
        return;
      }

      const result = evaluateGuess(character, targetCharacter);

      if (mode === "daily") {
        const newState = addDailyGuess(result);
        setDailyState(newState);
      } else {
        const newState = addInfiniteGuess(result);
        setInfiniteState(newState);
      }
    },
    [targetCharacter, isFinished, mode]
  );

  const handlePlayAgain = useCallback(() => {
    const newState = startNewInfiniteRound();
    setInfiniteState(newState);
  }, []);

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setDuplicateWarning(null);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-navy-500">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-parchment-300/40 bg-gradient-to-b from-parchment-50/95 via-parchment-100/90 to-parchment-100/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 sm:py-10">
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full border border-parchment-300/60 bg-parchment-50/70 px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-navy-600 shadow-soft dark:border-slate-600/60 dark:bg-slate-800/70 dark:text-slate-300">
            Treasure Log
          </div>
          <h1 className="mb-3 font-display text-4xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 sm:text-5xl">
            <span className="text-tile-wrong dark:text-red-400">One</span>
            <span className="text-navy-700 dark:text-slate-200">Piece</span>
            <span className="text-gold-600 dark:text-gold-400">dle</span>
          </h1>
          <div className="mb-4 h-0.5 w-32 rounded-full bg-gradient-to-r from-gold-400/80 via-gold-300/40 to-transparent dark:from-gold-500/60 dark:via-gold-400/30 dark:to-transparent" />
          <p className="mb-6 text-sm text-navy-500 dark:text-slate-400 sm:text-[15px]">
            Guess the character in {MAX_GUESSES} tries
            {mode === "daily" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-navy-100/70 px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-200/50 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600/50">
                #{getDailyGameNumber()}
              </span>
            )}
          </p>
          <ModeTabs mode={mode} onModeChange={handleModeChange} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            {/* Game area */}
            <div className="w-full max-w-5xl">
              <div className="game-stage">
                <div className="stage-overlay" aria-hidden="true" />
                <svg
                  className="stage-compass text-navy-700 dark:text-slate-500"
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
                      <span className="rounded-full border border-parchment-300/70 bg-parchment-100/70 px-3 py-1 text-[12px] font-medium text-navy-600 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-300">
                        Guess {guesses.length + 1} of {MAX_GUESSES}
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
                    />
                    {mode === "daily" && (
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
                    <h2 className="mb-2.5 font-display text-xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 sm:text-2xl">
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

      {/* Footer */}
      <footer className="border-t border-parchment-300/40 bg-gradient-to-t from-parchment-100/95 via-parchment-100/90 to-parchment-50/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-t dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2.5 px-4 py-6 text-center text-sm text-navy-500 dark:text-slate-400 sm:flex-row sm:justify-between">
          <Link
            href="/about"
            className="font-medium text-navy-600 underline-offset-2 transition-all hover:text-navy-800 hover:underline dark:text-slate-300 dark:hover:text-slate-100"
          >
            About / How to Play
          </Link>
          {mode === "infinite" && infiniteState && (
            <span className="text-xs font-medium sm:text-sm">
              Infinite Stats: {infiniteState.totalWins}W /{" "}
              {infiniteState.totalGames}G
            </span>
          )}
        </div>
      </footer>
    </main>
  );
}
