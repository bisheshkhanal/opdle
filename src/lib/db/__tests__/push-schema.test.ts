import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { pushSubscriptions, reminderAudit } from "../schema";
import {
  pushSubscriptionCreateSchema,
  pushSubscriptionDeleteSchema,
  pushSubscriptionUpdateSchema,
  reminderDispatchSchema,
} from "../../validators";

describe("push subscription schema", () => {
  it("declares the expected subscription columns and uniqueness", () => {
    const config = getTableConfig(pushSubscriptions);

    expect(pushSubscriptions.id).toBeDefined();
    expect(pushSubscriptions.userId).toBeDefined();
    expect(pushSubscriptions.endpoint).toBeDefined();
    expect(pushSubscriptions.p256dhKey).toBeDefined();
    expect(pushSubscriptions.authKey).toBeDefined();
    expect(pushSubscriptions.userAgent).toBeDefined();
    expect(pushSubscriptions.timezone).toBeDefined();
    expect(pushSubscriptions.utcOffset).toBeDefined();
    expect(pushSubscriptions.appOptIn).toBeDefined();
    expect(pushSubscriptions.createdAt).toBeDefined();
    expect(pushSubscriptions.updatedAt).toBeDefined();

    expect(config.foreignKeys.length).toBeGreaterThan(0);
    expect(config.indexes.length).toBeGreaterThan(0);
  });

  it("declares the expected reminder audit columns and dedupe constraint", () => {
    const config = getTableConfig(reminderAudit);

    expect(reminderAudit.id).toBeDefined();
    expect(reminderAudit.userId).toBeDefined();
    expect(reminderAudit.subscriptionId).toBeDefined();
    expect(reminderAudit.date).toBeDefined();
    expect(reminderAudit.tier).toBeDefined();
    expect(reminderAudit.sentAt).toBeDefined();
    expect(reminderAudit.status).toBeDefined();

    expect(config.foreignKeys.length).toBeGreaterThanOrEqual(2);
    expect(config.indexes.length).toBeGreaterThan(0);
    expect(config.checks.length).toBeGreaterThan(0);
  });
});

describe("push subscription validators", () => {
  const validSubscription = {
    endpoint: "https://push.example.com/abc",
    keys: {
      p256dh: "dGVzdC1wMjU2ZGg=",
      auth: "dGVzdC1hdXRo",
    },
    timezone: "Asia/Kolkata",
    utcOffset: 330,
  };

  it("accepts valid create, update, delete, and dispatch payloads", () => {
    expect(pushSubscriptionCreateSchema.parse(validSubscription)).toEqual(
      validSubscription
    );
    expect(
      pushSubscriptionUpdateSchema.parse({
        endpoint: validSubscription.endpoint,
        appOptIn: true,
      })
    ).toEqual({ endpoint: validSubscription.endpoint, appOptIn: true });
    expect(
      pushSubscriptionDeleteSchema.parse({
        endpoint: validSubscription.endpoint,
      })
    ).toEqual({ endpoint: validSubscription.endpoint });
    expect(
      reminderDispatchSchema.parse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        subscriptionId: "550e8400-e29b-41d4-a716-446655440001",
        date: "2026-03-30",
        tier: "casual",
        sentAt: new Date("2026-03-30T00:00:00.000Z"),
        status: "sent",
      })
    ).toEqual({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      subscriptionId: "550e8400-e29b-41d4-a716-446655440001",
      date: "2026-03-30",
      tier: "casual",
      sentAt: new Date("2026-03-30T00:00:00.000Z"),
      status: "sent",
    });
  });

  it("rejects malformed subscription payloads", () => {
    expect(
      pushSubscriptionCreateSchema.safeParse({
        endpoint: "not-a-url",
        keys: { p256dh: "bad", auth: "also-bad" },
      }).success
    ).toBe(false);
    expect(
      pushSubscriptionCreateSchema.safeParse({
        endpoint: validSubscription.endpoint,
        keys: { p256dh: "dGVzdC1wMjU2ZGg=", auth: "not-base64!" },
      }).success
    ).toBe(false);
    expect(
      reminderDispatchSchema.safeParse({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        subscriptionId: "550e8400-e29b-41d4-a716-446655440001",
        date: "2026-03-30",
        tier: "casual",
        sentAt: new Date("2026-03-30T00:00:00.000Z"),
        status: "unknown",
      }).success
    ).toBe(false);
  });
});
