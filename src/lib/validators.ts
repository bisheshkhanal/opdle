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

const factionSlugValues = [
  "marines",
  "pirates",
  "revolutionary",
  "warlords",
  "cipher_pol",
] as const;

export const factionSlugSchema = z.enum(factionSlugValues);

const packSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const weekKeySchema = z
  .string()
  .regex(/^\d{4}-W\d{2}$/)
  .refine((weekKey) => {
    const weekNumber = Number(weekKey.slice(-2));
    return weekNumber >= 1 && weekNumber <= 53;
  }, "Week key must be an ISO week between 01 and 53");

const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return value;
}, z.boolean());

const serializedGuessesSchema = z
  .string()
  .min(2)
  .refine((value) => {
    try {
      return Array.isArray(JSON.parse(value));
    } catch {
      return false;
    }
  }, "Guesses must be serialized as a JSON array");

export const factionSelectionUpdateSchema = z.object({
  factionSlug: factionSlugSchema,
});

export const weeklyLeaderboardFiltersSchema = z.object({
  weekKey: weekKeySchema,
  factionSlug: factionSlugSchema.optional(),
  tier: tierSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const challengeCreationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tierLevel: tierSchema,
  expiresAt: utcDateTimeSchema.optional(),
});

export const challengePlaySubmissionSchema = z.object({
  challengeId: z.string().uuid(),
  guessCount: z.number().int().min(1).max(10),
  solvedAt: utcDateTimeSchema.optional(),
  guessesSerialized: serializedGuessesSchema,
});

export const challengeHistoryQueryParamsSchema = z.object({
  userId: z.string().min(1).optional(),
  challengeId: z.string().min(1).optional(),
  packSlug: packSlugSchema.optional(),
  solved: queryBooleanSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const challengePackIdentifierSchema = z.object({
  packSlug: packSlugSchema,
  orderIndex: z.coerce.number().int(),
});

export const dailyComparisonAnalyticsQueryParamsSchema = z.object({
  date: utcDateSchema,
  factionSlug: factionSlugSchema.optional(),
  includeHistoricalTrend: queryBooleanSchema.optional(),
  trendWindowDays: z.coerce.number().int().min(7).max(30).optional(),
});

export function requireAuthenticatedMutation(
  userId: string | null | undefined
): string {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export function parseAuthenticatedMutation<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  userId: string | null | undefined
): z.output<TSchema> {
  requireAuthenticatedMutation(userId);

  return schema.parse(input);
}
