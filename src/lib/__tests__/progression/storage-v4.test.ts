import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStorage,
  getAchievementProgress,
  getLogPose,
  getMetaInbox,
  getMonthlyCollections,
  getProgressionByTier,
  loadStorage,
  saveAchievementProgress,
  saveLogPose,
  saveMetaInbox,
  saveMonthlyCollections,
  saveProgressionByTier,
} from "../../storage";
import type {
  AchievementProgress,
  MetaInboxEntry,
  MonthlyCollections,
  TierLogPose,
  TierProgression,
} from "../../types";
import type { AchievementId } from "../../progression/types";
import {
  createEmptyStorageV4,
  createFakeGuess,
  createStorageWithDailyWin,
} from "../../../test/progressionFixtures";

const STORAGE_KEY = "onepiecedle_v2";

function createTierProgressionFixture(): TierProgression {
  return {
    sagas: {
      "east-blue": {
        uniqueSolvedIds: ["luffy"],
        progressCount: 1,
        unlockedAt: "2026-04-12T00:00:00.000Z",
      },
      arabasta: {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "sky-island": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "water-7": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "thriller-bark": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "summit-war": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "fish-man-island": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      dressrosa: {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "whole-cake-island": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      "wano-country": {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
      final: {
        uniqueSolvedIds: [],
        progressCount: 0,
      },
    },
    completedSagaCount: 1,
  };
}

function createLogPoseFixture(): TierLogPose {
  return {
    charges: 2,
    earnedMilestones: [7],
    lastEarnedAt: "2026-04-12T00:00:00.000Z",
    consumptions: [
      {
        protectedDay: "2026-04-13",
        consumedAt: "2026-04-14T00:00:00.000Z",
        source: "streak-7",
      },
    ],
  };
}

function createAchievementProgressFixture(): Record<
  AchievementId,
  AchievementProgress
> {
  return {
    "streak-3": {
      progress: 3,
      target: 3,
      status: "unlocked",
      unlockedAt: "2026-04-12T00:00:00.000Z",
      lastUpdatedAt: "2026-04-12T00:00:00.000Z",
      seasonKey: null,
    },
  } as Record<AchievementId, AchievementProgress>;
}

function createMonthlyCollectionsFixture(): MonthlyCollections {
  return {
    activeSeasonKey: "2026-04",
    seasons: {
      "2026-04": {
        collectibleId: "poster-luffy",
        collectibleType: "bounty-poster",
        targetFragments: 4,
        revealedDays: ["2026-04-01"],
        revealedFragmentIndexes: [0],
      },
    },
  };
}

describe("storage v4 progression", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("migrates v3 storage while preserving existing progress data", () => {
    const legacyStorage = createStorageWithDailyWin(
      "casual",
      "2026-04-13",
      "luffy",
      4
    );

    legacyStorage.infinite.casual = {
      roundId: "legacy-round",
      seed: 12345,
      guesses: [createFakeGuess({ characterId: "zoro", isCorrect: false })],
      guessedIds: ["zoro"],
      isFinished: false,
      isWon: false,
      hintUsed: true,
      totalWins: 2,
      totalGames: 4,
    };
    legacyStorage.infiniteStats.casual = {
      totalWins: 2,
      totalGames: 4,
      streak: 1,
      maxStreak: 3,
      winDistribution: { 2: 1 },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStorage));

    const storage = loadStorage();

    expect(storage.version).toBe(4);
    expect(storage.daily["casual:2026-04-13"]?.isWon).toBe(true);
    expect(storage.infinite.casual.roundId).toBe("legacy-round");
    expect(storage.infiniteStats.casual.totalWins).toBe(2);
    expect(storage.progressionByTier?.casual.completedSagaCount).toBe(0);
    expect(
      getProgressionByTier("casual").sagas["east-blue"].progressCount
    ).toBe(0);
    expect(getLogPose("fan").charges).toBe(0);
    expect(getMonthlyCollections()).toEqual({
      activeSeasonKey: "",
      seasons: {},
    });
    expect(getMetaInbox()).toEqual([]);
  });

  it("resets only malformed v4 progression subtrees", () => {
    const validStorage = createEmptyStorageV4();
    validStorage.progressionByTier!.casual = createTierProgressionFixture();
    validStorage.logPoseByTier!.fan = createLogPoseFixture();
    validStorage.monthlyCollections = createMonthlyCollectionsFixture();
    validStorage.metaInbox = [
      {
        id: "inbox-1",
        type: "achievement",
        title: "Unlocked",
        body: "You unlocked something.",
        createdAt: "2026-04-12T00:00:00.000Z",
      },
    ];

    const malformedStorage: Record<string, unknown> = {
      ...validStorage,
      achievementProgress: {
        "streak-3": {
          progress: 1,
        },
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(malformedStorage));

    const storage = loadStorage();

    expect(storage.progressionByTier?.casual.completedSagaCount).toBe(1);
    expect(storage.logPoseByTier?.fan.charges).toBe(2);
    expect(storage.monthlyCollections?.activeSeasonKey).toBe("2026-04");
    expect(storage.metaInbox).toHaveLength(1);
    expect(storage.achievementProgress).toEqual({});
  });

  it("returns default v4 progression values after migration", () => {
    const legacyStorage = createStorageWithDailyWin(
      "fan",
      "2026-04-13",
      "sanji",
      2
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStorage));
    void loadStorage();

    const progression = getProgressionByTier("casual");
    const logPose = getLogPose("fan");
    const collections = getMonthlyCollections();

    expect(progression.completedSagaCount).toBe(0);
    expect(Object.keys(progression.sagas)).toHaveLength(11);
    expect(logPose.charges).toBe(0);
    expect(collections.activeSeasonKey).toBe("");
    expect(collections.seasons).toEqual({});
  });

  it("round-trips all v4 helper namespaces", () => {
    const progression = createTierProgressionFixture();
    const logPose = createLogPoseFixture();
    const achievementProgress = createAchievementProgressFixture();
    const monthlyCollections = createMonthlyCollectionsFixture();
    const metaInbox: MetaInboxEntry[] = [
      {
        id: "inbox-1",
        type: "saga",
        title: "Saga complete",
        body: "East Blue Saga complete.",
        createdAt: "2026-04-12T00:00:00.000Z",
      },
    ];

    saveProgressionByTier("casual", progression);
    saveLogPose("fan", logPose);
    saveAchievementProgress(achievementProgress);
    saveMonthlyCollections(monthlyCollections);
    saveMetaInbox(metaInbox);

    expect(getProgressionByTier("casual")).toEqual(progression);
    expect(getLogPose("fan")).toEqual(logPose);
    expect(getAchievementProgress()).toEqual(achievementProgress);
    expect(getMonthlyCollections()).toEqual(monthlyCollections);
    expect(getMetaInbox()).toEqual(metaInbox);
  });
});
