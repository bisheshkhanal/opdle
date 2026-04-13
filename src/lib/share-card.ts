import { getDailyGameNumber } from "./daily";
import { formatShareText } from "./share";
import type {
  Character,
  GameMode,
  GuessResult,
  ShareCardPayload,
} from "./types";

type ShareCardTemplate = "dossier" | "bounty";

export interface BuildShareCardPayloadOptions {
  guesses: GuessResult[];
  target: Character;
  mode: GameMode;
  date: string;
  challengeLabel?: string;
  template?: ShareCardTemplate;
}

const STATUS_EMOJI: Record<string, string> = {
  correct: "🟩",
  partial: "🟨",
  higher: "🔺",
  lower: "🔻",
  wrong: "🟥",
  unknown: "🟥",
};

function getEmoji(status: GuessResult["categories"][number]["status"]): string {
  return STATUS_EMOJI[status] ?? "🟥";
}

function buildEmojiGrid(guesses: GuessResult[]): string {
  return guesses
    .map((guess) =>
      guess.categories.map((category) => getEmoji(category.status)).join("")
    )
    .join("\n");
}

function getBrandingText(template: ShareCardTemplate): string {
  return template === "bounty"
    ? "Bounty Report"
    : "Marine Intelligence Dossier";
}

function getPuzzleLabel(
  mode: GameMode,
  date: string,
  challengeLabel?: string
): string {
  if (challengeLabel) {
    return challengeLabel;
  }

  if (mode === "daily") {
    return `Daily #${getDailyGameNumber(date)}`;
  }

  return "Infinite";
}

export function buildShareCardPayload({
  guesses,
  target,
  mode,
  date,
  challengeLabel,
  template = "dossier",
}: BuildShareCardPayloadOptions): ShareCardPayload {
  const brandingText = getBrandingText(template);
  const puzzleLabel = getPuzzleLabel(mode, date, challengeLabel);
  const emojiGrid = buildEmojiGrid(guesses);
  const guessCount = guesses.length;
  const silhouetteUrl = target.imageUrl || null;
  const isWon = guesses.some(
    (guess) => guess.isCorrect || guess.characterId === target.id
  );
  const textFallback = formatShareText(guesses, mode, isWon, date);

  return {
    template,
    title: target.name,
    mode,
    runKind: challengeLabel ? "challenge" : mode,
    ruleset: "classic",
    brandingText,
    guessCount,
    emojiGrid,
    puzzleLabel,
    silhouetteUrl,
    shareText: [
      brandingText,
      target.name,
      puzzleLabel,
      `${guessCount}/6 guesses`,
      emojiGrid,
    ]
      .filter(Boolean)
      .join("\n"),
    textFallback,
    shareUrl: null,
    createdAtUtc: `${date}T00:00:00.000Z`,
  };
}
