export type SagaId =
  | "east-blue"
  | "arabasta"
  | "sky-island"
  | "water-7"
  | "thriller-bark"
  | "summit-war"
  | "fish-man-island"
  | "dressrosa"
  | "whole-cake-island"
  | "wano-country"
  | "final";

export type AchievementId =
  | "streak-3"
  | "streak-7"
  | "streak-14"
  | "streak-30"
  | "streak-50"
  | "perfect-navigator"
  | "haki-master"
  | "yonko-slayer"
  | "grand-line-navigator"
  | "bounty-hunter"
  | "devil-fruit-encyclopedia"
  | "marine-inspector";

export type AchievementKind =
  | "streak"
  | "unique-solve"
  | "saga-complete"
  | "monthly-complete"
  | "first-guess";

export type AchievementVisibility = "visible" | "hidden" | "secret";

export type MonthlyCollectibleType = "bounty-poster" | "vivre-card";

export interface AchievementDef {
  id: AchievementId;
  kind: AchievementKind;
  label: string;
  description: string;
  target: number;
  visibility: AchievementVisibility;
  seasonKey?: string;
  characterIds?: string[];
}

export interface SagaDef {
  id: SagaId;
  label: string;
  arcs: string[];
  themeColor: string;
}

export interface MonthlyCollectibleDef {
  seasonKey: string;
  label: string;
  collectibleType: MonthlyCollectibleType;
  targetFragments: number;
}
