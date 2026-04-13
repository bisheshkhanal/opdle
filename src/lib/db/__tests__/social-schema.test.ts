import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  challengeAttempts,
  challengeEntities,
  challengePackEntries,
  challengePacks,
  factionMemberships,
  weeklyFactionAggregates,
} from "../schema";

function isIsoWeekKey(value: string): boolean {
  return /^\d{4}-W\d{2}$/.test(value);
}

function createUniqueAttemptStore() {
  const rows: Array<typeof challengeAttempts.$inferInsert> = [];
  const uniqueKeys = new Set<string>();

  return {
    insert(row: typeof challengeAttempts.$inferInsert) {
      const key = `${row.challengeId}:${row.userId}`;

      if (uniqueKeys.has(key)) {
        throw new Error(
          "unique constraint violation on challenge_id + user_id"
        );
      }

      uniqueKeys.add(key);
      rows.push({ ...row });

      return rows[rows.length - 1];
    },
  };
}

describe("social schema tables", () => {
  it("exposes faction membership columns and the user uniqueness index", () => {
    const config = getTableConfig(factionMemberships);

    const insertRow = {
      userId: "550e8400-e29b-41d4-a716-446655440000",
      factionSlug: "pirates",
      joinedAt: new Date("2026-04-13T00:00:00.000Z"),
      snapshotAt: new Date("2026-04-13T00:00:00.000Z"),
    } satisfies typeof factionMemberships.$inferInsert;

    const selectRow = {
      ...insertRow,
    } satisfies typeof factionMemberships.$inferSelect;

    expect(factionMemberships.userId).toBeDefined();
    expect(factionMemberships.factionSlug).toBeDefined();
    expect(factionMemberships.joinedAt).toBeDefined();
    expect(factionMemberships.snapshotAt).toBeDefined();
    expect(config.indexes.length).toBeGreaterThan(0);
    expect(selectRow).toEqual(insertRow);
  });

  it("exposes challenge entities with slug uniqueness and status lookup indexes", () => {
    const config = getTableConfig(challengeEntities);

    const insertRow = {
      creatorUserId: null,
      slug: "week-1-luffy",
      title: "Week 1: Luffy",
      description: "A starter challenge",
      tierLevel: 1,
      status: "active",
      expiresAt: null,
    } satisfies typeof challengeEntities.$inferInsert;

    const selectRow = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      creatorUserId: null,
      slug: "week-1-luffy",
      title: "Week 1: Luffy",
      description: "A starter challenge",
      tierLevel: 1,
      status: "active",
      createdAt: new Date("2026-04-13T00:00:00.000Z"),
      expiresAt: null,
    } satisfies typeof challengeEntities.$inferSelect;

    expect(challengeEntities.id).toBeDefined();
    expect(challengeEntities.slug).toBeDefined();
    expect(challengeEntities.status).toBeDefined();
    expect(config.indexes.length).toBeGreaterThan(0);
    expect(selectRow.slug).toBe(insertRow.slug);
  });

  it("rejects duplicate challenge attempts for the same user and challenge", () => {
    const store = createUniqueAttemptStore();

    const firstAttempt = {
      challengeId: "550e8400-e29b-41d4-a716-446655440002",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      guessCount: 3,
      solvedAt: new Date("2026-04-13T00:10:00.000Z"),
      guessesSerialized: '[{"guess":"luffy"}]',
      factionSnapshotAtSubmit: "pirates",
    } satisfies typeof challengeAttempts.$inferInsert;

    const stored = store.insert(firstAttempt);
    firstAttempt.factionSnapshotAtSubmit = "marines";

    expect(stored.factionSnapshotAtSubmit).toBe("pirates");
    expect(() =>
      store.insert({ ...firstAttempt, factionSnapshotAtSubmit: "pirates" })
    ).toThrow(/unique constraint/i);
  });

  it("exposes challenge pack rows and ordered pack entries", () => {
    const packConfig = getTableConfig(challengePacks);
    const entryConfig = getTableConfig(challengePackEntries);

    const packRow = {
      slug: "week-1",
      title: "Week 1",
      description: "First pack",
      status: "draft",
    } satisfies typeof challengePacks.$inferInsert;

    const packSelectRow = {
      id: "550e8400-e29b-41d4-a716-446655440003",
      ...packRow,
      createdAt: new Date("2026-04-13T00:00:00.000Z"),
    } satisfies typeof challengePacks.$inferSelect;

    const entryRow = {
      packId: "550e8400-e29b-41d4-a716-446655440003",
      challengeId: "550e8400-e29b-41d4-a716-446655440002",
      orderIndex: 1,
    } satisfies typeof challengePackEntries.$inferInsert;

    expect(challengePacks.slug).toBeDefined();
    expect(challengePackEntries.packId).toBeDefined();
    expect(packConfig.indexes.length).toBeGreaterThan(0);
    expect(entryConfig.indexes.length).toBeGreaterThan(0);
    expect(packSelectRow.slug).toBe(packRow.slug);
    expect(entryRow.orderIndex).toBe(1);
  });

  it("accepts valid ISO week keys for weekly faction aggregates", () => {
    const config = getTableConfig(weeklyFactionAggregates);

    const row = {
      weekKey: "2026-W15",
      factionSlug: "revolutionary",
      totalPoints: 120,
      avgGuesses: 3.4,
      participantCount: 18,
      updatedAt: new Date("2026-04-13T00:00:00.000Z"),
    } satisfies typeof weeklyFactionAggregates.$inferInsert;

    const selectRow = {
      ...row,
    } satisfies typeof weeklyFactionAggregates.$inferSelect;

    expect(weeklyFactionAggregates.weekKey).toBeDefined();
    expect(config.indexes.length).toBeGreaterThan(0);
    expect(isIsoWeekKey(row.weekKey)).toBe(true);
    expect(isIsoWeekKey(selectRow.weekKey)).toBe(true);
  });
});
