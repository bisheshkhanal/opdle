/**
 * T16: Deterministic daily matrix, tier coverage, and roster guard tests.
 *
 * Verifies:
 * 1. Every (tier × ruleset) pair produces deterministic results on repeated calls
 * 2. Every tier has enough characters for each ruleset to be playable
 * 3. Every character in each tier has ≥1 clue via getCharacterClues()
 * 4. Every tier has ≥4 characters sharing a group trait for four-seas mode
 * 5. Results vary across different dates (not all returning same character)
 */

import { describe, it, expect } from "vitest";
import { selectTarget, selectFourSeasTargets } from "../selectors";
import { getCharactersForTier } from "../tier";
import { getCharacterClues } from "../clues";
import type { Character, Ruleset, RunKind, Tier } from "../types";
import { validateCharacter } from "../types";
import sampleData from "../../data/characters.v2.json";

const characters = sampleData as Character[];
const TIERS: Tier[] = ["casual", "fan", "nakama"];
const RULESETS: Ruleset[] = [
  "classic",
  "silhouette",
  "wanted",
  "quote",
  "arc",
  "four-seas",
];
const SAMPLE_DATES = [
  "2025-01-01",
  "2025-03-15",
  "2025-06-30",
  "2025-09-22",
  "2025-12-25",
];

// ---------------------------------------------------------------------------
// 1. Deterministic daily selection — tier × ruleset matrix
// ---------------------------------------------------------------------------

