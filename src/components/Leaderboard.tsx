"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import type { Tier, GameMode } from "@/lib/types";

interface LeaderboardEntry {
  username: string;
  maxStreak: number;
  totalWins: number;
  totalGames: number;
}

const TIER_LABELS: Record<Tier, string> = {
  casual: "Casual",
  fan: "Fan",
  nakama: "Nakama",
};

const MODE_LABELS: Record<GameMode, string> = {
  daily: "Daily",
  infinite: "Infinite",
};

const TIERS: Tier[] = ["casual", "fan", "nakama"];
const MODES: GameMode[] = ["daily", "infinite"];

export function Leaderboard() {
  const { data: session } = useSession();
  const [tier, setTier] = useState<Tier>("casual");
  const [mode, setMode] = useState<GameMode>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);

    fetch(`/api/leaderboard?tier=${tier}&mode=${mode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<LeaderboardEntry[]>;
      })
      .then((data) => {
        setEntries(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  }, [tier, mode]);

  const currentUsername = session?.user?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Tier selector */}
      <div className="flex rounded-lg bg-navy-100/50 p-1 dark:bg-slate-800/50">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
              tier === t
                ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
                : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {TIER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Mode selector */}
      <div className="flex rounded-lg bg-navy-100/50 p-1 dark:bg-slate-800/50">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
              mode === m
                ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
                : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-parchment-200/80 dark:bg-slate-700/80"
            />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="py-8 text-center text-sm font-medium text-navy-500 dark:text-slate-400">
          Could not load leaderboard. Try again later.
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-navy-500 dark:text-slate-400">
            No pirates on the board yet.
          </p>
          <p className="mt-1 text-xs text-navy-400 dark:text-slate-500">
            Be the first to claim the top spot!
          </p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 px-3 text-xs font-bold uppercase tracking-wider text-navy-400 dark:text-slate-500">
            <span>#</span>
            <span>Pirate</span>
            <span className="text-right">Streak</span>
            <span className="text-right">Wins</span>
          </div>

          {/* Rows */}
          {entries.map((entry, index) => {
            const isCurrentUser = entry.username === currentUsername;
            const rank = index + 1;
            const rankDisplay =
              rank === 1
                ? "🥇"
                : rank === 2
                  ? "🥈"
                  : rank === 3
                    ? "🥉"
                    : String(rank);

            return (
              <div
                key={entry.username}
                className={`grid grid-cols-[2rem_1fr_5rem_5rem] items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isCurrentUser
                    ? "bg-gold-400/10 ring-2 ring-gold-400/60 dark:bg-gold-500/10 dark:ring-gold-500/60"
                    : "bg-parchment-50/80 hover:bg-parchment-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
                }`}
              >
                <span className="text-center text-xs font-bold text-navy-500 dark:text-slate-400">
                  {rankDisplay}
                </span>
                <span
                  className={`truncate font-bold ${
                    isCurrentUser
                      ? "text-gold-700 dark:text-gold-400"
                      : "text-navy-800 dark:text-slate-100"
                  }`}
                >
                  {entry.username}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs font-normal text-navy-400 dark:text-slate-500">
                      (you)
                    </span>
                  )}
                </span>
                <span className="text-right font-mono text-sm font-bold text-navy-700 dark:text-slate-200">
                  {entry.maxStreak}
                </span>
                <span className="text-right font-mono text-sm text-navy-500 dark:text-slate-400">
                  {entry.totalWins}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
