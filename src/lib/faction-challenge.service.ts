import type {
  ChallengeAttempt,
  ChallengeEntity,
  ChallengeHistoryRow,
  ChallengeLeaderboardRow,
  ChallengePack,
  FactionMembership,
  FactionSnapshot,
  WeeklyFactionRankingRow,
} from "./types";

export interface FactionCompetitiveFact {
  userId: string;
  username: string;
  factionSnapshot: FactionSnapshot;
  points: number;
  guessCount: number;
  isSolved: boolean;
  completedAtUtc: string;
}

export interface ProjectChallengeHistoryInput {
  userId: string;
  username: string;
  challenges: ChallengeEntity[];
  attempts: Array<ChallengeAttemptFact>;
}

export interface ProjectChallengePackProgressInput {
  pack: ChallengePack;
  challenges: ChallengeEntity[];
  attempts: Array<ChallengeAttemptFact>;
  userId: string;
}

export interface ChallengePackProgress {
  packId: string;
  totalCount: number;
  completedCount: number;
  solvedCount: number;
  skippedCount: number;
  failedCount: number;
  nextChallengeId: string | null;
  isComplete: boolean;
  completionRate: number;
  challengeStreak: number;
}

export interface ProjectChallengeLeaderboardInput {
  challenge: ChallengeEntity;
  attempts: Array<ChallengeAttemptFact>;
}

export interface ChallengeAttemptFact {
  challengeId: string;
  userId: string;
  username: string;
  guessCount: number;
  isSolved: boolean;
  solvedAtUtc: string | null;
  completedAtUtc: string;
  factionSnapshot: FactionSnapshot;
}

