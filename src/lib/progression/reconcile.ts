import type {
  AchievementProgress,
  LogPoseConsumption,
  MetaInboxEntry,
  MonthlyCollections,
  MonthlySeason,
  SagaProgress,
  StorageSchema,
  Tier,
  TierLogPose,
  TierProgression,
} from "@/lib/types";
import type { AchievementId, SagaId } from "./types";

export type StorageMetaFields = Partial<
  Pick<
    StorageSchema,
    | "progressionByTier"
    | "logPoseByTier"
    | "achievementProgress"
    | "monthlyCollections"
    | "metaInbox"
  >
>;

const ALL_TIERS: Tier[] = ["casual", "fan", "nakama"];
const STATUS_RANK: Record<AchievementProgress["status"], number> = {
  locked: 0,
  revealed: 1,
  unlocked: 2,
};

function uniqueStrings(values: string[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}

function uniqueNumbers(values: number[]): number[] {
  const result: number[] = [];

  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}

function compareDateLike(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

function chooseEarlier(left?: string, right?: string): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return compareDateLike(left, right) <= 0 ? left : right;
}

function chooseLater(left?: string, right?: string): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return compareDateLike(left, right) >= 0 ? left : right;
}

function mergeSagaProgress(
  local?: SagaProgress,
  server?: SagaProgress
): SagaProgress {
  const uniqueSolvedIds = uniqueStrings([
    ...(local?.uniqueSolvedIds ?? []),
    ...(server?.uniqueSolvedIds ?? []),
  ]);

  return {
    uniqueSolvedIds,
    progressCount: Math.max(
      local?.progressCount ?? 0,
      server?.progressCount ?? 0
    ),
    ...(chooseEarlier(local?.unlockedAt, server?.unlockedAt)
      ? { unlockedAt: chooseEarlier(local?.unlockedAt, server?.unlockedAt) }
      : {}),
    ...(chooseEarlier(local?.completedAt, server?.completedAt)
      ? { completedAt: chooseEarlier(local?.completedAt, server?.completedAt) }
      : {}),
  };
}

function mergeTierProgressionMap(
  local: Record<Tier, TierProgression> | undefined,
  server: Record<Tier, TierProgression> | undefined
): Record<Tier, TierProgression> | undefined {
  if (!local && !server) return undefined;

  const merged = {} as Record<Tier, TierProgression>;
  for (const tier of ALL_TIERS) {
    const localTier = local?.[tier];
    const serverTier = server?.[tier];
    merged[tier] =
      localTier && serverTier
        ? reconcileTierProgression(localTier, serverTier)
        : (localTier ??
          serverTier ?? {
            sagas: {} as Record<SagaId, SagaProgress>,
            completedSagaCount: 0,
          });
  }

  return merged;
}

function mergeLogPoseMap(
  local: Record<Tier, TierLogPose> | undefined,
  server: Record<Tier, TierLogPose> | undefined
): Record<Tier, TierLogPose> | undefined {
  if (!local && !server) return undefined;

  const merged = {} as Record<Tier, TierLogPose>;
  for (const tier of ALL_TIERS) {
    const localTier = local?.[tier];
    const serverTier = server?.[tier];
    merged[tier] =
      localTier && serverTier
        ? reconcileLogPose(localTier, serverTier)
        : (localTier ??
          serverTier ?? {
            charges: 0,
            earnedMilestones: [],
            consumptions: [],
          });
  }

  return merged;
}

function mergeAchievementEntry(
  local?: AchievementProgress,
  server?: AchievementProgress
): AchievementProgress {
  const left = local ?? server;
  const right = server ?? local;

  return {
    progress: Math.max(local?.progress ?? 0, server?.progress ?? 0),
    target: Math.max(local?.target ?? 0, server?.target ?? 0),
    status:
      local && server
        ? STATUS_RANK[local.status] >= STATUS_RANK[server.status]
          ? local.status
          : server.status
        : (left?.status ?? "locked"),
    ...(chooseEarlier(local?.unlockedAt, server?.unlockedAt)
      ? { unlockedAt: chooseEarlier(local?.unlockedAt, server?.unlockedAt) }
      : {}),
    lastUpdatedAt:
      chooseLater(local?.lastUpdatedAt, server?.lastUpdatedAt) ??
      left?.lastUpdatedAt ??
      right?.lastUpdatedAt ??
      "",
    ...(local?.seasonKey !== undefined || server?.seasonKey !== undefined
      ? { seasonKey: local?.seasonKey ?? server?.seasonKey }
      : {}),
  };
}

