import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));
vi.mock("@/lib/db/schema", () => ({
  users: {},
  factionMemberships: {},
  weeklyFactionAggregates: {},
  userStats: {},
  userProgression: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
}));

function createSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
}

function createInsertChain() {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

  return {
    values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
  };
}

describe("/api/factions routes", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReset();
  });

  it("returns the available factions list", async () => {
    const { GET } = await import("../route");

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(await res.json()).toEqual({
      factions: [
        {
          factionId: "marines",
          factionName: "Marines",
          factionSlug: "marines",
        },
        {
          factionId: "pirates",
          factionName: "Pirates",
          factionSlug: "pirates",
        },
        {
          factionId: "revolutionary",
          factionName: "Revolutionary Army",
          factionSlug: "revolutionary",
        },
        {
          factionId: "warlords",
          factionName: "Warlords",
          factionSlug: "warlords",
        },
        {
          factionId: "cipher_pol",
          factionName: "Cipher Pol",
          factionSlug: "cipher_pol",
        },
      ],
    });
  });

  it("returns 401 for unauthenticated faction updates", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/factions", {
        method: "POST",
        body: JSON.stringify({ factionSlug: "pirates" }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(401);
  });

  it("rejects invalid faction updates", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });

    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/factions", {
        method: "POST",
        body: JSON.stringify({ factionSlug: "not-a-faction" }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(400);
  });

  it("upserts faction membership for authenticated users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    mockSelect
      .mockReturnValueOnce(createSelectChain([{ username: "luffy" }]))
      .mockReturnValueOnce(
        createSelectChain([
          {
            factionSlug: "pirates",
            joinedAt: new Date("2026-04-13T00:00:00.000Z"),
            snapshotAt: new Date("2026-04-13T00:10:00.000Z"),
          },
        ])
      );
    mockInsert.mockReturnValue(createInsertChain());

    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/factions", {
        method: "POST",
        body: JSON.stringify({ factionSlug: "pirates" }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      factionMembership: {
        userId: "user-1",
        username: "luffy",
        factionId: "pirates",
        factionName: "Pirates",
        factionSlug: "pirates",
        visibility: "public",
        joinedAtUtc: "2026-04-13T00:00:00.000Z",
        updatedAtUtc: "2026-04-13T00:10:00.000Z",
      },
    });
  });
});

describe("/api/factions/leaderboard route", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSelect.mockReset();
  });

  it("returns an empty weekly payload with cache headers when no rows exist", async () => {
    mockSelect.mockReturnValue(createSelectChain([]));

    const { GET } = await import("../leaderboard/route");
    const res = await GET(
      new Request("http://localhost/api/factions/leaderboard?weekKey=2026-W15")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(await res.json()).toEqual({
      weekKey: "2026-W15",
      weekStartUtc: "2026-04-06T00:00:00.000Z",
      weekEndUtc: "2026-04-12T23:59:59.999Z",
      rankings: [],
    });
  });

  it("sorts factions by points, guesses, participants, then name", async () => {
    mockSelect.mockReturnValue(
      createSelectChain([
        {
          weekKey: "2026-W15",
          factionSlug: "marines",
          totalPoints: 120,
          avgGuesses: 3.4,
          participantCount: 18,
        },
        {
          weekKey: "2026-W15",
          factionSlug: "pirates",
          totalPoints: 120,
          avgGuesses: 3.4,
          participantCount: 18,
        },
        {
          weekKey: "2026-W15",
          factionSlug: "revolutionary",
          totalPoints: 120,
          avgGuesses: 2.8,
          participantCount: 18,
        },
        {
          weekKey: "2026-W15",
          factionSlug: "warlords",
          totalPoints: 120,
          avgGuesses: 3.4,
          participantCount: 20,
        },
        {
          weekKey: "2026-W15",
          factionSlug: "cipher_pol",
          totalPoints: 130,
          avgGuesses: 3.1,
          participantCount: 10,
        },
      ])
    );

    const { GET } = await import("../leaderboard/route");
    const res = await GET(
      new Request("http://localhost/api/factions/leaderboard?weekKey=2026-W15")
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(
      data.rankings.map((row: { factionSlug: string }) => row.factionSlug)
    ).toEqual([
      "cipher_pol",
      "revolutionary",
      "warlords",
      "marines",
      "pirates",
    ]);
    expect(data.rankings[0]).toMatchObject({ rank: 1, percentile: 100 });
    expect(data.rankings[4]).toMatchObject({ rank: 5, percentile: 0 });
  });
});

describe("GET /api/leaderboard faction-enhanced view", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSelect.mockReset();
  });

  it("adds current faction membership when requested", async () => {
    mockSelect.mockReturnValue(
      createSelectChain([
        {
          username: "luffy",
          maxStreak: 10,
          totalWins: 20,
          totalGames: 25,
          achievementCount: 4,
          completedSagaCount: 2,
          completedCollectionCount: 1,
          factionSlug: "pirates",
        },
      ])
    );

    const { GET } = await import("../../leaderboard/route");
    const res = await GET(
      new Request(
        "http://localhost/api/leaderboard?tier=casual&mode=daily&includeFaction=true"
      )
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(await res.json()).toEqual([
      {
        username: "luffy",
        maxStreak: 10,
        totalWins: 20,
        totalGames: 25,
        achievementCount: 4,
        completedSagaCount: 2,
        completedCollectionCount: 1,
        factionMembership: {
          factionId: "pirates",
          factionName: "Pirates",
          factionSlug: "pirates",
        },
      },
    ]);
  });
});
