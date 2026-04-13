import { describe, expect, it } from "vitest";
import { ARC_ORDER } from "../../arcs";
import {
  SAGA_CATALOG,
  getSagaDef,
  getSagaForArc,
} from "../../progression/sagaCatalog";
import {
  ACHIEVEMENT_CATALOG,
  getAchievementDef,
} from "../../progression/achievementCatalog";
import { getMonthlyCollectible } from "../../progression/monthlyCatalog";

describe("progression catalogs", () => {
  it("maps every arc to exactly one saga with no duplicates", () => {
    const arcToSaga = new Map<string, string>();

    for (const saga of SAGA_CATALOG) {
      for (const arc of saga.arcs) {
        expect(arcToSaga.has(arc)).toBe(false);
        arcToSaga.set(arc, saga.id);
      }
    }

    expect(arcToSaga.size).toBe(ARC_ORDER.length);
    expect(new Set(arcToSaga.keys()).size).toBe(ARC_ORDER.length);
    expect(ARC_ORDER.every((arc) => arcToSaga.has(arc))).toBe(true);
  });

  it("resolves saga lookups for known arcs", () => {
    expect(getSagaForArc("Romance Dawn")).toBe("east-blue");
    expect(getSagaForArc("Enies Lobby")).toBe("water-7");
    expect(getSagaForArc("Wano Country")).toBe("wano-country");
    expect(getSagaForArc("Unknown Arc")).toBeNull();
  });

  it("returns saga definitions by id", () => {
    expect(getSagaDef("final").arcs).toContain("Elbaph");
  });

  it("exposes the expected achievement entries with unique IDs", () => {
    const ids = ACHIEVEMENT_CATALOG.map((achievement) => achievement.id);

    expect(ids).toEqual([...new Set(ids)]);
    expect(getAchievementDef("perfect-navigator")?.target).toBe(1);
    expect(getAchievementDef("grand-line-navigator")?.target).toBe(11);
    expect(getAchievementDef("bounty-hunter")?.kind).toBe("unique-solve");
    expect(getAchievementDef("missing-achievement")).toBeUndefined();
  });

  it("returns deterministic monthly collectible metadata", () => {
    const first = getMonthlyCollectible("2026-04");
    const second = getMonthlyCollectible("2026-04");
    const third = getMonthlyCollectible("2026-05");

    expect(first).toEqual(second);
    expect(first.targetFragments).toBe(24);
    expect(first.collectibleType).toBe("vivre-card");
    expect(third.collectibleType).toBe("bounty-poster");
    expect(third.seasonKey).toBe("2026-05");
  });
});
