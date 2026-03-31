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

// Inferred types for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type DailyResult = typeof dailyResults.$inferSelect;
