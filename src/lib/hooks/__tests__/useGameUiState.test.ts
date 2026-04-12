import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameUiState } from "@/lib/hooks/useGameUiState";
import type { GameControllerState } from "@/lib/hooks/useGameController";
import { DEFAULT_SETTINGS } from "@/lib/settings";

function createMockGame(
  overrides: Partial<GameControllerState> = {}
): GameControllerState {
  return {
    mode: "daily",
    tier: "casual",
    targetCharacter: null,
    dailyState: null,
    infiniteState: null,
    guesses: [],
    guessedIds: [],
    isFinished: false,
    isWon: false,
    isLoaded: true,
    hintUsed: false,
    challengeMode: false,
    challengeLinkCopied: false,
    duplicateWarning: null,
    announcement: "",
    settings: { ...DEFAULT_SETTINGS },
    countdown: { hours: 0, minutes: 0, seconds: 0 },
    discoveredIds: [],
    dailyStats: {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {},
    },
    infiniteStats: { totalGames: 0, totalWins: 0 },
    characterCounts: { casual: 10, fan: 20, nakama: 30 },
    wrongGuessCount: 0,
    maxGuesses: 6,
    shouldShowOnboarding: false,
    handleGuess: vi.fn(),
    handlePlayAgain: vi.fn(),
    handleHintUsed: vi.fn(),
    handleChallengeShare: vi.fn(),
    handleSettingsChange: vi.fn(),
    handleTierChange: vi.fn(),
    handleModeChange: vi.fn(),
    ...overrides,
  };
}

describe("useGameUiState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("modal open/close", () => {
    it("starts with all modals closed", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      expect(result.current.showStats).toBe(false);
      expect(result.current.showBountyBoard).toBe(false);
      expect(result.current.showLeaderboard).toBe(false);
      expect(result.current.showAuthModal).toBe(false);
      expect(result.current.showSettings).toBe(false);
      expect(result.current.showHowToPlay).toBe(false);
      expect(result.current.showArchive).toBe(false);
    });

    it("opens and closes stats modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openStats());
      expect(result.current.showStats).toBe(true);

      act(() => result.current.closeStats());
      expect(result.current.showStats).toBe(false);
    });

    it("opens and closes bounty board modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openBountyBoard());
      expect(result.current.showBountyBoard).toBe(true);

      act(() => result.current.closeBountyBoard());
      expect(result.current.showBountyBoard).toBe(false);
    });

    it("opens and closes leaderboard modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openLeaderboard());
      expect(result.current.showLeaderboard).toBe(true);

      act(() => result.current.closeLeaderboard());
      expect(result.current.showLeaderboard).toBe(false);
    });

    it("opens and closes auth modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openAuthModal());
      expect(result.current.showAuthModal).toBe(true);

      act(() => result.current.closeAuthModal());
      expect(result.current.showAuthModal).toBe(false);
    });

    it("opens and closes settings modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openSettings());
      expect(result.current.showSettings).toBe(true);

      act(() => result.current.closeSettings());
      expect(result.current.showSettings).toBe(false);
    });

    it("opens and closes archive modal", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openArchive());
      expect(result.current.showArchive).toBe(true);

      act(() => result.current.closeArchive());
      expect(result.current.showArchive).toBe(false);
    });

    it("opens how-to-play and marks onboarded on close", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      act(() => result.current.openHowToPlay());
      expect(result.current.showHowToPlay).toBe(true);

      act(() => result.current.closeHowToPlay());
      expect(result.current.showHowToPlay).toBe(false);
      expect(localStorage.getItem("onepiecedle_onboarded")).toBe("true");
    });
  });

  describe("onboarding", () => {
    it("shows how-to-play when shouldShowOnboarding is true", () => {
      const { result } = renderHook(() =>
        useGameUiState(createMockGame({ shouldShowOnboarding: true }))
      );

      expect(result.current.showHowToPlay).toBe(true);
    });

    it("does not show how-to-play when shouldShowOnboarding is false", () => {
      const { result } = renderHook(() =>
        useGameUiState(createMockGame({ shouldShowOnboarding: false }))
      );

      expect(result.current.showHowToPlay).toBe(false);
    });
  });

  describe("compass animation", () => {
    it("starts in idle state", () => {
      const { result } = renderHook(() => useGameUiState(createMockGame()));

      expect(result.current.compassState).toBe("idle");
    });

    it("transitions to wrong-guess when guesses increase", () => {
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({ guesses: [] }),
          },
        }
      );

      expect(result.current.compassState).toBe("idle");

      rerender({
        game: createMockGame({
          guesses: [{ isCorrect: false, categories: [] } as never],
        }),
      });

      expect(result.current.compassState).toBe("wrong-guess");
    });

    it("transitions to correct-guess when isWon becomes true", () => {
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({ guesses: [], isWon: false }),
          },
        }
      );

      rerender({
        game: createMockGame({
          guesses: [{ isCorrect: true, categories: [] } as never],
          isWon: true,
        }),
      });

      expect(result.current.compassState).toBe("correct-guess");
    });

    it("prefers correct-guess over wrong-guess when both change", () => {
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({ guesses: [], isWon: false }),
          },
        }
      );

      rerender({
        game: createMockGame({
          guesses: [{ isCorrect: true, categories: [] } as never],
          isWon: true,
        }),
      });

      expect(result.current.compassState).toBe("correct-guess");
    });

    it("resets compass to idle after 2 seconds", () => {
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({ guesses: [] }),
          },
        }
      );

      rerender({
        game: createMockGame({
          guesses: [{ isCorrect: false, categories: [] } as never],
        }),
      });

      expect(result.current.compassState).toBe("wrong-guess");

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.compassState).toBe("idle");
    });

    it("does not trigger wrong-guess when guess count stays the same", () => {
      const guess = { isCorrect: false, categories: [] } as never;
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({ guesses: [] }),
          },
        }
      );

      expect(result.current.compassState).toBe("idle");

      rerender({
        game: createMockGame({ guesses: [guess] }),
      });
      expect(result.current.compassState).toBe("wrong-guess");

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.compassState).toBe("idle");

      rerender({
        game: createMockGame({ guesses: [guess] }),
      });
      expect(result.current.compassState).toBe("idle");
    });
  });

  describe("settings pass-through", () => {
    it("exposes settings from game controller", () => {
      const customSettings = {
        silhouetteReveal: true,
        progressiveHints: true,
      };
      const { result } = renderHook(() =>
        useGameUiState(createMockGame({ settings: customSettings }))
      );

      expect(result.current.settings).toEqual(customSettings);
    });

    it("exposes handleSettingsChange from game controller", () => {
      const mockHandler = vi.fn();
      const { result } = renderHook(() =>
        useGameUiState(createMockGame({ handleSettingsChange: mockHandler }))
      );

      const newSettings = { silhouetteReveal: true, progressiveHints: false };
      result.current.handleSettingsChange(newSettings);
      expect(mockHandler).toHaveBeenCalledWith(newSettings);
    });

    it("reflects updated settings when game controller changes them", () => {
      const { result, rerender } = renderHook(
        ({ game }) => useGameUiState(game),
        {
          initialProps: {
            game: createMockGame({
              settings: { silhouetteReveal: false, progressiveHints: false },
            }),
          },
        }
      );

      expect(result.current.settings.silhouetteReveal).toBe(false);

      rerender({
        game: createMockGame({
          settings: { silhouetteReveal: true, progressiveHints: true },
        }),
      });

      expect(result.current.settings.silhouetteReveal).toBe(true);
      expect(result.current.settings.progressiveHints).toBe(true);
    });
  });
});
