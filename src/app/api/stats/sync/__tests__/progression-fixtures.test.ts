import { describe, expect, it } from "vitest";
import { statsSyncSchema } from "../../../../../lib/validators";
import { createSyncPayload } from "../../../../../test/progressionFixtures";

describe("progression sync fixtures", () => {
  it("returns a payload that matches the sync schema", () => {
    const payload = createSyncPayload();

    expect(statsSyncSchema.safeParse(payload).success).toBe(true);
  });

  it("deeply overrides nested daily stats fields", () => {
    const payload = createSyncPayload({
      dailyStats: {
        casual: { streak: 5 },
      },
    });

    expect(payload.dailyStats.casual.streak).toBe(5);
    expect(payload.dailyStats.casual.maxStreak).toBe(0);
    expect(payload.dailyStats.fan.streak).toBe(0);
    expect(statsSyncSchema.safeParse(payload).success).toBe(true);
  });
});
