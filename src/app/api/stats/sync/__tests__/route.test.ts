import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ userStats: {} }));
vi.mock("drizzle-orm", () => ({
  sql: vi.fn((s: TemplateStringsArray) => s[0]),
}));

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

describe("POST /api/stats/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
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
    vi.doMock("@/lib/db", () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      },
    }));
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/sync", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
