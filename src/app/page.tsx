"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type {
  Character,
  GameMode,
  DailyState,
  InfiniteState,
  Tier,
  GuessResult,
} from "@/lib/types";
import { validateCharacter } from "@/lib/types";
import {
  getLocalCharacterImageUrl,
  normalizeCharacterImage,
} from "@/lib/images";
import { ModeTabs } from "@/components/ModeTabs";
import { TierTabs } from "@/components/TierTabs";
import { Autocomplete } from "@/components/Autocomplete";
import { GuessRow, GuessRowHeader } from "@/components/GuessRow";
import { HintImage } from "@/components/HintImage";
import { ResultsShare } from "@/components/ResultsShare";
import { AnswerReveal } from "@/components/AnswerReveal";
import { GameLegend } from "@/components/GameLegend";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Modal } from "@/components/Modal";
import { BountyBoard } from "@/components/BountyBoard";
import { StatsModal } from "@/components/StatsModal";
import { HintButton } from "@/components/HintButton";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { Leaderboard } from "@/components/Leaderboard";
import { DailyComparison } from "@/components/DailyComparison";
import { SettingsModal } from "@/components/SettingsModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { ArchiveModal } from "@/components/ArchiveModal";
import { loadSettings } from "@/lib/settings";
import type { UserSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { evaluateGuess } from "@/lib/evaluateGuess";
import { getCharactersForTier } from "@/lib/tier";
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
  getSelectedTier,
  setSelectedTier,
  getDailyStats,
  getInfiniteStats,
  getAllDiscoveredIds,
  markHintUsed,
} from "@/lib/storage";
import { useAuthSync } from "@/lib/hooks/useAuthSync";
import { useCanvasEnabled } from "@/lib/hooks/useCanvasEnabled";
import charactersData from "@/data/characters.v2.json";

// Validate and type characters
const characters: Character[] = (charactersData as unknown[])
  .filter(validateCharacter)
  .map((character) => normalizeCharacterImage(character)) as Character[];

const MAX_GUESSES = 6;

const CompassCanvas = dynamic(
  () => import("@/components/three/CompassCanvas"),
  {
    ssr: false,
  }
);

const EmptyStateOrb = dynamic(
  () => import("@/components/three/EmptyStateOrb"),
  {
    ssr: false,
  }
);

function generateGuessAnnouncement(
  guessNumber: number,
  totalGuesses: number,
  result: GuessResult
): string {
  const correct = result.categories.filter(
    (c) => c.status === "correct"
  ).length;
  const partial = result.categories.filter(
    (c) => c.status === "partial"
  ).length;
  const wrong = result.categories.filter((c) => c.status === "wrong").length;
  const arrows = result.categories
    .filter((c) => c.status === "higher" || c.status === "lower")
    .map((c) => `${c.label}: ${c.status}`)
    .join(". ");

  let text = `Guess ${guessNumber} of ${totalGuesses}: ${correct} correct, ${partial} partial, ${wrong} wrong.`;
  if (arrows) text += ` ${arrows}.`;
  return text;
}

