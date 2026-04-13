import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockCharacters = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Straw Hat"],
    imageUrl: "/characters/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Pirate Hunter"],
    imageUrl: "/characters/zoro.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: ["O", "A"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
];

const defaultDailyState = {
  date: "2026-04-12",
  guesses: [],
  guessedIds: [],
  isFinished: false,
  isWon: false,
  hintUsed: false,
  streak: 0,
  maxStreak: 0,
};

const defaultInfiniteState = {
  roundId: "12345-67890",
  seed: 12345,
  guesses: [],
  guessedIds: [],
  isFinished: false,
  isWon: false,
  hintUsed: false,
  totalWins: 0,
  totalGames: 0,
};

const {
  mockGetSelectedTier,
  mockGetDailyState,
  mockGetInfiniteState,
  mockGetDailyStats,
  mockGetInfiniteStats,
  mockGetAllDiscoveredIds,
  mockSetSelectedTier,
  mockAddDailyGuess,
  mockAddInfiniteGuess,
  mockStartNewInfiniteRound,
  mockIsDailyDuplicate,
  mockIsInfiniteDuplicate,
  mockMarkHintUsed,
  mockLoadSettings,
  mockSelectDailyCharacter,
  mockSelectInfiniteCharacter,
  mockGetCharactersForTier,
  mockUseSession,
  mockGetUTCDateString,
  mockGetTimeUntilReset,
  mockGetDailyGameNumber,
  mockEvaluateGuess,
  mockEncodeChallengeSeed,
  mockDecodeChallengeSeed,
  mockCopyToClipboard,
} = vi.hoisted(() => ({
  mockGetSelectedTier: vi.fn(),
  mockGetDailyState: vi.fn(),
  mockGetInfiniteState: vi.fn(),
  mockGetDailyStats: vi.fn(),
  mockGetInfiniteStats: vi.fn(),
  mockGetAllDiscoveredIds: vi.fn(),
  mockSetSelectedTier: vi.fn(),
  mockAddDailyGuess: vi.fn(),
  mockAddInfiniteGuess: vi.fn(),
  mockStartNewInfiniteRound: vi.fn(),
  mockIsDailyDuplicate: vi.fn(),
  mockIsInfiniteDuplicate: vi.fn(),
  mockMarkHintUsed: vi.fn(),
  mockLoadSettings: vi.fn(),
  mockSelectDailyCharacter: vi.fn(),
  mockSelectInfiniteCharacter: vi.fn(),
  mockGetCharactersForTier: vi.fn(),
  mockUseSession: vi.fn(),
  mockGetUTCDateString: vi.fn(),
  mockGetTimeUntilReset: vi.fn(),
  mockGetDailyGameNumber: vi.fn(),
  mockEvaluateGuess: vi.fn(),
  mockEncodeChallengeSeed: vi.fn(),
  mockDecodeChallengeSeed: vi.fn(),
  mockCopyToClipboard: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getSelectedTier: mockGetSelectedTier,
  getDailyState: mockGetDailyState,
  getInfiniteState: mockGetInfiniteState,
  getDailyStats: mockGetDailyStats,
  getInfiniteStats: mockGetInfiniteStats,
  getAllDiscoveredIds: mockGetAllDiscoveredIds,
  setSelectedTier: mockSetSelectedTier,
  addDailyGuess: mockAddDailyGuess,
  addInfiniteGuess: mockAddInfiniteGuess,
  startNewInfiniteRound: mockStartNewInfiniteRound,
  isDailyDuplicate: mockIsDailyDuplicate,
  isInfiniteDuplicate: mockIsInfiniteDuplicate,
  markHintUsed: mockMarkHintUsed,
}));

vi.mock("@/lib/settings", () => ({
  loadSettings: mockLoadSettings,
  DEFAULT_SETTINGS: {
    progressiveHints: false,
    autoUseLogPose: true,
    notificationsOptIn: false,
    installPrompt: {
      dismissed: false,
      dismissedAt: null,
      completedDailiesCount: 0,
    },
  },
}));

vi.mock("@/lib/daily", () => ({
  selectDailyCharacter: mockSelectDailyCharacter,
  getUTCDateString: mockGetUTCDateString,
  getTimeUntilReset: mockGetTimeUntilReset,
  getDailyGameNumber: mockGetDailyGameNumber,
}));

vi.mock("@/lib/infinite", () => ({
  selectInfiniteCharacter: mockSelectInfiniteCharacter,
}));

vi.mock("@/lib/tier", () => ({
  getCharactersForTier: mockGetCharactersForTier,
}));

vi.mock("@/lib/evaluateGuess", () => ({
  evaluateGuess: mockEvaluateGuess,
}));

vi.mock("@/lib/challengeUtils", () => ({
  encodeChallengeSeed: mockEncodeChallengeSeed,
  decodeChallengeSeed: mockDecodeChallengeSeed,
}));

vi.mock("@/lib/share", () => ({
  copyToClipboard: mockCopyToClipboard,
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: mockUseSession,
}));

vi.mock("@/data/characters.v2.json", () => ({
  default: mockCharacters,
}));

