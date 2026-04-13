import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challengePacks } from "@/lib/db/schema";

export async function GET() {
  const packs = await db.select().from(challengePacks);

  return NextResponse.json({ packs });
}
