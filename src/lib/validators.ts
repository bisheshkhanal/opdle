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
export const runKindSchema = z.enum(["daily", "infinite", "challenge"]);
export const rulesetSchema = z.enum([
  "classic",
  "silhouette",
  "wanted",
  "quote",
  "arc",
  "four-seas",
]);

const utcDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
const utcDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const publicVisibilitySchema = z.literal("public");

export const factionSnapshotSchema = z.object({
  factionId: z.string().min(1),
  factionName: z.string().min(1),
  factionSlug: z.string().min(1),
});

export const shareCardPayloadSchema = z.object({
  title: z.string().min(1),
  mode: modeSchema,
  runKind: runKindSchema,
  ruleset: rulesetSchema,
  shareText: z.string().min(1),
  textFallback: z.string().min(1),
  shareUrl: z.string().min(1).nullable().optional(),
  createdAtUtc: utcDateTimeSchema,
});

export const factionMembershipSchema = z.object({
  userId: z.string().min(1),
  username: usernameSchema,
  factionId: z.string().min(1),
  factionName: z.string().min(1),
  factionSlug: z.string().min(1),
  visibility: publicVisibilitySchema,
  joinedAtUtc: utcDateTimeSchema,
  updatedAtUtc: utcDateTimeSchema,
});

export const weeklyFactionRankingRowSchema = z.object({
  weekStartUtc: utcDateTimeSchema,
  weekEndUtc: utcDateTimeSchema,
  factionId: z.string().min(1),
  factionName: z.string().min(1),
  factionSlug: z.string().min(1),
  points: z.number().int().min(0),
  avgGuesses: z.number().min(0).nullable(),
  participantCount: z.number().int().min(0),
  rank: z.number().int().min(1),
  percentile: z.number().min(0).max(100).nullable(),
});

export const challengeEntitySchema = z.object({
  challengeId: z.string().min(1),
  packId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  targetCharacterId: z.string().min(1),
  ruleset: rulesetSchema,
  runKind: runKindSchema,
  weekStartUtc: utcDateTimeSchema,
  scheduledAtUtc: utcDateTimeSchema,
  createdAtUtc: utcDateTimeSchema,
  isActive: z.boolean(),
  factionSnapshot: factionSnapshotSchema,
});

export const challengeAttemptSchema = z.object({
  attemptId: z.string().min(1),
  challengeId: z.string().min(1),
  userId: z.string().min(1),
  username: usernameSchema,
  guessCount: z.number().int().min(0),
  isSolved: z.boolean(),
  solvedAtUtc: utcDateTimeSchema.nullable(),
  completedAtUtc: utcDateTimeSchema,
  factionSnapshot: factionSnapshotSchema,
});

export const challengePackSchema = z.object({
  packId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  challengeIds: z.array(z.string().min(1)),
  startsAtUtc: utcDateTimeSchema,
  endsAtUtc: utcDateTimeSchema,
  publishedAtUtc: utcDateTimeSchema,
  visibility: publicVisibilitySchema,
});

export const challengeHistoryRowSchema = z.object({
  challengeId: z.string().min(1),
  packId: z.string().min(1),
  userId: z.string().min(1),
  username: usernameSchema,
  result: z.enum(["solved", "failed", "skipped"]),
  guessCount: z.number().int().min(0).nullable(),
  solvedAtUtc: utcDateTimeSchema.nullable(),
  completedAtUtc: utcDateTimeSchema,
  challengeStreak: z.number().int().min(0),
  summaryVisibility: publicVisibilitySchema,
  factionSnapshot: factionSnapshotSchema,
});

export const challengeLeaderboardRowSchema = z.object({
  challengeId: z.string().min(1),
  userId: z.string().min(1),
  username: usernameSchema,
  factionSnapshot: factionSnapshotSchema,
  points: z.number().int().min(0),
  avgGuesses: z.number().min(0).nullable(),
  participantCount: z.number().int().min(0),
  rank: z.number().int().min(1),
  percentile: z.number().min(0).max(100).nullable(),
});

export const dailyComparisonDtoSchema = z.object({
  date: utcDateSchema,
  tier: tierSchema,
  totalPlayers: z.number().int().min(0),
  totalWins: z.number().int().min(0),
  avgGuesses: z.number().min(0).nullable(),
  userRank: z.number().int().min(1).nullable(),
  userGuessCount: z.number().int().min(0).nullable(),
  percentRank: z.number().min(0).max(100).nullable(),
});

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

const pushSubscriptionKeysSchema = z.object({
  p256dh: z.base64(),
  auth: z.base64(),
});

export const pushSubscriptionCreateSchema = z.object({
  endpoint: z.url(),
  keys: pushSubscriptionKeysSchema,
  timezone: z.string().optional(),
  utcOffset: z.number().int().optional(),
});

export const pushSubscriptionUpdateSchema = z.object({
  endpoint: z.url(),
  keys: pushSubscriptionKeysSchema.optional(),
  timezone: z.string().optional(),
  utcOffset: z.number().int().optional(),
  appOptIn: z.boolean().optional(),
});

export const pushSubscriptionDeleteSchema = z.object({
  endpoint: z.url(),
});

export const reminderDispatchSchema = z.object({
  userId: z.uuid(),
  subscriptionId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tier: tierSchema,
  sentAt: z.date(),
  status: z.enum(["sent", "failed", "skipped"]),
});
