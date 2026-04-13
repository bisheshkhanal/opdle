import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const { mockAuth, mockDbSelect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
}));

vi.mock("@/lib/validators", () => ({
  tierSchema: z.enum(["casual", "fan", "nakama"]),
  modeSchema: z.enum(["daily", "infinite"]),
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  db: {
    select: mockDbSelect,
  },
}));
vi.mock("@/lib/db/schema", () => ({
  dailyResults: {
    userId: "dailyResults.userId",
    date: "dailyResults.date",
    tier: "dailyResults.tier",
    guessCount: "dailyResults.guessCount",
    isWon: "dailyResults.isWon",
    completedAt: "dailyResults.completedAt",
  },
  factionMemberships: {
    userId: "factionMemberships.userId",
    factionSlug: "factionMemberships.factionSlug",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  sql: vi.fn((s: TemplateStringsArray) => s[0]),
  count: vi.fn(),
}));

describe("GET /api/daily-results", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
    mockDbSelect.mockReset();
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

  it("returns analytics object with correct shape when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              userId: "user1",
              date: "2026-03-30",
              tier: "casual",
              guessCount: 3,
              isWon: true,
              factionSlug: "pirates",
              completedAtUtc: new Date("2026-03-30T12:00:00Z"),
            },
          ]),
        }),
      }),
    });

    const { GET } = await import("../route");
    const req = new Request(
      "http://localhost/api/daily-results?date=2026-03-30&tier=casual"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userGuessCount).toBeNull();
    expect(data.sampleSize).toBe(1);
    expect(data.totalWins).toBe(1);
    expect(data.avgGuesses).toBe(3);
    expect(data.guessDistribution).toHaveLength(6);
    expect(data.trendData).toBeDefined();
    expect(data.factionSlice).toBeNull();
  });
});
