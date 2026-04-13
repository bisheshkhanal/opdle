"use client";

import React, { useRef, useEffect } from "react";
import { SAGA_CATALOG } from "@/lib/progression/sagaCatalog";
import type { TierProgression } from "@/lib/types";
import {
  getSagaNodeStatus,
  getSagaProgressText,
} from "@/lib/progression/sagas";
import type { SagaId } from "@/lib/progression/types";

interface SagaRouteMapProps {
  progression: TierProgression;
  onSagaClick?: (sagaId: SagaId) => void;
  selectedSagaId?: SagaId | null;
  className?: string;
}

export function SagaRouteMap({
  progression,
  onSagaClick,
  selectedSagaId,
  className = "",
}: SagaRouteMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedSagaId || !scrollRef.current) return;
    const selectedEl = scrollRef.current.querySelector(
      `[data-saga-id="${selectedSagaId}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedSagaId]);

  return (
    <div
      ref={scrollRef}
      className={`hide-scrollbar relative flex w-full overflow-x-auto px-4 py-8 sm:px-8 ${className}`}
      role="region"
      aria-label="Saga progression map"
    >
      <div className="flex min-w-max items-center">
        {SAGA_CATALOG.map((saga, index) => {
          const status = getSagaNodeStatus(progression, saga.id);
          const progressText = getSagaProgressText(progression, saga.id);
          const isSelected = selectedSagaId === saga.id;
          const isLast = index === SAGA_CATALOG.length - 1;

          const isCompleted = status === "completed";
          const isUnlocked = status === "unlocked";
          const isLocked = status === "locked";

          const colorTokens: Record<
            string,
            { bg: string; border: string; text: string }
          > = {
            gold: {
              bg: "bg-gold-100 dark:bg-gold-900/40",
              border: "border-gold-500",
              text: "text-gold-800 dark:text-gold-200",
            },
            amber: {
              bg: "bg-amber-100 dark:bg-amber-900/40",
              border: "border-amber-500",
              text: "text-amber-800 dark:text-amber-200",
            },
            sky: {
              bg: "bg-sky-100 dark:bg-sky-900/40",
              border: "border-sky-500",
              text: "text-sky-800 dark:text-sky-200",
            },
            cyan: {
              bg: "bg-cyan-100 dark:bg-cyan-900/40",
              border: "border-cyan-500",
              text: "text-cyan-800 dark:text-cyan-200",
            },
            violet: {
              bg: "bg-violet-100 dark:bg-violet-900/40",
              border: "border-violet-500",
              text: "text-violet-800 dark:text-violet-200",
            },
            red: {
              bg: "bg-red-100 dark:bg-red-900/40",
              border: "border-red-500",
              text: "text-red-800 dark:text-red-200",
            },
            blue: {
              bg: "bg-blue-100 dark:bg-blue-900/40",
              border: "border-blue-500",
              text: "text-blue-800 dark:text-blue-200",
            },
            rose: {
              bg: "bg-rose-100 dark:bg-rose-900/40",
              border: "border-rose-500",
              text: "text-rose-800 dark:text-rose-200",
            },
            pink: {
              bg: "bg-pink-100 dark:bg-pink-900/40",
              border: "border-pink-500",
              text: "text-pink-800 dark:text-pink-200",
            },
            emerald: {
              bg: "bg-emerald-100 dark:bg-emerald-900/40",
              border: "border-emerald-500",
              text: "text-emerald-800 dark:text-emerald-200",
            },
            purple: {
              bg: "bg-purple-100 dark:bg-purple-900/40",
              border: "border-purple-500",
              text: "text-purple-800 dark:text-purple-200",
            },
          };

          const themeTokens = colorTokens[saga.themeColor] || colorTokens.gold;

          let nodeClasses =
            "relative z-10 flex h-24 w-40 flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all duration-300 shadow-soft ";
          let labelClasses = "font-display text-lg leading-tight mb-1 ";
          let textClasses = "text-sm font-sans ";
          let ringClasses = isSelected
            ? "ring-4 ring-gold-400 ring-offset-2 ring-offset-parchment-100 dark:ring-offset-navy-900 "
            : "";

          if (isCompleted) {
            nodeClasses += `${themeTokens.bg} ${themeTokens.border} shadow-tile-correct hover:scale-105 cursor-pointer `;
            labelClasses += `${themeTokens.text} font-bold `;
            textClasses += "text-gold-600 dark:text-gold-400 font-bold ";
          } else if (isUnlocked) {
            nodeClasses += `bg-parchment-200 dark:bg-navy-800 border-parchment-400 hover:border-parchment-500 hover:scale-105 cursor-pointer opacity-90 `;
            labelClasses += "text-navy-700 dark:text-parchment-200 ";
            textClasses += "text-navy-500 dark:text-parchment-400 ";
          } else {
            nodeClasses +=
              "bg-parchment-300/50 dark:bg-navy-900/50 border-parchment-400/30 dark:border-navy-700/50 opacity-50 grayscale cursor-not-allowed ";
            labelClasses += "text-navy-600 dark:text-parchment-300 ";
            textClasses += "text-navy-500/70 dark:text-parchment-400/70 ";
          }

          return (
            <div key={saga.id} className="group relative flex items-center">
              <div
                data-saga-id={saga.id}
                role={isLocked ? "presentation" : "button"}
                tabIndex={isLocked ? -1 : 0}
                className={`${nodeClasses} ${ringClasses}`}
                onClick={() => {
                  if (!isLocked && onSagaClick) {
                    onSagaClick(saga.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isLocked && onSagaClick) {
                      onSagaClick(saga.id);
                    }
                  }
                }}
                aria-disabled={isLocked}
                aria-pressed={isSelected}
              >
                <div className={labelClasses}>{saga.label}</div>
                <div className={textClasses}>
                  {isCompleted ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="text-gold-500">★</span> Completed
                    </span>
                  ) : (
                    progressText
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="h-0 w-16 flex-shrink-0 border-t-4 border-dotted border-parchment-400 opacity-60 dark:border-navy-600 md:w-24" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
