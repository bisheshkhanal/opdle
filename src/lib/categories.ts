/**
 * Category configuration - Single source of truth for game categories
 * Classic mode categories in order:
 * Character, Gender, Affiliation (primary), Devil Fruit (type), Haki, Last Bounty, Height, Origin, First Arc
 */

import type { Character, CategoryResult, TileStatus, HakiType } from "./types";
import { compareArcs, isValidArc } from "./arcs";

export interface CategoryConfig {
  key: keyof Character;
  label: string;
  type: "string" | "haki" | "number";
  renderValue: (value: unknown) => string;
  evaluate: (guessValue: unknown, targetValue: unknown) => TileStatus;
}

/**
 * Format bounty for display
 */
function formatBounty(value: number | null): string {
  if (value === null) return "?";
  if (value === 0) return "None";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

/**
 * Format height for display
 */
function formatHeight(value: number | null): string {
  if (value === null) return "?";
  return `${value}cm`;
}

/**
 * Format haki for display
 */
function formatHaki(haki: HakiType[]): string {
  if (!haki || haki.length === 0) return "None";
  return haki.map((h) => h.charAt(0)).join(", ");
}

/**
 * Compare two haki sets
 * Green if equal set, Yellow if intersects but not equal, Red if disjoint
 */
function compareHaki(guess: HakiType[], target: HakiType[]): TileStatus {
  const guessSet = new Set(guess || []);
  const targetSet = new Set(target || []);

  // Both empty = correct
  if (guessSet.size === 0 && targetSet.size === 0) return "correct";

  // Check if sets are equal
  if (guessSet.size === targetSet.size) {
    let allMatch = true;
    guessSet.forEach((h) => {
      if (!targetSet.has(h)) {
        allMatch = false;
      }
    });
    if (allMatch) return "correct";
  }

  // Check for intersection (partial)
  let hasIntersection = false;
  guessSet.forEach((h) => {
    if (targetSet.has(h)) {
      hasIntersection = true;
    }
  });
  if (hasIntersection) return "partial";

  // Disjoint
  return "wrong";
}

/**
 * Compare numeric values with null handling
 * both null -> "correct" (both unknown, but matching)
 * one null -> "unknown" (displays as "?", no arrow)
 * exact match -> "correct"
 * guess < target -> "higher" (target is higher, show ↑)
 * guess > target -> "lower" (target is lower, show ↓)
 */
function compareNumber(
  guess: number | null,
  target: number | null
): TileStatus {
  // Both null = correct (both have unknown value, but they match)
  if (guess === null && target === null) return "correct";

  // One null, one number = unknown (can't compare, show "?")
  if (guess === null || target === null) return "unknown";

  // Both are numbers - compare
  if (guess === target) return "correct";
  return guess < target ? "higher" : "lower";
}

/**
 * Classic mode categories configuration
 * Order: Gender, Affiliation, Devil Fruit, Haki, Bounty, Height, Origin, First Arc
 * (Character/portrait is handled separately)
 */
export const categories: CategoryConfig[] = [
  {
    key: "gender",
    label: "Gender",
    type: "string",
    renderValue: (v) => String(v),
    evaluate: (g, t) => (g === t ? "correct" : "wrong"),
  },
  {
    key: "affiliationPrimary",
    label: "Affiliation",
    type: "string",
    renderValue: (v) => String(v),
    evaluate: (g, t) => (g === t ? "correct" : "wrong"),
  },
  {
    key: "devilFruitType",
    label: "Devil Fruit",
    type: "string",
    renderValue: (v) => String(v),
    evaluate: (g, t) => (g === t ? "correct" : "wrong"),
  },
  {
    key: "haki",
    label: "Haki",
    type: "haki",
    renderValue: (v) => formatHaki(v as HakiType[]),
    evaluate: (g, t) => compareHaki(g as HakiType[], t as HakiType[]),
  },
  {
    key: "bounty",
    label: "Bounty",
    type: "number",
    renderValue: (v) => formatBounty(v as number | null),
    evaluate: (g, t) => compareNumber(g as number | null, t as number | null),
  },
  {
    key: "heightCm",
    label: "Height",
    type: "number",
    renderValue: (v) => formatHeight(v as number | null),
    evaluate: (g, t) => compareNumber(g as number | null, t as number | null),
  },
  {
    key: "origin",
    label: "Origin",
    type: "string",
    renderValue: (v) => String(v),
    evaluate: (g, t) => (g === t ? "correct" : "wrong"),
  },
  {
    key: "firstArc",
    label: "First Arc",
    type: "string",
    renderValue: (v) => {
      const arc = String(v);
      // Show "?" if arc is not in our canonical list
      return isValidArc(arc) ? arc : "?";
    },
    evaluate: (g, t) => compareArcs(g as string, t as string),
  },
];

/**
 * Evaluate a guess against the target character
 */
export function evaluateCharacter(
  guess: Character,
  target: Character
): CategoryResult[] {
  return categories.map((cat) => {
    const guessValue = guess[cat.key];
    const targetValue = target[cat.key];
    const status = cat.evaluate(guessValue, targetValue);
    const displayValue = cat.renderValue(guessValue);

    return {
      key: cat.key as string,
      label: cat.label,
      status,
      value: guessValue as string | number | string[] | null,
      displayValue,
    };
  });
}

/**
 * Get category labels for header
 */
export function getCategoryLabels(): string[] {
  return categories.map((c) => c.label);
}
