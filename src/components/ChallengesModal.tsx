"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

interface ChallengesModalProps {
  onClose: () => void;
  onSignInClick: () => void;
}

interface ChallengePack {
  id: string;
  title: string;
  description: string;
}

interface ChallengePackProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface ChallengeHistoryItem {
  id: string;
  challengeId: string;
  guessCount: number;
  solvedAt: string | null;
  createdAt: string;
  isWon?: boolean;
  isExpired?: boolean;
}

interface ChallengeLeaderboard {
  challenge?: {
    title?: string;
  } | null;
  history?: ChallengeLeaderboardAttempt[];
}

interface ChallengeLeaderboardAttempt {
  id: string;
  userId: string;
  guessCount: number;
  factionSnapshotAtSubmit: string;
}

function isChallengePack(value: unknown): value is ChallengePack {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChallengePack).id === "string" &&
    typeof (value as ChallengePack).title === "string" &&
    typeof (value as ChallengePack).description === "string"
  );
}

function parsePacksResponse(data: unknown): ChallengePack[] {
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as { packs?: unknown[] }).packs)
  ) {
    return [];
  }

  return ((data as { packs: unknown[] }).packs ?? []).filter(isChallengePack);
}

function parsePackProgressResponse(
  data: unknown
): ChallengePackProgress | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const progress = (data as { progress?: unknown }).progress;

  if (typeof progress !== "object" || progress === null) {
    return null;
  }

  const completed = (progress as { completed?: unknown }).completed;
  const total = (progress as { total?: unknown }).total;
  const percentageValue =
    (progress as { percentage?: unknown }).percentage ??
    (progress as { percent?: unknown }).percent;

  if (
    typeof completed !== "number" ||
    typeof total !== "number" ||
    typeof percentageValue !== "number"
  ) {
    return null;
  }

  return {
    completed,
    total,
    percentage: percentageValue,
  };
}

function isChallengeHistoryItem(value: unknown): value is ChallengeHistoryItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChallengeHistoryItem).id === "string" &&
    typeof (value as ChallengeHistoryItem).challengeId === "string" &&
    typeof (value as ChallengeHistoryItem).guessCount === "number" &&
    ((value as ChallengeHistoryItem).solvedAt === null ||
      typeof (value as ChallengeHistoryItem).solvedAt === "string") &&
    typeof (value as ChallengeHistoryItem).createdAt === "string"
  );
}

function parseHistoryResponse(data: unknown): ChallengeHistoryItem[] {
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as { history?: unknown[] }).history)
  ) {
    return [];
  }

  return ((data as { history: unknown[] }).history ?? []).filter(
    isChallengeHistoryItem
  );
}

function toUtcDayKey(value: string): string | null {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function dayDifferenceUtc(
  laterDateKey: string,
  earlierDateKey: string
): number {
  const later = new Date(`${laterDateKey}T00:00:00.000Z`).getTime();
  const earlier = new Date(`${earlierDateKey}T00:00:00.000Z`).getTime();
  return Math.round((later - earlier) / (24 * 60 * 60 * 1000));
}

function calculateStreak(history: ChallengeHistoryItem[]): number {
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = new Date(a.solvedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.solvedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  let streak = 0;
  let previousDayKey: string | null = null;

  for (const item of sortedHistory) {
    const isWon = item.isWon ?? Boolean(item.solvedAt);
    if (!isWon) {
      break;
    }

    const dayKey = toUtcDayKey(item.solvedAt ?? item.createdAt);
    if (!dayKey) {
      break;
    }

    if (previousDayKey === null) {
      streak += 1;
      previousDayKey = dayKey;
      continue;
    }

    const gap = dayDifferenceUtc(previousDayKey, dayKey);
    if (gap > 1) {
      break;
    }

    streak += 1;
    previousDayKey = dayKey;
  }

  return streak;
}

function isChallengeLeaderboardAttempt(
  value: unknown
): value is ChallengeLeaderboardAttempt {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChallengeLeaderboardAttempt).id === "string" &&
    typeof (value as ChallengeLeaderboardAttempt).userId === "string" &&
    typeof (value as ChallengeLeaderboardAttempt).guessCount === "number" &&
    typeof (value as ChallengeLeaderboardAttempt).factionSnapshotAtSubmit ===
      "string"
  );
}

function parseChallengeLeaderboard(data: unknown): ChallengeLeaderboard {
  if (typeof data !== "object" || data === null) {
    return { challenge: null, history: [] };
  }

  const challengeData = (data as { challenge?: unknown }).challenge;
  const historyData = (data as { history?: unknown }).history;

  const challenge =
    typeof challengeData === "object" && challengeData !== null
      ? {
          title:
            typeof (challengeData as { title?: unknown }).title === "string"
              ? (challengeData as { title: string }).title
              : undefined,
        }
      : null;

  const history = Array.isArray(historyData)
    ? historyData.filter(isChallengeLeaderboardAttempt)
    : [];

  return { challenge, history };
}

