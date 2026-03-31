import { z } from "zod";

export const usernameSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_]{3,20}$/,
    "Username must be 3-20 alphanumeric characters or underscores"
  );

export const registerSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const tierSchema = z.enum(["casual", "fan", "nakama"]);
export const modeSchema = z.enum(["daily", "infinite"]);

const dailyTierStats = z.object({
  streak: z.number().int().min(0),
  maxStreak: z.number().int().min(0),
  winDistribution: z.record(z.string(), z.number()),
});

const infiniteTierStats = z.object({
  totalWins: z.number().int().min(0),
  totalGames: z.number().int().min(0),
  streak: z.number().int().min(0),
  maxStreak: z.number().int().min(0),
  winDistribution: z.record(z.string(), z.number()),
});

export const statsSyncSchema = z.object({
  dailyStats: z.object({
    casual: dailyTierStats,
    fan: dailyTierStats,
    nakama: dailyTierStats,
  }),
  infiniteStats: z.object({
    casual: infiniteTierStats,
    fan: infiniteTierStats,
    nakama: infiniteTierStats,
  }),
});

export const dailyResultSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  tier: tierSchema,
  guessCount: z.number().int().min(1).max(6),
  isWon: z.boolean(),
  hintUsed: z.boolean().default(false),
});
