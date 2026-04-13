/**
 * Fake clock for testing time-dependent progression logic.
 * Wraps a controllable Date and provides UTC helpers.
 */
export class FakeClock {
  private currentDate: Date;

  constructor(initialDate: string | Date = "2026-04-13T12:00:00Z") {
    this.currentDate =
      typeof initialDate === "string"
        ? new Date(initialDate)
        : new Date(initialDate.getTime());
  }

  /** Get current fake time */
  now(): Date {
    return new Date(this.currentDate.getTime());
  }

  /** Advance by N milliseconds */
  advance(ms: number): void {
    this.currentDate = new Date(this.currentDate.getTime() + ms);
  }

  /** Advance by N days (in UTC) */
  advanceDays(days: number): void {
    this.advance(days * 24 * 60 * 60 * 1000);
  }

  /** Set to specific date */
  setDate(date: string | Date): void {
    this.currentDate =
      typeof date === "string" ? new Date(date) : new Date(date.getTime());
  }

  /** Get UTC day key */
  getDayKey(): string {
    return this.now().toISOString().split("T")[0];
  }

  /** Get UTC month key */
  getMonthKey(): string {
    return this.now().toISOString().slice(0, 7);
  }
}

export function createFrozenClock(isoDate: string): FakeClock {
  return new FakeClock(isoDate);
}

export function advanceToNextDay(clock: FakeClock): void {
  const now = clock.now();
  const nextDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  clock.setDate(nextDay);
}

export function advanceToNextMonth(clock: FakeClock): void {
  const now = clock.now();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  clock.setDate(nextMonth);
}
