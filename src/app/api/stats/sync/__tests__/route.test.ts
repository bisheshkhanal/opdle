import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
  },
}));
vi.mock("@/lib/db/schema", () => ({
  userStats: {},
  userProgression: {},
  userAchievements: {},
  monthlyCollections: {},
}));
vi.mock("drizzle-orm", () => ({
  sql: vi.fn((s: TemplateStringsArray) => s[0]),
}));

const chain = {
  values: vi.fn().mockReturnValue({
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  }),
};

const validPayload = {
  dailyStats: {
    casual: { streak: 3, maxStreak: 5, winDistribution: { "3": 2 } },
    fan: { streak: 0, maxStreak: 0, winDistribution: {} },
    nakama: { streak: 0, maxStreak: 0, winDistribution: {} },
  },
  infiniteStats: {
    casual: {
      totalWins: 10,
      totalGames: 15,
      streak: 2,
      maxStreak: 4,
      winDistribution: {},
    },
    fan: {
      totalWins: 0,
      totalGames: 0,
      streak: 0,
      maxStreak: 0,
      winDistribution: {},
    },
    nakama: {
      totalWins: 0,
      totalGames: 0,
      streak: 0,
      maxStreak: 0,
      winDistribution: {},
    },
  },
};

const payloadWithMeta = {
  ...validPayload,
  metaProgression: {
    progressionSnapshot: { chapter: 12 },
    completedSagaCount: 1,
    achievementCount: 3,
    completedCollectionCount: 2,
  },
  achievementProgress: {
    brave_start: {
      progress: 2,
      target: 5,
      status: "revealed",
      unlockedAt: "2026-04-12T00:00:00.000Z",
      lastUpdatedAt: "2026-04-12T00:00:00.000Z",
      seasonKey: "2026-04",
    },
  },
  monthlyCollections: {
    activeSeasonKey: "2026-04",
    seasons: {
      "2026-04": {
        collectibleId: "poster-1",
        collectibleType: "bounty-poster",
        targetFragments: 24,
        revealedDays: ["2026-04-01"],
        revealedFragmentIndexes: [0, 3],
        completedAt: "2026-04-12T00:00:00.000Z",
      },
    },
  },
};

describe("POST /api/stats/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
    mockInsert.mockReturnValue(chain);
    chain.values.mockClear();
    chain.values().onConflictDoUpdate.mockClear();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify({ invalid: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 on valid sync", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("accepts valid sync payload with optional meta fields", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify(payloadWithMeta),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("rejects malformed meta fields", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify({
        ...validPayload,
        metaProgression: {
          completedSagaCount: -1,
        },
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
