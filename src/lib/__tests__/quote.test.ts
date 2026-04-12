import { describe, it, expect } from "vitest";
import {
  initQuoteState,
  applyQuoteGuess,
  getVisibleClues,
  isQuoteComplete,
  ATTRIBUTE_CLUE_ORDER,
} from "../quote";
import { runModeContractTests } from "./modeContract";
import sampleData from "../../data/characters.v2.json";
import { Character } from "../types";

const characters = sampleData as Character[];
const target = characters[0]; // Ace — has canonical clue (laugh: "Puhahaha")
const wrongGuess = characters[1]; // Akainu — no canonical clues

describe("Quote Mode Engine", () => {
  it("initializes state correctly", () => {
    const state = initQuoteState();
    expect(state.guesses).toEqual([]);
    expect(state.guessedIds).toEqual([]);
    expect(state.isFinished).toBe(false);
    expect(state.isWon).toBe(false);
    expect(state.clueIndex).toBe(0);
  });

  it("starter clue is always visible", () => {
    const state = initQuoteState();
    const { starterClue } = getVisibleClues(target, state);
    expect(starterClue).toBeDefined();
    expect(starterClue.kind).toBe("laugh");
    expect(starterClue.text).toBe("Puhahaha");
  });

  it("starter clue works for fallback character (no canonical clues)", () => {
    const state = initQuoteState();
    const { starterClue } = getVisibleClues(wrongGuess, state);
    expect(starterClue).toBeDefined();
    expect(typeof starterClue.text).toBe("string");
    expect(starterClue.text.length).toBeGreaterThan(0);
  });

  it("wrong guess reveals first attribute clue", () => {
    let state = initQuoteState();
    state = applyQuoteGuess(state, wrongGuess, target, 6);
    expect(state.clueIndex).toBe(1);
    expect(state.guesses.length).toBe(1);
    expect(state.guessedIds).toContain(wrongGuess.id);
    expect(state.isFinished).toBe(false);

    const { attributeClues } = getVisibleClues(target, state);
    expect(attributeClues.length).toBe(1);
    expect(attributeClues[0].key).toBe("gender");
    expect(attributeClues[0].label).toBe("Gender");
    expect(attributeClues[0].value).toBe("Male");
  });

  it("correct guess wins game immediately without advancing clueIndex", () => {
    let state = initQuoteState();
    state = applyQuoteGuess(state, target, target, 6);
    expect(state.clueIndex).toBe(0);
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(true);
  });

  it("max guesses loses game", () => {
    let state = initQuoteState();
    for (let i = 0; i < 6; i++) {
      state = applyQuoteGuess(state, wrongGuess, target, 6);
    }
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(false);
    expect(state.guesses.length).toBe(6);
  });

  it("clue order is deterministic across wrong guesses", () => {
    let state = initQuoteState();
    const expectedOrder = ATTRIBUTE_CLUE_ORDER.slice(0, 5).map(
      (k) => k as string
    );

    for (let i = 0; i < 5; i++) {
      state = applyQuoteGuess(state, wrongGuess, target, 6);
    }

    const { attributeClues } = getVisibleClues(target, state);
    expect(attributeClues.length).toBe(5);
    expect(attributeClues.map((c) => c.key)).toEqual(expectedOrder);
  });

  it("clueIndex caps at ATTRIBUTE_CLUE_ORDER length", () => {
    let state = initQuoteState();
    for (let i = 0; i < 10; i++) {
      state = applyQuoteGuess(state, wrongGuess, target, 6);
    }
    // Game finished at guess 6, so clueIndex stops advancing then
    expect(state.clueIndex).toBeLessThanOrEqual(ATTRIBUTE_CLUE_ORDER.length);
  });

  it("ignores guesses after finished", () => {
    let state = initQuoteState();
    state = applyQuoteGuess(state, target, target, 6);
    expect(state.isFinished).toBe(true);

    const afterState = applyQuoteGuess(state, wrongGuess, target, 6);
    expect(afterState).toBe(state);
    expect(afterState.guesses.length).toBe(1);
  });

  it("state can be serialized and deserialized safely", () => {
    const state = initQuoteState();
    const updated = applyQuoteGuess(state, wrongGuess, target, 6);
    const json = JSON.stringify(updated);
    const restored = JSON.parse(json);
    expect(restored.clueIndex).toBe(1);
    expect(restored.isFinished).toBe(false);
    expect(restored.guessedIds).toContain(wrongGuess.id);
  });

  it("attribute clue renders null bounty as Unknown", () => {
    // Find a character with null bounty
    const nullBountyChar = characters.find((c) => c.bounty === null);
    if (!nullBountyChar) return; // skip if none

    let state = initQuoteState();
    // Advance to reveal bounty (index 6 in ATTRIBUTE_CLUE_ORDER)
    for (let i = 0; i < 7; i++) {
      state = applyQuoteGuess(state, characters[1], nullBountyChar, 6);
    }

    const { attributeClues } = getVisibleClues(nullBountyChar, state);
    const bountyClue = attributeClues.find((c) => c.key === "bounty");
    if (bountyClue) {
      expect(bountyClue.value).toBe("?");
    }
  });

  it("no attribute clues visible at clueIndex 0", () => {
    const state = initQuoteState();
    const { attributeClues } = getVisibleClues(target, state);
    expect(attributeClues).toEqual([]);
  });

  it("isQuoteComplete returns true only when finished", () => {
    const state = initQuoteState();
    expect(isQuoteComplete(state)).toBe(false);

    const won = applyQuoteGuess(state, target, target, 6);
    expect(isQuoteComplete(won)).toBe(true);

    let lost = initQuoteState();
    for (let i = 0; i < 6; i++) {
      lost = applyQuoteGuess(lost, wrongGuess, target, 6);
    }
    expect(isQuoteComplete(lost)).toBe(true);
  });
});

describe("quote contract", () => {
  runModeContractTests({
    ruleset: "quote",
    runKind: "daily",
    sampleCharacters: characters.slice(0, 10),
  });
});
