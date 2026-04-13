import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import {
  pushSubscriptionCreateSchema,
  pushSubscriptionDeleteSchema,
  pushSubscriptionUpdateSchema,
} from "@/lib/validators";
import { z } from "zod";

type SessionLike = {
  user?: {
    id?: string;
  } | null;
} | null;

type SubscriptionPayload = z.infer<typeof pushSubscriptionUpdateSchema>;

function getUserId(session: SessionLike) {
  return session?.user?.id;
}

function getUserAgent(request: Request) {
  return request.headers.get("user-agent") ?? "unknown";
}

async function requireUser() {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId };
}

export async function GET() {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.appOptIn, true)
      )
    );

  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSubscriptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const createParsed = pushSubscriptionCreateSchema.safeParse(body);
    if (!createParsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
  }

  const payload: SubscriptionPayload = parsed.success
    ? parsed.data
    : {
        ...pushSubscriptionCreateSchema.parse(body),
        appOptIn: undefined,
      };
  const existingRows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, payload.endpoint));

  const existing = existingRows[0];
  const keys =
    payload.keys ??
    (existing ? { p256dh: existing.p256dhKey, auth: existing.authKey } : null);

  if (!keys) {
    return NextResponse.json(
      { error: "Keys are required for a new subscription" },
      { status: 400 }
    );
  }

  const values = {
    userId: authResult.userId,
    endpoint: payload.endpoint,
    p256dhKey: keys.p256dh,
    authKey: keys.auth,
    userAgent: getUserAgent(request),
    timezone: payload.timezone ?? existing?.timezone ?? null,
    utcOffset: payload.utcOffset ?? existing?.utcOffset ?? null,
    appOptIn:
      typeof payload.appOptIn === "boolean"
        ? payload.appOptIn
        : (existing?.appOptIn ?? true),
    updatedAt: new Date(),
  };

  const [subscription] = await db
    .insert(pushSubscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: values,
    })
    .returning();

  return NextResponse.json({ subscription });
}

export async function DELETE(request: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSubscriptionDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, parsed.data.endpoint),
        eq(pushSubscriptions.userId, authResult.userId)
      )
    );

  return NextResponse.json({ ok: true });
}
