"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { loadStorage } from "@/lib/storage";
import type { Tier } from "@/lib/types";

/**
 * Syncs localStorage stats to the server when the user logs in or registers.
 * Also exposes syncDailyResult() for post-game incremental sync.
 * All network calls are fire-and-forget — failures are silent to preserve UX.
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const hasSyncedRef = useRef(false);

  // Full sync on login (session transitions from unauthenticated → authenticated)
  useEffect(() => {
    if (status !== "authenticated" || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const storage = loadStorage();

    fetch("/api/stats/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyStats: storage.dailyStats,
        infiniteStats: storage.infiniteStats,
      }),
    }).catch(() => {
      // Silent failure — localStorage remains source of truth
    });
  }, [status]);

  // Reset sync flag on logout so next login re-syncs
  useEffect(() => {
    if (status === "unauthenticated") {
      hasSyncedRef.current = false;
    }
  }, [status]);

  // Incremental sync after a single daily game completes
  const syncDailyResult = useCallback(
    (params: {
      date: string;
      tier: Tier;
      guessCount: number;
      isWon: boolean;
      hintUsed: boolean;
    }) => {
      if (!session?.user?.id) return;

      fetch("/api/stats/daily-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).catch(() => {
        // Silent failure
      });
    },
    [session]
  );

  return {
    syncDailyResult,
    isAuthenticated: status === "authenticated",
  };
}
