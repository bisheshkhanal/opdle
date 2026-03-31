import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/validators", () => ({
  tierSchema: z.enum(["casual", "fan", "nakama"]),
  modeSchema: z.enum(["daily", "infinite"]),
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ dailyResults: {} }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn((s: TemplateStringsArray) => s[0]),
  count: vi.fn(),
}));

describe("GET /api/daily-results", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
  });

  it("returns 400 for invalid date format", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/daily-results?date=not-a-date&tier=casual"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid tier", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/daily-results?date=2026-03-30&tier=invalid"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with null userRank when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    vi.doMock("@/lib/db", () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue([
                { totalPlayers: 5, totalWins: 3, avgGuesses: "3.5" },
              ]),
          }),
        }),
      },
    }));
    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/daily-results?date=2026-03-30&tier=casual"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userRank).toBeNull();
  });
});