export default function Home() {
  const [mode, setMode] = useState<GameMode>("daily");
  const [tier, setTier] = useState<Tier>("casual");
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
  const [announcement, setAnnouncement] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showBountyBoard, setShowBountyBoard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [hintUsed, setHintUsedState] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [compassState, setCompassState] = useState<
    "idle" | "wrong-guess" | "correct-guess"
  >("idle");
  const previousGuessCountRef = useRef(0);
  const previousIsWonRef = useRef(false);
  const canvasEnabled = useCanvasEnabled();
  const { syncDailyResult } = useAuthSync();

  const { dailyStats, infiniteStats } = useMemo(() => {
    return {
      dailyStats: getDailyStats(tier),
      infiniteStats: getInfiniteStats(tier),
    };
  }, [tier]);

  const discoveredIds = useMemo(() => {
    void dailyState;
    void infiniteState;
    return getAllDiscoveredIds();
  }, [dailyState, infiniteState]);

  const characterCounts = useMemo(() => {
    const counts: Record<Tier, number> = { casual: 0, fan: 0, nakama: 0 };

    counts.casual = characters.filter((c) => c.minTier === "casual").length;
    counts.fan = characters.filter(
      (c) => c.minTier === "casual" || c.minTier === "fan"
    ).length;
    counts.nakama = characters.length;

    return counts;
  }, []);

  // Initialize game state
  useEffect(() => {
    const storedTier = getSelectedTier();
    setTier(storedTier);

    const dateString = getUTCDateString();
    const daily = getDailyState(storedTier, dateString);
    const infinite = getInfiniteState(storedTier);

    setDailyState(daily);
    setInfiniteState(infinite);
    setHintUsedState(daily.hintUsed || false);
    setSettings(loadSettings());
    setIsLoaded(true);

    const onboarded = localStorage.getItem("onepiecedle_onboarded");
    if (!onboarded) {
      setShowHowToPlay(true);
    }
  }, []);

  // Update target character when mode or tier changes
  useEffect(() => {
    if (!isLoaded) return;

    const tierCharacters = getCharactersForTier(characters, tier);

    if (mode === "daily") {
      const target = selectDailyCharacter(tierCharacters, undefined, tier);
      setTargetCharacter(target);
    } else if (infiniteState) {
      const target = selectInfiniteCharacter(
        tierCharacters,
        infiniteState.roundId
      );
      setTargetCharacter(target);
    }
  }, [mode, tier, isLoaded, infiniteState]);

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
  const wrongGuessCount = guesses.filter((guess) => !guess.isCorrect).length;
  const hintImageUrl = targetCharacter
    ? targetCharacter.imageUrl || getLocalCharacterImageUrl(targetCharacter.id)
    : "";

  useEffect(() => {
    if (isWon && !previousIsWonRef.current) {
      setCompassState("correct-guess");
    } else if (guesses.length > previousGuessCountRef.current) {
      setCompassState("wrong-guess");
    }

    previousGuessCountRef.current = guesses.length;
    previousIsWonRef.current = isWon;
  }, [guesses.length, isWon]);

  useEffect(() => {
    if (compassState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCompassState("idle");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [compassState]);

  const handleGuess = useCallback(
    (character: Character) => {
      if (!targetCharacter || isFinished) return;

      const isDuplicate =
        mode === "daily"
          ? isDailyDuplicate(character.id, tier)
          : isInfiniteDuplicate(character.id, tier);

      if (isDuplicate) {
        setDuplicateWarning(`You already guessed ${character.name}!`);
        setTimeout(() => setDuplicateWarning(null), 3000);
        return;
      }

      const result = evaluateGuess(character, targetCharacter);

      const guessNumber =
        mode === "daily"
          ? (dailyState?.guesses?.length ?? 0) + 1
          : (infiniteState?.guesses?.length ?? 0) + 1;

      setAnnouncement(
        generateGuessAnnouncement(guessNumber, MAX_GUESSES, result)
      );

      if (mode === "daily") {
        const newState = addDailyGuess(result, tier);
        setDailyState(newState);

        if (newState.isFinished) {
          syncDailyResult({
            date: getUTCDateString(),
            tier,
            guessCount: newState.guesses.length,
            isWon: newState.isWon,
            hintUsed: newState.hintUsed ?? false,
          });
          setTimeout(() => {
            setAnnouncement(
              newState.isWon
                ? `Victory! The answer was ${targetCharacter.name}!`
                : `Defeated. The answer was ${targetCharacter.name}.`
            );
          }, 1500);
        }
      } else {
        const newState = addInfiniteGuess(result, tier);
        setInfiniteState(newState);
        if (newState.isFinished) {
          setTimeout(() => {
            setAnnouncement(
              newState.isWon
                ? `Victory! The answer was ${targetCharacter.name}!`
                : `Defeated. The answer was ${targetCharacter.name}.`
            );
          }, 1500);
        }
      }
    },
    [
      targetCharacter,
      isFinished,
      mode,
      syncDailyResult,
      tier,
      dailyState?.guesses?.length,
      infiniteState?.guesses?.length,
    ]
  );

  const handlePlayAgain = useCallback(() => {
    const newState = startNewInfiniteRound(tier);
    setInfiniteState(newState);
    setHintUsedState(false);
  }, [tier]);

  const handleHintUsed = useCallback(() => {
    markHintUsed(tier, mode, mode === "daily" ? getUTCDateString() : undefined);
    setHintUsedState(true);
  }, [tier, mode]);

  const handleSettingsChange = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, []);

  const handleHowToPlayClose = useCallback(() => {
    setShowHowToPlay(false);
    localStorage.setItem("onepiecedle_onboarded", "true");
  }, []);

  const handleTierChange = useCallback(
    (newTier: Tier) => {
      setSelectedTier(newTier);
      setTier(newTier);
      setDuplicateWarning(null);

      const dateString = getUTCDateString();
      const daily = getDailyState(newTier, dateString);
      const infinite = getInfiniteState(newTier);
      setDailyState(daily);
      setInfiniteState(infinite);

      const currentHintUsed =
        mode === "daily" ? daily.hintUsed || false : infinite.hintUsed || false;
      setHintUsedState(currentHintUsed);
    },
    [mode]
  );

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setDuplicateWarning(null);

    const dateString = getUTCDateString();
    const daily = getDailyState(tier, dateString);
    const infinite = getInfiniteState(tier);
    setDailyState(daily);
    setInfiniteState(infinite);

    const currentHintUsed =
      newMode === "daily"
        ? daily.hintUsed || false
        : infinite.hintUsed || false;
    setHintUsedState(currentHintUsed);
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
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-5 sm:py-7">
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
            <button
              onClick={() => setShowArchive(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Archive"
              title="Archive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 2v20l4-3 4 3 4-3 4 3V2H4z" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="13" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Settings"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="How to Play"
              title="How to Play"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Leaderboard"
              title="Leaderboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-4"></path>
              </svg>
            </button>
            <button
              onClick={() => setShowBountyBoard(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Bounty Board"
              title="Bounty Board"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Show statistics"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </button>
            <UserMenu onSignInClick={() => setShowAuthModal(true)} />
            <ThemeToggle />
          </div>
          <h1 className="mb-3 font-display text-4xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 sm:text-5xl">
            <span className="text-tile-wrong dark:text-red-400">One</span>
            <span className="text-navy-700 dark:text-slate-200">Piece</span>
            <span className="text-gold-600 dark:text-gold-400">dle</span>
          </h1>
          <div className="mb-3 h-0.5 w-32 rounded-full bg-gradient-to-r from-gold-400/80 via-gold-300/40 to-transparent dark:from-gold-500/60 dark:via-gold-400/30 dark:to-transparent" />
          <p className="mb-4 text-sm text-navy-500 dark:text-slate-400 sm:text-[15px]">
            Guess the character in {MAX_GUESSES} tries
            {mode === "daily" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-navy-100/70 px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-200/50 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600/50">
                #{getDailyGameNumber()}
              </span>
            )}
          </p>
          <ModeTabs mode={mode} onModeChange={handleModeChange} />
          <div className="mt-3">
            <TierTabs
              tier={tier}
              onTierChange={handleTierChange}
              characterCounts={characterCounts}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            {/* Game area */}
            <div className="w-full min-w-0 max-w-5xl">
              <div className="game-stage">
                <div className="stage-overlay" aria-hidden="true" />
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
                    {mode === "daily" && (
                      <DailyComparison
                        date={getUTCDateString()}
                        tier={tier}
                        isWon={isWon}
                        guessCount={guesses.length}
                        onSignInClick={() => setShowAuthModal(true)}
                      />
                    )}
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

      {/* Footer */}
      <footer className="border-t border-parchment-300/40 bg-gradient-to-t from-parchment-100/95 via-parchment-100/90 to-parchment-50/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-t dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2.5 px-4 py-6 text-center text-sm text-navy-500 dark:text-slate-400 sm:flex-row sm:justify-between">
          <div className="sm:flex-1 sm:text-left">
            <Link
              href="/about"
              className="font-medium text-navy-600 underline-offset-2 transition-all hover:text-navy-800 hover:underline dark:text-slate-300 dark:hover:text-slate-100"
            >
              About / How to Play
            </Link>
          </div>
          <span className="font-pirate text-lg text-navy-700 dark:text-slate-300 sm:flex-none">
            Set sail across the Grand Line
          </span>
          <div className="sm:flex-1 sm:text-right">
            {mode === "infinite" && infiniteState && (
              <span className="text-xs font-medium sm:text-sm">
                Infinite Stats: {infiniteState.totalWins}W /{" "}
                {infiniteState.totalGames}G
              </span>
            )}
          </div>
        </div>
      </footer>

      <Modal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title="Leaderboard"
      >
        <Leaderboard />
      </Modal>

      <Modal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title="Statistics"
      >
        <StatsModal
          dailyStats={dailyStats}
          infiniteStats={infiniteStats}
          tier={tier}
          mode={mode}
        />
      </Modal>

      <Modal
        isOpen={showBountyBoard}
        onClose={() => setShowBountyBoard(false)}
        title="Bounty Board"
        maxWidth="5xl"
      >
        <BountyBoard characters={characters} discoveredIds={discoveredIds} />
      </Modal>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <HowToPlayModal isOpen={showHowToPlay} onClose={handleHowToPlayClose} />

      <ArchiveModal
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        characters={characters}
        tier={tier}
      />
    </main>
  );
}
