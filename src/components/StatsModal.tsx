"use client";

import React, { useState } from "react";
import type { DailyStats, InfiniteStats, Tier, GameMode } from "@/lib/types";

interface StatsModalProps {
  dailyStats: DailyStats;
  infiniteStats: InfiniteStats;
  tier: Tier;
  mode?: GameMode;
}

const TIER_LABELS: Record<Tier, string> = {
  casual: "Casual",
  fan: "Fan",
  nakama: "Nakama",
};

export function StatsModal({
  dailyStats,
  infiniteStats,
  tier,
  mode = "daily",
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<GameMode>(mode);

  const isDaily = activeTab === "daily";
  const distribution = isDaily
    ? dailyStats.winDistribution || {}
    : infiniteStats.winDistribution || {};

  const maxCount = Math.max(
    1,
    ...Array.from({ length: 6 }, (_, i) => distribution[i + 1] || 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2 rounded-lg bg-navy-100/50 p-1 dark:bg-slate-800/50">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            isDaily
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveTab("infinite")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            !isDaily
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Infinite
        </button>
      </div>

      <div className="flex justify-center gap-8 text-center">
        {isDaily ? (
          <>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
                {dailyStats.streak}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
                Current Streak
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
                {dailyStats.maxStreak}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
                Max Streak
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
                {infiniteStats.streak || 0}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
                Current Streak
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
                {infiniteStats.maxStreak || 0}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
                Max Streak
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-navy-900 dark:text-slate-100">
                {infiniteStats.totalWins}/{infiniteStats.totalGames}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
                Total W/G
              </span>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <span className="inline-flex rounded-full bg-navy-100/70 px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-200/50 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600/50">
          {TIER_LABELS[tier]} Tier
        </span>
      </div>

      <div>
        <h3 className="mb-4 text-center font-display text-lg font-semibold text-navy-800 dark:text-slate-200">
          {isDaily ? "Win Distribution" : "Infinite Win Distribution"}
        </h3>
        {!isDaily && infiniteStats.totalGames === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-navy-500 dark:text-slate-400">
            Play Infinite mode to track your stats!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => i + 1).map((guessCount) => {
              const count = distribution[guessCount] || 0;
              const widthPercentage = Math.max(7, (count / maxCount) * 100);
              const isMax = count === maxCount && count > 0;

              return (
                <div
                  key={guessCount}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-3 text-right font-medium text-navy-600 dark:text-slate-400">
                    {guessCount}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`flex h-6 items-center justify-end rounded px-2 text-xs font-bold text-white transition-all duration-500 ${
                        isMax
                          ? "bg-gold-500 dark:bg-gold-600"
                          : "bg-navy-400 dark:bg-slate-600"
                      }`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
