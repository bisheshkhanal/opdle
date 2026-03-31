import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthorizeDBLike } from "../auth-credentials";

const { mockBcryptCompare } = vi.hoisted(() => ({
  mockBcryptCompare: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
  },
}));

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    username: "username",
  },
}));

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.resetModules();
    mockBcryptCompare.mockReset();
  });

  it("returns null when username is missing", async () => {
    const { authorizeCredentials } = await import("../auth-credentials");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as unknown as AuthorizeDBLike;

    const result = await authorizeCredentials({ password: "pass" }, mockDb);
    expect(result).toBeNull();
  });

  it("returns null when password is missing", async () => {
    const { authorizeCredentials } = await import("../auth-credentials");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as unknown as AuthorizeDBLike;

    const result = await authorizeCredentials({ username: "user" }, mockDb);
    expect(result).toBeNull();
  });

  it("returns null when user is not found", async () => {
    const { authorizeCredentials } = await import("../auth-credentials");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as unknown as AuthorizeDBLike;

    const result = await authorizeCredentials(
      { username: "unknown", password: "pass" },
      mockDb
    );
    expect(result).toBeNull();
  });

  it("returns null when password does not match", async () => {
    mockBcryptCompare.mockResolvedValue(false);
    const { authorizeCredentials } = await import("../auth-credentials");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([
          { id: "uuid-1", username: "luffy", passwordHash: "hash" },
        ]),
    } as unknown as AuthorizeDBLike;

    const result = await authorizeCredentials(
      { username: "luffy", password: "wrongpass" },
      mockDb
    );
    expect(result).toBeNull();
  });

  it("returns user object when credentials are valid", async () => {
    mockBcryptCompare.mockResolvedValue(true);
    const { authorizeCredentials } = await import("../auth-credentials");
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([
          { id: "uuid-1", username: "luffy", passwordHash: "hash" },
        ]),
    } as unknown as AuthorizeDBLike;

    const result = await authorizeCredentials(
      { username: "luffy", password: "correctpass" },
      mockDb
    );
    expect(result).toEqual({ id: "uuid-1", name: "luffy" });
  });
});
