"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Character, Ruleset } from "@/lib/types";
import { validateCharacter } from "@/lib/types";
import { normalizeCharacterImage } from "@/lib/images";
import { updateSetting } from "@/lib/settings";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GamePageHeader } from "@/components/GamePageHeader";
import { AnswerReveal } from "@/components/AnswerReveal";
import { ResultsShare } from "@/components/ResultsShare";
import { getUTCDateString } from "@/lib/daily";
import { GameBoardSection } from "@/components/GameBoardSection";
import { SilhouetteBoard } from "@/components/SilhouetteBoard";
import { WantedBoard } from "@/components/WantedBoard";
import { QuoteBoard } from "@/components/QuoteBoard";
import { ArcBoard } from "@/components/ArcBoard";
import type { SilhouetteState } from "@/lib/silhouette";
import type { WantedState } from "@/lib/wanted";
import type { QuoteState } from "@/lib/quote";
import type { ArcState } from "@/lib/arc";
import { GameModalRegistry } from "@/components/GameModalRegistry";
import { useGameController } from "@/lib/hooks/useGameController";
import { useGameUiState } from "@/lib/hooks/useGameUiState";
import { useRulesetGame } from "@/lib/hooks/useRulesetGame";
import { useFourSeasGame } from "@/lib/hooks/useFourSeasGame";
import { FourSeasBoard } from "@/components/FourSeasBoard";
import {
  isFourSeasWon,
  isFourSeasFinished,
  getFourSeasTotalGuesses,
} from "@/lib/fourSeas";
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
  const [activeRuleset, setActiveRuleset] = useState<Ruleset>("classic");
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }

    return navigator.onLine;
  });
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] =
    useState(false);

  useEffect(() => {
    const syncOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      setIsOfflineBannerDismissed(false);
    }
  }, [isOnline]);

  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(
    null
  );
  const prevDailyWonRef = useRef<boolean | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const currentIsDailyWon = mode === "daily" && isWon;

    if (prevDailyWonRef.current === null) {
      prevDailyWonRef.current = currentIsDailyWon;
      return;
    }

    if (currentIsDailyWon && !prevDailyWonRef.current) {
      const newSettings = updateSetting("installPrompt", {
        ...settings.installPrompt,
        completedDailiesCount: settings.installPrompt.completedDailiesCount + 1,
      });
      handleSettingsChange(newSettings);
    }

    prevDailyWonRef.current = currentIsDailyWon;
  }, [isLoaded, mode, isWon, settings.installPrompt, handleSettingsChange]);

  const showOfflineBanner =
    game.mode === "infinite" && !isOnline && !isOfflineBannerDismissed;

  const rulesetGame = useRulesetGame(
    activeRuleset === "classic" || activeRuleset === "four-seas"
      ? "silhouette"
      : activeRuleset,
    game.challengeMode ? "challenge" : game.mode,
    game.tier,
    characters
  );

  const fourSeasGame = useFourSeasGame(
    game.challengeMode ? "challenge" : game.mode,
    game.tier,
    characters
  );

  const {
    showStats,
    showBountyBoard,
    showLeaderboard,
    showAuthModal,
    showSettings,
    showHowToPlay,
    showArchive,
    showChallenges,
    openChallenges,
    closeChallenges,
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
        activeRuleset={activeRuleset}
        challengeMode={challengeMode}
        maxGuesses={MAX_GUESSES}
        characterCounts={characterCounts}
        onModeChange={handleModeChange}
        onTierChange={handleTierChange}
        onRulesetChange={setActiveRuleset}
        onOpenArchive={openArchive}
        onOpenSettings={openSettings}
        onOpenHowToPlay={openHowToPlay}
        onOpenChallenges={openChallenges}
        onOpenLeaderboard={openLeaderboard}
        onOpenBountyBoard={openBountyBoard}
        onOpenStats={openStats}
        onSignInClick={openAuthModal}
      />

      {showOfflineBanner && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4">
          <div
            className="flex items-start justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-100/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/70 dark:text-amber-100"
            role="status"
            aria-live="polite"
          >
            <p className="leading-6">
              You&apos;re offline — infinite mode available, daily results
              require connection.
            </p>
            <button
              type="button"
              className="rounded-full p-1 text-amber-900 transition hover:bg-amber-200/70 dark:text-amber-100 dark:hover:bg-amber-900/70"
              aria-label="Dismiss offline notice"
              onClick={() => setIsOfflineBannerDismissed(true)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      {(activeRuleset === "classic" || challengeMode) && (
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
      )}
      {activeRuleset !== "classic" &&
        activeRuleset !== "four-seas" &&
        !challengeMode &&
        rulesetGame.state &&
        rulesetGame.targetCharacter && (
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-8 sm:py-10">
            {activeRuleset === "silhouette" && (
              <SilhouetteBoard
                targetCharacter={rulesetGame.targetCharacter}
                allCharacters={characters}
                state={rulesetGame.state as SilhouetteState}
                onGuess={rulesetGame.handleGuess}
              />
            )}
            {activeRuleset === "wanted" && (
              <WantedBoard
                targetCharacter={rulesetGame.targetCharacter}
                allCharacters={characters}
                state={rulesetGame.state as WantedState}
                onGuess={rulesetGame.handleGuess}
              />
            )}
            {activeRuleset === "quote" && (
              <QuoteBoard
                targetCharacter={rulesetGame.targetCharacter}
                allCharacters={characters}
                state={rulesetGame.state as QuoteState}
                onGuess={rulesetGame.handleGuess}
              />
            )}
            {activeRuleset === "arc" && (
              <ArcBoard
                targetCharacter={rulesetGame.targetCharacter}
                allCharacters={characters}
                state={rulesetGame.state as ArcState}
                onGuess={rulesetGame.handleGuess}
              />
            )}

            {rulesetGame.state.isFinished && (
              <div className="mt-8 flex flex-col items-center gap-6">
                <AnswerReveal
                  character={rulesetGame.targetCharacter}
                  isWon={rulesetGame.state.isWon}
                  guessCount={rulesetGame.state.guesses.length}
                  mode={mode}
                  silhouetteReveal={settings.silhouetteReveal}
                  onPlayAgain={
                    mode === "infinite" ? handlePlayAgain : undefined
                  }
                  streak={mode === "daily" ? dailyState?.streak : undefined}
                  ruleset={activeRuleset}
                />
                <ResultsShare
                  guesses={rulesetGame.state.guesses}
                  mode={mode}
                  isWon={rulesetGame.state.isWon}
                  dateString={mode === "daily" ? getUTCDateString() : undefined}
                  streak={mode === "daily" ? dailyState?.streak : undefined}
                  hintUsed={false}
                  ruleset={activeRuleset}
                  target={rulesetGame.targetCharacter || undefined}
                  challengeMode={challengeMode}
                />
              </div>
            )}
          </div>
        )}

      {activeRuleset === "four-seas" &&
        !challengeMode &&
        fourSeasGame.fourSeasState && (
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-8 sm:py-10">
            <FourSeasBoard
              targetCharacters={fourSeasGame.targetCharacters}
              allCharacters={characters}
              state={fourSeasGame.fourSeasState}
              onGuess={fourSeasGame.handleFourSeasGuess}
            />

            {isFourSeasFinished(fourSeasGame.fourSeasState) && (
              <div className="mt-8 flex flex-col items-center gap-6">
                <AnswerReveal
                  character={
                    fourSeasGame.targetCharacters[
                      fourSeasGame.fourSeasState.boards["north"]
                        .targetCharacterId
                    ]
                  }
                  isWon={isFourSeasWon(fourSeasGame.fourSeasState)}
                  guessCount={getFourSeasTotalGuesses(
                    fourSeasGame.fourSeasState
                  )}
                  mode={mode}
                  silhouetteReveal={settings.silhouetteReveal}
                  onPlayAgain={
                    mode === "infinite" ? handlePlayAgain : undefined
                  }
                  streak={undefined}
                  ruleset={activeRuleset}
                />
                <ResultsShare
                  guesses={[]}
                  mode={mode}
                  isWon={isFourSeasWon(fourSeasGame.fourSeasState)}
                  dateString={mode === "daily" ? getUTCDateString() : undefined}
                  streak={undefined}
                  hintUsed={false}
                  ruleset={activeRuleset}
                  target={
                    fourSeasGame.targetCharacters[
                      fourSeasGame.fourSeasState.boards["north"]
                        .targetCharacterId
                    ]
                  }
                  challengeMode={challengeMode}
                />
              </div>
            )}
          </div>
        )}

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
        openAuthModal={openAuthModal}
        closeAuthModal={closeAuthModal}
        showHowToPlay={showHowToPlay}
        closeHowToPlay={closeHowToPlay}
        showArchive={showArchive}
        closeArchive={closeArchive}
        showChallenges={showChallenges}
        closeChallenges={closeChallenges}
      />
      <InstallPrompt
        settings={settings}
        onSettingsChange={handleSettingsChange}
        installPromptEvent={installPromptEvent}
      />
    </main>
  );
}