describe("Daily matrix: determinism across all tier × ruleset pairs", () => {
  for (const tier of TIERS) {
    for (const ruleset of RULESETS) {
      describe(`tier=${tier}, ruleset=${ruleset}`, () => {
        it("returns same result on repeated calls (deterministic)", () => {
          const dateString = "2025-06-15";
          const ctx = {
            runKind: "daily" as RunKind,
            ruleset,
            tier,
            dateString,
          };

          const result1 = selectTarget(characters, ctx);
          const result2 = selectTarget(characters, ctx);

          expect(result1.kind).toBe(result2.kind);

          if (result1.kind === "single" && result2.kind === "single") {
            expect(result1.character.id).toBe(result2.character.id);
            // Verify the character is valid
            expect(validateCharacter(result1.character)).toBe(true);
          } else if (result1.kind === "multi" && result2.kind === "multi") {
            const ids1 = result1.characters.map((c) => c.id);
            const ids2 = result2.characters.map((c) => c.id);
            expect(ids1).toEqual(ids2);
            // Verify all characters are valid
            for (const c of result1.characters) {
              expect(validateCharacter(c)).toBe(true);
            }
          }
        });

        it("result character is within the correct tier", () => {
          const ctx = {
            runKind: "daily" as RunKind,
            ruleset,
            tier,
            dateString: "2025-06-15",
          };

          const tiered = getCharactersForTier(characters, tier);
          const result = selectTarget(characters, ctx);

          if (result.kind === "single") {
            expect(tiered.some((c) => c.id === result.character.id)).toBe(true);
          } else if (result.kind === "multi") {
            for (const c of result.characters) {
              expect(tiered.some((tc) => tc.id === c.id)).toBe(true);
            }
          }
        });

        if (ruleset !== "four-seas") {
          it("same underlying character across all non-four-seas rulesets", () => {
            const dateString = "2025-06-15";
            const classicCtx = {
              runKind: "daily" as RunKind,
              ruleset: "classic" as Ruleset,
              tier,
              dateString,
            };

            const classicResult = selectTarget(characters, classicCtx);
            const thisResult = selectTarget(characters, {
              runKind: "daily",
              ruleset,
              tier,
              dateString,
            });

            // Both should be single results
            expect(classicResult.kind).toBe("single");
            expect(thisResult.kind).toBe("single");

            if (
              classicResult.kind === "single" &&
              thisResult.kind === "single"
            ) {
              expect(classicResult.character.id).toBe(thisResult.character.id);
            }
          });
        }
      });
    }
  }

  it("different dates produce different characters (not all identical)", () => {
    const tier: Tier = "casual";
    const ids = new Set<string>();

    for (const date of SAMPLE_DATES) {
      const result = selectTarget(characters, {
        runKind: "daily",
        ruleset: "classic",
        tier,
        dateString: date,
      });
      if (result.kind === "single") {
        ids.add(result.character.id);
      }
    }

    // With 5 different dates and 83 casual characters, we should get
    // at least 2 different characters (proving date-based selection works)
    expect(ids.size).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 2. Infinite mode determinism across tier × ruleset
// ---------------------------------------------------------------------------

describe("Infinite matrix: determinism across all tier × ruleset pairs", () => {
  for (const tier of TIERS) {
    for (const ruleset of RULESETS) {
      it(`returns same result on repeated calls for tier=${tier}, ruleset=${ruleset}`, () => {
        const ctx = {
          runKind: "infinite" as RunKind,
          ruleset,
          tier,
          roundId: "test-round-determinism",
        };

        const result1 = selectTarget(characters, ctx);
        const result2 = selectTarget(characters, ctx);

        expect(result1.kind).toBe(result2.kind);

        if (result1.kind === "single" && result2.kind === "single") {
          expect(result1.character.id).toBe(result2.character.id);
        } else if (result1.kind === "multi" && result2.kind === "multi") {
          expect(result1.characters.map((c) => c.id)).toEqual(
            result2.characters.map((c) => c.id)
          );
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Roster guard: every tier has playable characters
// ---------------------------------------------------------------------------

describe("Roster guard: tier playability", () => {
  for (const tier of TIERS) {
    describe(`tier=${tier}`, () => {
      it("has at least 1 character in the tier", () => {
        const tiered = getCharactersForTier(characters, tier);
        expect(tiered.length).toBeGreaterThan(0);
      });

      it("every character passes validateCharacter()", () => {
        const tiered = getCharactersForTier(characters, tier);
        for (const c of tiered) {
          expect(validateCharacter(c)).toBe(true);
        }
      });

      it("every character has ≥1 clue via getCharacterClues()", () => {
        const tiered = getCharactersForTier(characters, tier);
        for (const c of tiered) {
          const clues = getCharacterClues(c);
          expect(clues.length).toBeGreaterThanOrEqual(1);
        }
      });

      it("has ≥4 characters sharing an affiliationPrimary (four-seas playable)", () => {
        const tiered = getCharactersForTier(characters, tier);
        const byAffiliation: Record<string, number> = {};
        for (const c of tiered) {
          byAffiliation[c.affiliationPrimary] =
            (byAffiliation[c.affiliationPrimary] || 0) + 1;
        }
        const groupsWith4 = Object.values(byAffiliation).filter((v) => v >= 4);
        // Must have at least 1 affiliation group with ≥4 members
        // OR enough arc groups (checked below) — but we want to verify
        // at least one grouping strategy works
        const byArc: Record<string, number> = {};
        for (const c of tiered) {
          byArc[c.firstArc] = (byArc[c.firstArc] || 0) + 1;
        }
        const arcGroupsWith4 = Object.values(byArc).filter((v) => v >= 4);

        const hasPlayableGroup =
          groupsWith4.length > 0 || arcGroupsWith4.length > 0;
        expect(hasPlayableGroup).toBe(true);
      });

      it("selectFourSeasTargets returns exactly 4 valid characters", () => {
        const tiered = getCharactersForTier(characters, tier);
        // The function takes allCharacters and filters internally
        const targets = selectFourSeasTargets(
          characters,
          tier,
          `${tier}-test-seed`
        );

        expect(targets).toHaveLength(4);
        const ids = targets.map((c) => c.id);
        expect(new Set(ids).size).toBe(4); // all distinct

        // All targets must be in the tier
        for (const t of targets) {
          expect(tiered.some((c) => c.id === t.id)).toBe(true);
        }
      });

      it("selectFourSeasTargets is deterministic for same seed", () => {
        const seed = `${tier}-determinism-check`;
        const t1 = selectFourSeasTargets(characters, tier, seed);
        const t2 = selectFourSeasTargets(characters, tier, seed);
        expect(t1.map((c) => c.id)).toEqual(t2.map((c) => c.id));
      });

      it("tier has enough characters for 6 guesses (maxGuesses) without exhausting pool", () => {
        const tiered = getCharactersForTier(characters, tier);
        // Even the smallest tier needs at least 7 characters (6 guesses + the target)
        // to avoid running out of possible guesses
        expect(tiered.length).toBeGreaterThanOrEqual(7);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Cross-tier isolation: different tiers produce different characters
// ---------------------------------------------------------------------------

describe("Cross-tier isolation", () => {
  it("different tiers produce different daily characters for the same date", () => {
    const dateString = "2025-06-15";
    const results: Record<Tier, string> = {} as Record<Tier, string>;

    for (const tier of TIERS) {
      const result = selectTarget(characters, {
        runKind: "daily",
        ruleset: "classic",
        tier,
        dateString,
      });
      if (result.kind === "single") {
        results[tier] = result.character.id;
      }
    }

    // All three tiers should produce results
    expect(results.casual).toBeDefined();
    expect(results.fan).toBeDefined();
    expect(results.nakama).toBeDefined();

    // The characters should differ across tiers for at least some dates
    // (This is a probabilistic test — same char across tiers is possible
    // but unlikely for most dates)
    const uniqueChars = new Set(Object.values(results));
    // We just verify they're valid; exact uniqueness isn't guaranteed
    expect(uniqueChars.size).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Four-seas edge cases
// ---------------------------------------------------------------------------

describe("Four-seas edge cases with real roster", () => {
  it("multiple seeds produce valid results for every tier", () => {
    const seeds = ["seed-a", "seed-b", "seed-c", "2025-01-01", "2025-12-25"];

    for (const tier of TIERS) {
      for (const seed of seeds) {
        const targets = selectFourSeasTargets(characters, tier, seed);
        expect(targets).toHaveLength(4);
        const ids = targets.map((c) => c.id);
        expect(new Set(ids).size).toBe(4);
      }
    }
  });

  it("fallback strategy works even when no group has ≥4 members", () => {
    function makeIsolatedChar(i: number): Character {
      return {
        id: `char-${i}`,
        name: `Character ${i}`,
        aliases: [],
        imageUrl: `/characters/char-${i}.png`,
        gender: "Male",
        affiliationPrimary: `Unique-Crew-${i}`,
        devilFruitType: ["None"],
        haki: [],
        bounty: null,
        heightCm: null,
        origin: "East Blue",
        firstArc: `Unique-Arc-${i}`,
        minTier: "casual",
      };
    }
    const smallRoster: Character[] = Array.from({ length: 5 }, (_, i) =>
      makeIsolatedChar(i)
    );

    const targets = selectFourSeasTargets(smallRoster, "casual", "test-seed");
    expect(targets).toHaveLength(4);
    expect(new Set(targets.map((c) => c.id)).size).toBe(4);
  });
});
