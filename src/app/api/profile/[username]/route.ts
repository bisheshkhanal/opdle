import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  return NextResponse.json({ user, stats });
}
