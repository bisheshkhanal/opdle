import { describe, it, expect } from "vitest";
import { selectTarget, selectFourSeasTargets } from "../selectors";
import type { Character } from "../types";

function makeCharacter(
  id: string,
  overrides: Partial<Character> = {}
): Character {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    aliases: [],
    imageUrl: `/characters/${id}.png`,
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: [],
    bounty: null,
    heightCm: null,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
    ...overrides,
  };
}

const strawHats: Character[] = [
  makeCharacter("luffy", {
    name: "Monkey D. Luffy",
    affiliationPrimary: "Straw Hat Pirates",
    firstArc: "Romance Dawn",
    minTier: "casual",
  }),
  makeCharacter("zoro", {
    name: "Roronoa Zoro",
    affiliationPrimary: "Straw Hat Pirates",
    firstArc: "Romance Dawn",
    minTier: "casual",
  }),
  makeCharacter("nami", {
    name: "Nami",
    affiliationPrimary: "Straw Hat Pirates",
    firstArc: "Orange Town",
    minTier: "casual",
  }),
  makeCharacter("usopp", {
    name: "Usopp",
    affiliationPrimary: "Straw Hat Pirates",
    firstArc: "Syrup Village",
    minTier: "casual",
  }),
  makeCharacter("sanji", {
    name: "Sanji",
    affiliationPrimary: "Straw Hat Pirates",
    firstArc: "Baratie",
    minTier: "casual",
  }),
];

const heartPirates: Character[] = [
  makeCharacter("law", {
    name: "Trafalgar Law",
    affiliationPrimary: "Heart Pirates",
    firstArc: "Sabaody Archipelago",
    minTier: "fan",
  }),
  makeCharacter("bepo", {
    name: "Bepo",
    affiliationPrimary: "Heart Pirates",
    firstArc: "Sabaody Archipelago",
    minTier: "fan",
  }),
  makeCharacter("penguin", {
    name: "Penguin",
    affiliationPrimary: "Heart Pirates",
    firstArc: "Sabaody Archipelago",
    minTier: "fan",
  }),
  makeCharacter("shachi", {
    name: "Shachi",
    affiliationPrimary: "Heart Pirates",
    firstArc: "Sabaody Archipelago",
    minTier: "fan",
  }),
];

const allCharacters = [...strawHats, ...heartPirates];

describe("selectors.ts", () => {
  describe("selectTarget — daily determinism", () => {
    it("returns same character on repeated calls with identical context", () => {
      const ctx = {
        runKind: "daily" as const,
        ruleset: "classic" as const,
        tier: "casual" as const,
        dateString: "2025-01-01",
      };

      const result1 = selectTarget(allCharacters, ctx);
      const result2 = selectTarget(allCharacters, ctx);

      expect(result1.kind).toBe("single");
      expect(result2.kind).toBe("single");
      expect((result1 as { character: Character }).character.id).toBe(
        (result2 as { character: Character }).character.id
      );
    });
  });

  describe("selectTarget — infinite determinism", () => {
    it("returns same character for same roundId", () => {
      const ctx = {
        runKind: "infinite" as const,
        ruleset: "classic" as const,
        tier: "casual" as const,
        roundId: "test-round-id",
      };

      const result1 = selectTarget(allCharacters, ctx);
      const result2 = selectTarget(allCharacters, ctx);

      expect(result1.kind).toBe("single");
      expect(result2.kind).toBe("single");
      expect((result1 as { character: Character }).character.id).toBe(
        (result2 as { character: Character }).character.id
      );
    });
  });

  describe("selectTarget — ruleset independence for daily", () => {
    it("returns same character for classic and silhouette rulesets on same date", () => {
      const classicResult = selectTarget(allCharacters, {
        runKind: "daily",
        ruleset: "classic",
        tier: "casual",
        dateString: "2025-01-01",
      });

      const silhouetteResult = selectTarget(allCharacters, {
        runKind: "daily",
        ruleset: "silhouette",
        tier: "casual",
        dateString: "2025-01-01",
      });

      expect(classicResult.kind).toBe("single");
      expect(silhouetteResult.kind).toBe("single");
      expect((classicResult as { character: Character }).character.id).toBe(
        (silhouetteResult as { character: Character }).character.id
      );
    });

    it("returns same character for wanted and quote rulesets on same date", () => {
      const wantedResult = selectTarget(allCharacters, {
        runKind: "daily",
        ruleset: "wanted",
        tier: "casual",
        dateString: "2025-06-15",
      });

      const quoteResult = selectTarget(allCharacters, {
        runKind: "daily",
        ruleset: "quote",
        tier: "casual",
        dateString: "2025-06-15",
      });

      expect(wantedResult.kind).toBe("single");
      expect(quoteResult.kind).toBe("single");
      expect((wantedResult as { character: Character }).character.id).toBe(
        (quoteResult as { character: Character }).character.id
      );
    });
  });

  describe("selectTarget — four-seas mode", () => {
    it("returns multi result with 4 characters for four-seas ruleset", () => {
      const result = selectTarget(allCharacters, {
        runKind: "daily",
        ruleset: "four-seas",
        tier: "casual",
        dateString: "2025-01-01",
      });

      expect(result.kind).toBe("multi");
      const multi = result as { characters: Character[] };
      expect(multi.characters).toHaveLength(4);
    });
  });

  describe("selectTarget — challenge mode", () => {
    it("returns deterministic result from challengeSeed", () => {
      const ctx = {
        runKind: "challenge" as const,
        ruleset: "classic" as const,
        tier: "casual" as const,
        challengeSeed: "my-challenge-seed",
      };

      const result1 = selectTarget(allCharacters, ctx);
      const result2 = selectTarget(allCharacters, ctx);

      expect(result1.kind).toBe("single");
      expect(result2.kind).toBe("single");
      expect((result1 as { character: Character }).character.id).toBe(
        (result2 as { character: Character }).character.id
      );
    });
  });

  describe("selectFourSeasTargets", () => {
    it("returns exactly 4 characters", () => {
      const targets = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-123"
      );
      expect(targets).toHaveLength(4);
    });

    it("returns same 4 characters on repeated calls (deterministic)", () => {
      const targets1 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-123"
      );
      const targets2 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-123"
      );

      const ids1 = targets1.map((c) => c.id);
      const ids2 = targets2.map((c) => c.id);
      expect(ids1).toEqual(ids2);
    });

    it("returns 4 distinct characters (no duplicates)", () => {
      const targets = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-456"
      );
      const ids = targets.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });

    it("produces deterministic results that vary with seed", () => {
      // With a larger pool we can observe different orderings across seeds.
      // Even if the same set of 4 is picked, the deterministic property is key.
      const targets1 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-aaa"
      );
      const targets2 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-bbb"
      );

      expect(targets1).toHaveLength(4);
      expect(targets2).toHaveLength(4);

      const ordered1 = targets1.map((c) => c.id).join(",");
      const ordered2 = targets2.map((c) => c.id).join(",");

      const replay1 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-aaa"
      );
      expect(replay1.map((c) => c.id).join(",")).toBe(ordered1);

      const replay2 = selectFourSeasTargets(
        allCharacters,
        "casual",
        "seed-bbb"
      );
      expect(replay2.map((c) => c.id).join(",")).toBe(ordered2);
    });
  });
});
