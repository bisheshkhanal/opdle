"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Tier } from "@/lib/types";
import type { DailyComparisonAnalyticsResult } from "@/lib/daily-comparison-analytics";
import { getFactionBySlug } from "@/lib/factions";

interface DailyComparisonProps {
  date: string;
  tier: Tier;
  isWon: boolean;
  guessCount: number;
  onSignInClick?: () => void;
}

export function DailyComparison({
  date,
  tier,
  isWon,
  guessCount,
  onSignInClick,
}: DailyComparisonProps) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DailyComparisonAnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status === "loading") return;

    setIsLoading(true);
    setError(false);
    fetch(`/api/daily-results?date=${date}&tier=${tier}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<DailyComparisonAnalyticsResult>;
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

  if (isLoading) {
    return null; // Or a loading skeleton
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
    data.sampleSize > 0
      ? Math.round((data.totalWins / data.sampleSize) * 100)
      : 0;

  const isAnon = status === "unauthenticated" || !session;
  const isLowSample = data.sampleSize < 5;

  const maxDistributionCount = Math.max(1, ...data.guessDistribution);

  return (
    <div className="game-card px-6 py-5">
      <h3 className="mb-4 text-center font-display text-lg font-semibold text-navy-800 dark:text-slate-200">
        Today&apos;s Results
      </h3>

      {/* Global Stats row */}
      <div className="mb-6 flex justify-center gap-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
            {data.sampleSize}
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
              {data.avgGuesses.toFixed(1)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
              Avg Guesses
            </span>
          </div>
        )}
      </div>

      {isAnon && onSignInClick && (
        <div className="mb-6 rounded-lg bg-navy-50 p-4 text-center dark:bg-slate-800/50">
          <p className="mb-3 text-sm font-medium text-navy-600 dark:text-slate-300">
            Sign in to see your percentile and faction stats
          </p>
          <button
            onClick={onSignInClick}
            className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-800 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Rank/Percentile display */}
      {!isAnon && isWon && data.percentile !== null && (
        <div
          data-testid="percentile-messaging"
          className="mb-6 rounded-lg bg-tile-correct/10 px-4 py-3 text-center ring-1 ring-tile-correct/20 dark:bg-green-900/20 dark:ring-green-700/30"
        >
          <p className="text-sm font-medium text-tile-correct dark:text-green-400">
            You solved it in <span className="font-bold">{guessCount}</span>{" "}
            {guessCount === 1 ? "guess" : "guesses"}
          </p>
          <p className="mt-0.5 text-sm font-bold text-navy-700 dark:text-slate-200">
            You&apos;re in the top {data.percentile}%!
          </p>
          {data.rank && (
            <p className="mt-0.5 text-xs text-navy-500 dark:text-slate-400">
              Ranked #{data.rank} out of {data.sampleSize}
            </p>
          )}
        </div>
      )}

      {/* Low sample fallback */}
      {isLowSample && (
        <div className="py-4 text-center">
          <p className="text-sm font-medium italic text-navy-500 dark:text-slate-400">
            Not enough data yet for charts and trends. Check back later!
          </p>
        </div>
      )}

      {/* Charts & Trends */}
      {!isLowSample && (
        <div className="flex flex-col gap-6">
          {/* Faction Slice */}
          {data.factionSlice && (
            <div
              data-testid="faction-slice-row"
              className="rounded-lg bg-navy-50 p-4 dark:bg-slate-800/50"
            >
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-slate-400">
                Your Faction:{" "}
                <span className="text-navy-900 dark:text-slate-200">
                  {getFactionBySlug(data.factionSlice.factionSlug)
                    ?.factionName ?? data.factionSlice.factionSlug}
                </span>
              </h4>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-navy-500 dark:text-slate-400">
                    Members today:
                  </span>{" "}
                  <span className="font-bold text-navy-800 dark:text-slate-200">
                    {data.factionSlice.sampleSize}
                  </span>
                </div>
                {data.factionSlice.avgGuesses && (
                  <div>
                    <span className="text-navy-500 dark:text-slate-400">
                      Avg Guesses:
                    </span>{" "}
                    <span className="font-bold text-navy-800 dark:text-slate-200">
                      {data.factionSlice.avgGuesses.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distribution Chart */}
          <div data-testid="distribution-chart">
            <h4 className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-slate-400">
              Guess Distribution
            </h4>
            <div className="flex flex-col gap-1.5">
              {data.guessDistribution.map((count, index) => {
                const gCount = index + 1;
                const widthPercentage = Math.max(
                  5,
                  (count / maxDistributionCount) * 100
                );
                const isHighlight = data.userGuessCount === gCount;

                return (
                  <div key={gCount} className="flex items-center gap-2 text-sm">
                    <div className="w-3 text-right font-medium text-navy-600 dark:text-slate-400">
                      {gCount}
                    </div>
                    <div className="flex-1">
                      <div
                        data-testid={`dist-bar-${gCount}${isHighlight ? "-highlight" : ""}`}
                        className={`flex h-5 items-center justify-end rounded px-2 text-xs font-bold transition-all duration-500 ${
                          isHighlight
                            ? "bg-tile-correct text-white dark:bg-green-600"
                            : count > 0
                              ? "bg-navy-400 text-white dark:bg-slate-600"
                              : "bg-navy-100 text-navy-400 dark:bg-slate-800 dark:text-slate-500"
                        }`}
                        style={{ width: `${widthPercentage}%` }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Trend */}
          {data.trendData && data.trendData.length > 0 && (
            <div data-testid="trend-section">
              <h4 className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-slate-400">
                Percentile Trend
              </h4>
              <div className="flex h-20 items-end justify-between gap-1 rounded-lg border border-navy-100 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/30">
                {data.trendData.map((day, i) => {
                  const pct = day.percentile ?? 0;
                  // Higher percentile means better rank (closer to 100%). We represent 100% as full height.
                  const height = day.percentile === null ? "0%" : `${pct}%`;
                  const label = new Date(day.date).toLocaleDateString(
                    undefined,
                    { weekday: "short" }
                  );

                  return (
                    <div
                      key={i}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      {day.percentile !== null && (
                        <div
                          className="w-full max-w-4 rounded-t-sm bg-gold-400 transition-all dark:bg-gold-500"
                          style={{ height }}
                          title={`${day.date}: Top ${pct}%`}
                        ></div>
                      )}
                      <span className="text-[10px] text-navy-400 dark:text-slate-500">
                        {label[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
