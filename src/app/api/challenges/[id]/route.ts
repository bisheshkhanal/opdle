import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { challengeAttempts, challengeEntities } from "@/lib/db/schema";
import { challengePlaySubmissionSchema } from "@/lib/validators";

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

function isExpiredChallenge(challenge: {
  status?: string;
  expiresAt?: Date | string | null;
}): boolean {
  if (challenge.status && challenge.status !== "active") {
    return true;
  }

  if (!challenge.expiresAt) {
    return false;
  }

  return new Date(challenge.expiresAt).getTime() < Date.now();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const [challenge] = await db
    .select()
    .from(challengeEntities)
    .where(eq(challengeEntities.id, params.id));

  if (!challenge) {
    return jsonError("Challenge not found", 404);
  }

  const history = await db
    .select()
    .from(challengeAttempts)
    .where(eq(challengeAttempts.challengeId, params.id));

  return NextResponse.json({ challenge, history });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = challengePlaySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  if (parsed.data.challengeId !== params.id) {
    return jsonError("Challenge id mismatch", 400);
  }

  const [challenge] = await db
    .select()
    .from(challengeEntities)
    .where(eq(challengeEntities.id, params.id));

  if (!challenge) {
    return jsonError("Challenge not found", 404);
  }

  if (isExpiredChallenge(challenge)) {
    return jsonError("Challenge expired", 410);
  }

  try {
    const [attempt] = await db
      .insert(challengeAttempts)
      .values({
        challengeId: params.id,
        userId: session.user.id,
        guessCount: parsed.data.guessCount,
        solvedAt: parsed.data.solvedAt ? new Date(parsed.data.solvedAt) : null,
        guessesSerialized: parsed.data.guessesSerialized,
        factionSnapshotAtSubmit: session.user.name ?? session.user.id,
      })
      .returning();

    return NextResponse.json({ attempt });
  } catch (error) {
    if (
      error instanceof Error &&
      (error as { code?: string }).code === "23505"
    ) {
      return jsonError("Duplicate submission", 409);
    }

    throw error;
  }
}
