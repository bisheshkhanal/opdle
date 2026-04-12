"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Character,
  GameMode,
  DailyState,
  InfiniteState,
  Tier,
  GuessResult,
  DailyStats,
  InfiniteStats,
} from "@/lib/types";
import { validateCharacter } from "@/lib/types";
import { normalizeCharacterImage } from "@/lib/images";
import { evaluateGuess } from "@/lib/evaluateGuess";
import { getCharactersForTier } from "@/lib/tier";
import {
  selectDailyCharacter,
  getUTCDateString,
  getTimeUntilReset,
  getDailyGameNumber,
} from "@/lib/daily";
import { selectInfiniteCharacter } from "@/lib/infinite";
import { copyToClipboard } from "@/lib/share";
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
import { loadSettings } from "@/lib/settings";
import type { UserSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { encodeChallengeSeed, decodeChallengeSeed } from "@/lib/challengeUtils";
import { useAuthSync } from "@/lib/hooks/useAuthSync";
import charactersData from "@/data/characters.v2.json";

const MAX_GUESSES = 6;

const characters: Character[] = (charactersData as unknown[])
  .filter(validateCharacter)
  .map((character) => normalizeCharacterImage(character)) as Character[];

export interface GameControllerState {
  mode: GameMode;
  tier: Tier;
  targetCharacter: Character | null;
  dailyState: DailyState | null;
  infiniteState: InfiniteState | null;
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  isLoaded: boolean;
  hintUsed: boolean;
  challengeMode: boolean;
  challengeLinkCopied: boolean;
  duplicateWarning: string | null;
  announcement: string;
  settings: UserSettings;
  countdown: { hours: number; minutes: number; seconds: number };
  discoveredIds: string[];
  dailyStats: DailyStats;
  infiniteStats: InfiniteStats;
  characterCounts: Record<Tier, number>;
  wrongGuessCount: number;
  maxGuesses: number;
  shouldShowOnboarding: boolean;
  // Actions
  handleGuess: (character: Character) => void;
  handlePlayAgain: () => void;
  handleHintUsed: () => void;
  handleChallengeShare: () => Promise<void>;
  handleSettingsChange: (newSettings: UserSettings) => void;
  handleTierChange: (newTier: Tier) => void;
  handleModeChange: (newMode: GameMode) => void;
}

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

export function useGameController(): GameControllerState {
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
  const [hintUsed, setHintUsedState] = useState(false);
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeGuesses, setChallengeGuesses] = useState<GuessResult[]>([]);
  const [challengeGuessedIds, setChallengeGuessedIds] = useState<string[]>([]);
  const [challengeIsFinished, setChallengeIsFinished] = useState(false);
  const [challengeIsWon, setChallengeIsWon] = useState(false);
  const [challengeLinkCopied, setChallengeLinkCopied] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

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

  useEffect(() => {
    const storedTier = getSelectedTier();
    setTier(storedTier);

    const dateString = getUTCDateString();
    const daily = getDailyState(storedTier, dateString);
    const infinite = getInfiniteState(storedTier);
    const searchParams = new URLSearchParams(window.location.search);
    const challengeSeed = searchParams.get("challenge");

    if (challengeSeed) {
      const characterId = decodeChallengeSeed(challengeSeed);
      if (characterId) {
        const challengeCharacter = characters.find((c) => c.id === characterId);
        if (challengeCharacter) {
          setChallengeMode(true);
          setTargetCharacter(challengeCharacter);
          setHintUsedState(false);
        }
      }

      window.history.replaceState({}, "", window.location.pathname);
    }

    setDailyState(daily);
    setInfiniteState(infinite);
    if (!challengeSeed) {
      setHintUsedState(daily.hintUsed || false);
    }
    setSettings(loadSettings());
    setIsLoaded(true);

    const onboarded = localStorage.getItem("onepiecedle_onboarded");
    if (!onboarded) {
      setShouldShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (challengeMode) return;

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
  }, [mode, tier, isLoaded, infiniteState, challengeMode]);

  useEffect(() => {
    if (mode !== "daily") return;

    const updateCountdown = () => {
      setCountdown(getTimeUntilReset());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const currentState = challengeMode
    ? null
    : mode === "daily"
      ? dailyState
      : infiniteState;
  const guesses = challengeMode
    ? challengeGuesses
    : currentState?.guesses || [];
  const guessedIds = challengeMode
    ? challengeGuessedIds
    : currentState?.guessedIds || [];
  const isFinished = challengeMode
    ? challengeIsFinished
    : currentState?.isFinished || false;
  const isWon = challengeMode ? challengeIsWon : currentState?.isWon || false;
  const wrongGuessCount = guesses.filter((guess) => !guess.isCorrect).length;

  const handleGuess = useCallback(
    (character: Character) => {
      if (!targetCharacter || isFinished) return;

      const isDuplicate = challengeMode
        ? challengeGuessedIds.includes(character.id)
        : mode === "daily"
          ? isDailyDuplicate(character.id, tier)
          : isInfiniteDuplicate(character.id, tier);

      if (isDuplicate) {
        setDuplicateWarning(`You already guessed ${character.name}!`);
        setTimeout(() => setDuplicateWarning(null), 3000);
        return;
      }

      const result = evaluateGuess(character, targetCharacter);

      const guessNumber = challengeMode
        ? challengeGuesses.length + 1
        : mode === "daily"
          ? (dailyState?.guesses?.length ?? 0) + 1
          : (infiniteState?.guesses?.length ?? 0) + 1;

      setAnnouncement(
        generateGuessAnnouncement(guessNumber, MAX_GUESSES, result)
      );

      if (challengeMode) {
        const nextGuesses = [...challengeGuesses, result];
        const nextGuessedIds = [...challengeGuessedIds, character.id];
        const didWin = result.isCorrect;
        const didFinish = didWin || nextGuesses.length >= MAX_GUESSES;

        setChallengeGuesses(nextGuesses);
        setChallengeGuessedIds(nextGuessedIds);

        if (didFinish) {
          setChallengeIsFinished(true);
          setChallengeIsWon(didWin);
          setTimeout(() => {
            setAnnouncement(
              didWin
                ? `Victory! The answer was ${targetCharacter.name}!`
                : `Defeated. The answer was ${targetCharacter.name}.`
            );
          }, 1500);
        }

        return;
      }

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
      challengeMode,
      challengeGuessedIds,
      challengeGuesses,
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
    if (challengeMode) {
      setHintUsedState(true);
      return;
    }

    markHintUsed(tier, mode, mode === "daily" ? getUTCDateString() : undefined);
    setHintUsedState(true);
  }, [challengeMode, tier, mode]);

  const handleChallengeShare = useCallback(async () => {
    if (!targetCharacter || challengeMode) return;

    const seed = encodeChallengeSeed(targetCharacter.id);
    if (!seed) return;

    const challengeUrl = new URL(window.location.href);
    challengeUrl.search = "";
    challengeUrl.hash = "";
    challengeUrl.searchParams.set("challenge", seed);

    const success = await copyToClipboard(challengeUrl.toString());
    if (success) {
      setChallengeLinkCopied(true);
      setTimeout(() => setChallengeLinkCopied(false), 2500);
    }
  }, [targetCharacter, challengeMode]);

  const handleSettingsChange = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
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

  const handleModeChange = useCallback(
    (newMode: GameMode) => {
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
    },
    [tier]
  );

  return {
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
    shouldShowOnboarding,
    handleGuess,
    handlePlayAgain,
    handleHintUsed,
    handleChallengeShare,
    handleSettingsChange,
    handleTierChange,
    handleModeChange,
  };
}
