import type { TierLogPose, LogPoseConsumption, Tier } from "@/lib/types";
import { getUtcDayKey, isNextUtcDay } from "./clock";

const LOG_POSE_CAP = 2;
const STREAK_MILESTONE_STEP = 7;
const LOG_POSE_SOURCES: Record<Tier, LogPoseConsumption["source"]> = {
  casual: "streak-7",
  fan: "streak-7",
  nakama: "streak-7",
};

function cloneLogPose(logPose: TierLogPose): TierLogPose {
  return {
    charges: logPose.charges,
    earnedMilestones: [...logPose.earnedMilestones],
    ...(logPose.lastEarnedAt ? { lastEarnedAt: logPose.lastEarnedAt } : {}),
    consumptions: logPose.consumptions.map((consumption) => ({
      ...consumption,
    })),
  };
}

function createUtcDateFromKey(dayKey: string): Date {
  return {
    getTime: () => Date.parse(`${dayKey}T00:00:00.000Z`),
  } as Date;
}

function isNextUtcDayKey(afterDayKey: string, beforeDayKey: string): boolean {
  return isNextUtcDay(
    createUtcDateFromKey(afterDayKey),
    createUtcDateFromKey(beforeDayKey)
  );
}

function isMissedGap(lastPlayedDayKey: string, currentDayKey: string): boolean {
  if (currentDayKey <= lastPlayedDayKey) {
    return false;
  }

  return !isNextUtcDayKey(currentDayKey, lastPlayedDayKey);
}

function getMilestone(currentStreak: number): number | null {
  if (currentStreak < STREAK_MILESTONE_STEP) {
    return null;
  }

  if (currentStreak % STREAK_MILESTONE_STEP !== 0) {
    return null;
  }

  return currentStreak;
}

function getMostRecentConsumption(
  consumptions: LogPoseConsumption[]
): LogPoseConsumption | null {
  if (consumptions.length === 0) {
    return null;
  }

  let mostRecent = consumptions[0];
  let mostRecentTime = Date.parse(mostRecent.consumedAt);

  for (let index = 1; index < consumptions.length; index += 1) {
    const consumption = consumptions[index];
    const consumedAt = Date.parse(consumption.consumedAt);

    if (consumedAt >= mostRecentTime) {
      mostRecent = consumption;
      mostRecentTime = consumedAt;
    }
  }

  return mostRecent;
}

export function createEmptyLogPose(): TierLogPose {
  return {
    charges: 0,
    earnedMilestones: [],
    consumptions: [],
  };
}

export function checkAndEarnCharge(
  logPose: TierLogPose,
  currentStreak: number,
  now: Date
): { logPose: TierLogPose; earnedCharge: boolean } {
  const milestone = getMilestone(currentStreak);
  const nextLogPose = cloneLogPose(logPose);
  void getUtcDayKey(now);

  if (
    milestone === null ||
    nextLogPose.earnedMilestones.includes(milestone) ||
    nextLogPose.charges >= LOG_POSE_CAP
  ) {
    return { logPose: nextLogPose, earnedCharge: false };
  }

  nextLogPose.charges += 1;
  nextLogPose.earnedMilestones.push(milestone);
  nextLogPose.lastEarnedAt = now.toISOString();

  return { logPose: nextLogPose, earnedCharge: true };
}

export function checkMissedDayAndProtect(
  logPose: TierLogPose,
  lastPlayedDayKey: string,
  currentDayKey: string,
  autoUseEnabled: boolean,
  now: Date
): { logPose: TierLogPose; wasProtected: boolean; streakSurvived: boolean } {
  const nextLogPose = cloneLogPose(logPose);

  if (!isMissedGap(lastPlayedDayKey, currentDayKey)) {
    return {
      logPose: nextLogPose,
      wasProtected: false,
      streakSurvived: true,
    };
  }

  if (!autoUseEnabled || nextLogPose.charges <= 0) {
    return {
      logPose: nextLogPose,
      wasProtected: false,
      streakSurvived: false,
    };
  }

  const protectedDay = `${lastPlayedDayKey}+1`;
  nextLogPose.charges -= 1;
  nextLogPose.consumptions.push({
    protectedDay,
    consumedAt: now.toISOString(),
    source: LOG_POSE_SOURCES.casual,
  });

  return {
    logPose: nextLogPose,
    wasProtected: true,
    streakSurvived: true,
  };
}

export function getChargeCount(logPose: TierLogPose): number {
  return logPose.charges;
}

export function getLastProtectedDay(logPose: TierLogPose): string | null {
  const consumption = getMostRecentConsumption(logPose.consumptions);
  return consumption ? consumption.protectedDay : null;
}
