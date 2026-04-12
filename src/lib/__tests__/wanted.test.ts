import { describe, it, expect } from "vitest";
import {
  initWantedState,
  applyWantedGuess,
  getWantedRevealStep,
  isWantedComplete,
} from "../wanted";
import { runModeContractTests } from "./modeContract";
import sampleData from "../../data/characters.v2.json";
import { Character } from "../types";

const characters = sampleData as Character[];
const target = characters[0];
const wrongGuess = characters[1];

describe("Wanted Mode Engine", () => {
  it("initializes state correctly", () => {
    const state = initWantedState();
    expect(state.guesses).toEqual([]);
    expect(state.guessedIds).toEqual([]);
    expect(state.isFinished).toBe(false);
    expect(state.isWon).toBe(false);
    expect(state.revealStep).toBe(0);
  });

  it("wrong guess advances reveal step and adds guess", () => {
    let state = initWantedState();
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(state.revealStep).toBe(1);
    expect(state.guesses.length).toBe(1);
    expect(state.guessedIds).toContain(wrongGuess.id);
    expect(state.isFinished).toBe(false);
  });

  it("correct guess wins game immediately and reveals full image", () => {
    let state = initWantedState();
    state = applyWantedGuess(state, target, target, 6);
    expect(state.revealStep).toBe(5);
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(true);
  });

  it("max guesses loses game and reveals full image", () => {
    let state = initWantedState();
    for (let i = 0; i < 6; i++) {
      state = applyWantedGuess(state, wrongGuess, target, 6);
    }
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(false);
    expect(state.revealStep).toBe(5);
  });

  it("ignores guesses after finished", () => {
    let state = initWantedState();
    state = applyWantedGuess(state, target, target, 6);
    expect(state.isFinished).toBe(true);

    const afterState = applyWantedGuess(state, wrongGuess, target, 6);
    expect(afterState).toBe(state);
    expect(afterState.guesses.length).toBe(1);
  });

  it("covers steps 0 to 5 on sequential wrong guesses", () => {
    let state = initWantedState();
    expect(getWantedRevealStep(state)).toBe(0);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(1);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(2);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(3);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(4);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(5);
    state = applyWantedGuess(state, wrongGuess, target, 6);
    expect(getWantedRevealStep(state)).toBe(5);
    expect(isWantedComplete(state)).toBe(true);
  });

  it("getWantedRevealStep returns 0 if undefined", () => {
    const state = initWantedState();
    // @ts-expect-error forcing undefined
    state.revealStep = undefined;
    expect(getWantedRevealStep(state)).toBe(0);
  });

  it("state can be serialized and deserialized safely", () => {
    const state = initWantedState();
    const updated = applyWantedGuess(state, wrongGuess, target, 6);
    const json = JSON.stringify(updated);
    const restored = JSON.parse(json);
    expect(restored.revealStep).toBe(1);
    expect(restored.isFinished).toBe(false);
    expect(restored.guessedIds).toContain(wrongGuess.id);
  });
});

describe("wanted contract", () => {
  runModeContractTests({
    ruleset: "wanted",
    runKind: "daily",
    sampleCharacters: characters.slice(0, 10),
  });
});
