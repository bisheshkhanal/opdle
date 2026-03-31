import { users, userStats, dailyResults } from "../schema";
import { describe, it, expect } from "vitest";

describe("schema exports", () => {
  it("users table has required columns", () => {
    expect(users.id).toBeDefined();
    expect(users.username).toBeDefined();
    expect(users.passwordHash).toBeDefined();
    expect(users.createdAt).toBeDefined();
  });

  it("userStats table has composite primary key columns", () => {
    expect(userStats.userId).toBeDefined();
    expect(userStats.tier).toBeDefined();
    expect(userStats.mode).toBeDefined();
    expect(userStats.maxStreak).toBeDefined();
    expect(userStats.winDistribution).toBeDefined();
  });

  it("dailyResults table has composite primary key columns", () => {
    expect(dailyResults.userId).toBeDefined();
    expect(dailyResults.date).toBeDefined();
    expect(dailyResults.tier).toBeDefined();
    expect(dailyResults.guessCount).toBeDefined();
    expect(dailyResults.isWon).toBeDefined();
  });
});
