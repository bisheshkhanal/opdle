"use client";

import { useState } from "react";
import type { GuessResult, GameMode } from "@/lib/types";
import { shareResults } from "@/lib/share";

interface ResultsShareProps {
  guesses: GuessResult[];
  mode: GameMode;
  isWon: boolean;
  dateString?: string;
}

export function ResultsShare({
  guesses,
  mode,
  isWon,
  dateString,
}: ResultsShareProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const result = await shareResults(guesses, mode, isWon, dateString);
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3.5">
      <button
        onClick={handleShare}
        className={`btn-success transition-transform ${copied ? "scale-105" : ""} font-display`}
        aria-live="polite"
      >
        {copied ? (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Copy Results
          </>
        )}
      </button>
      <span className="text-xs font-medium text-navy-500 dark:text-slate-400">
        {mode === "daily" ? "Daily Challenge" : "Infinite Mode"}
      </span>
    </div>
  );
}
