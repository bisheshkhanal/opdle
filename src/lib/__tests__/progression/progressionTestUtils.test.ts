import { describe, expect, it } from "vitest";
import {
  advanceToNextDay,
  advanceToNextMonth,
  createFrozenClock,
  FakeClock,
} from "../../../test/fakeClock";
import {
  createEmptyStorage,
  createStorageWithDailyWin,
  createStorageWithStreak,
} from "../../../test/progressionFixtures";

describe("progression test utilities", () => {
  it("creates a frozen clock with the expected day key", () => {
    const clock = createFrozenClock("2026-04-13T12:00:00Z");

    expect(clock.now().toISOString()).toBe("2026-04-13T12:00:00.000Z");
    expect(clock.getDayKey()).toBe("2026-04-13");
    expect(clock.getMonthKey()).toBe("2026-04");
  });

  it("advances by one day without needing global fake timers", () => {
    const clock = createFrozenClock("2026-04-13T12:00:00Z");

    clock.advanceDays(1);

    expect(clock.now().toISOString()).toBe("2026-04-14T12:00:00.000Z");
  });

  it("advances across a month boundary and updates the month key", () => {
    const clock = createFrozenClock("2026-04-30T12:00:00Z");

    clock.advanceDays(1);

    expect(clock.now().toISOString()).toBe("2026-05-01T12:00:00.000Z");
    expect(clock.getMonthKey()).toBe("2026-05");
  });

  it("advances to the next day at midnight UTC", () => {
    const clock = createFrozenClock("2026-04-13T12:00:00Z");

    advanceToNextDay(clock);

    expect(clock.now().toISOString()).toBe("2026-04-14T00:00:00.000Z");
    expect(clock.getDayKey()).toBe("2026-04-14");
  });

  it("advances to the next month at midnight UTC", () => {
    const clock = createFrozenClock("2026-04-13T12:00:00Z");

    advanceToNextMonth(clock);

    expect(clock.now().toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(clock.getDayKey()).toBe("2026-05-01");
    expect(clock.getMonthKey()).toBe("2026-05");
  });

  it("creates valid empty storage for progression fixtures", () => {
    const storage = createEmptyStorage();

    expect(storage.version).toBe(3);
    expect(storage.tier).toBe("casual");
    expect(storage.hasSelectedTier).toBe(true);
    expect(storage.daily).toEqual({});
    expect(storage.infinite.casual.roundId).toBe("test");
    expect(storage.dailyStats.nakama.maxStreak).toBe(0);
    expect(storage.infiniteStats.fan.totalGames).toBe(0);
  });

  it("creates a daily win fixture for the requested tier and date", () => {
    const storage = createStorageWithDailyWin("fan", "2026-04-13", "zoro", 4);
    const dailyState = storage.daily["fan:2026-04-13"];

    expect(dailyState).toBeDefined();
    expect(dailyState.date).toBe("2026-04-13");
    expect(dailyState.isWon).toBe(true);
    expect(dailyState.guessedIds).toEqual(["zoro"]);
    expect(storage.dailyStats.fan.streak).toBe(4);
    expect(storage.dailyStats.fan.winDistribution).toEqual({ 1: 1 });
  });

  it("creates a streak fixture with consecutive daily wins", () => {
    const storage = createStorageWithStreak(
      "nakama",
      3,
      "2026-04-13T12:00:00Z"
    );

    expect(storage.daily["nakama:2026-04-13"].streak).toBe(1);
    expect(storage.daily["nakama:2026-04-14"].streak).toBe(2);
    expect(storage.daily["nakama:2026-04-15"].streak).toBe(3);
    expect(storage.dailyStats.nakama.maxStreak).toBe(3);
  });

  it("keeps fake clock instances independent", () => {
    const first = new FakeClock("2026-04-13T12:00:00Z");
    const second = new FakeClock("2026-04-20T12:00:00Z");

    first.advanceDays(1);

    expect(first.getDayKey()).toBe("2026-04-14");
    expect(second.getDayKey()).toBe("2026-04-20");
    expect(second.now().toISOString()).toBe("2026-04-20T12:00:00.000Z");
  });

  it("returns cloned dates from now() so callers cannot mutate internal state", () => {
    const clock = new FakeClock("2026-04-13T12:00:00Z");
    const snapshot = clock.now();

    snapshot.setUTCDate(20);

    expect(clock.getDayKey()).toBe("2026-04-13");
  });
});
