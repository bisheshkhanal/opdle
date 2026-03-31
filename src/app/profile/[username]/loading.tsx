export default function ProfileLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-parchment-300/40 bg-gradient-to-b from-parchment-50/95 via-parchment-100/90 to-parchment-100/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-8 sm:py-9">
          <div className="mb-4 h-5 w-24 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
          <div className="mb-4 h-20 w-20 animate-pulse rounded-full bg-parchment-200 dark:bg-slate-700" />
          <div className="h-10 w-48 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
        </div>
      </header>

      <div className="flex-1 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-7">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="game-card p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="h-8 w-32 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-parchment-200 dark:bg-slate-700" />
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-parchment-300/60 bg-parchment-50/80 p-5 dark:border-slate-700/60 dark:bg-slate-800/80">
                  <div className="mb-4 h-5 w-16 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
                  <div className="mb-5 grid gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }, (_, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="h-20 animate-pulse rounded-lg bg-parchment-200 dark:bg-slate-700"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="mx-auto mb-4 h-6 w-48 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-5 w-3 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
                          <div className="h-6 flex-1 animate-pulse rounded bg-parchment-200 dark:bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
