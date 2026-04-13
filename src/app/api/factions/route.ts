import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { factionMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  FACTIONS,
  buildFactionMembershipResponse,
  getFactionBySlug,
} from "@/lib/factions";
import { factionUpdateSchema } from "@/lib/validators";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  return NextResponse.json(
    { factions: FACTIONS },
    {
      headers: CACHE_HEADERS,
    }
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = factionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  const faction = getFactionBySlug(parsed.data.factionSlug);

  if (!faction) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();

  await db
    .insert(factionMemberships)
    .values({
      userId: session.user.id,
      factionSlug: parsed.data.factionSlug,
      joinedAt: now,
      snapshotAt: now,
    })
    .onConflictDoUpdate({
      target: factionMemberships.userId,
      set: {
        factionSlug: parsed.data.factionSlug,
        snapshotAt: now,
      },
    });

  const [membershipRow] = await db
    .select({
      factionSlug: factionMemberships.factionSlug,
      joinedAt: factionMemberships.joinedAt,
      snapshotAt: factionMemberships.snapshotAt,
    })
    .from(factionMemberships)
    .where(eq(factionMemberships.userId, session.user.id));

  const membership = buildFactionMembershipResponse({
    userId: session.user.id,
    username: user.username,
    factionSlug: membershipRow?.factionSlug ?? parsed.data.factionSlug,
    joinedAt: membershipRow?.joinedAt ?? now,
    updatedAt: membershipRow?.snapshotAt ?? now,
  });

  return NextResponse.json({ factionMembership: membership });
}
