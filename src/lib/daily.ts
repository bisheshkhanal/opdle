/**
 * Daily mode utilities - UTC date helpers and seeded daily selection
 */

import type { Character } from "./types";

/**
 * Get the current UTC date string in YYYY-MM-DD format
 */
export function getUTCDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse a date string to get a numeric seed
 * Uses a simple hash of the date string
 */
export function dateToSeed(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (Mulberry32)
 * Returns a function that generates numbers between 0 and 1
 */
export function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Select a character for daily mode based on UTC date
 * Deterministic - same date always returns same character
 */
export function selectDailyCharacter(
  characters: Character[],
  dateString?: string
): Character {
  const date = dateString || getUTCDateString();
  const seed = dateToSeed(date);
  const rng = seededRandom(seed);
  const index = Math.floor(rng() * characters.length);
  return characters[index];
}

/**
 * Get the daily game number (days since game launch)
 * Starting from a reference date
 */
export function getDailyGameNumber(dateString?: string): number {
  const referenceDate = new Date("2024-01-01");
  const currentDate = dateString
    ? new Date(dateString)
    : new Date(getUTCDateString());
  const diffTime = currentDate.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Check if a date string is today's date (UTC)
 */
export function isToday(dateString: string): boolean {
  return dateString === getUTCDateString();
}

/**
 * Get time until next daily reset (midnight UTC)
 */
export function getTimeUntilReset(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}
