"use client";

import Image from "next/image";

import type { GuessResult, TileStatus } from "@/lib/types";
import { categories } from "@/lib/categories";
import { getArrowIndicator } from "@/lib/evaluateGuess";

interface GuessRowProps {
  guess: GuessResult;
  isLatest?: boolean;
}

/**
 * Maps TileStatus to CSS class for tile styling
 * Uses literal Tailwind classes for proper compilation
 */
function getTileClass(status: TileStatus): string {
  switch (status) {
    case "correct":
      return "tile-correct";
    case "partial":
      return "tile-partial";
    case "wrong":
      return "tile-wrong";
    case "higher":
      return "tile-wrong";
    case "lower":
      return "tile-wrong";
    case "unknown":
      return "tile-unknown";
    default:
      return "tile-wrong";
  }
}

export function GuessRow({ guess, isLatest = false }: GuessRowProps) {
  return (
    <div
      className={`guess-table ${isLatest ? "guess-row-enter" : ""}`}
      role="row"
    >
      {/* Character portrait and name - first column */}
      <div
        className={`character-cell ${guess.isCorrect ? "portrait-stamp" : ""}`}
        role="cell"
      >
        <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-sm ring-2 ring-parchment-300/60 dark:ring-slate-600/60 sm:h-[72px] sm:w-[72px] md:h-[84px] md:w-[84px]">
          <Image
            src={guess.imageUrl}
            alt={guess.characterName}
            fill
            sizes="(min-width: 768px) 84px, (min-width: 640px) 72px, 64px"
            className={`object-cover object-top ${guess.isCorrect ? "reveal-stamp" : "reveal-ink"}`}
            quality={92}
            onError={(event) => {
              event.currentTarget.src = "https://via.placeholder.com/84?text=?";
            }}
          />
        </div>
        <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-navy-800 dark:text-slate-100 sm:text-[13px] md:text-sm">
          {guess.characterName}
        </span>
      </div>

      {/* Category result cells */}
      {guess.categories.map((result, index) => {
        const arrow = getArrowIndicator(result.status);
        const delayClass = `tile-delay-${index + 1}`;

        return (
          <div
            key={result.key}
            className={`guess-cell ${result.status === "correct" ? "tile-reveal-stamp" : "tile-reveal"} ${delayClass} ${getTileClass(result.status)}`}
            role="cell"
            aria-label={`${result.label}: ${result.displayValue}${arrow ? ` (${result.status})` : ""}`}
            data-status={result.status}
          >
            <span className="flex items-center justify-center gap-0.5">
              {arrow && (
                <span
                  className="text-xs font-bold opacity-95 sm:text-sm"
                  aria-hidden="true"
                >
                  {arrow}
                </span>
              )}
              <span className="break-words leading-tight">
                {result.displayValue}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function GuessRowHeader() {
  return (
    <div className="guess-table" role="row">
      {/* Character header */}
      <div
        className="plaque-header flex items-center justify-center rounded-lg p-2 dark:bg-slate-700 md:rounded-xl"
        role="columnheader"
      >
        <span className="text-center font-display text-[10px] font-bold uppercase tracking-wide text-parchment-200 dark:text-slate-200 sm:text-[10.5px] md:text-xs">
          Character
        </span>
      </div>

      {/* Category headers */}
      {categories.map((cat) => (
        <div
          key={cat.key}
          className="plaque-header flex items-center justify-center rounded-lg p-1.5 dark:bg-slate-700 md:rounded-xl md:p-2"
          role="columnheader"
        >
          <span className="text-center font-display text-[9px] font-bold uppercase tracking-wide text-parchment-200 dark:text-slate-200 sm:text-[9.5px] md:text-[10px]">
            {cat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
