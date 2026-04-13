"use client";

import React from "react";
import type { MonthlyCollections, MonthlySeason } from "@/lib/types";
import { getActiveSeason, isMonthlyComplete } from "@/lib/progression/monthly";

interface CollectionGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CollectionGrid({
  children,
  className = "",
}: CollectionGridProps) {
  return (
    <div
      className={`grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 ${className}`}
    >
      {children}
    </div>
  );
}

interface MonthlyCollectionBoardProps {
  collections: MonthlyCollections;
  className?: string;
}

export function MonthlyCollectionBoard({
  collections,
  className = "",
}: MonthlyCollectionBoardProps) {
  const activeSeason = getActiveSeason(collections);
  const isComplete = isMonthlyComplete(collections);

  if (!activeSeason) {
    return (
      <div
        className={`p-6 text-center text-navy-400 dark:text-navy-300 ${className}`}
      >
        No active collection season.
      </div>
    );
  }

  const { targetFragments, revealedFragmentIndexes, collectibleType } =
    activeSeason;
  const progress = revealedFragmentIndexes.length;

  const getIcon = () => {
    if (collectibleType === "bounty-poster") {
      return "📜";
    }
    if (collectibleType === "vivre-card") {
      return "🃏";
    }
    return "✨";
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy-800 dark:text-navy-100">
          Season {collections.activeSeasonKey}
        </h3>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-navy-600 dark:text-navy-300">
            {progress} / {targetFragments}
          </span>
          {isComplete && (
            <span className="rounded bg-gold-500 px-2 py-0.5 text-xs text-white">
              COMPLETE
            </span>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-parchment-300 dark:bg-navy-800">
        <div
          className="h-full bg-gold-500 transition-all duration-500"
          style={{ width: `${(progress / targetFragments) * 100}%` }}
        />
      </div>

      <CollectionGrid>
        {Array.from({ length: targetFragments }).map((_, index) => {
          const isRevealed = revealedFragmentIndexes.includes(index);

          return (
            <div
              key={index}
              data-testid={`fragment-tile-${index}`}
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 text-2xl transition-all duration-200 ${
                isRevealed
                  ? "border-gold-500 bg-parchment-100 shadow-sm dark:bg-navy-700"
                  : "border-navy-300/30 bg-parchment-200/50 opacity-70 dark:border-navy-700/50 dark:bg-navy-800/50"
              }`}
            >
              {isRevealed ? (
                <span>{getIcon()}</span>
              ) : (
                <span className="text-navy-300 dark:text-navy-600">?</span>
              )}
            </div>
          );
        })}
      </CollectionGrid>
    </div>
  );
}
