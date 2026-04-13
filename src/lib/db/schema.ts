import {
  index,
  pgEnum,
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  check,
  uniqueIndex,
  varchar,
  real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const factionSlugEnum = pgEnum("faction_slug", [
  "marines",
  "pirates",
  "revolutionary",
  "warlords",
  "cipher_pol",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft",
  "active",
  "expired",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    usernameCheck: check(
      "username_format",
      sql`${t.username} ~ '^[a-zA-Z0-9_]{3,20}$'`
    ),
  })
);

export const userStats = pgTable(
  "user_stats",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tier: text("tier").notNull(), // "casual" | "fan" | "nakama"
    mode: text("mode").notNull(), // "daily" | "infinite"
    streak: integer("streak").default(0).notNull(),
    maxStreak: integer("max_streak").default(0).notNull(),
    totalWins: integer("total_wins").default(0).notNull(),
    totalGames: integer("total_games").default(0).notNull(),
    winDistribution: jsonb("win_distribution")
      .$type<Record<string, number>>()
      .default({})
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tier, t.mode] }),
  })
);

export const dailyResults = pgTable(
  "daily_results",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: text("date").notNull(), // "YYYY-MM-DD"
    tier: text("tier").notNull(),
    guessCount: integer("guess_count").notNull(),
    isWon: boolean("is_won").notNull(),
    hintUsed: boolean("hint_used").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.date, t.tier] }),
  })
);

export const factionMemberships = pgTable(
  "faction_memberships",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    factionSlug: factionSlugEnum("faction_slug").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("faction_memberships_user_unique").on(t.userId),
    factionSlugLookup: index("faction_memberships_faction_slug_idx").on(
      t.factionSlug
    ),
    joinedAtLookup: index("faction_memberships_joined_at_idx").on(t.joinedAt),
  })
);

export const challengeEntities = pgTable(
  "challenge_entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creatorUserId: uuid("creator_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tierLevel: integer("tier_level").notNull(),
    status: challengeStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => ({
    slugUnique: uniqueIndex("challenge_entities_slug_unique").on(t.slug),
    creatorUserLookup: index("challenge_entities_creator_user_id_idx").on(
      t.creatorUserId
    ),
    statusLookup: index("challenge_entities_status_idx").on(t.status),
    expiresAtLookup: index("challenge_entities_expires_at_idx").on(t.expiresAt),
  })
);

export const challengeAttempts = pgTable(
  "challenge_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id")
      .references(() => challengeEntities.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    guessCount: integer("guess_count").notNull(),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    guessesSerialized: text("guesses_serialized").notNull(),
    factionSnapshotAtSubmit: varchar("faction_snapshot_at_submit", {
      length: 128,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    challengeUserUnique: uniqueIndex(
      "challenge_attempts_challenge_user_unique"
    ).on(t.challengeId, t.userId),
    challengeLookup: index("challenge_attempts_challenge_id_idx").on(
      t.challengeId
    ),
    userLookup: index("challenge_attempts_user_id_idx").on(t.userId),
  })
);

export const challengePacks = pgTable(
  "challenge_packs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: challengeStatusEnum("status").notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("challenge_packs_slug_unique").on(t.slug),
    statusLookup: index("challenge_packs_status_idx").on(t.status),
    createdAtLookup: index("challenge_packs_created_at_idx").on(t.createdAt),
  })
);

export const challengePackEntries = pgTable(
  "challenge_pack_entries",
  {
    packId: uuid("pack_id")
      .references(() => challengePacks.id, { onDelete: "cascade" })
      .notNull(),
    challengeId: uuid("challenge_id")
      .references(() => challengeEntities.id, { onDelete: "cascade" })
      .notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.packId, t.challengeId] }),
    packLookup: index("challenge_pack_entries_pack_id_idx").on(t.packId),
    challengeLookup: index("challenge_pack_entries_challenge_id_idx").on(
      t.challengeId
    ),
    orderLookup: index("challenge_pack_entries_pack_order_idx").on(
      t.packId,
      t.orderIndex
    ),
  })
);

