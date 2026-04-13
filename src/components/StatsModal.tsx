"use client";

import React, { useEffect, useState } from "react";
import { ACHIEVEMENT_CATALOG } from "@/lib/progression/achievementCatalog";
import { getAchievementProgress } from "@/lib/storage";
import type { AchievementKind } from "@/lib/progression/types";
import type {
  AchievementProgress,
  DailyStats,
  GameMode,
  InfiniteStats,
  Tier,
} from "@/lib/types";

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

const ACHIEVEMENT_KIND_ORDER: AchievementKind[] = [
  "streak",
  "first-guess",
  "unique-solve",
  "saga-complete",
  "monthly-complete",
];

const ACHIEVEMENT_KIND_LABELS: Record<AchievementKind, string> = {
  streak: "Streaks",
  "first-guess": "Perfect Runs",
  "unique-solve": "Collection",
  "saga-complete": "Saga Progress",
  "monthly-complete": "Monthly",
};

function getAchievementTitle(
  achievementId: string,
  label: string,
  visibility: "visible" | "hidden" | "secret",
  status: "locked" | "revealed" | "unlocked"
): string {
  if (visibility !== "visible" && status === "locked") {
    return "???";
  }

  return label || achievementId;
}

function getAchievementDescription(
  description: string,
  visibility: "visible" | "hidden" | "secret",
  status: "locked" | "revealed" | "unlocked"
): string {
  if (visibility !== "visible" && status === "locked") {
    return "Hidden achievement";
  }

  return description;
}

export function StatsModal({
  dailyStats,
  infiniteStats,
  tier,
  mode = "daily",
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<GameMode>(mode);
  const [achievementProgress, setAchievementProgress] = useState<
    Record<string, AchievementProgress>
  >({});

  useEffect(() => {
    setAchievementProgress(getAchievementProgress());
  }, []);

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
        <div className="flex w-full flex-col gap-4">
          {ACHIEVEMENT_KIND_ORDER.map((kind) => {
            const achievements = ACHIEVEMENT_CATALOG.filter(
              (achievement) => achievement.kind === kind
            );

            if (achievements.length === 0) {
              return null;
            }

            return (
              <section key={kind} className="flex flex-col gap-2">
                <div className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-navy-500 dark:text-slate-400">
                  {ACHIEVEMENT_KIND_LABELS[kind]}
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {achievements.map((achievement) => {
                    const progress: AchievementProgress = achievementProgress[
                      achievement.id
                    ] ?? {
                      progress: 0,
                      target: achievement.target,
                      status: "locked",
                      lastUpdatedAt: "",
                      seasonKey: null,
                    };
                    const isHiddenLocked =
                      achievement.visibility !== "visible" &&
                      progress.status === "locked";
                    const isUnlocked = progress.status === "unlocked";
                    const isRevealed = progress.status === "revealed";

                    return (
                      <div
                        key={achievement.id}
                        className={`flex w-[130px] flex-col rounded-lg p-3 text-left transition-all sm:w-[150px] ${
                          isUnlocked
                            ? "bg-gold-100 ring-2 ring-gold-400 dark:bg-gold-900/40 dark:ring-gold-500"
                            : isRevealed
                              ? "bg-gold-50 ring-1 ring-gold-300 dark:bg-gold-900/20 dark:ring-gold-700"
                              : "bg-slate-100 opacity-80 ring-1 ring-slate-200 grayscale dark:bg-slate-800 dark:ring-slate-700"
                        }`}
                        title={
                          isHiddenLocked
                            ? "Hidden achievement"
                            : `${achievement.label} — ${achievement.description}`
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-500 dark:text-slate-400">
                            {ACHIEVEMENT_KIND_LABELS[achievement.kind]}
                          </div>
                          <div className="text-[11px] font-bold text-navy-700 dark:text-slate-200">
                            {isUnlocked ? "✓" : isRevealed ? "◇" : "🔒"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm font-bold leading-tight text-navy-900 dark:text-slate-100">
                          {getAchievementTitle(
                            achievement.id,
                            achievement.label,
                            achievement.visibility,
                            progress.status
                          )}
                        </div>
                        <div className="mt-1 text-[10px] leading-snug text-navy-600 dark:text-slate-400">
                          {getAchievementDescription(
                            achievement.description,
                            achievement.visibility,
                            progress.status
                          )}
                        </div>
                        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-500 dark:text-slate-400">
                          {isHiddenLocked
                            ? "???"
                            : `${progress.progress}/${progress.target}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
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
