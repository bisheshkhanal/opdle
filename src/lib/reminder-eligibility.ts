import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dailyResults,
  pushSubscriptions,
  reminderAudit,
  type DailyResult,
  type PushSubscription,
  type ReminderAudit,
} from "@/lib/db/schema";
import { getUTCDateString } from "./daily";
import type { Tier } from "./types";

export type ReminderReason =
  | "missing-user"
  | "no-subscription"
  | "app-opt-out"
  | "daily-completed"
  | "already-sent-today"
  | "weekday-timing"
  | "late-week-timing";

export interface ReminderEligibilityResult {
  eligible: boolean;
  reason: ReminderReason;
}

export interface ReminderEligibilityOptions {
  alreadySentToday?: boolean;
  requireLateWeek?: boolean;
}

export interface ReminderDispatchOptions {
  date?: string | Date;
  baseUrl?: string;
  dryRun?: boolean;
  requireLateWeek?: boolean;
  tiers?: Tier[];
}

export interface ReminderDispatchRecord {
  userId: string;
  tier: Tier;
  subscriptionId: string;
  deepLink: string;
  sentAt: Date;
}

export interface ReminderDispatchSummary {
  date: string;
  dispatched: ReminderDispatchRecord[];
  skipped: number;
}

type EligibleSubscription = Pick<
  PushSubscription,
  "id" | "userId" | "appOptIn" | "updatedAt"
>;
type EligibleDailyResult = Pick<DailyResult, "userId" | "date" | "tier">;
type AuditEntry = Pick<ReminderAudit, "userId" | "tier" | "date">;

const TIERS: Tier[] = ["casual", "fan", "nakama"];

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/g, "");

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getReminderBaseUrl(baseUrl?: string) {
  const candidate =
    baseUrl ??
    process.env.REMINDER_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ??
    "https://onepiecedle.app";

  return normalizeBaseUrl(candidate);
}

export function buildReminderDeepLink(
  baseUrl?: string,
  tier?: Tier,
  date?: string
) {
  const url = new URL("/", getReminderBaseUrl(baseUrl));
  url.searchParams.set("mode", "daily");

  if (tier) {
    url.searchParams.set("tier", tier);
  }

  if (date) {
    url.searchParams.set("date", date);
  }

  return url.toString();
}

function isLateWeekUtc(date: string) {
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return dayOfWeek >= 4 && dayOfWeek <= 6;
}

function hasCompletedDaily(
  dailyResultRows: EligibleDailyResult[],
  date: string
) {
  return dailyResultRows.some((row) => row.date === date);
}

export function computeEligibility(
  userId: string | null | undefined,
  date: string,
  subscriptions: EligibleSubscription[],
  dailyResultRows: EligibleDailyResult[],
  options: ReminderEligibilityOptions = {}
): ReminderEligibilityResult {
  if (!userId) {
    return { eligible: false, reason: "missing-user" };
  }

  if (subscriptions.length === 0) {
    return { eligible: false, reason: "no-subscription" };
  }

  if (!subscriptions.some((subscription) => subscription.appOptIn)) {
    return { eligible: false, reason: "app-opt-out" };
  }

  if (hasCompletedDaily(dailyResultRows, date)) {
    return { eligible: false, reason: "daily-completed" };
  }

  if (options.alreadySentToday) {
    return { eligible: false, reason: "already-sent-today" };
  }

  const lateWeek = isLateWeekUtc(date);

  if (options.requireLateWeek && !lateWeek) {
    return { eligible: false, reason: "weekday-timing" };
  }

  return {
    eligible: true,
    reason: lateWeek ? "late-week-timing" : "weekday-timing",
  };
}

async function loadReminderState(date: string) {
  const [subscriptions, completedDailyResults, auditRows] = await Promise.all([
    db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.appOptIn, true)),
    db.select().from(dailyResults).where(eq(dailyResults.date, date)),
    db.select().from(reminderAudit).where(eq(reminderAudit.date, date)),
  ]);

  return { subscriptions, completedDailyResults, auditRows };
}

function buildAuditLookup(auditRows: AuditEntry[]) {
  const lookup = new Set<string>();

  for (const auditRow of auditRows) {
    lookup.add(`${auditRow.userId}:${auditRow.tier}:${auditRow.date}`);
  }

  return lookup;
}

function groupDailyResultsByUserAndTier(
  dailyResultRows: EligibleDailyResult[]
) {
  const grouped = new Map<string, EligibleDailyResult[]>();

  for (const row of dailyResultRows) {
    const key = `${row.userId}:${row.tier}`;
    const rows = grouped.get(key) ?? [];
    rows.push(row);
    grouped.set(key, rows);
  }

  return grouped;
}

export async function dispatchReminders(
  options: ReminderDispatchOptions = {}
): Promise<ReminderDispatchSummary> {
  const date = getUTCDateString(
    typeof options.date === "string"
      ? new Date(`${options.date}T00:00:00.000Z`)
      : options.date
  );
  const baseUrl = getReminderBaseUrl(options.baseUrl);
  const tiers = options.tiers ?? TIERS;
  const { subscriptions, completedDailyResults, auditRows } =
    await loadReminderState(date);

  const activeSubscriptionByUser = new Map<string, EligibleSubscription>();
  for (const subscription of subscriptions) {
    const existing = activeSubscriptionByUser.get(subscription.userId);

    if (!existing || subscription.updatedAt > existing.updatedAt) {
      activeSubscriptionByUser.set(subscription.userId, subscription);
    }
  }

  const dailyResultLookup = groupDailyResultsByUserAndTier(
    completedDailyResults
  );
  const auditLookup = buildAuditLookup(auditRows);
  const dispatched: ReminderDispatchRecord[] = [];

  for (const [userId, subscription] of activeSubscriptionByUser) {
    for (const tier of tiers) {
      const dailyRows =
        dailyResultLookup.get(`${userId}:${tier}`) ??
        ([] as EligibleDailyResult[]);
      const alreadySentToday = auditLookup.has(`${userId}:${tier}:${date}`);
      const eligibility = computeEligibility(
        userId,
        date,
        [subscription],
        dailyRows,
        {
          alreadySentToday,
          requireLateWeek: options.requireLateWeek,
        }
      );

      if (!eligibility.eligible) {
        continue;
      }

      const deepLink = buildReminderDeepLink(baseUrl, tier, date);
      const sentAt = new Date();

      if (options.dryRun) {
        dispatched.push({
          userId,
          tier,
          subscriptionId: subscription.id,
          deepLink,
          sentAt,
        });
        continue;
      }

      const [inserted] = await db
        .insert(reminderAudit)
        .values({
          userId,
          subscriptionId: subscription.id,
          date,
          tier,
          sentAt,
          status: "sent",
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        dispatched.push({
          userId,
          tier,
          subscriptionId: subscription.id,
          deepLink,
          sentAt,
        });
      }
    }
  }

  return {
    date,
    dispatched,
    skipped: Math.max(
      0,
      activeSubscriptionByUser.size * tiers.length - dispatched.length
    ),
  };
}
