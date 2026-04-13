import characters from "../../data/characters.v2.json";
import { Character, validateCharacter } from "../types";
import { describe, expect, test } from "vitest";

const CANONICAL_HAKI_ORDER = ["O", "A", "C"] as const;
const CANONICAL_SKYPIEA_ORIGIN = "White White Sea (Skypiea)";

function toCharacterArray(): Character[] {
  const result: Character[] = [];
  for (const candidate of characters as unknown[]) {
    if (!validateCharacter(candidate)) {
      throw new Error("Dataset contains invalid character shape");
    }
    result.push(candidate);
  }
  return result;
}

describe("characters.v2.json dataset invariants", () => {
  const dataset = toCharacterArray();

  const sample = dataset[0];

  test("all characters pass runtime validation", () => {
    expect(dataset.length).toBeGreaterThan(0);
  });

  test("accepts optional enrichment fields when they are valid", () => {
    expect(
      validateCharacter({
        ...sample,
        age: 53,
        status: "Deceased",
        crewHistory: [
          {
            crew: "Whitebeard Pirates",
            role: "Division Commander",
            fromArc: "Arabasta",
            toArc: "Marineford",
          },
        ],
        epithet: "Fire Fist",
        quotesOrLaughs: ["Puhahaha", "I'm not going to run away."],
        provenance: {
          source: "wiki",
          scrapedAt: "2026-04-12T00:00:00.000Z",
          version: 1,
        },
      })
    ).toBe(true);
  });

  test("rejects invalid optional enrichment values", () => {
    expect(
      validateCharacter({
        ...sample,
        age: "53",
      })
    ).toBe(false);

    expect(
      validateCharacter({
        ...sample,
        status: "Missing",
      })
    ).toBe(false);

    expect(
      validateCharacter({
        ...sample,
        crewHistory: [{ crew: "Whitebeard Pirates", role: 123 }],
      })
    ).toBe(false);

    expect(
      validateCharacter({
        ...sample,
        epithet: 123,
      })
    ).toBe(false);

    expect(
      validateCharacter({
        ...sample,
        quotesOrLaughs: ["valid", 123],
      })
    ).toBe(false);

    expect(
      validateCharacter({
        ...sample,
        provenance: {
          source: "wiki",
          scrapedAt: "2026-04-12T00:00:00.000Z",
          version: "1",
        },
      })
    ).toBe(false);
  });

  test('no character has affiliationPrimary typo "Alabasta Kingdom"', () => {
    const typoEntries = dataset.filter(
      (character) => character.affiliationPrimary === "Alabasta Kingdom"
    );
    expect(typoEntries).toHaveLength(0);
  });

  test("all Skypiea-related origins use canonical label", () => {
    const skypieaEntries = dataset.filter((character) =>
      character.origin.includes("Skypiea")
    );

    expect(skypieaEntries.length).toBeGreaterThan(0);
    expect(
      skypieaEntries.every(
        (character) => character.origin === CANONICAL_SKYPIEA_ORIGIN
      )
    ).toBe(true);
  });

  test("all haki arrays follow canonical order [O, A, C]", () => {
    const badHakiOrder = dataset.filter((character) => {
      const indices = character.haki.map((type) =>
        CANONICAL_HAKI_ORDER.indexOf(type)
      );
      return indices.some((index, i) => i > 0 && indices[i - 1] > index);
    });

    expect(badHakiOrder).toHaveLength(0);
  });

  test("all devilFruitType arrays are sorted alphabetically", () => {
    const badDevilFruitOrder = dataset.filter((character) =>
      character.devilFruitType.some(
        (type, i, arr) => i > 0 && arr[i - 1].localeCompare(type) > 0
      )
    );

    expect(badDevilFruitOrder).toHaveLength(0);
  });

  test("Karoo specifically has Arabasta Kingdom affiliation", () => {
    const karoo = dataset.find((character) => character.id === "karoo");

    expect(karoo).toBeDefined();
    expect(karoo?.affiliationPrimary).toBe("Arabasta Kingdom");
  });
});
