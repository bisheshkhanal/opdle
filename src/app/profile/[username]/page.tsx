import Link from "next/link";
import { notFound } from "next/navigation";
import type { GameMode, Tier } from "@/lib/types";

interface UserStatsRow {
  userId: string;
  tier: Tier;
  mode: GameMode;
  streak: number;
  maxStreak: number;
  totalWins: number;
  totalGames: number;
  winDistribution: Record<string, number>;
  updatedAt: string;
}

interface ProfileData {
  user: {
    id: string;
    username: string;
    createdAt: string;
  };
  stats: UserStatsRow[];
}

const TIER_LABELS: Record<Tier, string> = {
  casual: "Casual",
  fan: "Fan",
  nakama: "Nakama",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-navy-100/50 px-4 py-3 text-center dark:bg-slate-700/50">
      <p className="text-2xl font-bold text-navy-900 dark:text-slate-100">
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

function WinDistribution({
  title,
  distribution,
}: {
  title: string;
  distribution: Record<string, number>;
}) {
  const maxCount = Math.max(
    1,
    ...Array.from({ length: 6 }, (_, i) => distribution[String(i + 1)] ?? 0)
  );

  if (Object.keys(distribution).length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="mb-4 text-center font-display text-lg font-semibold text-navy-800 dark:text-slate-200">
        {title}
      </h4>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => i + 1).map((guessCount) => {
          const count = distribution[String(guessCount)] ?? 0;
          const widthPercentage = Math.max(7, (count / maxCount) * 100);
          const isMax = count === maxCount && count > 0;

          return (
            <div key={guessCount} className="flex items-center gap-2 text-sm">
              <div className="w-3 text-right font-medium text-navy-600 dark:text-slate-400">
                {guessCount}
              </div>
              <div className="flex-1">
                <div
                  className={`flex h-6 items-center justify-end rounded px-2 text-xs font-bold text-white transition-all duration-500 ${
                    isMax
                      ? "bg-gold-500 dark:bg-gold-600"
                      : "bg-navy-400 dark:bg-slate-600"
                  }`}
                  style={{ width: `${widthPercentage}%` }}
                >
                  {count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getWinRate(totalWins: number, totalGames: number): string {
  if (totalGames === 0) {
    return "—";
  }

  return `${Math.round((totalWins / totalGames) * 100)}%`;
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/profile/${encodeURIComponent(params.username)}`,
    { next: { revalidate: 60 } }
  );

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error("Failed to fetch profile");
  }

  const { user, stats } = (await response.json()) as ProfileData;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tiers: Tier[] = ["casual", "fan", "nakama"];

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-parchment-300/40 bg-gradient-to-b from-parchment-50/95 via-parchment-100/90 to-parchment-100/95 backdrop-blur-md dark:border-slate-700/40 dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-8 sm:py-9">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-navy-600 underline-offset-2 transition-all hover:text-navy-800 hover:underline dark:text-slate-300 dark:hover:text-slate-100"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to game
          </Link>
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-navy-700 text-3xl font-bold text-gold-400 shadow-card dark:bg-slate-600">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-800 dark:text-slate-100 md:text-4xl">
            {user.username}
          </h1>
          <p className="mt-2 text-sm text-navy-500 dark:text-slate-400">
            Joined {joinedDate}
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-7">
          {stats.length === 0 ? (
            <section className="game-card p-6 sm:p-7">
              <h2 className="mb-3 font-display text-xl font-semibold text-navy-800 dark:text-slate-100">
                No stats yet
              </h2>
              <p className="text-sm text-navy-500 dark:text-slate-400">
                This pirate hasn&apos;t logged any voyages yet.
              </p>
            </section>
          ) : (
            tiers.map((tier) => {
              const dailyStats = stats.find(
                (entry) => entry.tier === tier && entry.mode === "daily"
              );
              const infiniteStats = stats.find(
                (entry) => entry.tier === tier && entry.mode === "infinite"
              );

              if (!dailyStats && !infiniteStats) {
                return null;
              }

              return (
                <section key={tier} className="game-card p-6 sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold text-navy-800 dark:text-slate-100 sm:text-2xl">
                      {TIER_LABELS[tier]} Tier
                    </h2>
                    <span className="inline-flex rounded-full bg-navy-100/70 px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-200/50 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600/50">
                      Captain&apos;s Log
                    </span>
                  </div>

                  <div className="space-y-6">
                    {dailyStats && (
                      <div className="rounded-xl border border-parchment-300/60 bg-parchment-50/80 p-5 dark:border-slate-700/60 dark:bg-slate-800/80">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-500 dark:text-slate-400">
                          Daily
                        </h3>
                        <div className="mb-5 grid gap-3 sm:grid-cols-4">
                          <StatCard label="Streak" value={dailyStats.streak} />
                          <StatCard
                            label="Max Streak"
                            value={dailyStats.maxStreak}
                          />
                          <StatCard label="Wins" value={dailyStats.totalWins} />
                          <StatCard
                            label="Win Rate"
                            value={getWinRate(
                              dailyStats.totalWins,
                              dailyStats.totalGames
                            )}
                          />
                        </div>
                        <WinDistribution
                          title="Daily Win Distribution"
                          distribution={dailyStats.winDistribution}
                        />
                      </div>
                    )}

                    {infiniteStats && (
                      <div className="rounded-xl border border-parchment-300/60 bg-parchment-50/80 p-5 dark:border-slate-700/60 dark:bg-slate-800/80">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-500 dark:text-slate-400">
                          Infinite
                        </h3>
                        <div className="mb-5 grid gap-3 sm:grid-cols-4">
                          <StatCard
                            label="Streak"
                            value={infiniteStats.streak}
                          />
                          <StatCard
                            label="Max Streak"
                            value={infiniteStats.maxStreak}
                          />
                          <StatCard
                            label="Wins"
                            value={`${infiniteStats.totalWins}/${infiniteStats.totalGames}`}
                          />
                          <StatCard
                            label="Win Rate"
                            value={getWinRate(
                              infiniteStats.totalWins,
                              infiniteStats.totalGames
                            )}
                          />
                        </div>
                        <WinDistribution
                          title="Infinite Win Distribution"
                          distribution={infiniteStats.winDistribution}
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
