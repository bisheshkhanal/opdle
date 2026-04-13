"use client";

import React, { useState } from "react";
import type { Character } from "@/lib/types";

interface HintButtonProps {
  targetCharacter: Character;
  hintUsed: boolean;
  onHintUsed: () => void;
}

export function HintButton({
  targetCharacter,
  hintUsed,
  onHintUsed,
}: HintButtonProps) {
  const [confirmState, setConfirmState] = useState<"idle" | "confirming">(
    "idle"
  );

  if (hintUsed) {
    return (
      <div className="game-card mx-auto max-w-sm px-4 py-3 text-center text-sm">
        <span className="text-navy-600 dark:text-slate-400">
          💡 First Arc:{" "}
        </span>
        <span className="font-semibold text-navy-800 dark:text-slate-100">
          {targetCharacter.firstArc}
        </span>
      </div>
    );
  }

  if (confirmState === "confirming") {
    return (
      <div className="game-card mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-3 text-center text-sm">
        <span className="font-medium text-navy-800 dark:text-slate-200">
          Reveal First Arc?
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmState("idle")}
            className="px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:text-navy-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onHintUsed();
              setConfirmState("idle");
            }}
            className="rounded-full border border-gold-400/60 bg-gold-50/80 px-3 py-1.5 text-sm font-medium text-gold-700 transition-colors hover:bg-gold-100/80 dark:border-gold-500/40 dark:bg-gold-900/20 dark:text-gold-300 dark:hover:bg-gold-900/40"
          >
            Yes, reveal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={() => setConfirmState("confirming")}
        className="rounded-full border border-gold-400/60 bg-gold-50/80 px-4 py-1.5 text-sm font-medium text-gold-700 transition-colors hover:bg-gold-100/80 dark:border-gold-500/40 dark:bg-gold-900/20 dark:text-gold-300 dark:hover:bg-gold-900/40"
      >
        💡 Hint
      </button>
    </div>
  );
}
