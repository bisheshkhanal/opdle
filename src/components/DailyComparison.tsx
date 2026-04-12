"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Tier } from "@/lib/types";

interface DailyComparisonProps {
  date: string;
  tier: Tier;
  isWon: boolean;
  guessCount: number;
  onSignInClick?: () => void;
}

interface ComparisonData {
  totalPlayers: number;
  totalWins: number;
  avgGuesses: string | null;
  userRank: number | null;
  userGuessCount: number | null;
}

export function DailyComparison({
  date,
  tier,
  isWon,
  guessCount,
  onSignInClick,
}: DailyComparisonProps) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    setError(false);
    fetch(`/api/daily-results?date=${date}&tier=${tier}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<ComparisonData>;
      })
      .then((d) => {
        setData(d);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  }, [date, tier, status, retryCount]);

  // Not logged in — prompt to sign in
  if (status === "unauthenticated" || (!session && status !== "loading")) {
    return (
      <div className="game-card px-6 py-5 text-center">
        <p className="mb-3 text-sm font-medium text-navy-600 dark:text-slate-300">
          Sign in to see how you ranked today
        </p>
        {onSignInClick && (
          <button
            onClick={onSignInClick}
            className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-800 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="game-card px-6 py-5 text-center">
        <p className="mb-3 text-sm font-medium text-navy-600 dark:text-slate-300">
          Could not load comparison data
        </p>
        <button
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-800 dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const winRate =
    data.totalPlayers > 0
      ? Math.round((data.totalWins / data.totalPlayers) * 100)
      : 0;

  return (
    <div className="game-card px-6 py-5">
      <h3 className="mb-4 text-center font-display text-lg font-semibold text-navy-800 dark:text-slate-200">
        Today&apos;s Results
      </h3>

      {/* Rank display */}
      {isWon && data.userRank !== null && (
        <div className="mb-4 rounded-lg bg-tile-correct/10 px-4 py-3 text-center ring-1 ring-tile-correct/20 dark:bg-green-900/20 dark:ring-green-700/30">
          <p className="text-sm font-medium text-tile-correct dark:text-green-400">
            You solved it in <span className="font-bold">{guessCount}</span>{" "}
            {guessCount === 1 ? "guess" : "guesses"}
          </p>
          <p className="mt-0.5 text-xs text-navy-500 dark:text-slate-400">
            Ranked{" "}
            <span className="font-bold text-navy-700 dark:text-slate-200">
              #{data.userRank}
            </span>{" "}
            out of{" "}
            <span className="font-bold text-navy-700 dark:text-slate-200">
              {data.totalPlayers}
            </span>{" "}
            {data.totalPlayers === 1 ? "player" : "players"} today
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex justify-center gap-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
            {data.totalPlayers}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
            Players
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
            {winRate}%
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
            Win Rate
          </span>
        </div>
        {data.avgGuesses && (
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
              {data.avgGuesses}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
              Avg Guesses
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
