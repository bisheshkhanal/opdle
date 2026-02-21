"use client";

import type { GameMode } from "@/lib/types";

interface ModeTabsProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="inline-flex rounded-2xl border-2 border-parchment-400/80 bg-parchment-200/80 p-1.5 shadow-inner backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-800/80">
      {/* Daily Mode - Today's Bounty */}
      <button
        onClick={() => onModeChange("daily")}
        className={`relative rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ${
          mode === "daily"
            ? "bg-navy-700 text-white shadow-card ring-2 ring-gold-400/50 dark:bg-slate-600 dark:ring-gold-500/60"
            : "text-navy-600 hover:bg-parchment-300/80 hover:text-navy-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
        }`}
        aria-pressed={mode === "daily"}
      >
        <span className="relative z-10 flex items-center gap-2.5 font-display tracking-wide">
          {/* Sun/Calendar icon */}
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${mode === "daily" ? "text-gold-400" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <span>Daily</span>
        </span>
        {mode === "daily" && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-500"></span>
          </span>
        )}
      </button>

      {/* Infinite Mode - Endless Seas */}
      <button
        onClick={() => onModeChange("infinite")}
        className={`relative rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ${
          mode === "infinite"
            ? "bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-card ring-2 ring-gold-300/60 dark:from-gold-400 dark:to-gold-500 dark:ring-gold-400/60"
            : "text-navy-600 hover:bg-parchment-300/80 hover:text-navy-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
        }`}
        aria-pressed={mode === "infinite"}
      >
        <span className="relative z-10 flex items-center gap-2.5 font-display tracking-wide">
          {/* Infinity/Wave icon */}
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${mode === "infinite" ? "animate-pulse" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.781 0-4.781 8 0 8 5.606 0 7.644-8 12.74-8z"
            />
          </svg>
          <span>Infinite</span>
        </span>
        {mode === "infinite" && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}
