import { NextResponse } from "next/server";
import { z } from "zod";
import { tierSchema } from "@/lib/validators";
import { dispatchReminders } from "@/lib/reminder-eligibility";

const reminderDispatchRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  mode: z.enum(["cron", "manual"]).optional().default("manual"),
  dryRun: z.boolean().optional(),
  baseUrl: z.string().min(1).optional(),
  tiers: z.array(tierSchema).min(1).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reminderDispatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const summary = await dispatchReminders({
    date: parsed.data.date,
    baseUrl: parsed.data.baseUrl,
    dryRun: parsed.data.dryRun,
    tiers: parsed.data.tiers,
    requireLateWeek: parsed.data.mode === "cron",
  });

  return NextResponse.json({
    ok: true,
    mode: parsed.data.mode,
    summary,
  });
}
