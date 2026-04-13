import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  challengeAttempts,
  challengePackEntries,
  challengePacks,
} from "@/lib/db/schema";

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

  const packEntries = await db
    .select({ challengeId: challengePackEntries.challengeId })
    .from(challengePackEntries)
    .where(eq(challengePackEntries.packId, params.packId));

  const challengeIds = packEntries.map((entry) => entry.challengeId);

  const attempts =
    challengeIds.length > 0
      ? await db
          .select({ challengeId: challengeAttempts.challengeId })
          .from(challengeAttempts)
          .where(
            and(
              eq(challengeAttempts.userId, session.user.id),
              inArray(challengeAttempts.challengeId, challengeIds)
            )
          )
      : [];

  const completed = attempts.length;
  const total = challengeIds.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    pack,
    progress: {
      completed,
      total,
      percentage,
    },
  });
}
