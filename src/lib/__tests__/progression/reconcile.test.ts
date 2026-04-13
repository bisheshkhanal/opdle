import { describe, expect, it } from "vitest";
import {
  reconcileAchievementProgress,
  reconcileLogPose,
  reconcileMonthlyCollections,
  reconcileProgression,
  reconcileTierProgression,
  type StorageMetaFields,
} from "../../progression/reconcile";
import type {
  AchievementProgress,
  MonthlyCollections,
  SagaProgress,
  TierLogPose,
} from "../../types";
import type { AchievementId } from "../../progression/types";
import { createEmptyStorageV4 } from "../../../test/progressionFixtures";

function createMeta(storage = createEmptyStorageV4()): StorageMetaFields {
  return {
    progressionByTier: storage.progressionByTier,
    logPoseByTier: storage.logPoseByTier,
    achievementProgress: storage.achievementProgress,
    monthlyCollections: storage.monthlyCollections,
    metaInbox: storage.metaInbox,
  };
}

function createSagaProgress(
  overrides: Partial<SagaProgress> = {}
): SagaProgress {
  return {
    uniqueSolvedIds: [],
    progressCount: 0,
    ...overrides,
  };
}

function createAchievementRecord(
  overrides: Partial<Record<AchievementId, AchievementProgress>> = {}
): Record<AchievementId, AchievementProgress> {
  const record = createEmptyStorageV4().achievementProgress!;
  return Object.assign(record, overrides);
}

