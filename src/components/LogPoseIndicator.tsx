"use client";

import type { TierLogPose, Tier } from "@/lib/types";
import { getChargeCount, getLastProtectedDay } from "@/lib/progression/logPose";

interface LogPoseIndicatorProps {
  logPose: TierLogPose;
  tier: Tier;
  className?: string;
}

function formatProtectedDay(protectedDay: string): string {
  return protectedDay.endsWith("+1") ? protectedDay.slice(0, -2) : protectedDay;
}

export function LogPoseIndicator({
  logPose,
  tier,
  className = "",
}: LogPoseIndicatorProps) {
  const charges = getChargeCount(logPose);
  const lastProtectedDay = getLastProtectedDay(logPose);
  const isReady = charges > 0;

  return (
    <div
      className={`inline-flex max-w-full flex-col gap-1 rounded-2xl border px-3 py-2 text-sm shadow-sm backdrop-blur-sm ${
        isReady
          ? "border-gold-400/40 bg-gold-400/10 text-gold-700 dark:border-gold-500/40 dark:bg-gold-500/10 dark:text-gold-200"
          : "border-slate-300/80 bg-slate-100/80 text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400"
      } ${className}`}
      data-tier={tier}
      aria-label={`Log Pose status for ${tier}`}
    >
      <span className="flex items-center gap-2 font-medium leading-none">
        <span aria-hidden="true" className="text-base">
          🧭
        </span>
        <span>Log Pose: {charges}/2 charges</span>
      </span>

      {lastProtectedDay ? (
        <span className="text-current/75 text-[11px] font-medium leading-tight">
          Last protected: {formatProtectedDay(lastProtectedDay)}
        </span>
      ) : null}
    </div>
  );
}