function mergeAchievementRecord(
  local: Record<AchievementId, AchievementProgress> | undefined,
  server: Record<AchievementId, AchievementProgress> | undefined
): Record<AchievementId, AchievementProgress> | undefined {
  if (!local && !server) return undefined;

  const ids = uniqueStrings([
    ...Object.keys(local ?? {}),
    ...Object.keys(server ?? {}),
  ]) as AchievementId[];

  const merged = {} as Record<AchievementId, AchievementProgress>;
  for (const id of ids) {
    merged[id] = mergeAchievementEntry(local?.[id], server?.[id]);
  }

  return merged;
}

function chooseMoreCompleteSeason(
  local: MonthlySeason | undefined,
  server: MonthlySeason | undefined
): Pick<
  MonthlySeason,
  "collectibleId" | "collectibleType" | "targetFragments"
> {
  if (!local && !server) {
    return {
      collectibleId: "",
      collectibleType: "bounty-poster",
      targetFragments: 24,
    };
  }

  if (!local) {
    return {
      collectibleId: server!.collectibleId,
      collectibleType: server!.collectibleType,
      targetFragments: server!.targetFragments,
    };
  }

  if (!server) {
    return {
      collectibleId: local.collectibleId,
      collectibleType: local.collectibleType,
      targetFragments: local.targetFragments,
    };
  }

  const score = (season: MonthlySeason): number =>
    Number(Boolean(season.collectibleId)) +
    Number(Boolean(season.collectibleType)) +
    Number(Number.isFinite(season.targetFragments)) +
    Number(Boolean(season.completedAt)) +
    season.revealedDays.length +
    season.revealedFragmentIndexes.length;

  const winner = score(local) >= score(server) ? local : server;

  return {
    collectibleId: winner.collectibleId,
    collectibleType: winner.collectibleType,
    targetFragments: winner.targetFragments,
  };
}

function recalculateFragmentIndexes(
  revealedDays: string[],
  targetFragments: number
): number[] {
  const count = Math.min(uniqueStrings(revealedDays).length, targetFragments);
  const indexes: number[] = [];

  for (let index = 0; index < count; index += 1) {
    indexes.push(index);
  }

  return indexes;
}

function mergeMonthlySeason(
  local: MonthlySeason | undefined,
  server: MonthlySeason | undefined
): MonthlySeason {
  const uniqueDays = uniqueStrings([
    ...(local?.revealedDays ?? []),
    ...(server?.revealedDays ?? []),
  ]);
  const picked = chooseMoreCompleteSeason(local, server);
  const targetFragments =
    Math.max(local?.targetFragments ?? 0, server?.targetFragments ?? 0) ||
    picked.targetFragments;
  const completedAt = chooseEarlier(local?.completedAt, server?.completedAt);

  return {
    collectibleId: picked.collectibleId,
    collectibleType: picked.collectibleType,
    targetFragments,
    revealedDays: uniqueDays,
    revealedFragmentIndexes: recalculateFragmentIndexes(
      uniqueDays,
      targetFragments
    ),
    ...(completedAt ? { completedAt } : {}),
  };
}

function mergeMonthlyCollectionsValue(
  local: MonthlyCollections | undefined,
  server: MonthlyCollections | undefined
): MonthlyCollections | undefined {
  if (!local && !server) return undefined;
  if (!local) return server;
  if (!server) return local;

  const seasonKeys = uniqueStrings([
    ...Object.keys(local.seasons),
    ...Object.keys(server.seasons),
  ]);

  const seasons: MonthlyCollections["seasons"] = {};
  for (const seasonKey of seasonKeys) {
    seasons[seasonKey] = mergeMonthlySeason(
      local.seasons[seasonKey],
      server.seasons[seasonKey]
    );
  }

  return {
    activeSeasonKey: local.activeSeasonKey || server.activeSeasonKey,
    seasons,
  };
}