function createAchievement(
  overrides: Partial<AchievementProgress>
): AchievementProgress {
  return {
    progress: 0,
    target: 3,
    status: "locked",
    lastUpdatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

function createLogPose(overrides: Partial<TierLogPose>): TierLogPose {
  return {
    charges: 0,
    earnedMilestones: [],
    consumptions: [],
    ...overrides,
  };
}

function createMonthlyCollections(
  overrides: Partial<MonthlyCollections>
): MonthlyCollections {
  return {
    activeSeasonKey: "2026-04",
    seasons: {},
    ...overrides,
  };
}

describe("progression reconciliation", () => {
  it("merges stale server snapshot into newer local data without losing unlocks", () => {
    const local = createEmptyStorageV4();
    const server = createEmptyStorageV4();

    local.progressionByTier!.casual.sagas["east-blue"] = createSagaProgress({
      uniqueSolvedIds: ["luffy", "zoro"],
      progressCount: 2,
      unlockedAt: "2026-04-11T00:00:00.000Z",
      completedAt: "2026-04-12T00:00:00.000Z",
    });
    local.progressionByTier!.casual.completedSagaCount = 1;

    server.progressionByTier!.casual.sagas["east-blue"] = createSagaProgress({
      uniqueSolvedIds: ["luffy"],
      progressCount: 1,
    });

    local.achievementProgress!["streak-3"] = createAchievement({
      progress: 3,
      status: "unlocked",
      unlockedAt: "2026-04-11T00:00:00.000Z",
      lastUpdatedAt: "2026-04-11T00:00:00.000Z",
    });
    server.achievementProgress!["streak-3"] = createAchievement({
      progress: 1,
      status: "revealed",
      lastUpdatedAt: "2026-04-10T00:00:00.000Z",
    });

    local.logPoseByTier!.casual = createLogPose({ charges: 2 });
    server.logPoseByTier!.casual = createLogPose({ charges: 1 });

    const merged = reconcileProgression(createMeta(local), createMeta(server));

    expect(
      merged.progressionByTier!.casual.sagas["east-blue"].uniqueSolvedIds
    ).toEqual(["luffy", "zoro"]);
    expect(
      merged.progressionByTier!.casual.sagas["east-blue"].completedAt
    ).toBe("2026-04-12T00:00:00.000Z");
    expect(merged.progressionByTier!.casual.completedSagaCount).toBe(1);
    expect(merged.achievementProgress!["streak-3"].status).toBe("unlocked");
    expect(merged.logPoseByTier!.casual.charges).toBe(2);
  });

  it("merges monthly fragment reveals by unique day set", () => {
    const local = createMonthlyCollections({
      activeSeasonKey: "2026-04",
      seasons: {
        "2026-04": {
          collectibleId: "poster-1",
          collectibleType: "bounty-poster",
          targetFragments: 4,
          revealedDays: ["2026-04-01", "2026-04-02"],
          revealedFragmentIndexes: [0, 1],
          completedAt: "2026-04-12T00:00:00.000Z",
        },
      },
    });
    const server = createMonthlyCollections({
      activeSeasonKey: "2026-04",
      seasons: {
        "2026-04": {
          collectibleId: "poster-1",
          collectibleType: "bounty-poster",
          targetFragments: 4,
          revealedDays: ["2026-04-02", "2026-04-03"],
          revealedFragmentIndexes: [1, 2],
        },
      },
    });

    const merged = reconcileMonthlyCollections(local, server);

    expect(merged.seasons["2026-04"].revealedDays).toEqual([
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
    ]);
    expect(merged.seasons["2026-04"].revealedFragmentIndexes).toEqual([
      0, 1, 2,
    ]);
    expect(merged.seasons["2026-04"].completedAt).toBe(
      "2026-04-12T00:00:00.000Z"
    );
  });

  it("preserves local data when the server snapshot is empty", () => {
    const local = createMeta(createEmptyStorageV4());
    const empty: StorageMetaFields = {};

    const merged = reconcileProgression(local, empty);

    expect(merged).toEqual(local);
  });

  it("adopts server data when local data is empty", () => {
    const empty: StorageMetaFields = {};
    const server = createMeta(createEmptyStorageV4());

    const merged = reconcileProgression(empty, server);

    expect(merged).toEqual(server);
  });

  it("keeps unlocked achievements unlocked after merge", () => {
    const merged = reconcileAchievementProgress(
      createAchievementRecord({
        "streak-3": createAchievement({
          progress: 3,
          status: "unlocked",
          unlockedAt: "2026-04-11T00:00:00.000Z",
          lastUpdatedAt: "2026-04-11T00:00:00.000Z",
        }),
      }),
      createAchievementRecord({
        "streak-3": createAchievement({
          progress: 1,
          status: "locked",
          lastUpdatedAt: "2026-04-10T00:00:00.000Z",
        }),
      })
    );

    expect(merged["streak-3"].status).toBe("unlocked");
    expect(merged["streak-3"].unlockedAt).toBe("2026-04-11T00:00:00.000Z");
  });

  it("takes the max saga progress count", () => {
    const merged = reconcileTierProgression(
      {
        sagas: {
          "east-blue": createSagaProgress({ progressCount: 2 }),
          arabasta: createSagaProgress(),
          "sky-island": createSagaProgress(),
          "water-7": createSagaProgress(),
          "thriller-bark": createSagaProgress(),
          "summit-war": createSagaProgress(),
          "fish-man-island": createSagaProgress(),
          dressrosa: createSagaProgress(),
          "whole-cake-island": createSagaProgress(),
          "wano-country": createSagaProgress(),
          final: createSagaProgress(),
        },
        completedSagaCount: 0,
      },
      {
        sagas: {
          "east-blue": createSagaProgress({ progressCount: 5 }),
          arabasta: createSagaProgress(),
          "sky-island": createSagaProgress(),
          "water-7": createSagaProgress(),
          "thriller-bark": createSagaProgress(),
          "summit-war": createSagaProgress(),
          "fish-man-island": createSagaProgress(),
          dressrosa: createSagaProgress(),
          "whole-cake-island": createSagaProgress(),
          "wano-country": createSagaProgress(),
          final: createSagaProgress(),
        },
        completedSagaCount: 0,
      }
    );

    expect(merged.sagas["east-blue"].progressCount).toBe(5);
  });

  it("deduplicates Log Pose consumptions by protectedDay", () => {
    const merged = reconcileLogPose(
      createLogPose({
        charges: 1,
        earnedMilestones: [7],
        consumptions: [
          {
            protectedDay: "2026-04-13",
            consumedAt: "2026-04-14T00:00:00.000Z",
            source: "streak-7",
          },
        ],
      }),
      createLogPose({
        charges: 2,
        earnedMilestones: [7, 14],
        consumptions: [
          {
            protectedDay: "2026-04-13",
            consumedAt: "2026-04-15T00:00:00.000Z",
            source: "streak-7",
          },
          {
            protectedDay: "2026-04-14",
            consumedAt: "2026-04-16T00:00:00.000Z",
            source: "streak-7",
          },
        ],
      })
    );

    expect(merged.charges).toBe(2);
    expect(merged.earnedMilestones).toEqual([7, 14]);
    expect(merged.consumptions).toHaveLength(2);
    expect(
      merged.consumptions.map(
        (entry: TierLogPose["consumptions"][number]) => entry.protectedDay
      )
    ).toEqual(["2026-04-13", "2026-04-14"]);
  });

  it("keeps the merged result monotonic against both inputs", () => {
    const local = createMeta(createEmptyStorageV4());
    const server = createMeta(createEmptyStorageV4());

    local.progressionByTier!.casual.sagas["east-blue"] = createSagaProgress({
      uniqueSolvedIds: ["luffy"],
      progressCount: 1,
      unlockedAt: "2026-04-11T00:00:00.000Z",
    });
    server.progressionByTier!.casual.sagas["east-blue"] = createSagaProgress({
      uniqueSolvedIds: ["luffy", "zoro"],
      progressCount: 3,
      completedAt: "2026-04-12T00:00:00.000Z",
    });

    local.achievementProgress!["streak-3"] = createAchievement({
      progress: 1,
      status: "revealed",
      lastUpdatedAt: "2026-04-10T00:00:00.000Z",
    });
    server.achievementProgress!["streak-3"] = createAchievement({
      progress: 3,
      status: "unlocked",
      unlockedAt: "2026-04-12T00:00:00.000Z",
      lastUpdatedAt: "2026-04-12T00:00:00.000Z",
    });

    local.logPoseByTier!.casual = createLogPose({
      charges: 1,
      earnedMilestones: [7],
    });
    server.logPoseByTier!.casual = createLogPose({
      charges: 3,
      earnedMilestones: [7, 14],
    });

    local.monthlyCollections = createMonthlyCollections({
      seasons: {
        "2026-04": {
          collectibleId: "poster-1",
          collectibleType: "bounty-poster",
          targetFragments: 4,
          revealedDays: ["2026-04-01"],
          revealedFragmentIndexes: [0],
        },
      },
    });
    server.monthlyCollections = createMonthlyCollections({
      seasons: {
        "2026-04": {
          collectibleId: "poster-1",
          collectibleType: "bounty-poster",
          targetFragments: 4,
          revealedDays: ["2026-04-01", "2026-04-02"],
          revealedFragmentIndexes: [0, 1],
        },
      },
    });

    const merged = reconcileProgression(local, server);

    expect(
      merged.progressionByTier!.casual.sagas["east-blue"].progressCount
    ).toBeGreaterThanOrEqual(1);
    expect(
      merged.progressionByTier!.casual.sagas["east-blue"].progressCount
    ).toBeGreaterThanOrEqual(3);
    expect(
      new Set(
        merged.progressionByTier!.casual.sagas["east-blue"].uniqueSolvedIds
      )
    ).toEqual(new Set(["luffy", "zoro"]));
    expect(merged.achievementProgress!["streak-3"].status).toBe("unlocked");
    expect(
      merged.achievementProgress!["streak-3"].progress
    ).toBeGreaterThanOrEqual(1);
    expect(
      merged.achievementProgress!["streak-3"].progress
    ).toBeGreaterThanOrEqual(3);
    expect(merged.logPoseByTier!.casual.charges).toBeGreaterThanOrEqual(1);
    expect(merged.logPoseByTier!.casual.charges).toBeGreaterThanOrEqual(3);
    expect(
      new Set(merged.monthlyCollections!.seasons["2026-04"].revealedDays)
    ).toEqual(new Set(["2026-04-01", "2026-04-02"]));
  });
});
