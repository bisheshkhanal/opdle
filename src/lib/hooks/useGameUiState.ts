"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameControllerState } from "@/lib/hooks/useGameController";
import type { UserSettings } from "@/lib/settings";

export type CompassState = "idle" | "wrong-guess" | "correct-guess";

export interface GameUiState {
  // Modal visibility
  showStats: boolean;
  showBountyBoard: boolean;
  showLeaderboard: boolean;
  showAuthModal: boolean;
  showSettings: boolean;
  showHowToPlay: boolean;
  showArchive: boolean;
  showChallenges: boolean;

  // Compass animation
  compassState: CompassState;

  // Settings (pass-through from game controller)
  settings: UserSettings;
  handleSettingsChange: (newSettings: UserSettings) => void;

  // Modal open/close actions
  openStats: () => void;
  closeStats: () => void;
  openBountyBoard: () => void;
  closeBountyBoard: () => void;
  openLeaderboard: () => void;
  closeLeaderboard: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openHowToPlay: () => void;
  closeHowToPlay: () => void;
  openArchive: () => void;
  closeArchive: () => void;
  openChallenges: () => void;
  closeChallenges: () => void;
}

export function useGameUiState(game: GameControllerState): GameUiState {
  const {
    shouldShowOnboarding,
    guesses,
    isWon,
    settings,
    handleSettingsChange,
  } = game;

  const [showStats, setShowStats] = useState(false);
  const [showBountyBoard, setShowBountyBoard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  const [compassState, setCompassState] = useState<CompassState>("idle");
  const previousGuessCountRef = useRef(0);
  const previousIsWonRef = useRef(false);

  useEffect(() => {
    if (shouldShowOnboarding) {
      setShowHowToPlay(true);
    }
  }, [shouldShowOnboarding]);

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

  const closeHowToPlay = useCallback(() => {
    setShowHowToPlay(false);
    localStorage.setItem("onepiecedle_onboarded", "true");
  }, []);

  return {
    showStats,
    showBountyBoard,
    showLeaderboard,
    showAuthModal,
    showSettings,
    showHowToPlay,
    showArchive,
    compassState,
    settings,
    handleSettingsChange,
    openStats: useCallback(() => setShowStats(true), []),
    closeStats: useCallback(() => setShowStats(false), []),
    openBountyBoard: useCallback(() => setShowBountyBoard(true), []),
    closeBountyBoard: useCallback(() => setShowBountyBoard(false), []),
    openLeaderboard: useCallback(() => setShowLeaderboard(true), []),
    closeLeaderboard: useCallback(() => setShowLeaderboard(false), []),
    openAuthModal: useCallback(() => setShowAuthModal(true), []),
    closeAuthModal: useCallback(() => setShowAuthModal(false), []),
    openSettings: useCallback(() => setShowSettings(true), []),
    closeSettings: useCallback(() => setShowSettings(false), []),
    openHowToPlay: useCallback(() => setShowHowToPlay(true), []),
    closeHowToPlay,
    openArchive: useCallback(() => setShowArchive(true), []),
    closeArchive: useCallback(() => setShowArchive(false), []),
  };
}
