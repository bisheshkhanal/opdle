"use client";

import type { Tier } from "@/lib/types";

const TIER_META: Array<{
  value: Tier;
  label: string;
  icon: JSX.Element;
}> = [
  {
    value: "casual",
    label: "Casual",
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
    ),
  },
  {
    value: "fan",
    label: "Fan",
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
  },
  {
    value: "nakama",
    label: "Nakama",
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
  },
];

interface TierTabsProps {
  tier: Tier;
  onTierChange: (tier: Tier) => void;
  characterCounts: Record<Tier, number>;
}

export function TierTabs({
  tier,
  onTierChange,
  characterCounts,
}: TierTabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-parchment-300/80 bg-parchment-100/60 p-1 backdrop-blur-sm dark:border-slate-600/60 dark:bg-slate-800/60">
      {TIER_META.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onTierChange(value)}
          className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300 ${
            tier === value
              ? "bg-navy-700 text-white shadow-sm ring-1 ring-gold-400/40 dark:bg-slate-600 dark:ring-gold-500/50"
              : "text-navy-600 hover:bg-parchment-200/80 hover:text-navy-800 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-slate-200"
          }`}
          aria-pressed={tier === value}
        >
          <span className="flex items-center gap-1.5 font-display tracking-wide">
            <span className={tier === value ? "text-gold-400" : ""}>
              {icon}
            </span>
            <span>{label}</span>
            <span className="ml-0.5 text-[10px] font-normal opacity-70">
              {characterCounts[value]}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