function setupMocks() {
  mockGetSelectedTier.mockReturnValue("casual");
  mockGetDailyState.mockReturnValue({ ...defaultDailyState });
  mockGetInfiniteState.mockReturnValue({ ...defaultInfiniteState });
  mockGetDailyStats.mockReturnValue({
    streak: 0,
    maxStreak: 0,
    winDistribution: {},
  });
  mockGetInfiniteStats.mockReturnValue({
    totalWins: 0,
    totalGames: 0,
    streak: 0,
    maxStreak: 0,
    winDistribution: {},
  });
  mockGetAllDiscoveredIds.mockReturnValue([]);
  mockLoadSettings.mockReturnValue({
    progressiveHints: false,
    autoUseLogPose: true,
    notificationsOptIn: false,
    installPrompt: {
      dismissed: false,
      dismissedAt: null,
      completedDailiesCount: 0,
    },
  });
  mockGetCharactersForTier.mockReturnValue(mockCharacters);
  mockSelectDailyCharacter.mockReturnValue(mockCharacters[0]);
  mockSelectInfiniteCharacter.mockReturnValue(mockCharacters[0]);
  mockGetUTCDateString.mockReturnValue("2026-04-12");
  mockGetTimeUntilReset.mockReturnValue({ hours: 5, minutes: 30, seconds: 0 });
  mockGetDailyGameNumber.mockReturnValue(100);
  mockUseSession.mockReturnValue({
    data: null,
    status: "unauthenticated",
  });
  mockIsDailyDuplicate.mockReturnValue(false);
  mockIsInfiniteDuplicate.mockReturnValue(false);
  mockCopyToClipboard.mockResolvedValue(true);
  mockEncodeChallengeSeed.mockReturnValue("c2VlZA");
  mockDecodeChallengeSeed.mockReturnValue(null);

  const searchParams = new URLSearchParams();
  vi.spyOn(window, "location", "get").mockReturnValue({
    ...window.location,
    search: searchParams.toString(),
    pathname: "/",
    href: "http://localhost:3000/",
    hash: "",
  });
  vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
}

describe("useGameController", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("isLoaded becomes true after initialization", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
  });

  it("initializes with daily mode and casual tier by default", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.mode).toBe("daily");
    expect(result.current.tier).toBe("casual");
  });

  it("sets shouldShowOnboarding when not onboarded", async () => {
    localStorage.removeItem("onepiecedle_onboarded");

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.shouldShowOnboarding).toBe(true);
  });

  it("does not show onboarding when already onboarded", async () => {
    localStorage.setItem("onepiecedle_onboarded", "true");

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.shouldShowOnboarding).toBe(false);
  });

  it("handleModeChange switches mode and refreshes state", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handleModeChange("infinite");
    });

    expect(result.current.mode).toBe("infinite");
    expect(mockGetDailyState).toHaveBeenCalled();
    expect(mockGetInfiniteState).toHaveBeenCalled();
  });

  it("handleTierChange switches tier and refreshes state", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handleTierChange("fan");
    });

    expect(result.current.tier).toBe("fan");
    expect(mockSetSelectedTier).toHaveBeenCalledWith("fan");
    expect(mockGetDailyState).toHaveBeenCalled();
    expect(mockGetInfiniteState).toHaveBeenCalled();
  });

  it("handleGuess with correct character marks isWon", async () => {
    mockEvaluateGuess.mockReturnValue({
      characterId: "luffy",
      characterName: "Monkey D. Luffy",
      imageUrl: "/characters/luffy.png",
      categories: [],
      isCorrect: true,
    });

    const finishedDailyState = {
      ...defaultDailyState,
      guesses: [
        {
          characterId: "luffy",
          characterName: "Monkey D. Luffy",
          imageUrl: "/characters/luffy.png",
          categories: [],
          isCorrect: true,
        },
      ],
      guessedIds: ["luffy"],
      isFinished: true,
      isWon: true,
      streak: 1,
      maxStreak: 1,
    };

    mockAddDailyGuess.mockReturnValue(finishedDailyState);

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handleGuess(mockCharacters[0] as never);
    });

    expect(result.current.isWon).toBe(true);
    expect(result.current.isFinished).toBe(true);
  });

  it("handleGuess blocks duplicate guesses", async () => {
    mockIsDailyDuplicate.mockReturnValue(true);

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handleGuess(mockCharacters[0] as never);
    });

    expect(result.current.duplicateWarning).toBe(
      "You already guessed Monkey D. Luffy!"
    );
    expect(mockEvaluateGuess).not.toHaveBeenCalled();
  });

  it("challengeMode is false when no challenge seed in URL", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.challengeMode).toBe(false);
  });

  it("initializes challenge mode when challenge seed is present", async () => {
    const searchParams = new URLSearchParams();
    searchParams.set("challenge", "bHVmZnk");
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      search: searchParams.toString(),
      pathname: "/",
      href: "http://localhost:3000/?challenge=bHVmZnk",
      hash: "",
    });

    mockDecodeChallengeSeed.mockReturnValue("luffy");

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.challengeMode).toBe(true);
    expect(window.history.replaceState).toHaveBeenCalledWith({}, "", "/");
  });

  it("handlePlayAgain starts a new infinite round", async () => {
    const newInfiniteState = {
      ...defaultInfiniteState,
      roundId: "99999-00000",
      seed: 99999,
    };
    mockStartNewInfiniteRound.mockReturnValue(newInfiniteState);

    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handlePlayAgain();
    });

    expect(mockStartNewInfiniteRound).toHaveBeenCalledWith("casual");
  });

  it("handleHintUsed marks hint for daily mode", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.handleHintUsed();
    });

    expect(mockMarkHintUsed).toHaveBeenCalledWith(
      "casual",
      "daily",
      "2026-04-12"
    );
    expect(result.current.hintUsed).toBe(true);
  });

  it("exposes characterCounts for all tiers", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.characterCounts).toEqual({
      casual: 2,
      fan: 2,
      nakama: 2,
    });
  });

  it("maxGuesses is 6", async () => {
    const { useGameController } = await import("../useGameController");
    const { result } = renderHook(() => useGameController());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.maxGuesses).toBe(6);
  });
});
