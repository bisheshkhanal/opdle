import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ dailyResults: {} }));

const validPayload = {
  date: "2026-03-30",
  tier: "casual",
  guessCount: 3,
  isWon: true,
  hintUsed: false,
};

describe("POST /api/stats/daily-result", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/daily-result", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 before parsing JSON when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/daily-result", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid date format", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/daily-result", {
      method: "POST",
      body: JSON.stringify({ ...validPayload, date: "not-a-date" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 on valid submission (idempotent)", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "uuid-1", name: "luffy", email: null, image: null },
      expires: "",
    });
    vi.doMock("@/lib/db", () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      },
    }));
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/stats/daily-result", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
