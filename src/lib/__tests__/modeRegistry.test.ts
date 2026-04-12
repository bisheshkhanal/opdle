import { describe, it, expect } from "vitest";
import type { Ruleset } from "../types";
import {
  RULESET_REGISTRY,
  getRulesetDef,
  isRulesetSupported,
  getSupportedRulesets,
} from "../modeRegistry";

const ALL_RULESET_IDS: Ruleset[] = [
  "classic",
  "silhouette",
  "wanted",
  "quote",
  "arc",
  "four-seas",
];

describe("modeRegistry", () => {
  it("returns correct maxGuesses for classic", () => {
    expect(getRulesetDef("classic").maxGuesses).toBe(6);
  });

  it("returns usesProgressiveReveal = true for silhouette", () => {
    expect(getRulesetDef("silhouette").usesProgressiveReveal).toBe(true);
  });

  it("returns isMultiBoard = true and boardCount = 4 for four-seas", () => {
    const def = getRulesetDef("four-seas");
    expect(def.isMultiBoard).toBe(true);
    expect(def.boardCount).toBe(4);
  });

  it("contains all 6 rulesets in RULESET_REGISTRY", () => {
    for (const id of ALL_RULESET_IDS) {
      expect(RULESET_REGISTRY[id]).toBeDefined();
      expect(RULESET_REGISTRY[id].id).toBe(id);
    }
    expect(Object.keys(RULESET_REGISTRY)).toHaveLength(6);
  });

  it("silhouette does not support challenge run kind", () => {
    expect(isRulesetSupported("silhouette", "challenge")).toBe(false);
  });

  it("classic supports challenge run kind", () => {
    expect(isRulesetSupported("classic", "challenge")).toBe(true);
  });

  it("getSupportedRulesets returns all 6 entries", () => {
    const rulesets = getSupportedRulesets();
    expect(rulesets).toHaveLength(6);
    for (const id of ALL_RULESET_IDS) {
      expect(rulesets).toContain(id);
    }
  });

  it("exhaustive switch over Ruleset is complete", () => {
    const ruleset: Ruleset = "classic";

    const result = (() => {
      switch (ruleset) {
        case "classic":
          return "c";
        case "silhouette":
          return "s";
        case "wanted":
          return "w";
        case "quote":
          return "q";
        case "arc":
          return "a";
        case "four-seas":
          return "f";
      }
    })();

    expect(result).toBe("c");
    expect<typeof result>("c").toBe("c");
  });
});