export function ChallengesModal({
  onClose,
  onSignInClick,
}: ChallengesModalProps) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<
    "history" | "packs" | "leaderboard"
  >("packs");

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-navy-500 dark:text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
        <svg
          className="mb-4 h-12 w-12 text-navy-300 dark:text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-bold text-navy-800 dark:text-slate-100">
          Sign in to play Tracked Challenges
        </h3>
        <p className="mb-6 text-sm text-navy-600 dark:text-slate-400">
          Track your history, maintain streaks, and compete on leaderboards.
        </p>
        <button
          onClick={onSignInClick}
          className="rounded-xl bg-gold-400 px-6 py-2.5 font-bold text-navy-900 transition-colors hover:bg-gold-300 dark:bg-gold-500 dark:text-slate-900 dark:hover:bg-gold-400"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[500px] flex-col">
      <div className="flex border-b border-parchment-300 dark:border-slate-700">
        <button
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "packs" ? "border-b-2 border-gold-400 text-navy-800 dark:text-slate-100" : "text-navy-500 hover:bg-parchment-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
          onClick={() => setActiveTab("packs")}
        >
          Packs
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "history" ? "border-b-2 border-gold-400 text-navy-800 dark:text-slate-100" : "text-navy-500 hover:bg-parchment-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
          onClick={() => setActiveTab("history")}
        >
          History & Streaks
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "leaderboard" ? "border-b-2 border-gold-400 text-navy-800 dark:text-slate-100" : "text-navy-500 hover:bg-parchment-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "packs" && <ChallengePacksTab />}
        {activeTab === "history" && <ChallengeHistoryTab />}
        {activeTab === "leaderboard" && <ChallengeLeaderboardTab />}
      </div>
    </div>
  );
}

function ChallengePacksTab() {
  const [packs, setPacks] = useState<ChallengePack[]>([]);
  const [packProgressById, setPackProgressById] = useState<
    Record<string, ChallengePackProgress | null>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges/packs")
      .then((res) => res.json())
      .then(async (data: unknown) => {
        const parsedPacks = parsePacksResponse(data);
        setPacks(parsedPacks);

        const progressEntries = await Promise.all(
          parsedPacks.map(async (pack) => {
            try {
              const response = await fetch(`/api/challenges/packs/${pack.id}`);
              const progressData: unknown = await response.json();
              return [
                pack.id,
                parsePackProgressResponse(progressData),
              ] as const;
            } catch {
              return [pack.id, null] as const;
            }
          })
        );

        setPackProgressById(Object.fromEntries(progressEntries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-sm text-navy-500">Loading packs...</div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="text-center text-sm text-navy-500">
        No packs available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packs.map((pack) => (
        <div
          key={pack.id}
          className="rounded-xl border border-parchment-300 bg-parchment-100 p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          {(() => {
            const progress = packProgressById[pack.id];
            const completed = progress?.completed ?? 0;
            const total = progress?.total ?? 0;

            return (
              <>
                <h4 className="font-bold text-navy-800 dark:text-slate-100">
                  {pack.title}
                </h4>
                <p className="mt-1 text-sm text-navy-600 dark:text-slate-400">
                  {pack.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-navy-500 dark:text-slate-500">
                    Partial progress ({completed}/{total})
                  </span>
                  <button className="rounded-lg bg-navy-100 px-3 py-1.5 text-xs font-bold text-navy-700 hover:bg-navy-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
                    View Challenges
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

function ChallengeHistoryTab() {
  const [history, setHistory] = useState<ChallengeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data: unknown) => {
        const parsedHistory = parseHistoryResponse(data);
        setHistory(parsedHistory);
        setStreak(calculateStreak(parsedHistory));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-sm text-navy-500">
        Loading history...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-900/50 dark:bg-gold-900/20">
        <div>
          <h4 className="font-bold text-navy-800 dark:text-slate-100">
            Current Streak
          </h4>
          <p className="text-sm text-navy-600 dark:text-slate-400">
            Complete challenges daily to keep it alive!
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-xl font-black text-navy-900">
          {streak}
        </div>
      </div>

      <h4 className="mb-3 font-bold text-navy-800 dark:text-slate-100">
        Past Challenges
      </h4>
      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-parchment-300 p-6 text-center dark:border-slate-700">
          <p className="text-sm text-navy-500 dark:text-slate-400">
            You haven&apos;t played any tracked challenges yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-parchment-200 bg-parchment-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <div>
                <p className="font-medium text-navy-800 dark:text-slate-200">
                  Challenge {item.challengeId.slice(0, 8)}
                </p>
                <p className="text-xs text-navy-500 dark:text-slate-400">
                  {item.solvedAt
                    ? `Solved in ${item.guessCount} guesses`
                    : "Failed"}
                </p>
              </div>
              {item.isExpired && (
                <span className="text-xs text-red-500">Expired</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeLeaderboardTab() {
  const [challengeId, setChallengeId] = useState("");
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboard | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    setLoading(true);
    fetch(`/api/challenges/${challengeId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        setLeaderboard(parseChallengeLeaderboard(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div>
      <form onSubmit={fetchLeaderboard} className="mb-6 flex gap-2">
        <input
          type="text"
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
          placeholder="Enter Challenge ID"
          className="flex-1 rounded-lg border border-parchment-300 bg-white px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white hover:bg-navy-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          View
        </button>
      </form>

      {loading && (
        <div className="text-center text-sm text-navy-500">Loading...</div>
      )}

      {leaderboard && (
        <div>
          <h4 className="mb-3 font-bold text-navy-800 dark:text-slate-100">
            Leaderboard for {leaderboard.challenge?.title || challengeId}
          </h4>
          <div className="space-y-2">
            {leaderboard.history?.map((attempt, i) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-lg bg-parchment-100 p-2 dark:bg-slate-800"
              >
                <span className="text-sm font-medium text-navy-800 dark:text-slate-200">
                  {i + 1}.{" "}
                  {attempt.factionSnapshotAtSubmit ||
                    attempt.userId.slice(0, 8)}
                </span>
                <span className="text-sm text-navy-600 dark:text-slate-400">
                  {attempt.guessCount} guesses
                </span>
              </div>
            ))}
            {(!leaderboard.history || leaderboard.history.length === 0) && (
              <div className="text-sm text-navy-500">No attempts yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
