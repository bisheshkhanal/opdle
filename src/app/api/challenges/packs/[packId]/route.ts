import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { challengeAttempts, challengePacks } from "@/lib/db/schema";

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: { packId: string } }
) {
  const [pack] = await db
    .select()
    .from(challengePacks)
    .where(eq(challengePacks.id, params.packId));

  if (!pack) {
    return jsonError("Pack not found", 404);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ pack, progress: null });
  }

  const attempts = await db
    .select()
    .from(challengeAttempts)
    .where(eq(challengeAttempts.userId, session.user.id));

  const challengeIds = Array.isArray(
    (pack as { challengeIds?: string[] }).challengeIds
  )
    ? ((pack as { challengeIds?: string[] }).challengeIds ?? [])
    : [];
  const completed = attempts.filter((attempt) =>
    challengeIds.includes(attempt.challengeId)
  ).length;

  return NextResponse.json({
    pack,
    progress: {
      completed,
      total: challengeIds.length,
      percent:
        challengeIds.length > 0
          ? Math.round((completed / challengeIds.length) * 100)
          : 0,
    },
  });
}
