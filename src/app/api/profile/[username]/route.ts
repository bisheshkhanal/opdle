import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  userStats,
  userProgression,
  userAchievements,
  monthlyCollections,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAchievementDef } from "@/lib/progression/achievementCatalog";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stats = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, user.id));

  const [progressionRow] = await db
    .select({
      completedSagaCount: userProgression.completedSagaCount,
      achievementCount: userProgression.achievementCount,
      completedCollectionCount: userProgression.completedCollectionCount,
    })
    .from(users)
    .leftJoin(userProgression, eq(users.id, userProgression.userId))
    .where(eq(users.username, username));

  const recentAchievementRows = await db
    .select({
      id: userAchievements.achievementId,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(users)
    .leftJoin(userAchievements, eq(users.id, userAchievements.userId))
    .where(eq(users.username, username))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(5);

  const completedCollectionRows = await db
    .select({
      seasonKey: monthlyCollections.seasonKey,
      collectibleType: monthlyCollections.collectibleType,
      completedAt: monthlyCollections.completedAt,
    })
    .from(users)
    .leftJoin(monthlyCollections, eq(users.id, monthlyCollections.userId))
    .where(eq(users.username, username))
    .orderBy(desc(monthlyCollections.completedAt));

  const recentAchievements = recentAchievementRows.flatMap((row) => {
    if (!row.id || !row.unlockedAt) {
      return [];
    }

    const achievement = getAchievementDef(row.id);

    return [
      {
        id: row.id,
        label: achievement?.label ?? row.id,
        unlockedAt: toIsoString(row.unlockedAt) ?? "",
      },
    ];
  });

  const completedCollections = completedCollectionRows
    .filter((row) => row.seasonKey && row.completedAt)
    .map((row) => ({
      seasonKey: row.seasonKey,
      collectibleType: row.collectibleType,
      completedAt: toIsoString(row.completedAt) ?? "",
    }));

  return NextResponse.json({
    user,
    stats,
    meta: {
      completedSagaCount: progressionRow?.completedSagaCount ?? 0,
      achievementCount: progressionRow?.achievementCount ?? 0,
      completedCollectionCount: progressionRow?.completedCollectionCount ?? 0,
      recentAchievements,
      completedCollections,
    },
  });
}
