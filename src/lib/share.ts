/**
 * Share functionality - emoji grid formatting
 */

import type { GuessResult, GameMode, TileStatus } from "./types";
import { getDailyGameNumber } from "./daily";

const MAX_GUESSES = 6;
const SHARE_LEGEND = "🟩 Correct  🟨 Partial  ⬜ Wrong  ⬆️ Higher  ⬇️ Lower";

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
  _hintUsed?: boolean
): string {
  const lines: string[] = [];

  if (mode === "daily") {
    const gameNumber = getDailyGameNumber(dateString);
    lines.push(`🏴‍☠️ Onepiecedle Daily #${gameNumber}`);
  } else {
    lines.push("🏴‍☠️ Onepiecedle Infinite");
  }

  lines.push(`${isWon ? guesses.length : "X"}/${MAX_GUESSES} guesses`);

  if (isWon) {
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
  lines.push(SHARE_LEGEND);

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
