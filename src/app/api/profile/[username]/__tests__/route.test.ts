import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  users: {},
  userStats: {},
  userProgression: {},
  userAchievements: {},
  monthlyCollections: {},
}));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(), desc: vi.fn() }));

function createQuery(result: unknown) {
  const query: Record<string, unknown> = {};
  const chain = () => query;

  Object.assign(query, {
    from: chain,
    where: chain,
    leftJoin: chain,
    innerJoin: chain,
    orderBy: chain,
    limit: chain,
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  });

  return query;
}

describe("GET /api/profile/[username]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 404 for unknown username", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(createQuery([])),
      },
    }));
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/profile/unknown");
    const res = await GET(req, {
      params: { username: "unknown" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 with user and stats for known username", async () => {
    const mockUser = {
      id: "uuid-1",
      username: "luffy",
      createdAt: new Date(),
    };
    const mockStats = [
      {
        userId: "uuid-1",
        tier: "casual",
        mode: "daily",
        streak: 3,
        maxStreak: 5,
        totalWins: 9,
        totalGames: 12,
        winDistribution: {},
        updatedAt: new Date(),
      },
    ];
    const mockProgression = [
      {
        completedSagaCount: 2,
        achievementCount: 4,
        completedCollectionCount: 1,
      },
    ];
    const mockAchievements = [
      {
        id: "streak-3",
        unlockedAt: new Date("2026-04-12T12:00:00.000Z"),
      },
      {
        id: "perfect-navigator",
        unlockedAt: new Date("2026-04-11T12:00:00.000Z"),
      },
    ];
    const mockCollections = [
      {
        seasonKey: "2026-04",
        collectibleType: "bounty-poster",
        completedAt: new Date("2026-04-10T12:00:00.000Z"),
      },
    ];
    const results = [
      [mockUser],
      mockStats,
      mockProgression,
      mockAchievements,
      mockCollections,
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockImplementation(() => createQuery(results.shift())),
      },
    }));
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/profile/luffy");
    const res = await GET(req, {
      params: { username: "luffy" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.username).toBe("luffy");
    expect(data.stats).toHaveLength(1);
    expect(data.meta).toEqual({
      completedSagaCount: 2,
      achievementCount: 4,
      completedCollectionCount: 1,
      recentAchievements: [
        {
          id: "streak-3",
          label: "Three-Day Streak",
          unlockedAt: "2026-04-12T12:00:00.000Z",
        },
        {
          id: "perfect-navigator",
          label: "Perfect Navigator",
          unlockedAt: "2026-04-11T12:00:00.000Z",
        },
      ],
      completedCollections: [
        {
          seasonKey: "2026-04",
          collectibleType: "bounty-poster",
          completedAt: "2026-04-10T12:00:00.000Z",
        },
      ],
    });
  });

  it("returns empty meta counts when progression data is missing", async () => {
    const mockUser = {
      id: "uuid-2",
      username: "zoro",
      createdAt: new Date(),
    };
    const results = [[mockUser], [], [], [], []];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockImplementation(() => createQuery(results.shift())),
      },
    }));

    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/profile/zoro");
    const res = await GET(req, {
      params: { username: "zoro" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meta).toEqual({
      completedSagaCount: 0,
      achievementCount: 0,
      completedCollectionCount: 0,
      recentAchievements: [],
      completedCollections: [],
    });
  });
});
