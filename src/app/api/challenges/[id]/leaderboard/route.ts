import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { challengeAttempts, challengeEntities } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const [challenge] = await db
    .select()
    .from(challengeEntities)
    .where(eq(challengeEntities.id, params.id));

  if (!challenge) {
    return jsonError("Challenge not found", 404);
  }

  const leaderboard = await db
    .select()
    .from(challengeAttempts)
    .where(eq(challengeAttempts.challengeId, params.id));

  return NextResponse.json({ leaderboard });
}
