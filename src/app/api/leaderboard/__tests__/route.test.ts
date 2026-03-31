import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/validators", () => ({
  tierSchema: z.enum(["casual", "fan", "nakama"]),
  modeSchema: z.enum(["daily", "infinite"]),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ userStats: {}, users: {} }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
}));

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
      { username: "luffy", maxStreak: 10, totalWins: 20, totalGames: 25 },
    ];
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        }),
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
});
