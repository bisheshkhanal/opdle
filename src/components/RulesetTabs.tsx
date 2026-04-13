"use client";

import { useRef, useCallback } from "react";
import type { Ruleset } from "@/lib/types";

interface RulesetTabsProps {
  activeRuleset: Ruleset;
  onRulesetChange: (ruleset: Ruleset) => void;
}

const TAB_ORDER: Ruleset[] = ["classic", "wanted", "quote", "four-seas"];

const TAB_ICONS: Record<string, React.ReactNode> = {
  classic: (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  wanted: (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  quote: (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  "four-seas": (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7c3-2 6-2 9 0s6 2 9 0M3 12c3-2 6-2 9 0s6 2 9 0M3 17c3-2 6-2 9 0s6 2 9 0"
      />
    </svg>
  ),
};

const TAB_LABELS: Record<Ruleset, string> = {
  classic: "Classic",
  wanted: "Wanted",
  quote: "Quote",
  "four-seas": "Four Seas",
};

export function RulesetTabs({
  activeRuleset,
  onRulesetChange,
}: RulesetTabsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TAB_ORDER.indexOf(activeRuleset);
      let nextIndex: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TAB_ORDER.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = TAB_ORDER.length - 1;
      }

      if (nextIndex !== null) {
        const nextRuleset = TAB_ORDER[nextIndex];
        onRulesetChange(nextRuleset);
        buttonRefs.current[nextRuleset]?.focus();
      }
    },
    [activeRuleset, onRulesetChange]
  );

  return (
    <div
      className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border-2 border-parchment-400/80 bg-parchment-200/80 p-1.5 shadow-inner backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:gap-2"
      role="tablist"
      aria-label="Game mode"
      data-testid="ruleset-tabs"
      onKeyDown={handleKeyDown}
    >
      {TAB_ORDER.map((id) => (
        <button
          key={id}
          ref={(el) => {
            buttonRefs.current[id] = el;
          }}
          onClick={() => onRulesetChange(id)}
          className={`relative rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm ${
            activeRuleset === id
              ? "bg-navy-700 text-white shadow-card ring-2 ring-gold-400/50 dark:bg-slate-600 dark:ring-gold-500/60"
              : "text-navy-600 hover:bg-parchment-300/80 hover:text-navy-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
          }`}
          aria-selected={activeRuleset === id}
          role="tab"
          tabIndex={activeRuleset === id ? 0 : -1}
          data-testid={`ruleset-tab-${id}`}
        >
          <span className="relative z-10 flex items-center gap-1.5 font-display tracking-wide sm:gap-2">
            {TAB_ICONS[id]}
            <span className="hidden sm:inline">{TAB_LABELS[id]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
