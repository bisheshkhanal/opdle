"use client";

import type { GameMode, Tier } from "@/lib/types";
import { getDailyGameNumber } from "@/lib/daily";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModeTabs } from "@/components/ModeTabs";
import { TierTabs } from "@/components/TierTabs";

interface GamePageHeaderProps {
  mode: GameMode;
  tier: Tier;
  challengeMode: boolean;
  maxGuesses: number;
  characterCounts: Record<Tier, number>;
  onModeChange: (mode: GameMode) => void;
  onTierChange: (tier: Tier) => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenLeaderboard: () => void;
  onOpenBountyBoard: () => void;
  onOpenStats: () => void;
  onSignInClick: () => void;
}

export function GamePageHeader({
  mode,
  tier,
  challengeMode,
  maxGuesses,
  characterCounts,
  onModeChange,
  onTierChange,
  onOpenArchive,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenLeaderboard,
  onOpenBountyBoard,
  onOpenStats,
  onSignInClick,
}: GamePageHeaderProps) {
  return (
    <header className="border-b border-parchment-300/40 bg-gradient-to-b from-parchment-50/95 via-parchment-100/90 to-parchment-100/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-5 sm:py-7">
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          <button
            onClick={onOpenArchive}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Archive"
            title="Archive"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2v20l4-3 4 3 4-3 4 3V2H4z" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="13" y2="12" />
            </svg>
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Settings"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={onOpenHowToPlay}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="How to Play"
            title="How to Play"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Leaderboard"
            title="Leaderboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20V10"></path>
              <path d="M18 20V4"></path>
              <path d="M6 20v-4"></path>
            </svg>
          </button>
          <button
            onClick={onOpenBountyBoard}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Bounty Board"
            title="Bounty Board"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </button>
          <button
            onClick={onOpenStats}
            className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Show statistics"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </button>
          <UserMenu onSignInClick={onSignInClick} />
          <ThemeToggle />
        </div>
        <h1 className="mb-3 font-display text-4xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 sm:text-5xl">
          <span className="text-tile-wrong dark:text-red-400">One</span>
          <span className="text-navy-700 dark:text-slate-200">Piece</span>
          <span className="text-gold-600 dark:text-gold-400">dle</span>
        </h1>
        <div className="mb-3 h-0.5 w-32 rounded-full bg-gradient-to-r from-gold-400/80 via-gold-300/40 to-transparent dark:from-gold-500/60 dark:via-gold-400/30 dark:to-transparent" />
        <p className="mb-4 text-sm text-navy-500 dark:text-slate-400 sm:text-[15px]">
          Guess the character in {maxGuesses} tries
          {mode === "daily" && (
            <span className="ml-2 inline-flex items-center rounded-full bg-navy-100/70 px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-200/50 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600/50">
              #{getDailyGameNumber()}
            </span>
          )}
        </p>
        {!challengeMode && <ModeTabs mode={mode} onModeChange={onModeChange} />}
        {!challengeMode && (
          <div className="mt-3">
            <TierTabs
              tier={tier}
              onTierChange={onTierChange}
              characterCounts={characterCounts}
            />
          </div>
        )}
      </div>
    </header>
  );
}
