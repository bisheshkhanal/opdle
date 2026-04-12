"use client";

import type { Ruleset } from "@/lib/types";

interface RulesetTabsProps {
  activeRuleset: Ruleset;
  onRulesetChange: (ruleset: Ruleset) => void;
}

export function RulesetTabs({
  activeRuleset,
  onRulesetChange,
}: RulesetTabsProps) {
  const tabs: { id: Ruleset; label: string; icon: React.ReactNode }[] = [
    {
      id: "classic",
      label: "Classic",
      icon: (
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${activeRuleset === "classic" ? "text-gold-400" : ""}`}
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
    },
    {
      id: "silhouette",
      label: "Silhouette",
      icon: (
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${activeRuleset === "silhouette" ? "text-gold-400" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
    },
    {
      id: "wanted",
      label: "Wanted",
      icon: (
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${activeRuleset === "wanted" ? "text-gold-400" : ""}`}
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
    },
    {
      id: "quote",
      label: "Quote",
      icon: (
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${activeRuleset === "quote" ? "text-gold-400" : ""}`}
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
    },
    {
      id: "arc",
      label: "Arc",
      icon: (
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${activeRuleset === "arc" ? "text-gold-400" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border-2 border-parchment-400/80 bg-parchment-200/80 p-1.5 shadow-inner backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:gap-2"
      role="tablist"
      data-testid="ruleset-tabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onRulesetChange(tab.id)}
          className={`relative rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm ${
            activeRuleset === tab.id
              ? "bg-navy-700 text-white shadow-card ring-2 ring-gold-400/50 dark:bg-slate-600 dark:ring-gold-500/60"
              : "text-navy-600 hover:bg-parchment-300/80 hover:text-navy-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
          }`}
          aria-selected={activeRuleset === tab.id}
          role="tab"
          data-testid={`ruleset-tab-${tab.id}`}
        >
          <span className="relative z-10 flex items-center gap-1.5 font-display tracking-wide sm:gap-2">
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
