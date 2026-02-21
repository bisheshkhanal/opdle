export function GameLegend() {
  return (
    <div className="game-card legend-card sticky top-6 hidden p-6 lg:block">
      {/* Compass rose watermark */}
      <svg
        className="legend-mark text-gold-600 dark:text-gold-500"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <path
          d="M50 18L58 42L82 50L58 58L50 82L42 58L18 50L42 42Z"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>

      <h3 className="mb-5 text-center font-pirate text-lg tracking-wide text-navy-700 dark:text-slate-200">
        Navigation Guide
      </h3>

      <div className="space-y-3.5">
        {/* Correct */}
        <div className="flex items-center gap-3">
          <div className="tile-correct flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white">
            M
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Correct
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              Exact match
            </div>
          </div>
        </div>

        {/* Partial */}
        <div className="flex items-center gap-3">
          <div className="tile-partial flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white">
            O
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Partial
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              Some match (Haki)
            </div>
          </div>
        </div>

        {/* Wrong */}
        <div className="flex items-center gap-3">
          <div className="tile-wrong flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white">
            F
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Wrong
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              No match
            </div>
          </div>
        </div>

        {/* Higher */}
        <div className="flex items-center gap-3">
          <div className="tile-wrong flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white">
            ↑
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Higher
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              Target value is higher
            </div>
          </div>
        </div>

        {/* Lower */}
        <div className="flex items-center gap-3">
          <div className="tile-wrong flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white">
            ↓
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Lower
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              Target value is lower
            </div>
          </div>
        </div>

        {/* Unknown */}
        <div className="flex items-center gap-3">
          <div className="tile-unknown flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold">
            ?
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-navy-700 dark:text-slate-200">
              Unknown
            </div>
            <div className="text-xs text-navy-500 dark:text-slate-400">
              No data for target
            </div>
          </div>
        </div>
      </div>

      {/* Divider with gold accent */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent dark:via-gold-500/40" />
        <svg
          className="h-3 w-3 text-gold-500 dark:text-gold-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
        </svg>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent dark:via-gold-500/40" />
      </div>

      {/* Tips */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600 dark:text-gold-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs leading-relaxed text-navy-600 dark:text-slate-300">
            <span className="font-bold">Haki</span> shows partial when some
            types match
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600 dark:text-gold-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs leading-relaxed text-navy-600 dark:text-slate-300">
            <span className="font-bold">Arrows</span> apply to Bounty and Height
          </p>
        </div>
      </div>
    </div>
  );
}
