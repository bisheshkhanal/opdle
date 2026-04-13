import { describe, expect, it } from "vitest";
import {
  checkAndEarnCharge,
  checkMissedDayAndProtect,
  createEmptyLogPose,
  getChargeCount,
  getLastProtectedDay,
} from "../../progression/logPose";
import type { TierLogPose } from "../../types";

function createLogPose(overrides: Partial<TierLogPose> = {}): TierLogPose {
  return {
    ...createEmptyLogPose(),
    ...overrides,
    earnedMilestones: overrides.earnedMilestones
      ? [...overrides.earnedMilestones]
      : [],
    consumptions: overrides.consumptions ? [...overrides.consumptions] : [],
  };
}

describe("progression log pose", () => {
  it("earns a charge at a 7-day streak", () => {
    const now = new Date("2026-04-07T12:00:00Z");

    const result = checkAndEarnCharge(createEmptyLogPose(), 7, now);

    expect(result.earnedCharge).toBe(true);
    expect(result.logPose.charges).toBe(1);
    expect(result.logPose.earnedMilestones).toEqual([7]);
    expect(result.logPose.lastEarnedAt).toBe(now.toISOString());
  });

  it("earns a second charge at 14 days and caps at two", () => {
    const first = checkAndEarnCharge(
      createEmptyLogPose(),
      7,
      new Date("2026-04-07T12:00:00Z")
    ).logPose;

    const second = checkAndEarnCharge(
      first,
      14,
      new Date("2026-04-14T12:00:00Z")
    );

    const capped = checkAndEarnCharge(
      second.logPose,
      21,
      new Date("2026-04-21T12:00:00Z")
    );

    expect(second.earnedCharge).toBe(true);
    expect(second.logPose.charges).toBe(2);
    expect(second.logPose.earnedMilestones).toEqual([7, 14]);
    expect(capped.earnedCharge).toBe(false);
    expect(capped.logPose.charges).toBe(2);
    expect(capped.logPose.earnedMilestones).toEqual([7, 14]);
  });

  it("does not earn a duplicate charge for the same milestone", () => {
    const initial = checkAndEarnCharge(
      createEmptyLogPose(),
      7,
      new Date("2026-04-07T12:00:00Z")
    ).logPose;

    const duplicate = checkAndEarnCharge(
      initial,
      7,
      new Date("2026-04-08T12:00:00Z")
    );

    expect(duplicate.earnedCharge).toBe(false);
    expect(duplicate.logPose.charges).toBe(1);
    expect(duplicate.logPose.earnedMilestones).toEqual([7]);
  });

  it("protects a missed day when a charge is available and auto-use is enabled", () => {
    const logPose = createLogPose({ charges: 1 });

    const result = checkMissedDayAndProtect(
      logPose,
      "2026-04-13",
      "2026-04-15",
      true,
      new Date("2026-04-15T12:00:00Z")
    );

    expect(result.wasProtected).toBe(true);
    expect(result.streakSurvived).toBe(true);
    expect(result.logPose.charges).toBe(0);
    expect(result.logPose.consumptions).toHaveLength(1);
    expect(result.logPose.consumptions[0]).toEqual({
      protectedDay: "2026-04-13+1",
      consumedAt: "2026-04-15T12:00:00.000Z",
      source: "streak-7",
    });
  });

  it("breaks the streak on a missed day with no charges", () => {
    const result = checkMissedDayAndProtect(
      createEmptyLogPose(),
      "2026-04-13",
      "2026-04-15",
      true,
      new Date("2026-04-15T12:00:00Z")
    );

    expect(result.wasProtected).toBe(false);
    expect(result.streakSurvived).toBe(false);
    expect(result.logPose.charges).toBe(0);
    expect(result.logPose.consumptions).toEqual([]);
  });

  it("breaks the streak when auto-use is disabled even with charges", () => {
    const result = checkMissedDayAndProtect(
      createLogPose({ charges: 1 }),
      "2026-04-13",
      "2026-04-15",
      false,
      new Date("2026-04-15T12:00:00Z")
    );

    expect(result.wasProtected).toBe(false);
    expect(result.streakSurvived).toBe(false);
    expect(result.logPose.charges).toBe(1);
    expect(result.logPose.consumptions).toEqual([]);
  });

  it("does not retroactively repair a broken streak after a later-earned charge", () => {
    const broken = checkMissedDayAndProtect(
      createEmptyLogPose(),
      "2026-04-13",
      "2026-04-15",
      true,
      new Date("2026-04-15T12:00:00Z")
    );

    const earnedLater = checkAndEarnCharge(
      broken.logPose,
      7,
      new Date("2026-04-16T12:00:00Z")
    );

    expect(broken.streakSurvived).toBe(false);
    expect(earnedLater.earnedCharge).toBe(true);
    expect(earnedLater.logPose.charges).toBe(1);
    expect(getLastProtectedDay(earnedLater.logPose)).toBeNull();
  });

  it("returns the most recent protected day", () => {
    const logPose = createLogPose({
      consumptions: [
        {
          protectedDay: "2026-04-13+1",
          consumedAt: "2026-04-14T12:00:00.000Z",
          source: "streak-7",
        },
        {
          protectedDay: "2026-04-20+1",
          consumedAt: "2026-04-21T12:00:00.000Z",
          source: "streak-7",
        },
      ],
    });

    expect(getLastProtectedDay(logPose)).toBe("2026-04-20+1");
  });

  it("protects only the first day in a multi-day gap", () => {
    const result = checkMissedDayAndProtect(
      createLogPose({ charges: 1 }),
      "2026-04-13",
      "2026-04-16",
      true,
      new Date("2026-04-16T12:00:00Z")
    );

    expect(result.wasProtected).toBe(true);
    expect(result.streakSurvived).toBe(true);
    expect(result.logPose.charges).toBe(0);
    expect(getLastProtectedDay(result.logPose)).toBe("2026-04-13+1");
    expect(getChargeCount(result.logPose)).toBe(0);
  });
});
