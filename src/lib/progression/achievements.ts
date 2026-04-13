import type {
  Character,
  AchievementProgress,
  MetaInboxEntry,
} from "@/lib/types";

import { ACHIEVEMENT_CATALOG, getAchievementDef } from "./achievementCatalog";
import {
  getDevilFruitUserIds,
  getHakiUserIds,
  getMarineIds,
  getYonkoTargetIds,
} from "./characterSets";
import type { AchievementId, AchievementVisibility } from "./types";
import type { StorageSchema } from "@/lib/types";

export interface AchievementEvent {
  type: "daily-win" | "infinite-win";
  characterId: string;
  guessCount: number;
  streak: number;
  maxStreak: number;
}

export interface AchievementEvaluationState {
  achievementProgress?: Partial<Record<AchievementId, AchievementProgress>>;
  daily?: StorageSchema["daily"];
  infinite?: StorageSchema["infinite"];
  progressionByTier?: StorageSchema["progressionByTier"];
}

export interface AchievementEvaluationResult {
  achievementProgress: Record<AchievementId, AchievementProgress>;
  inboxEntries: MetaInboxEntry[];
}

const ACHIEVEMENT_ORDER = ACHIEVEMENT_CATALOG.map(
  (achievement) => achievement.id
);

function getUtcNow(): Date {
  return new Date();
}

function getTimestamp(): string {
  return getUtcNow().toISOString();
}

function cloneAchievementProgress(
  progress: AchievementProgress
): AchievementProgress {
  return {
    ...progress,
    ...(progress.unlockedAt ? { unlockedAt: progress.unlockedAt } : {}),
    ...(progress.seasonKey !== undefined
      ? { seasonKey: progress.seasonKey }
      : {}),
  };
}

function getTargetForAchievement(
  achievementId: AchievementId,
  characters: Character[]
): number {
  switch (achievementId) {
    case "haki-master":
      return getHakiUserIds(characters).length;
    case "yonko-slayer":
      return getYonkoTargetIds(characters).length;
    case "devil-fruit-encyclopedia":
      return getDevilFruitUserIds(characters).length;
    case "marine-inspector":
      return getMarineIds(characters).length;
    default:
      return getAchievementDef(achievementId)?.target ?? 0;
  }
}

function countDiscoveredIds(state: AchievementEvaluationState): Set<string> {
  const discovered = new Set<string>();

  for (const dailyState of Object.values(state.daily ?? {})) {
    for (const guess of dailyState.guesses ?? []) {
      if (guess.isCorrect) {
        discovered.add(guess.characterId);
      }
    }
  }

  for (const infiniteState of Object.values(state.infinite ?? {})) {
    for (const guess of infiniteState.guesses ?? []) {
      if (guess.isCorrect) {
        discovered.add(guess.characterId);
      }
    }
  }

  return discovered;
}

function getMaxCompletedSagaCount(state: AchievementEvaluationState): number {
  const completedCounts = Object.values(state.progressionByTier ?? {}).map(
    (tierProgression) => tierProgression?.completedSagaCount ?? 0
  );

  return completedCounts.length > 0 ? Math.max(...completedCounts) : 0;
}

function getProgressForAchievement(
  achievementId: AchievementId,
  event: AchievementEvent,
  characters: Character[],
  discoveredIds: Set<string>,
  maxCompletedSagaCount: number
): number {
  switch (achievementId) {
    case "streak-3":
    case "streak-7":
    case "streak-14":
    case "streak-30":
    case "streak-50":
      return event.maxStreak;
    case "perfect-navigator":
      return event.guessCount === 1 ? 1 : 0;
    case "haki-master":
      return getHakiUserIds(characters).filter((id) => discoveredIds.has(id))
        .length;
    case "yonko-slayer":
      return getYonkoTargetIds(characters).filter((id) => discoveredIds.has(id))
        .length;
    case "devil-fruit-encyclopedia":
      return getDevilFruitUserIds(characters).filter((id) =>
        discoveredIds.has(id)
      ).length;
    case "marine-inspector":
      return getMarineIds(characters).filter((id) => discoveredIds.has(id))
        .length;
    case "bounty-hunter":
      return discoveredIds.size;
    case "grand-line-navigator":
      return maxCompletedSagaCount;
    default:
      return 0;
  }
}

function buildInboxEntry(
  achievementId: AchievementId,
  timestamp: string
): MetaInboxEntry {
  const achievement = getAchievementDef(achievementId);

  return {
    id: `achievement-${achievementId}-${timestamp}`,
    type: "achievement",
    title: achievement?.label ?? achievementId,
    body: achievement?.description ?? "Achievement unlocked.",
    createdAt: timestamp,
  };
}

function resolveNextStatus(
  visibility: AchievementVisibility,
  progress: number,
  target: number,
  currentStatus: AchievementProgress["status"]
): AchievementProgress["status"] {
  if (currentStatus === "unlocked") {
    return "unlocked";
  }

  if (visibility !== "visible") {
    if (progress >= target) {
      return "unlocked";
    }

    return progress > 0 ? "revealed" : "locked";
  }

  return progress >= target ? "unlocked" : "locked";
}

export function evaluateAchievements(
  event: AchievementEvent,
  state: AchievementEvaluationState,
  characters: Character[]
): AchievementEvaluationResult {
  const timestamp = getTimestamp();
  const discoveredIds = countDiscoveredIds(state);
  discoveredIds.add(event.characterId);
  const maxCompletedSagaCount = getMaxCompletedSagaCount(state);
  const nextAchievementProgress = {} as Record<
    AchievementId,
    AchievementProgress
  >;
  const inboxEntries: MetaInboxEntry[] = [];

  for (const achievementId of ACHIEVEMENT_ORDER) {
    const definition = getAchievementDef(achievementId);
    if (!definition) {
      continue;
    }

    const target = getTargetForAchievement(achievementId, characters);
    const existing = state.achievementProgress?.[achievementId];

    if (existing?.status === "unlocked") {
      nextAchievementProgress[achievementId] =
        cloneAchievementProgress(existing);
      continue;
    }

    const progress = Math.max(
      existing?.progress ?? 0,
      getProgressForAchievement(
        achievementId,
        event,
        characters,
        discoveredIds,
        maxCompletedSagaCount
      )
    );

    const status = resolveNextStatus(
      definition.visibility,
      progress,
      target,
      existing?.status ?? "locked"
    ) as AchievementProgress["status"];
    const didUnlock = status === "unlocked";
    const unlockedAt = didUnlock
      ? (existing?.unlockedAt ?? timestamp)
      : existing?.unlockedAt;
    const lastUpdatedAt =
      !existing ||
      existing.progress !== progress ||
      existing.target !== target ||
      existing.status !== status ||
      (didUnlock && !existing.unlockedAt)
        ? timestamp
        : existing.lastUpdatedAt;

    nextAchievementProgress[achievementId] = {
      progress,
      target,
      status,
      ...(unlockedAt ? { unlockedAt } : {}),
      lastUpdatedAt,
      seasonKey: existing?.seasonKey ?? null,
    };

    if (didUnlock) {
      inboxEntries.push(buildInboxEntry(achievementId, timestamp));
    }
  }

  return {
    achievementProgress: nextAchievementProgress,
    inboxEntries,
  };
}
