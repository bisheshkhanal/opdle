import { beforeEach, describe, expect, it, vi } from "vitest";

type ReminderAuditRow = {
  id: string;
  userId: string;
  subscriptionId: string;
  date: string;
  tier: "casual" | "fan" | "nakama";
  sentAt: Date;
  status: string;
};

type SubscriptionRow = {
  id: string;
  userId: string;
  appOptIn: boolean;
  updatedAt: Date;
};

type DailyResultRow = {
  userId: string;
  date: string;
  tier: "casual" | "fan" | "nakama";
};

type Condition =
  | { type: "eq"; left: string; right: unknown }
  | { type: "and"; conditions: Condition[] };

const { mockEq, mockDb, audits, subscriptions, results, tables } = vi.hoisted(
  () => {
    const audits: ReminderAuditRow[] = [];
    const subscriptions: SubscriptionRow[] = [];
    const results: DailyResultRow[] = [];
    const tables = {
      pushSubscriptions: {
        id: "id",
        userId: "userId",
        appOptIn: "appOptIn",
        updatedAt: "updatedAt",
      },
      dailyResults: {
        userId: "userId",
        date: "date",
        tier: "tier",
      },
      reminderAudit: {
        id: "id",
        userId: "userId",
        subscriptionId: "subscriptionId",
        date: "date",
        tier: "tier",
        sentAt: "sentAt",
        status: "status",
      },
    };

    const mockEq = vi.fn(
      (left: string, right: unknown): Condition => ({
        type: "eq",
        left,
        right,
      })
    );

    const matches = (
      row: Record<string, unknown>,
      condition: Condition
    ): boolean => {
      if (condition.type === "eq") {
        return row[condition.left] === condition.right;
      }

      return condition.conditions.every((item) => matches(row, item));
    };

    const cloneAudit = (row: ReminderAuditRow): ReminderAuditRow => ({
      ...row,
      sentAt: new Date(row.sentAt),
    });

    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn(async (condition: Condition) => {
            if (table === tables.pushSubscriptions) {
              return subscriptions.filter((row) => matches(row, condition));
            }

            if (table === tables.dailyResults) {
              return results.filter((row) => matches(row, condition));
            }

            if (table === tables.reminderAudit) {
              return audits
                .filter((row) => matches(row, condition))
                .map(cloneAudit);
            }

            return [];
          }),
        })),
      })),
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((values: Omit<ReminderAuditRow, "id">) => ({
          onConflictDoNothing: vi.fn(() => ({
            returning: vi.fn(async () => {
              if (table !== tables.reminderAudit) {
                return [];
              }

              const existingIndex = audits.findIndex(
                (row) =>
                  row.userId === values.userId &&
                  row.date === values.date &&
                  row.tier === values.tier
              );

              if (existingIndex >= 0) {
                return [];
              }

              const nextRow: ReminderAuditRow = {
                id: `audit-${audits.length + 1}`,
                ...values,
              };
              audits.push(nextRow);
              return [cloneAudit(nextRow)];
            }),
          })),
        })),
      })),
    };

    return { mockEq, mockDb, audits, subscriptions, results, tables };
  }
);

vi.mock("drizzle-orm", () => ({
  eq: mockEq,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  dailyResults: tables.dailyResults,
  pushSubscriptions: tables.pushSubscriptions,
  reminderAudit: tables.reminderAudit,
}));

describe("reminder eligibility", () => {
  beforeEach(() => {
    mockEq.mockClear();
    subscriptions.splice(0, subscriptions.length);
    results.splice(0, results.length);
    audits.splice(0, audits.length);
  });

  it("rejects users without a subscription", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(computeEligibility("user-1", "2026-04-13", [], [], {})).toEqual({
      eligible: false,
      reason: "no-subscription",
    });
  });

  it("rejects subscriptions with appOptIn disabled", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(
      computeEligibility(
        "user-1",
        "2026-04-13",
        [
          {
            id: "sub-1",
            userId: "user-1",
            appOptIn: false,
            updatedAt: new Date("2026-04-13T00:00:00.000Z"),
          },
        ],
        []
      )
    ).toEqual({ eligible: false, reason: "app-opt-out" });
  });

  it("rejects when the daily is already completed", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(
      computeEligibility(
        "user-1",
        "2026-04-13",
        [
          {
            id: "sub-1",
            userId: "user-1",
            appOptIn: true,
            updatedAt: new Date("2026-04-13T00:00:00.000Z"),
          },
        ],
        [{ userId: "user-1", date: "2026-04-13", tier: "casual" }]
      )
    ).toEqual({ eligible: false, reason: "daily-completed" });
  });

  it("rejects when a reminder was already sent today", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(
      computeEligibility(
        "user-1",
        "2026-04-13",
        [
          {
            id: "sub-1",
            userId: "user-1",
            appOptIn: true,
            updatedAt: new Date("2026-04-13T00:00:00.000Z"),
          },
        ],
        [],
        { alreadySentToday: true }
      )
    ).toEqual({ eligible: false, reason: "already-sent-today" });
  });

  it("accepts a normal weekday when the daily is incomplete", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(
      computeEligibility(
        "user-1",
        "2026-04-13",
        [
          {
            id: "sub-1",
            userId: "user-1",
            appOptIn: true,
            updatedAt: new Date("2026-04-13T00:00:00.000Z"),
          },
        ],
        []
      )
    ).toEqual({ eligible: true, reason: "weekday-timing" });
  });

  it("accepts late-week reminders for Thu-Sat UTC dates", async () => {
    const { computeEligibility } = await import("../reminder-eligibility");

    expect(
      computeEligibility(
        "user-1",
        "2026-04-16",
        [
          {
            id: "sub-1",
            userId: "user-1",
            appOptIn: true,
            updatedAt: new Date("2026-04-16T00:00:00.000Z"),
          },
        ],
        []
      )
    ).toEqual({ eligible: true, reason: "late-week-timing" });
  });

  it("dispatches once per user-tier-day even when run twice", async () => {
    subscriptions.push({
      id: "sub-1",
      userId: "user-1",
      appOptIn: true,
      updatedAt: new Date("2026-04-13T00:00:00.000Z"),
    });

    const { dispatchReminders } = await import("../reminder-eligibility");

    const firstRun = await dispatchReminders({
      date: "2026-04-13",
      baseUrl: "https://onepiecedle.app",
      dryRun: false,
      tiers: ["casual"],
    });

    const secondRun = await dispatchReminders({
      date: "2026-04-13",
      baseUrl: "https://onepiecedle.app",
      dryRun: false,
      tiers: ["casual"],
    });

    expect(firstRun.dispatched).toHaveLength(1);
    expect(firstRun.dispatched[0]?.deepLink).toBe(
      "https://onepiecedle.app/?mode=daily&tier=casual&date=2026-04-13"
    );
    expect(secondRun.dispatched).toHaveLength(0);
    expect(audits).toHaveLength(1);
  });
});
