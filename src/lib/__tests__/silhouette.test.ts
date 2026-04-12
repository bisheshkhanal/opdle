import { describe, it, expect } from "vitest";
import {
  initSilhouetteState,
  applySilhouetteGuess,
  getSilhouetteRevealStep,
  isSilhouetteComplete,
} from "../silhouette";
import { runModeContractTests } from "./modeContract";
import sampleData from "../../data/characters.v2.json";
import { Character } from "../types";

const characters = sampleData as Character[];
const target = characters[0]; // e.g. Ace
const wrongGuess = characters[1]; // e.g. Akainu

describe("Silhouette Mode Engine", () => {
  it("initializes state correctly", () => {
    const state = initSilhouetteState();
    expect(state.guesses).toEqual([]);
    expect(state.guessedIds).toEqual([]);
    expect(state.isFinished).toBe(false);
    expect(state.isWon).toBe(false);
    expect(state.revealStep).toBe(0);
  });

  it("wrong guess advances reveal step and adds guess", () => {
    let state = initSilhouetteState();
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(state.revealStep).toBe(1);
    expect(state.guesses.length).toBe(1);
    expect(state.guessedIds).toContain(wrongGuess.id);
    expect(state.isFinished).toBe(false);
  });

  it("correct guess wins game immediately", () => {
    let state = initSilhouetteState();
    state = applySilhouetteGuess(state, target, target, 6);
    expect(state.revealStep).toBe(0);
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(true);
  });

  it("max guesses loses game", () => {
    let state = initSilhouetteState();
    for (let i = 0; i < 6; i++) {
      state = applySilhouetteGuess(state, wrongGuess, target, 6);
    }
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(false);
    expect(state.revealStep).toBe(5); // step reaches 5
  });

  it("ignores guesses after finished", () => {
    let state = initSilhouetteState();
    state = applySilhouetteGuess(state, target, target, 6);
    expect(state.isFinished).toBe(true);

    const afterState = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(afterState).toBe(state);
    expect(afterState.guesses.length).toBe(1);
  });

  it("covers steps 0 to 5 on sequential wrong guesses", () => {
    let state = initSilhouetteState();
    expect(getSilhouetteRevealStep(state)).toBe(0);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(1);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(2);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(3);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(4);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(5);
    state = applySilhouetteGuess(state, wrongGuess, target, 6);
    expect(getSilhouetteRevealStep(state)).toBe(5); // caps at 5 when finished
    expect(isSilhouetteComplete(state)).toBe(true);
  });

  it("getSilhouetteRevealStep returns 0 if undefined", () => {
    const state = initSilhouetteState();
    // @ts-expect-error forcing undefined
    state.revealStep = undefined;
    expect(getSilhouetteRevealStep(state)).toBe(0);
  });

  it("state can be serialized and deserialized safely", () => {
    const state = initSilhouetteState();
    const updated = applySilhouetteGuess(state, wrongGuess, target, 6);
    const json = JSON.stringify(updated);
    const restored = JSON.parse(json);
    expect(restored.revealStep).toBe(1);
    expect(restored.isFinished).toBe(false);
    expect(restored.guessedIds).toContain(wrongGuess.id);
  });
});

describe("silhouette contract", () => {
  runModeContractTests({
    ruleset: "silhouette",
    runKind: "daily",
    sampleCharacters: characters.slice(0, 10),
  });
});
