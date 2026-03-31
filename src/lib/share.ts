/**
 * Share functionality - emoji grid formatting
 */

import type { GuessResult, GameMode, TileStatus } from "./types";
import { getDailyGameNumber } from "./daily";

/**
 * Get emoji for a category status
 * Green = correct
 * Yellow = partial
 * Red = wrong/higher/lower/unknown
 */
function getStatusEmoji(status: TileStatus): string {
  switch (status) {
    case "correct":
      return "🟩";
    case "partial":
      return "🟨";
    case "higher":
      return "🔺";
    case "lower":
      return "🔻";
    case "unknown":
    case "wrong":
    default:
      return "🟥";
  }
}

export function getFlavorTitle(guesses: number): string | null {
  switch (guesses) {
    case 1:
      return "Pirate King";
    case 2:
      return "Yonko";
    case 3:
      return "Warlord";
    case 4:
      return "Super Rookie";
    case 5:
      return "Pirate";
    case 6:
      return "Rookie";
    default:
      return null;
  }
}

/**
 * Format a single guess row as emojis
 */
function formatGuessRow(guess: GuessResult): string {
  return guess.categories.map((c) => getStatusEmoji(c.status)).join("");
}

/**
 * Format the complete game result as a shareable string
 */
export function formatShareText(
  guesses: GuessResult[],
  mode: GameMode,
  isWon: boolean,
  dateString?: string,
  streak?: number,
  hintUsed?: boolean
): string {
  const lines: string[] = [];

  // Header
  if (mode === "daily") {
    const gameNumber = getDailyGameNumber(dateString);
    const attempts = isWon ? guesses.length : "X";
    const hintSuffix = hintUsed === true ? " 💡" : "";
    lines.push(`OnePiecedle #${gameNumber} ${attempts}/6${hintSuffix}`);
  } else {
    const attempts = isWon ? guesses.length : "X";
    const hintSuffix = hintUsed === true ? " 💡" : "";
    lines.push(`OnePiecedle (Infinite) ${attempts}/6${hintSuffix}`);
  }

  if (isWon) {
    const flavor = getFlavorTitle(guesses.length);
    if (flavor) {
      lines.push(flavor);
    }

    if (mode === "daily" && streak !== undefined && streak > 0) {
      lines.push(`🔥 Streak: ${streak}`);
    }
  }

  lines.push("");

  // Emoji grid
  for (const guess of guesses) {
    lines.push(formatGuessRow(guess));
  }

  lines.push("");
  lines.push("https://onepiecedle.com");

  return lines.join("\n");
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Share results (copy to clipboard with feedback)
 */
export async function shareResults(
  guesses: GuessResult[],
  mode: GameMode,
  isWon: boolean,
  dateString?: string,
  streak?: number,
  hintUsed?: boolean
): Promise<{ success: boolean; text: string }> {
  const text = formatShareText(
    guesses,
    mode,
    isWon,
    dateString,
    streak,
    hintUsed
  );
  const success = await copyToClipboard(text);
  return { success, text };
}
