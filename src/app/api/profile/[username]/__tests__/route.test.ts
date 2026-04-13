import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  users: {},
  userStats: {},
  userProgression: {},
  userAchievements: {},
  monthlyCollections: {},
  factionMemberships: {},
  weeklyFactionAggregates: {},
  challengeAttempts: {},
  challengePacks: {},
  challengePackEntries: {},
}));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(), and: vi.fn(), desc: vi.fn() }));

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
    const res = await GET(new Request("http://localhost/api/profile/unknown"), {
      params: { username: "unknown" },
    });

    expect(res.status).toBe(404);
  });

  it("returns faction and challenge summaries for a fully populated profile", async () => {
    const mockUser = {
      id: "uuid-1",
      username: "luffy",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    };

    const results = [
      [mockUser],
      [
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
      ],
      [
        {
          completedSagaCount: 2,
          achievementCount: 4,
          completedCollectionCount: 1,
        },
      ],
      [
        {
          id: "streak-3",
          unlockedAt: new Date("2026-04-12T12:00:00.000Z"),
        },
        {
          id: "perfect-navigator",
          unlockedAt: new Date("2026-04-11T12:00:00.000Z"),
        },
      ],
      [
        {
          seasonKey: "2026-04",
          collectibleType: "bounty-poster",
          completedAt: new Date("2026-04-10T12:00:00.000Z"),
        },
      ],
      [
        {
          factionSlug: "pirates",
          joinedAt: new Date("2026-04-10T00:00:00.000Z"),
        },
      ],
      [
        {
          points: 120,
          avgGuesses: 3.2,
        },
      ],
      [
        {
          challengeId: "challenge-1",
          guessCount: 3,
          solvedAt: new Date("2026-04-10T10:00:00.000Z"),
          createdAt: new Date("2026-04-10T10:00:00.000Z"),
        },
        {
          challengeId: "challenge-2",
          guessCount: 4,
          solvedAt: new Date("2026-04-11T10:00:00.000Z"),
          createdAt: new Date("2026-04-11T10:00:00.000Z"),
        },
        {
          challengeId: "challenge-3",
          guessCount: 6,
          solvedAt: null,
          createdAt: new Date("2026-04-12T10:00:00.000Z"),
        },
      ],
      [
        { id: "pack-1", slug: "season-1", title: "Season 1" },
        { id: "pack-2", slug: "season-2", title: "Season 2" },
      ],
      [
        { packId: "pack-1", challengeId: "challenge-1" },
        { packId: "pack-1", challengeId: "challenge-2" },
        { packId: "pack-2", challengeId: "challenge-3" },
      ],
    ];

    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockImplementation(() => createQuery(results.shift())),
      },
    }));

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/profile/luffy"), {
      params: { username: "luffy" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.user).toMatchObject({
      username: "luffy",
      faction: {
        factionId: "pirates",
        factionName: "Pirates",
        factionSlug: "pirates",
      },
    });
    expect(data.factionSummary).toEqual({
      factionSlug: "pirates",
      displayName: "Pirates",
      weeklyContribution: {
        points: 120,
        avgGuesses: 3.2,
      },
      memberSince: "2026-04-10T00:00:00.000Z",
    });
    expect(data.challengeSummary).toEqual({
      totalChallenges: 3,
      wins: 2,
      currentStreak: 0,
      bestStreak: 2,
      packCompletions: 1,
    });
    expect(data.challengeSummary).not.toHaveProperty("challengeId");
    expect(data.factionSummary).not.toHaveProperty("factionId");
  });

  it("returns null faction summary when the user has no faction", async () => {
    const mockUser = {
      id: "uuid-2",
      username: "zoro",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    };

    const results = [
      [mockUser],
      [],
      [],
      [],
      [],
      [],
      [
        {
          challengeId: "challenge-1",
          guessCount: 2,
          solvedAt: new Date("2026-04-10T10:00:00.000Z"),
          createdAt: new Date("2026-04-10T10:00:00.000Z"),
        },
      ],
      [{ id: "pack-1", slug: "season-1", title: "Season 1" }],
      [{ packId: "pack-1", challengeId: "challenge-1" }],
    ];

    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockImplementation(() => createQuery(results.shift())),
      },
    }));

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/profile/zoro"), {
      params: { username: "zoro" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.faction).toBeNull();
    expect(data.factionSummary).toBeNull();
    expect(data.challengeSummary).toMatchObject({
      totalChallenges: 1,
      wins: 1,
      currentStreak: 1,
      bestStreak: 1,
      packCompletions: 1,
    });
  });

  it("returns null challenge summary when the user has no challenge history", async () => {
    const mockUser = {
      id: "uuid-3",
      username: "nami",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    };

    const results = [
      [mockUser],
      [],
      [],
      [],
      [],
      [
        {
          factionSlug: "marines",
          joinedAt: new Date("2026-04-09T00:00:00.000Z"),
        },
      ],
      [
        {
          points: 80,
          avgGuesses: 4.1,
        },
      ],
      [],
    ];

    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockImplementation(() => createQuery(results.shift())),
      },
    }));

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/profile/nami"), {
      params: { username: "nami" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.faction).toMatchObject({
      factionId: "marines",
      factionName: "Marines",
      factionSlug: "marines",
    });
    expect(data.factionSummary).toMatchObject({
      factionSlug: "marines",
      displayName: "Marines",
      weeklyContribution: {
        points: 80,
        avgGuesses: 4.1,
      },
      memberSince: "2026-04-09T00:00:00.000Z",
    });
    expect(data.challengeSummary).toBeNull();
  });
});