function toUtcDate(value: string | Date): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function startOfUtcDay(value: string | Date): Date {
  const date = toUtcDate(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function compareIsoStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function compareNullableNumbersAsc(
  left: number | null,
  right: number | null
): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function getIsoWeekInfo(value: string | Date): {
  weekKey: string;
  weekYear: number;
  weekNumber: number;
} {
  const date = startOfUtcDay(value);
  const utcDay = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() + 3 - utcDay);

  const weekYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - firstThursdayDay);

  const weekNumber =
    1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);

  return {
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, "0")}`,
    weekYear,
    weekNumber,
  };
}

function getWeekWindow(value: string | Date): {
  weekStartUtc: string;
  weekEndUtc: string;
  weekKey: string;
} {
  const date = toUtcDate(value);
  const utcDay = (date.getUTCDay() + 6) % 7;
  const weekStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  weekStart.setUTCDate(weekStart.getUTCDate() - utcDay);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart.getTime());
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return {
    weekStartUtc: weekStart.toISOString(),
    weekEndUtc: weekEnd.toISOString(),
    weekKey: getIsoWeekInfo(date).weekKey,
  };
}

function rankWeeklyFactionRows(
  rows: WeeklyFactionRankingRow[]
): WeeklyFactionRankingRow[] {
  const sorted = [...rows].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    const avgGuessComparison = compareNullableNumbersAsc(
      left.avgGuesses,
      right.avgGuesses
    );

    if (avgGuessComparison !== 0) {
      return avgGuessComparison;
    }

    if (right.participantCount !== left.participantCount) {
      return right.participantCount - left.participantCount;
    }

    return left.factionName.localeCompare(right.factionName);
  });

  const total = sorted.length || 1;

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
    percentile:
      total === 0
        ? null
        : Math.max(
            0,
            Math.min(100, Math.round(((total - index) / total) * 100))
          ),
  }));
}

export function getUtcWeekWindow(value: string | Date): {
  weekStartUtc: string;
  weekEndUtc: string;
  weekKey: string;
} {
  return getWeekWindow(value);
}

export function resolveFactionSnapshot(
  competitiveFactSnapshot: FactionSnapshot | null | undefined,
  fallbackMembership?: Pick<
    FactionMembership,
    "factionId" | "factionName" | "factionSlug"
  > | null
): FactionSnapshot {
  if (competitiveFactSnapshot) {
    return competitiveFactSnapshot;
  }

  if (!fallbackMembership) {
    return {
      factionId: "unknown",
      factionName: "Unknown",
      factionSlug: "unknown",
    };
  }

  return {
    factionId: fallbackMembership.factionId,
    factionName: fallbackMembership.factionName,
    factionSlug: fallbackMembership.factionSlug,
  };
}

export function buildWeeklyFactionRankings(
  facts: FactionCompetitiveFact[]
): WeeklyFactionRankingRow[] {
  const grouped = new Map<
    string,
    Map<
      string,
      {
        weekStartUtc: string;
        weekEndUtc: string;
        factionSnapshot: FactionSnapshot;
        points: number;
        solvedGuesses: number[];
        participantIds: Set<string>;
      }
    >
  >();

  for (const fact of facts) {
    const window = getWeekWindow(fact.completedAtUtc);
    let weekGroup = grouped.get(window.weekKey);

    if (!weekGroup) {
      weekGroup = new Map();
      grouped.set(window.weekKey, weekGroup);
    }

    const factionKey = fact.factionSnapshot.factionSlug;
    let factionGroup = weekGroup.get(factionKey);

    if (!factionGroup) {
      factionGroup = {
        weekStartUtc: window.weekStartUtc,
        weekEndUtc: window.weekEndUtc,
        factionSnapshot: fact.factionSnapshot,
        points: 0,
        solvedGuesses: [],
        participantIds: new Set<string>(),
      };
      weekGroup.set(factionKey, factionGroup);
    }

    factionGroup.points += fact.points;
    factionGroup.participantIds.add(fact.userId);

    if (fact.isSolved) {
      factionGroup.solvedGuesses.push(fact.guessCount);
    }
  }

  const rows: WeeklyFactionRankingRow[] = [];

  for (const weekGroup of Array.from(grouped.values())) {
    for (const factionGroup of Array.from(weekGroup.values())) {
      const solvedCount = factionGroup.solvedGuesses.length;
      const avgGuesses =
        solvedCount === 0
          ? null
          : Number(
              (
                factionGroup.solvedGuesses.reduce(
                  (sum: number, value: number) => sum + value,
                  0
                ) / solvedCount
              ).toFixed(2)
            );

      rows.push({
        weekStartUtc: factionGroup.weekStartUtc,
        weekEndUtc: factionGroup.weekEndUtc,
        factionId: factionGroup.factionSnapshot.factionId,
        factionName: factionGroup.factionSnapshot.factionName,
        factionSlug: factionGroup.factionSnapshot.factionSlug,
        points: factionGroup.points,
        avgGuesses,
        participantCount: factionGroup.participantIds.size,
        rank: 0,
        percentile: null,
      });
    }
  }

  const rowsByWeekStart = new Map<string, WeeklyFactionRankingRow[]>();

  for (const row of rows) {
    const bucket = rowsByWeekStart.get(row.weekStartUtc);

    if (bucket) {
      bucket.push(row);
    } else {
      rowsByWeekStart.set(row.weekStartUtc, [row]);
    }
  }

  return Array.from(rowsByWeekStart.entries())
    .sort((left, right) => compareIsoStrings(left[0], right[0]))
    .flatMap(([, weekRows]) => rankWeeklyFactionRows(weekRows));
}

export function recordChallengeAttempt(
  input: ChallengeAttempt
): ChallengeAttempt {
  return {
    ...input,
    factionSnapshot: resolveFactionSnapshot(input.factionSnapshot),
  };
}

export function projectChallengeHistory(
  input: ProjectChallengeHistoryInput
): ChallengeHistoryRow[] {
  const attemptByChallengeId = new Map(
    input.attempts.map((attempt) => [attempt.challengeId, attempt])
  );

  const rows = [...input.challenges]
    .sort((left, right) => {
      if (left.scheduledAtUtc !== right.scheduledAtUtc) {
        return compareIsoStrings(left.scheduledAtUtc, right.scheduledAtUtc);
      }

      return compareIsoStrings(left.challengeId, right.challengeId);
    })
    .map((challenge) => {
      const attempt = attemptByChallengeId.get(challenge.challengeId);

      if (!attempt) {
        return {
          challengeId: challenge.challengeId,
          packId: challenge.packId,
          userId: input.userId,
          username: input.username,
          result: "skipped" as const,
          guessCount: null,
          solvedAtUtc: null,
          completedAtUtc: challenge.scheduledAtUtc,
          challengeStreak: 0,
          summaryVisibility: "public" as const,
          factionSnapshot: challenge.factionSnapshot,
        };
      }

      return {
        challengeId: attempt.challengeId,
        packId: challenge.packId,
        userId: attempt.userId,
        username: attempt.username,
        result: attempt.isSolved ? ("solved" as const) : ("failed" as const),
        guessCount: attempt.isSolved ? attempt.guessCount : attempt.guessCount,
        solvedAtUtc: attempt.isSolved ? attempt.solvedAtUtc : null,
        completedAtUtc: attempt.completedAtUtc,
        challengeStreak: 0,
        summaryVisibility: "public" as const,
        factionSnapshot: attempt.factionSnapshot,
      };
    });

  let streak = 0;

  return rows.map((row) => {
    if (row.result === "failed") {
      streak = 0;
    } else if (row.result === "solved") {
      streak += 1;
    }

    return {
      ...row,
      challengeStreak: streak,
    };
  });
}

export function computeChallengeStreak(rows: ChallengeHistoryRow[]): number {
  const sorted = [...rows].sort((left, right) => {
    if (left.completedAtUtc !== right.completedAtUtc) {
      return compareIsoStrings(left.completedAtUtc, right.completedAtUtc);
    }

    return compareIsoStrings(left.challengeId, right.challengeId);
  });

  let streak = 0;

  for (const row of sorted) {
    if (row.result === "failed") {
      streak = 0;
    } else if (row.result === "solved") {
      streak += 1;
    }
  }

  return streak;
}

export function projectChallengePackProgress(
  input: ProjectChallengePackProgressInput
): ChallengePackProgress {
  const fallbackUsername =
    input.attempts.find((attempt) => attempt.userId === input.userId)
      ?.username ?? input.userId;

  const history = projectChallengeHistory({
    userId: input.userId,
    username: fallbackUsername,
    challenges: input.challenges,
    attempts: input.attempts.filter((attempt) =>
      input.challenges.some(
        (challenge) => challenge.challengeId === attempt.challengeId
      )
    ),
  });

  const relevantRows = history.filter((row) =>
    input.pack.challengeIds.includes(row.challengeId)
  );

  const completedCount = relevantRows.filter(
    (row) => row.result !== "skipped"
  ).length;
  const solvedCount = relevantRows.filter(
    (row) => row.result === "solved"
  ).length;
  const skippedCount = relevantRows.filter(
    (row) => row.result === "skipped"
  ).length;
  const failedCount = relevantRows.filter(
    (row) => row.result === "failed"
  ).length;
  const nextChallenge = relevantRows.find((row) => row.result === "skipped");

  return {
    packId: input.pack.packId,
    totalCount: input.pack.challengeIds.length,
    completedCount,
    solvedCount,
    skippedCount,
    failedCount,
    nextChallengeId: nextChallenge?.challengeId ?? null,
    isComplete: completedCount === input.pack.challengeIds.length,
    completionRate:
      input.pack.challengeIds.length === 0
        ? 0
        : Number(
            ((completedCount / input.pack.challengeIds.length) * 100).toFixed(2)
          ),
    challengeStreak: computeChallengeStreak(relevantRows),
  };
}

export function projectChallengeLeaderboard(
  input: ProjectChallengeLeaderboardInput
): ChallengeLeaderboardRow[] {
  const participants = input.attempts
    .filter((attempt) => attempt.challengeId === input.challenge.challengeId)
    .map((attempt) => ({
      attempt,
      points: attempt.isSolved ? Math.max(0, 7 - attempt.guessCount) : 0,
      avgGuesses: attempt.isSolved ? attempt.guessCount : null,
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      const avgGuessComparison = compareNullableNumbersAsc(
        left.avgGuesses,
        right.avgGuesses
      );

      if (avgGuessComparison !== 0) {
        return avgGuessComparison;
      }

      if (left.attempt.username !== right.attempt.username) {
        return left.attempt.username.localeCompare(right.attempt.username);
      }

      return left.attempt.userId.localeCompare(right.attempt.userId);
    });

  const participantCount = participants.length;

  return participants.map(({ attempt, points, avgGuesses }, index) => ({
    challengeId: input.challenge.challengeId,
    userId: attempt.userId,
    username: attempt.username,
    factionSnapshot: attempt.factionSnapshot,
    points,
    avgGuesses,
    participantCount,
    rank: index + 1,
    percentile: Math.max(
      0,
      Math.min(
        100,
        Math.round(((participantCount - index) / participantCount) * 100)
      )
    ),
  }));
}
