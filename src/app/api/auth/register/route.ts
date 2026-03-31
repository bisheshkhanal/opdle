import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [user] = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id, username: users.username });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const getCode = (e: unknown): string | undefined => {
      if (e && typeof e === "object") {
        if ("code" in e) return (e as { code: string }).code;
        if (
          "cause" in e &&
          e.cause &&
          typeof e.cause === "object" &&
          "code" in e.cause
        )
          return (e.cause as { code: string }).code;
      }
    };

    if (getCode(error) === "23505") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
