import { describe, expect, it } from "vitest";
import {
  getUtcDayKey,
  getUtcMonthKey,
  getUtcWeekKey,
  getUtcDayNumber,
  isNextUtcDay,
} from "../../progression/clock";

describe("progression clock", () => {
  it("formats UTC day and month keys across midnight", () => {
    const beforeMidnight = new Date("2026-04-30T23:59:59Z");
    const afterMidnight = new Date("2026-05-01T00:00:00Z");

    expect(getUtcDayKey(beforeMidnight)).toBe("2026-04-30");
    expect(getUtcMonthKey(beforeMidnight)).toBe("2026-04");
    expect(getUtcDayKey(afterMidnight)).toBe("2026-05-01");
    expect(getUtcMonthKey(afterMidnight)).toBe("2026-05");
  });

  it("formats ISO week keys", () => {
    expect(getUtcWeekKey(new Date("2026-04-30T23:59:59Z"))).toBe("2026-W18");
    expect(getUtcWeekKey(new Date("2026-05-01T00:00:00Z"))).toBe("2026-W18");
  });

  it("detects consecutive UTC days", () => {
    const before = new Date("2026-04-30T12:00:00Z");
    const after = new Date("2026-05-01T08:00:00Z");
    const notNext = new Date("2026-05-02T00:00:00Z");

    expect(isNextUtcDay(after, before)).toBe(true);
    expect(isNextUtcDay(notNext, before)).toBe(false);
  });

  it("returns consistent UTC day numbers", () => {
    const date = new Date("2026-05-01T00:00:00Z");

    expect(getUtcDayNumber(date)).toBe(
      getUtcDayNumber(new Date("2026-05-01T23:59:59Z"))
    );
    expect(getUtcDayNumber(new Date("1970-01-01T00:00:00Z"))).toBe(0);
  });
});
