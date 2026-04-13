import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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

// Inferred types for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type DailyResult = typeof dailyResults.$inferSelect;
export type UserProgression = typeof userProgression.$inferSelect;
export type NewUserProgression = typeof userProgression.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type MonthlyCollection = typeof monthlyCollections.$inferSelect;
export type NewMonthlyCollection = typeof monthlyCollections.$inferInsert;
