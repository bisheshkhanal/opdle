import { describe, expect, it } from "vitest";
import { buildShareCardPayload } from "../share-card";
import { formatShareText } from "../share";
import type { Character, GuessResult, TileStatus } from "../types";

function makeGuess(id: string, statuses: TileStatus[]): GuessResult {
  return {
    characterId: id,
    characterName: id.toUpperCase(),
    imageUrl: `https://example.com/${id}.png`,
    categories: statuses.map((status, index) => ({
      key: `category-${index}`,
      label: `Category ${index + 1}`,
      status,
      value: null,
      displayValue: "-",
    })),
    isCorrect: statuses.every((status) => status === "correct"),
  };
}

function makeTarget(overrides: Partial<Character> = {}): Character {
  return {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy"],
    imageUrl: "https://example.com/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
    ...overrides,
  };
}

describe("share-card", () => {
  it("buildShareCardPayload returns deterministic output for identical inputs", () => {
    const guesses = [
      makeGuess("zoro", ["correct", "partial"]),
      makeGuess("sanji", ["wrong", "higher"]),
    ];
    const target = makeTarget();

    const first = buildShareCardPayload({
      guesses,
      target,
      mode: "daily",
      date: "2026-04-13",
      template: "dossier",
    });
    const second = buildShareCardPayload({
      guesses,
      target,
      mode: "daily",
      date: "2026-04-13",
      template: "dossier",
    });

    expect(second).toEqual(first);
  });

  it("switches branding text by template", () => {
    const guesses = [makeGuess("zoro", ["correct", "partial"])];
    const target = makeTarget();

    const dossier = buildShareCardPayload({
      guesses,
      target,
      mode: "daily",
      date: "2026-04-13",
      template: "dossier",
    });
    const bounty = buildShareCardPayload({
      guesses,
      target,
      mode: "daily",
      date: "2026-04-13",
      template: "bounty",
      challengeLabel: "Week 1",
    });

    expect(dossier.brandingText).toBe("Marine Intelligence Dossier");
    expect(bounty.brandingText).toBe("Bounty Report");
  });

  it("falls back gracefully when silhouette URL is missing", () => {
    const payload = buildShareCardPayload({
      guesses: [makeGuess("zoro", ["correct"])],
      target: makeTarget({ imageUrl: "" }),
      mode: "infinite",
      date: "2026-04-13",
    });

    expect(payload.silhouetteUrl).toBeNull();
  });

  it("preserves the existing text fallback formatting", () => {
    const guesses = [makeGuess("luffy", ["correct", "correct"])];
    const target = makeTarget();
    const payload = buildShareCardPayload({
      guesses,
      target,
      mode: "daily",
      date: "2026-04-13",
    });

    expect(payload.textFallback).toBe(
      formatShareText(guesses, "daily", true, "2026-04-13")
    );
  });
});
