import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ users: {}, userStats: {} }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

describe("GET /api/profile/[username]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 404 for unknown username", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
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
        maxStreak: 5,
      },
    ];
    let callCount = 0;
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) return Promise.resolve([mockUser]);
              return Promise.resolve(mockStats);
            }),
          }),
        }),
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
  });
});
