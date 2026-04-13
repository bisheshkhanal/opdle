import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/validators", () => ({
  tierSchema: z.enum(["casual", "fan", "nakama"]),
  modeSchema: z.enum(["daily", "infinite"]),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  userStats: {},
  users: {},
  userProgression: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
}));

function createQuery(result: unknown) {
  const query: Record<string, unknown> = {};
  const chain = () => query;

  Object.assign(query, {
    from: chain,
    where: chain,
    innerJoin: chain,
    leftJoin: chain,
    orderBy: chain,
    limit: chain,
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  });

  return query;
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 for missing tier", async () => {
    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/leaderboard?mode=daily");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid mode", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/leaderboard?tier=casual&mode=invalid"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with leaderboard data", async () => {
    const mockRows = [
      {
        username: "luffy",
        maxStreak: 10,
        totalWins: 20,
        totalGames: 25,
        achievementCount: 4,
        completedSagaCount: 2,
        completedCollectionCount: 1,
      },
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(createQuery(mockRows)),
      },
    }));
    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/leaderboard?tier=casual&mode=daily"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockRows);
  });

  it("returns lightweight meta counts without changing leaderboard order", async () => {
    const mockRows = [
      {
        username: "luffy",
        maxStreak: 11,
        totalWins: 25,
        totalGames: 30,
        achievementCount: 5,
        completedSagaCount: 3,
        completedCollectionCount: 2,
      },
      {
        username: "zoro",
        maxStreak: 10,
        totalWins: 20,
        totalGames: 24,
        achievementCount: 1,
        completedSagaCount: 1,
        completedCollectionCount: 0,
      },
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(createQuery(mockRows)),
      },
    }));

    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/leaderboard?tier=casual&mode=daily"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].username).toBe("luffy");
    expect(data[0]).toMatchObject({
      achievementCount: 5,
      completedSagaCount: 3,
      completedCollectionCount: 2,
    });
  });
});
