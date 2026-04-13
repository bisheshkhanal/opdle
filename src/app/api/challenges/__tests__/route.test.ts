import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  challengeEntities: {},
  challengeAttempts: {},
  challengePacks: {},
  challengePackEntries: {},
}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  sql: vi.fn(),
}));

function createSelectQuery(result: unknown) {
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

function createInsertQuery(result: unknown) {
  const query: Record<string, unknown> = {};
  const chain = () => query;

  Object.assign(query, {
    values: chain,
    onConflictDoNothing: chain,
    onConflictDoUpdate: chain,
    returning: chain,
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  });

  return query;
}

describe("challenge API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
  });

  it("creates a tracked challenge for authenticated users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const created = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        slug: "week-1-luffy",
        title: "Week 1: Luffy",
        description: "A starter challenge",
        tierLevel: 1,
        status: "active",
        createdAt: new Date("2026-04-13T00:00:00.000Z"),
        expiresAt: null,
      },
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        insert: vi.fn().mockReturnValue(createInsertQuery(created)),
      },
    }));

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        title: "Week 1: Luffy",
        description: "A starter challenge",
        tierLevel: "casual",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.challenge.slug).toBe("week-1-luffy");
  });

  it("returns 401 when creating a challenge without a session", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        title: "Week 1: Luffy",
        description: "A starter challenge",
        tierLevel: "casual",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns an empty history list for authenticated users with no entries", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(createSelectQuery([])),
      },
    }));

    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/challenges?limit=20");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.history).toEqual([]);
  });

  it("returns challenge details and history for authenticated users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const selectResults = [
      [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          creatorUserId: "user-1",
          slug: "week-1-luffy",
          title: "Week 1: Luffy",
          description: "A starter challenge",
          tierLevel: 1,
          status: "active",
          createdAt: new Date("2026-04-13T00:00:00.000Z"),
          expiresAt: null,
        },
      ],
      [
        {
          challengeId: "550e8400-e29b-41d4-a716-446655440001",
          packId: "weekly-pack-1",
          userId: "user-1",
          username: "luffy",
          result: "solved",
          guessCount: 3,
          solvedAtUtc: "2026-04-13T00:10:00.000Z",
          completedAtUtc: "2026-04-13T00:10:00.000Z",
          challengeStreak: 4,
          summaryVisibility: "public",
          factionSnapshot: {
            factionId: "straw-hat-pirates",
            factionName: "Straw Hat Pirates",
            factionSlug: "straw-hat-pirates",
          },
        },
      ],
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi
          .fn()
          .mockImplementation(() => createSelectQuery(selectResults.shift())),
      },
    }));

    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/challenges?challengeId=550e8400-e29b-41d4-a716-446655440001"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.challenge.slug).toBe("week-1-luffy");
    expect(data.history).toHaveLength(1);
  });

  it("rejects duplicate challenge submissions", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const dupError = Object.assign(new Error("duplicate"), { code: "23505" });
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(
          createSelectQuery([
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              status: "active",
              expiresAt: null,
            },
          ])
        ),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(dupError),
          }),
        }),
      },
    }));

    const { PATCH } = await import("../[id]/route");
    const req = new Request(
      "http://localhost/api/challenges/550e8400-e29b-41d4-a716-446655440001",
      {
        method: "PATCH",
        body: JSON.stringify({
          challengeId: "550e8400-e29b-41d4-a716-446655440001",
          guessCount: 3,
          guessesSerialized: "[]",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const res = await PATCH(req, {
      params: { id: "550e8400-e29b-41d4-a716-446655440001" },
    });

    expect(res.status).toBe(409);
  });

  it("rejects submissions for expired challenges", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(
          createSelectQuery([
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              status: "expired",
              expiresAt: new Date("2026-04-01T00:00:00.000Z"),
            },
          ])
        ),
      },
    }));

    const { PATCH } = await import("../[id]/route");
    const req = new Request(
      "http://localhost/api/challenges/550e8400-e29b-41d4-a716-446655440001",
      {
        method: "PATCH",
        body: JSON.stringify({
          challengeId: "550e8400-e29b-41d4-a716-446655440001",
          guessCount: 3,
          guessesSerialized: "[]",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const res = await PATCH(req, {
      params: { id: "550e8400-e29b-41d4-a716-446655440001" },
    });

    expect(res.status).toBe(410);
  });

  it("lists public challenge packs", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(
          createSelectQuery([
            {
              packId: "weekly-pack-1",
              slug: "week-1",
              title: "Week 1",
              description: "First challenge pack",
              challengeIds: ["550e8400-e29b-41d4-a716-446655440001"],
              startsAtUtc: "2026-04-13T00:00:00.000Z",
              endsAtUtc: "2026-04-19T23:59:59.999Z",
              publishedAtUtc: "2026-04-12T12:00:00.000Z",
              visibility: "public",
            },
          ])
        ),
      },
    }));

    const { GET } = await import("../packs/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.packs).toHaveLength(1);
  });

  it("returns 404 for an unknown pack id", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(createSelectQuery([])),
      },
    }));

    const { GET } = await import("../packs/[packId]/route");
    const req = new Request("http://localhost/api/challenges/packs/bad-pack");
    const res = await GET(req, { params: { packId: "bad-pack" } });

    expect(res.status).toBe(404);
  });

  it("returns a public leaderboard for a challenge", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue(
          createSelectQuery([
            {
              challengeId: "550e8400-e29b-41d4-a716-446655440001",
              userId: "user-1",
              username: "luffy",
              factionSnapshot: {
                factionId: "straw-hat-pirates",
                factionName: "Straw Hat Pirates",
                factionSlug: "straw-hat-pirates",
              },
              points: 50,
              avgGuesses: 3.2,
              participantCount: 18,
              rank: 1,
              percentile: 100,
            },
          ])
        ),
      },
    }));

    const { GET } = await import("../[id]/leaderboard/route");
    const req = new Request(
      "http://localhost/api/challenges/550e8400-e29b-41d4-a716-446655440001/leaderboard"
    );
    const res = await GET(req, {
      params: { id: "550e8400-e29b-41d4-a716-446655440001" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.leaderboard).toHaveLength(1);
  });
});
