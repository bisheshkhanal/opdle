/**
 * Shared mode contract test harness.
 *
 * Every ruleset implementation (T7-T10, T12) must pass these tests
 * to guarantee consistency across all game modes.
 *
 * Usage:
 *   describe("my-ruleset contract", () => {
 *     runModeContractTests({ ruleset: "silhouette", runKind: "daily", sampleCharacters });
 *   });
 */

import { it, expect, beforeEach } from "vitest";
import type { Character, Ruleset, RunKind } from "../types";
import { selectTarget } from "../selectors";
import { getRulesetDailyState, saveRulesetDailyState } from "../storage";
import { clearStorage } from "../storage";
import { formatShareText } from "../share";
import { RULESET_REGISTRY } from "../modeRegistry";

export interface ModeContractConfig {
  ruleset: Ruleset;
  runKind: RunKind;
  sampleCharacters: Character[];
}

export function runModeContractTests(config: ModeContractConfig): void {
  const { ruleset, runKind, sampleCharacters } = config;

  beforeEach(() => {
    clearStorage();
  });

  it("selector returns deterministic result for same context", () => {
    const ctx = {
      runKind,
      ruleset,
      tier: "casual" as const,
      dateString: "2025-01-01",
      roundId: "test-round-determinism",
      challengeSeed: "test-challenge-seed",
    };

    const result1 = selectTarget(sampleCharacters, ctx);
    const result2 = selectTarget(sampleCharacters, ctx);

    // Both should return same kind
    expect(result1.kind).toBe(result2.kind);

    if (result1.kind === "single" && result2.kind === "single") {
      expect(result1.character.id).toBe(result2.character.id);
    } else if (result1.kind === "multi" && result2.kind === "multi") {
      const ids1 = result1.characters.map((c) => c.id);
      const ids2 = result2.characters.map((c) => c.id);
      expect(ids1).toEqual(ids2);
    }
  });

  it("save/restore cycle works for daily state", () => {
    const tier = "casual";
    const fakeState = {
      guesses: [],
      guessedIds: [],
      isFinished: false,
      isWon: false,
    };

    // Initial state should be empty
    const initialState = getRulesetDailyState(tier, ruleset);
    expect(initialState.guesses).toEqual([]);
    expect(initialState.isFinished).toBe(false);

    // Save a state
    saveRulesetDailyState(
      { ...fakeState, guessedIds: ["luffy"] },
      tier,
      ruleset
    );

    // Restore should return the saved state
    const restored = getRulesetDailyState(tier, ruleset);
    expect(restored.guessedIds).toEqual(["luffy"]);
    expect(restored.isFinished).toBe(false);
    expect(restored.isWon).toBe(false);
  });

  it("storage isolation between rulesets", () => {
    const tier = "casual";
    const otherRuleset: Ruleset =
      ruleset === "silhouette" ? "wanted" : "silhouette";

    // Save state for the primary ruleset
    saveRulesetDailyState(
      {
        guesses: [],
        guessedIds: ["zoro"],
        isFinished: true,
        isWon: true,
      },
      tier,
      ruleset
    );

    // The other ruleset should remain unaffected
    const otherState = getRulesetDailyState(tier, otherRuleset);
    expect(otherState.guessedIds).toEqual([]);
    expect(otherState.isFinished).toBe(false);
  });

  it("share label identifies ruleset correctly", () => {
    const text = formatShareText(
      [],
      "daily",
      false,
      "2025-01-01",
      undefined,
      undefined,
      ruleset
    );

    const headerLine = text.split("\n")[0];

    if (ruleset === "classic") {
      // Classic should NOT include a ruleset label
      expect(headerLine).toContain("Onepiecedle Daily");
      expect(headerLine).not.toContain("Silhouette");
      expect(headerLine).not.toContain("Wanted");
    } else {
      // Non-classic rulesets must include the ruleset label
      const expectedLabel = RULESET_REGISTRY[ruleset].label;
      expect(headerLine).toContain(expectedLabel);
    }
  });
}
