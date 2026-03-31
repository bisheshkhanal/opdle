import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ users: {} }));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed") },
}));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 for missing username", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid username format", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "a!", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for password too short", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "luffy", password: "short" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 201 on valid registration", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "uuid-1", username: "luffy" }]),
          }),
        }),
      },
    }));
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "luffy", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.username).toBe("luffy");
  });

  it("returns 409 on duplicate username", async () => {
    const dupError = Object.assign(new Error("duplicate"), { code: "23505" });
    vi.doMock("@/lib/db", () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(dupError),
          }),
        }),
      },
    }));
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "luffy", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Username already taken");
  });
});
