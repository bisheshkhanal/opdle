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

const achievementProgressSchema = z.object({
  progress: z.number().int().min(0).optional(),
  target: z.number().int().min(0).optional(),
  status: z.enum(["locked", "revealed", "unlocked"]).optional(),
  unlockedAt: z.string().optional(),
  lastUpdatedAt: z.string().optional(),
  seasonKey: z.string().nullable().optional(),
});

const monthlySeasonSchema = z.object({
  collectibleId: z.string().optional(),
  collectibleType: z.enum(["bounty-poster", "vivre-card"]).optional(),
  targetFragments: z.number().int().min(0).optional(),
  revealedDays: z.array(z.string()).optional(),
  revealedFragmentIndexes: z.array(z.number()).optional(),
  completedAt: z.string().optional(),
});

export const metaProgressionSchema = z.object({
  progressionSnapshot: z.record(z.string(), z.unknown()).optional(),
  completedSagaCount: z.number().int().min(0).optional(),
  achievementCount: z.number().int().min(0).optional(),
  completedCollectionCount: z.number().int().min(0).optional(),
});

export const statsSyncWithMetaSchema = statsSyncSchema.extend({
  metaProgression: metaProgressionSchema.optional(),
  achievementProgress: z
    .record(z.string(), achievementProgressSchema)
    .optional(),
  monthlyCollections: z
    .object({
      activeSeasonKey: z.string().optional(),
      seasons: z.record(z.string(), monthlySeasonSchema).optional(),
    })
    .optional(),
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
