"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import type { Tier, GameMode } from "@/lib/types";
import { FACTIONS } from "@/lib/factions";

interface LeaderboardEntry {
  username: string;
  maxStreak: number;
  totalWins: number;
  totalGames: number;
  factionMembership?: {
    factionId: string;
    factionName: string;
    factionSlug: string;
  } | null;
}

interface FactionLeaderboardResponse {
  weekKey: string;
  weekStartUtc: string;
  weekEndUtc: string;
  rankings: Array<{
    factionId: string;
    factionName: string;
    factionSlug: string;
    points: number;
    avgGuesses: number | null;
    participantCount: number;
    rank: number;
    percentile: number | null;
  }>;
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
type ViewType = "individual" | "factions";

export function Leaderboard() {
  const { data: session } = useSession();
  const [viewType, setViewType] = useState<ViewType>("individual");
  const [tier, setTier] = useState<Tier>("casual");
  const [mode, setMode] = useState<GameMode>("daily");

  const [individualEntries, setIndividualEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [factionRankings, setFactionRankings] = useState<
    FactionLeaderboardResponse["rankings"]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);

    if (viewType === "individual") {
      fetch(`/api/leaderboard?tier=${tier}&mode=${mode}&includeFaction=true`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json() as Promise<LeaderboardEntry[]>;
        })
        .then((data) => {
          setIndividualEntries(data);
          setIsLoading(false);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
        });
    } else {
      fetch(`/api/factions/leaderboard?tier=${tier}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json() as Promise<FactionLeaderboardResponse>;
        })
        .then((data) => {
          setFactionRankings(data.rankings);
          setIsLoading(false);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
        });
    }
  }, [viewType, tier, mode]);

  const currentUsername = session?.user?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* View selector */}
      <div className="flex rounded-lg bg-navy-100/50 p-1 dark:bg-slate-800/50">
        <button
          onClick={() => setViewType("individual")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            viewType === "individual"
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Individual
        </button>
        <button
          onClick={() => setViewType("factions")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            viewType === "factions"
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Factions
        </button>
      </div>

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
      {viewType === "individual" && (
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
      )}

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

      {!isLoading && !error && viewType === "individual" && (
        <>
          {individualEntries.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-navy-500 dark:text-slate-400">
                No pirates on the board yet.
              </p>
              <p className="mt-1 text-xs text-navy-400 dark:text-slate-500">
                Be the first to claim the top spot!
              </p>
            </div>
          )}
          {individualEntries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {/* Header */}
              <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 px-3 text-xs font-bold uppercase tracking-wider text-navy-400 dark:text-slate-500">
                <span>#</span>
                <span>Pirate</span>
                <span className="text-right">Streak</span>
                <span className="text-right">Wins</span>
              </div>

              {/* Rows */}
              {individualEntries.map((entry, index) => {
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

                const factionIcon = null;

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
                      className={`flex items-center gap-1.5 truncate font-bold ${
                        isCurrentUser
                          ? "text-gold-700 dark:text-gold-400"
                          : "text-navy-800 dark:text-slate-100"
                      }`}
                    >
                      {factionIcon && (
                        <span
                          className="text-sm"
                          title={entry.factionMembership?.factionName}
                        >
                          {factionIcon}
                        </span>
                      )}
                      {entry.username}
                      {isCurrentUser && (
                        <span className="text-xs font-normal text-navy-400 dark:text-slate-500">
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
        </>
      )}

      {!isLoading && !error && viewType === "factions" && (
        <>
          {factionRankings.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-navy-500 dark:text-slate-400">
                No factions on the board this week.
              </p>
              <p className="mt-1 text-xs text-navy-400 dark:text-slate-500">
                Join a faction and start playing!
              </p>
            </div>
          )}
          {factionRankings.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {/* Header */}
              <div className="grid grid-cols-[2rem_1fr_4rem_4rem] gap-2 px-3 text-xs font-bold uppercase tracking-wider text-navy-400 dark:text-slate-500">
                <span>#</span>
                <span>Faction</span>
                <span className="text-right">Pts</span>
                <span className="text-right">Avg</span>
              </div>

              {/* Rows */}
              {factionRankings.map((entry) => {
                const rank = entry.rank;
                const rankDisplay =
                  rank === 1
                    ? "🥇"
                    : rank === 2
                      ? "🥈"
                      : rank === 3
                        ? "🥉"
                        : String(rank);

                const factionIcon = null;

                return (
                  <div
                    key={entry.factionSlug}
                    className="grid grid-cols-[2rem_1fr_4rem_4rem] items-center gap-2 rounded-lg bg-parchment-50/80 px-3 py-2.5 text-sm transition-colors hover:bg-parchment-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
                  >
                    <span className="text-center text-xs font-bold text-navy-500 dark:text-slate-400">
                      {rankDisplay}
                    </span>
                    <span className="flex items-center gap-1.5 truncate font-bold text-navy-800 dark:text-slate-100">
                      {factionIcon && (
                        <span className="text-sm">{factionIcon}</span>
                      )}
                      {entry.factionName}
                    </span>
                    <span className="text-right font-mono text-sm font-bold text-navy-700 dark:text-slate-200">
                      {entry.points}
                    </span>
                    <span className="text-right font-mono text-sm text-navy-500 dark:text-slate-400">
                      {entry.avgGuesses !== null
                        ? entry.avgGuesses.toFixed(1)
                        : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