function mergeMetaInbox(
  local: MetaInboxEntry[] | undefined,
  server: MetaInboxEntry[] | undefined
): MetaInboxEntry[] | undefined {
  if (!local && !server) return undefined;
  if (!local) return server;
  if (!server) return local;

  const merged: MetaInboxEntry[] = [];

  for (const entry of [...local, ...server]) {
    const index = merged.findIndex((candidate) => candidate.id === entry.id);
    if (index === -1) {
      merged.push({ ...entry });
      continue;
    }

    const current = merged[index];
    merged[index] = {
      ...current,
      ...entry,
      dismissedAt: current.dismissedAt ?? entry.dismissedAt,
    };
  }

  return merged;
}

export function reconcileTierProgression(
  local: TierProgression,
  server: TierProgression
): TierProgression {
  const sagaIds = uniqueStrings([
    ...Object.keys(local.sagas),
    ...Object.keys(server.sagas),
  ]) as SagaId[];

  const sagas = {} as Record<SagaId, SagaProgress>;
  for (const sagaId of sagaIds) {
    sagas[sagaId] = mergeSagaProgress(
      local.sagas[sagaId],
      server.sagas[sagaId]
    );
  }

  return {
    sagas,
    completedSagaCount: Object.values(sagas).filter((saga) =>
      Boolean(saga.completedAt)
    ).length,
  };
}

export function reconcileLogPose(
  local: TierLogPose,
  server: TierLogPose
): TierLogPose {
  const consumptions: LogPoseConsumption[] = [];

  for (const consumption of [...local.consumptions, ...server.consumptions]) {
    if (
      !consumptions.some(
        (item) => item.protectedDay === consumption.protectedDay
      )
    ) {
      consumptions.push({ ...consumption });
    }
  }

  return {
    charges: Math.max(local.charges, server.charges),
    earnedMilestones: uniqueNumbers([
      ...local.earnedMilestones,
      ...server.earnedMilestones,
    ]),
    lastEarnedAt: chooseEarlier(local.lastEarnedAt, server.lastEarnedAt),
    consumptions,
  };
}

export function reconcileAchievementProgress(
  local: Record<AchievementId, AchievementProgress>,
  server: Record<AchievementId, AchievementProgress>
): Record<AchievementId, AchievementProgress> {
  const ids = uniqueStrings([
    ...Object.keys(local),
    ...Object.keys(server),
  ]) as AchievementId[];

  const merged = {} as Record<AchievementId, AchievementProgress>;
  for (const id of ids) {
    merged[id] = mergeAchievementEntry(local[id], server[id]);
  }

  return merged;
}

export function reconcileMonthlyCollections(
  local: MonthlyCollections,
  server: MonthlyCollections
): MonthlyCollections {
  const seasonKeys = uniqueStrings([
    ...Object.keys(local.seasons),
    ...Object.keys(server.seasons),
  ]);

  const seasons: MonthlyCollections["seasons"] = {};
  for (const seasonKey of seasonKeys) {
    seasons[seasonKey] = mergeMonthlySeason(
      local.seasons[seasonKey],
      server.seasons[seasonKey]
    );
  }

  return {
    activeSeasonKey: local.activeSeasonKey || server.activeSeasonKey,
    seasons,
  };
}

export function reconcileProgression(
  local: StorageMetaFields,
  server: StorageMetaFields
): StorageMetaFields {
  return {
    progressionByTier: mergeTierProgressionMap(
      local.progressionByTier,
      server.progressionByTier
    ),
    logPoseByTier: mergeLogPoseMap(local.logPoseByTier, server.logPoseByTier),
    achievementProgress: mergeAchievementRecord(
      local.achievementProgress,
      server.achievementProgress
    ),
    monthlyCollections: mergeMonthlyCollectionsValue(
      local.monthlyCollections,
      server.monthlyCollections
    ),
    metaInbox: mergeMetaInbox(local.metaInbox, server.metaInbox),
  };
}