export const weeklyFactionAggregates = pgTable(
  "weekly_faction_aggregates",
  {
    weekKey: varchar("week_key", { length: 8 }).notNull(),
    factionSlug: factionSlugEnum("faction_slug").notNull(),
    totalPoints: integer("total_points").notNull(),
    avgGuesses: real("avg_guesses").notNull(),
    participantCount: integer("participant_count").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.weekKey, t.factionSlug] }),
    factionLookup: index("weekly_faction_aggregates_faction_slug_idx").on(
      t.factionSlug
    ),
    updatedAtLookup: index("weekly_faction_aggregates_updated_at_idx").on(
      t.updatedAt
    ),
    weekKeyCheck: check(
      "weekly_faction_aggregates_week_key_check",
      sql`${t.weekKey} ~ '^[0-9]{4}-W[0-9]{2}$'`
    ),
  })
);

export const userProgression = pgTable("user_progression", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .primaryKey(),
  progressionSnapshot: jsonb("progression_snapshot")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  completedSagaCount: integer("completed_saga_count").default(0).notNull(),
  achievementCount: integer("achievement_count").default(0).notNull(),
  completedCollectionCount: integer("completed_collection_count")
    .default(0)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    achievementId: text("achievement_id").notNull(),
    seasonKey: text("season_key"),
    progress: integer("progress").default(0).notNull(),
    target: integer("target").default(0).notNull(),
    status: text("status").default("locked").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  })
);

export const monthlyCollections = pgTable(
  "monthly_collections",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    seasonKey: text("season_key").notNull(),
    collectibleId: text("collectible_id").notNull(),
    collectibleType: text("collectible_type").notNull(),
    revealedDays: jsonb("revealed_days")
      .$type<string[]>()
      .default([])
      .notNull(),
    revealedFragmentIndexes: jsonb("revealed_fragment_indexes")
      .$type<number[]>()
      .default([])
      .notNull(),
    targetFragments: integer("target_fragments").default(24).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.seasonKey] }),
  })
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull(),
    p256dhKey: text("p256dh_key").notNull(),
    authKey: text("auth_key").notNull(),
    userAgent: text("user_agent").notNull(),
    timezone: text("timezone"),
    utcOffset: integer("utc_offset"),
    appOptIn: boolean("app_opt_in").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    endpointUnique: uniqueIndex("push_subscriptions_endpoint_unique").on(
      t.endpoint
    ),
  })
);

export const reminderAudit = pgTable(
  "reminder_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    subscriptionId: uuid("subscription_id")
      .references(() => pushSubscriptions.id, { onDelete: "cascade" })
      .notNull(),
    date: text("date").notNull(),
    tier: text("tier").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    status: text("status").notNull(),
  },
  (t) => ({
    dedupeUnique: uniqueIndex("reminder_audit_user_date_tier_unique").on(
      t.userId,
      t.date,
      t.tier
    ),
    statusCheck: check(
      "reminder_audit_status_check",
      sql`${t.status} in ('sent', 'failed', 'skipped')`
    ),
  })
);

// Inferred types for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type DailyResult = typeof dailyResults.$inferSelect;
export type DbFactionMembership = typeof factionMemberships.$inferSelect;
export type NewDbFactionMembership = typeof factionMemberships.$inferInsert;
export type DbChallengeEntity = typeof challengeEntities.$inferSelect;
export type NewDbChallengeEntity = typeof challengeEntities.$inferInsert;
export type DbChallengeAttempt = typeof challengeAttempts.$inferSelect;
export type NewDbChallengeAttempt = typeof challengeAttempts.$inferInsert;
export type DbChallengePack = typeof challengePacks.$inferSelect;
export type NewDbChallengePack = typeof challengePacks.$inferInsert;
export type DbChallengePackEntry = typeof challengePackEntries.$inferSelect;
export type NewDbChallengePackEntry = typeof challengePackEntries.$inferInsert;
export type DbWeeklyFactionAggregate =
  typeof weeklyFactionAggregates.$inferSelect;
export type NewDbWeeklyFactionAggregate =
  typeof weeklyFactionAggregates.$inferInsert;
export type UserProgression = typeof userProgression.$inferSelect;
export type NewUserProgression = typeof userProgression.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type MonthlyCollection = typeof monthlyCollections.$inferSelect;
export type NewMonthlyCollection = typeof monthlyCollections.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type ReminderAudit = typeof reminderAudit.$inferSelect;
export type NewReminderAudit = typeof reminderAudit.$inferInsert;
