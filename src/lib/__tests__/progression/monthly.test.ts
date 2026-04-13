import { describe, expect, it } from "vitest";
import { getUtcDayNumber } from "../../progression/clock";
import {
  createEmptyMonthlyCollections,
  getActiveSeason,
  getArchivedSeasons,
  isMonthlyComplete,
  recordDailyWinForMonthly,
} from "../../progression/monthly";

describe("monthly progression", () => {
  it("adds only one fragment for the same UTC day", () => {
    const day = new Date("2026-04-12T08:00:00Z");

    const first = recordDailyWinForMonthly(
      createEmptyMonthlyCollections(),
      day
    );
    const second = recordDailyWinForMonthly(
      first,
      new Date("2026-04-12T23:59:59Z")
    );

    expect(second).toBe(first);
    expect(getActiveSeason(second)?.revealedDays).toEqual(["2026-04-12"]);
    expect(getActiveSeason(second)?.revealedFragmentIndexes).toHaveLength(1);
  });

  it("archives the old season when moving into a new month", () => {
    let collections = createEmptyMonthlyCollections();

    collections = recordDailyWinForMonthly(
      collections,
      new Date("2026-04-30T12:00:00Z")
    );
    collections = recordDailyWinForMonthly(
      collections,
      new Date("2026-05-01T12:00:00Z")
    );

    expect(getActiveSeason(collections)?.collectibleType).toBe("bounty-poster");
    expect(collections.activeSeasonKey).toBe("2026-05");
    expect(getArchivedSeasons(collections)).toEqual([
      {
        seasonKey: "2026-04",
        season: expect.objectContaining({ collectibleType: "vivre-card" }),
      },
    ]);
  });

  it("completes after 24 unique win days", () => {
    let collections = createEmptyMonthlyCollections();

    for (let day = 1; day <= 24; day += 1) {
      collections = recordDailyWinForMonthly(
        collections,
        new Date(`2026-04-${String(day).padStart(2, "0")}T12:00:00Z`)
      );
    }

    const activeSeason = getActiveSeason(collections);

    expect(activeSeason?.revealedDays).toHaveLength(24);
    expect(activeSeason?.revealedFragmentIndexes).toHaveLength(24);
    expect(activeSeason?.completedAt).toBeDefined();
    expect(isMonthlyComplete(collections)).toBe(true);
  });

  it("uses a deterministic fragment index from the UTC day number", () => {
    const date = new Date("2026-04-12T00:00:00Z");
    const collections = recordDailyWinForMonthly(
      createEmptyMonthlyCollections(),
      date
    );

    expect(getActiveSeason(collections)?.revealedFragmentIndexes).toEqual([
      getUtcDayNumber(date) % 24,
    ]);
  });

  it("returns archived seasons newest first", () => {
    let collections = createEmptyMonthlyCollections();

    collections = recordDailyWinForMonthly(
      collections,
      new Date("2026-03-15T12:00:00Z")
    );
    collections = recordDailyWinForMonthly(
      collections,
      new Date("2026-04-15T12:00:00Z")
    );
    collections = recordDailyWinForMonthly(
      collections,
      new Date("2026-05-15T12:00:00Z")
    );

    expect(
      getArchivedSeasons(collections).map(({ seasonKey }) => seasonKey)
    ).toEqual(["2026-04", "2026-03"]);
  });

  it("returns null for an empty active season", () => {
    expect(getActiveSeason(createEmptyMonthlyCollections())).toBeNull();
  });
});
