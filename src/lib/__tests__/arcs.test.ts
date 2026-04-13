import { describe, it, expect } from "vitest";
import {
  ARC_ORDER,
  getArcIndex,
  compareArcs,
  isValidArc,
  getValidArcs,
} from "../arcs";

describe("arcs.ts", () => {
  describe("getArcIndex", () => {
    it("returns the correct index for an exact canonical name", () => {
      expect(getArcIndex("Romance Dawn")).toBe(0);
    });

    it("resolves alias 'alabasta' to Arabasta", () => {
      expect(getArcIndex("alabasta")).toBe(getArcIndex("Arabasta"));
    });

    it("resolves alias 'wano' to Wano Country", () => {
      expect(getArcIndex("wano")).toBe(getArcIndex("Wano Country"));
    });

    it("resolves alias 'sabaody' to Sabaody Archipelago", () => {
      expect(getArcIndex("sabaody")).toBe(getArcIndex("Sabaody Archipelago"));
    });

    it("resolves alias 'return to sabaody' to Return to Sabaody", () => {
      expect(getArcIndex("return to sabaody")).toBe(
        getArcIndex("Return to Sabaody")
      );
    });

    it("resolves alias 'return sabaody' to Return to Sabaody", () => {
      expect(getArcIndex("return sabaody")).toBe(
        getArcIndex("Return to Sabaody")
      );
    });

    it("resolves alias 'water seven' to Water 7", () => {
      expect(getArcIndex("water seven")).toBe(getArcIndex("Water 7"));
    });

    it("resolves alias 'reverie' to Levely", () => {
      expect(getArcIndex("reverie")).toBe(getArcIndex("Levely"));
    });

    it("resolves alias 'fishman island' to Fish-Man Island", () => {
      expect(getArcIndex("fishman island")).toBe(
        getArcIndex("Fish-Man Island")
      );
    });

    it("matches arc names case-insensitively", () => {
      expect(getArcIndex("marineford")).toBe(getArcIndex("Marineford"));
    });

    it("returns -1 for unknown arcs", () => {
      expect(getArcIndex("Some Unknown Arc")).toBe(-1);
    });
  });

  describe("compareArcs", () => {
    it("returns correct for the same arc", () => {
      expect(compareArcs("Romance Dawn", "Romance Dawn")).toBe("correct");
    });

    it("returns higher when guess is earlier than target", () => {
      expect(compareArcs("Romance Dawn", "Marineford")).toBe("higher");
    });

    it("returns lower when guess is later than target", () => {
      expect(compareArcs("Marineford", "Romance Dawn")).toBe("lower");
    });

    it("returns unknown when guess is null", () => {
      expect(compareArcs(null, "Marineford")).toBe("unknown");
    });

    it("returns unknown when target is undefined", () => {
      expect(compareArcs("Marineford", undefined)).toBe("unknown");
    });

    it("returns unknown when both arcs are unknown", () => {
      expect(compareArcs("Unknown Arc A", "Unknown Arc B")).toBe("unknown");
    });

    it("compares first and last arcs within Water 7 saga correctly", () => {
      expect(compareArcs("Water 7", "Post-Enies Lobby")).toBe("higher");
      expect(compareArcs("Post-Enies Lobby", "Water 7")).toBe("lower");
    });
  });

  describe("isValidArc", () => {
    it("accepts canonical arc names", () => {
      expect(isValidArc("Romance Dawn")).toBe(true);
      expect(isValidArc("Marineford")).toBe(true);
    });

    it("accepts aliases", () => {
      expect(isValidArc("alabasta")).toBe(true);
      expect(isValidArc("wano")).toBe(true);
    });

    it("rejects unknown values", () => {
      expect(isValidArc("Unknown")).toBe(false);
      expect(isValidArc("garbage-value")).toBe(false);
    });
  });

  describe("ARC_ORDER", () => {
    it("contains at least the documented canonical arc baseline", () => {
      expect(ARC_ORDER.length).toBeGreaterThanOrEqual(24);
    });

    it("starts with Romance Dawn", () => {
      expect(ARC_ORDER[0]).toBe("Romance Dawn");
    });

    it("ends with Elbaph", () => {
      expect(ARC_ORDER[ARC_ORDER.length - 1]).toBe("Elbaph");
    });

    it("maintains chronological ordering for key milestones", () => {
      expect(getArcIndex("Water 7")).toBeLessThan(getArcIndex("Enies Lobby"));
      expect(getArcIndex("Enies Lobby")).toBeLessThan(
        getArcIndex("Post-Enies Lobby")
      );
      expect(getArcIndex("Sabaody Archipelago")).toBeLessThan(
        getArcIndex("Marineford")
      );
      expect(getArcIndex("Dressrosa")).toBeLessThan(
        getArcIndex("Whole Cake Island")
      );
      expect(getArcIndex("Wano Country")).toBeLessThan(getArcIndex("Egghead"));
    });
  });

  describe("getValidArcs", () => {
    it("returns a list with the same length as ARC_ORDER", () => {
      expect(getValidArcs()).toHaveLength(ARC_ORDER.length);
    });
  });
});
