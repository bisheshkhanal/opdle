import type { AchievementDef } from "./types";

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    id: "streak-3",
    kind: "streak",
    label: "Three-Day Streak",
    description: "Reach a 3-day solve streak.",
    target: 3,
    visibility: "visible",
  },
  {
    id: "streak-7",
    kind: "streak",
    label: "Weekly Rhythm",
    description: "Reach a 7-day solve streak.",
    target: 7,
    visibility: "visible",
  },
  {
    id: "streak-14",
    kind: "streak",
    label: "Two-Week Momentum",
    description: "Reach a 14-day solve streak.",
    target: 14,
    visibility: "visible",
  },
  {
    id: "streak-30",
    kind: "streak",
    label: "Month of Resolve",
    description: "Reach a 30-day solve streak.",
    target: 30,
    visibility: "visible",
  },
  {
    id: "streak-50",
    kind: "streak",
    label: "Unbreakable Routine",
    description: "Reach a 50-day solve streak.",
    target: 50,
    visibility: "visible",
  },
  {
    id: "perfect-navigator",
    kind: "first-guess",
    label: "Perfect Navigator",
    description: "Win a puzzle in 1 guess.",
    target: 1,
    visibility: "visible",
  },
  {
    id: "haki-master",
    kind: "unique-solve",
    label: "Haki Master",
    description: "Solve all unique Haki users.",
    target: 0,
    visibility: "hidden",
  },
  {
    id: "yonko-slayer",
    kind: "unique-solve",
    label: "Yonko Slayer",
    description: "Solve all Yonko targets.",
    target: 0,
    visibility: "hidden",
  },
  {
    id: "grand-line-navigator",
    kind: "saga-complete",
    label: "Grand Line Navigator",
    description: "Complete all 11 sagas.",
    target: 11,
    visibility: "visible",
  },
  {
    id: "bounty-hunter",
    kind: "unique-solve",
    label: "Bounty Hunter",
    description: "Solve 50 unique characters.",
    target: 50,
    visibility: "visible",
  },
  {
    id: "devil-fruit-encyclopedia",
    kind: "unique-solve",
    label: "Devil Fruit Encyclopedia",
    description: "Solve all Devil Fruit users.",
    target: 0,
    visibility: "hidden",
  },
  {
    id: "marine-inspector",
    kind: "unique-solve",
    label: "Marine Inspector",
    description: "Solve all Marine characters.",
    target: 0,
    visibility: "hidden",
  },
];

const ACHIEVEMENT_BY_ID = new Map<string, AchievementDef>(
  ACHIEVEMENT_CATALOG.map((achievement) => [achievement.id, achievement])
);

const UNIQUE_IDS = new Set(
  ACHIEVEMENT_CATALOG.map((achievement) => achievement.id)
);

if (UNIQUE_IDS.size !== ACHIEVEMENT_CATALOG.length) {
  throw new Error("Achievement catalog contains duplicate IDs");
}

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_BY_ID.get(id);
}
