"use client";

import { useEffect, useState } from "react";

interface HintImageProps {
  imageUrl: string;
  wrongGuessCount: number;
  isEnabled: boolean;
}

function getBlurLevel(wrongGuessCount: number): number {
  if (wrongGuessCount >= 6) return 3;
  if (wrongGuessCount >= 5) return 10;
  return 20;
}

export function HintImage({
  imageUrl,
  wrongGuessCount,
  isEnabled,
}: HintImageProps) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [wrongGuessCount]);

  if (!isEnabled || wrongGuessCount < 3 || !imageUrl) {
    return null;
  }

  const blurLevel = getBlurLevel(wrongGuessCount);

  return (
    <div className="game-card mx-auto mb-6 w-full max-w-[280px] p-4 text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-600 dark:text-slate-300">
        🔍 Hint
      </p>

      {!showHint ? (
        <button
          type="button"
          className="btn-secondary w-full px-4 py-2.5 text-sm"
          onClick={() => setShowHint(true)}
        >
          👁 Show Hint
        </button>
      ) : (
        <div className="mx-auto h-[120px] w-[120px] overflow-hidden rounded-xl border border-parchment-300/60 bg-parchment-100/60 shadow-soft dark:border-slate-600/70 dark:bg-slate-800/70">
          <img
            src={imageUrl}
            alt="Character hint"
            className="h-full w-full object-cover"
            style={{ filter: `blur(${blurLevel}px)` }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
