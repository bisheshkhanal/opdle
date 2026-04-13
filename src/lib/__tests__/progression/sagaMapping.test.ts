import { describe, expect, it } from "vitest";

import { ARC_ORDER } from "../../arcs";

import {
  getArcsForSaga,
  getSagaIdForArc,
  validateAllArcsMapped,
} from "../../progression/sagaMapping";

describe("progression saga mapping", () => {
  it("maps early, middle, and late arcs to the correct saga ids", () => {
    expect(getSagaIdForArc("Romance Dawn")).toBe("east-blue");
    expect(getSagaIdForArc("Enies Lobby")).toBe("water-7");
    expect(getSagaIdForArc("Wano Country")).toBe("wano-country");
    expect(getSagaIdForArc("Egghead")).toBe("final");
  });

  it("returns all arcs for a saga in canonical order", () => {
    expect(getArcsForSaga("east-blue")).toHaveLength(6);
    expect(getArcsForSaga("thriller-bark")).toEqual(["Thriller Bark"]);
  });

  it("returns null for unknown arcs", () => {
    expect(getSagaIdForArc("Fake Arc")).toBeNull();
  });

  it("maps every arc in ARC_ORDER", () => {
    expect(validateAllArcsMapped()).toEqual({ unmapped: [] });
    expect(ARC_ORDER.every((arc) => getSagaIdForArc(arc) !== null)).toBe(true);
  });

  it("detects temporary unmapped arcs", () => {
    expect(validateAllArcsMapped(["Romance Dawn", "Temporary Arc"])).toEqual({
      unmapped: ["Temporary Arc"],
    });
  });
});
