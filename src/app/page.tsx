"use client";

import Link from "next/link";
import type { Character } from "@/lib/types";
import { validateCharacter } from "@/lib/types";
import { normalizeCharacterImage } from "@/lib/images";
import { GamePageHeader } from "@/components/GamePageHeader";
import { GameBoardSection } from "@/components/GameBoardSection";
import { GameModalRegistry } from "@/components/GameModalRegistry";
import { useGameController } from "@/lib/hooks/useGameController";
import { useGameUiState } from "@/lib/hooks/useGameUiState";
import charactersData from "@/data/characters.v2.json";

const characters: Character[] = (charactersData as unknown[])
  .filter(validateCharacter)
  .map((character) => normalizeCharacterImage(character)) as Character[];

export default function Home() {
  const game = useGameController();
  const ui = useGameUiState(game);

  const {
    mode,
    tier,
    targetCharacter,
    dailyState,
    infiniteState,
    guesses,
    guessedIds,
    isFinished,
    isWon,
    isLoaded,
    hintUsed,
    challengeMode,
    challengeLinkCopied,
    duplicateWarning,
    announcement,
    settings,
    countdown,
    discoveredIds,
    dailyStats,
    infiniteStats,
    characterCounts,
    wrongGuessCount,
    maxGuesses: MAX_GUESSES,
    handleGuess,
    handlePlayAgain,
    handleHintUsed,
    handleChallengeShare,
    handleSettingsChange,
    handleTierChange,
    handleModeChange,
  } = game;

  const {
    showStats,
    showBountyBoard,
    showLeaderboard,
    showAuthModal,
    showSettings,
    showHowToPlay,
    showArchive,
    compassState,
    openStats,
    closeStats,
    openBountyBoard,
    closeBountyBoard,
    openLeaderboard,
    closeLeaderboard,
    openAuthModal,
    closeAuthModal,
    openSettings,
    closeSettings,
    openHowToPlay,
    closeHowToPlay,
    openArchive,
    closeArchive,
  } = ui;

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
      <GamePageHeader
        mode={mode}
        tier={tier}
        challengeMode={challengeMode}
        maxGuesses={MAX_GUESSES}
        characterCounts={characterCounts}
        onModeChange={handleModeChange}
        onTierChange={handleTierChange}
        onOpenArchive={openArchive}
        onOpenSettings={openSettings}
        onOpenHowToPlay={openHowToPlay}
        onOpenLeaderboard={openLeaderboard}
        onOpenBountyBoard={openBountyBoard}
        onOpenStats={openStats}
        onSignInClick={openAuthModal}
      />

      {/* Main content */}
      <GameBoardSection
        mode={mode}
        tier={tier}
        targetCharacter={targetCharacter}
        dailyState={dailyState}
        guesses={guesses}
        guessedIds={guessedIds}
        isFinished={isFinished}
        isWon={isWon}
        hintUsed={hintUsed}
        challengeMode={challengeMode}
        challengeLinkCopied={challengeLinkCopied}
        duplicateWarning={duplicateWarning}
        announcement={announcement}
        settings={settings}
        countdown={countdown}
        wrongGuessCount={wrongGuessCount}
        maxGuesses={MAX_GUESSES}
        characters={characters}
        compassState={compassState}
        handleGuess={handleGuess}
        handlePlayAgain={handlePlayAgain}
        handleHintUsed={handleHintUsed}
        handleChallengeShare={handleChallengeShare}
        openAuthModal={openAuthModal}
      />

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

      <GameModalRegistry
        tier={tier}
        mode={mode}
        dailyStats={dailyStats}
        infiniteStats={infiniteStats}
        discoveredIds={discoveredIds}
        settings={settings}
        characters={characters}
        handleSettingsChange={handleSettingsChange}
        showLeaderboard={showLeaderboard}
        closeLeaderboard={closeLeaderboard}
        showStats={showStats}
        closeStats={closeStats}
        showBountyBoard={showBountyBoard}
        closeBountyBoard={closeBountyBoard}
        showSettings={showSettings}
        closeSettings={closeSettings}
        showAuthModal={showAuthModal}
        closeAuthModal={closeAuthModal}
        showHowToPlay={showHowToPlay}
        closeHowToPlay={closeHowToPlay}
        showArchive={showArchive}
        closeArchive={closeArchive}
      />
    </main>
  );
}
