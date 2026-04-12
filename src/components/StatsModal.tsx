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

export const BADGES = [
  { threshold: 3, title: "Pirate Apprentice", emoji: "🏴‍☠️" },
  { threshold: 7, title: "Cabin Mate", emoji: "⚓" },
  { threshold: 14, title: "First Mate", emoji: "🗡️" },
  { threshold: 30, title: "Captain", emoji: "👑" },
  { threshold: 50, title: "Yonko", emoji: "🏆" },
];

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

      <div className="flex flex-col items-center gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-slate-300">
          Milestones
        </h3>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {BADGES.map((badge) => {
            const streak = isDaily
              ? dailyStats.maxStreak
              : infiniteStats.maxStreak || 0;
            const isEarned = streak >= badge.threshold;

            const earnedBadges = BADGES.filter((b) => streak >= b.threshold);
            const currentBadge = earnedBadges[earnedBadges.length - 1];
            const isCurrent = currentBadge?.threshold === badge.threshold;

            return (
              <div
                key={badge.threshold}
                className={`flex w-[60px] flex-col items-center justify-center rounded-lg p-2 text-center transition-all sm:w-[70px] ${
                  isEarned
                    ? isCurrent
                      ? "bg-gold-100 ring-2 ring-gold-400 dark:bg-gold-900/40 dark:ring-gold-500"
                      : "bg-gold-50 ring-1 ring-gold-300 dark:bg-gold-900/20 dark:ring-gold-700"
                    : "bg-slate-100 opacity-40 grayscale dark:bg-slate-800"
                }`}
                title={`${badge.title} (${badge.threshold} streak)`}
              >
                <div className="relative mb-1 text-2xl">
                  {badge.emoji}
                  {!isEarned && (
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[8px] text-white">
                      🔒
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold leading-tight text-navy-800 dark:text-slate-200">
                  {badge.title}
                </div>
              </div>
            );
          })}
        </div>
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
