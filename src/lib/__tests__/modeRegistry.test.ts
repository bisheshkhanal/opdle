import { describe, it, expect } from "vitest";
import type { Ruleset } from "../types";
import {
  RULESET_REGISTRY,
  getRulesetDef,
  isRulesetSupported,
  getSupportedRulesets,
} from "../modeRegistry";

const ALL_RULESET_IDS: Ruleset[] = ["classic", "wanted", "quote", "four-seas"];

describe("modeRegistry", () => {
  it("returns correct maxGuesses for classic", () => {
    expect(getRulesetDef("classic").maxGuesses).toBe(6);
  });

  it("returns usesClueProgression = true for wanted", () => {
    expect(getRulesetDef("wanted").usesClueProgression).toBe(true);
  });

  it("returns isMultiBoard = true and boardCount = 4 for four-seas", () => {
    const def = getRulesetDef("four-seas");
    expect(def.isMultiBoard).toBe(true);
    expect(def.boardCount).toBe(4);
  });

  it("contains all 4 rulesets in RULESET_REGISTRY", () => {
    for (const id of ALL_RULESET_IDS) {
      expect(RULESET_REGISTRY[id]).toBeDefined();
      expect(RULESET_REGISTRY[id].id).toBe(id);
    }
    expect(Object.keys(RULESET_REGISTRY)).toHaveLength(4);
  });

  it("wanted does not support challenge run kind", () => {
    expect(isRulesetSupported("wanted", "challenge")).toBe(false);
  });

  it("classic supports challenge run kind", () => {
    expect(isRulesetSupported("classic", "challenge")).toBe(true);
  });

  it("getSupportedRulesets returns all 4 entries", () => {
    const rulesets = getSupportedRulesets();
    expect(rulesets).toHaveLength(4);
    for (const id of ALL_RULESET_IDS) {
      expect(rulesets).toContain(id);
    }
  });

  it("exhaustive switch over Ruleset is complete", () => {
    let ruleset: Ruleset = "classic" as Ruleset;

    const result = (() => {
      switch (ruleset) {
        case "classic":
          return "c";
        case "wanted":
          return "w";
        case "quote":
          return "q";
        case "four-seas":
          return "f";
      }
    })();

    expect(result).toBe("c");
    expect<typeof result>("c").toBe("c");
  });
});
