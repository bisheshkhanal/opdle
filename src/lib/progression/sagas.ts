import type { SagaProgress, TierProgression } from "@/lib/types";

import { SAGA_CATALOG, getSagaForArc } from "./sagaCatalog";
import type { SagaId } from "./types";

export interface SagaEvent {
  type: "saga-unlocked" | "saga-completed";
  sagaId: SagaId;
  sagaLabel: string;
  timestamp: string;
}

type SagaStatus = "locked" | "unlocked" | "completed";

const ALL_SAGA_IDS = SAGA_CATALOG.map((saga) => saga.id);

function createSagaProgress(): SagaProgress {
  return {
    uniqueSolvedIds: [],
    progressCount: 0,
  };
}

function getSagaLabel(sagaId: SagaId): string {
  return SAGA_CATALOG.find((saga) => saga.id === sagaId)?.label ?? sagaId;
}

function getCompletedSagaCount(progression: TierProgression): number {
  return Object.values(progression.sagas).filter(
    (sagaProgress) => sagaProgress.progressCount >= 3
  ).length;
}

function cloneTierProgression(progression: TierProgression): TierProgression {
  const sagas = {} as TierProgression["sagas"];

  for (const sagaId of ALL_SAGA_IDS) {
    const sagaProgress = progression.sagas[sagaId] ?? createSagaProgress();
    sagas[sagaId] = {
      uniqueSolvedIds: [...sagaProgress.uniqueSolvedIds],
      progressCount: sagaProgress.progressCount,
      ...(sagaProgress.unlockedAt
        ? { unlockedAt: sagaProgress.unlockedAt }
        : {}),
      ...(sagaProgress.completedAt
        ? { completedAt: sagaProgress.completedAt }
        : {}),
    };
  }

  return {
    sagas,
    completedSagaCount: progression.completedSagaCount,
  };
}

export function createEmptyTierProgression(): TierProgression {
  const sagas = {} as TierProgression["sagas"];

  for (const sagaId of ALL_SAGA_IDS) {
    sagas[sagaId] = createSagaProgress();
  }

  return {
    sagas,
    completedSagaCount: 0,
  };
}

export function recordDailyWin(
  progression: TierProgression,
  targetCharacterId: string,
  targetFirstArc: string,
  now: Date
): { progression: TierProgression; events: SagaEvent[] } {
  const sagaId = getSagaForArc(targetFirstArc);

  if (!sagaId) {
    return { progression, events: [] };
  }

  const currentSaga = progression.sagas[sagaId] ?? createSagaProgress();

  if (currentSaga.uniqueSolvedIds.includes(targetCharacterId)) {
    return { progression, events: [] };
  }

  const nextProgression = cloneTierProgression(progression);
  const nextSaga = nextProgression.sagas[sagaId];
  const nextTimestamp = now.toISOString();
  const events: SagaEvent[] = [];

  nextSaga.uniqueSolvedIds.push(targetCharacterId);
  nextSaga.progressCount += 1;

  if (nextSaga.progressCount === 1 && !nextSaga.unlockedAt) {
    nextSaga.unlockedAt = nextTimestamp;
    events.push({
      type: "saga-unlocked",
      sagaId,
      sagaLabel: getSagaLabel(sagaId),
      timestamp: nextTimestamp,
    });
  }

  if (nextSaga.progressCount >= 3 && !nextSaga.completedAt) {
    nextSaga.completedAt = nextTimestamp;
    events.push({
      type: "saga-completed",
      sagaId,
      sagaLabel: getSagaLabel(sagaId),
      timestamp: nextTimestamp,
    });
  }

  nextProgression.completedSagaCount = getCompletedSagaCount(nextProgression);

  return { progression: nextProgression, events };
}

export function getSagaNodeStatus(
  progression: TierProgression,
  sagaId: SagaId
): SagaStatus {
  const progressCount = progression.sagas[sagaId]?.progressCount ?? 0;

  if (progressCount === 0) return "locked";
  if (progressCount < 3) return "unlocked";
  return "completed";
}

export function getSagaProgressText(
  progression: TierProgression,
  sagaId: SagaId
): string {
  const status = getSagaNodeStatus(progression, sagaId);
  const progressCount = progression.sagas[sagaId]?.progressCount ?? 0;

  if (status === "locked") return "0/3 daily wins";
  if (status === "unlocked") return `${progressCount}/3 daily wins`;
  return "Completed";
}

export function getAllSagaStatuses(
  progression: TierProgression
): Record<SagaId, { status: SagaStatus; progressCount: number }> {
  const statuses = {} as Record<
    SagaId,
    { status: SagaStatus; progressCount: number }
  >;

  for (const saga of SAGA_CATALOG) {
    const progressCount = progression.sagas[saga.id]?.progressCount ?? 0;

    statuses[saga.id] = {
      status: getSagaNodeStatus(progression, saga.id),
      progressCount,
    };
  }

  return statuses;
}
