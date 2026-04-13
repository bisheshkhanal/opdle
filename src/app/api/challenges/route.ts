import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { challengeAttempts, challengeEntities } from "@/lib/db/schema";
import {
  challengeCreationSchema,
  challengeHistoryQueryParamsSchema,
} from "@/lib/validators";

export const dynamic = "force-dynamic";

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "challenge";
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

function tierLevelFromTier(tierLevel: "casual" | "fan" | "nakama"): number {
  switch (tierLevel) {
    case "fan":
      return 2;
    case "nakama":
      return 3;
    default:
      return 1;
  }
}

export async function POST(request: Request) {
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

  const parsed = challengeCreationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const [challenge] = await db
      .insert(challengeEntities)
      .values({
        creatorUserId: session.user.id,
        slug: slugify(parsed.data.title),
        title: parsed.data.title,
        description: parsed.data.description,
        tierLevel: tierLevelFromTier(parsed.data.tierLevel),
        status: "active",
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
      })
      .returning();

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error as { code?: string }).code === "23505"
    ) {
      return jsonError("Challenge already exists", 409);
    }

    throw error;
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = challengeHistoryQueryParamsSchema.safeParse({
    userId: searchParams.get("userId") ?? undefined,
    challengeId: searchParams.get("challengeId") ?? undefined,
    packSlug: searchParams.get("packSlug") ?? undefined,
    solved: searchParams.get("solved") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid query", 400);
  }

  if (parsed.data.userId && parsed.data.userId !== session.user.id) {
    return jsonError("Forbidden", 403);
  }

  let challenge = null;
  if (parsed.data.challengeId) {
    [challenge] = await db
      .select()
      .from(challengeEntities)
      .where(eq(challengeEntities.id, parsed.data.challengeId));

    if (!challenge) {
      return jsonError("Challenge not found", 404);
    }
  }

  const query = db
    .select()
    .from(challengeAttempts)
    .where(
      and(
        eq(challengeAttempts.userId, session.user.id),
        parsed.data.challengeId
          ? eq(challengeAttempts.challengeId, parsed.data.challengeId)
          : eq(challengeAttempts.userId, session.user.id)
      )
    )
    .orderBy(desc(challengeAttempts.createdAt))
    .limit(parsed.data.limit);

  const history = await query;

  return NextResponse.json(challenge ? { challenge, history } : { history });
}
