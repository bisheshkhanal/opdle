import { describe, it, expect, beforeEach } from "vitest";
import {
  initArcState,
  applyArcGuess,
  getArcDistance,
  isArcComplete,
} from "../arc";
import { runModeContractTests } from "./modeContract";
import { saveRulesetDailyState, getRulesetDailyState } from "../storage";
import { clearStorage } from "../storage";
import sampleData from "../../data/characters.v2.json";
import { Character } from "../types";

const characters = sampleData as Character[];

function findCharByArc(arc: string): Character | undefined {
  return characters.find((c) => c.firstArc === arc);
}

describe("Arc Mode Engine", () => {
  it("initializes state correctly", () => {
    const state = initArcState();
    expect(state.arcGuesses).toEqual([]);
    expect(state.guesses).toEqual([]);
    expect(state.guessedIds).toEqual([]);
    expect(state.isFinished).toBe(false);
    expect(state.isWon).toBe(false);
  });

  it("getArcDistance returns same for matching arcs", () => {
    const result = getArcDistance("Romance Dawn", "Romance Dawn");
    expect(result.direction).toBe("same");
    expect(result.distance).toBe(0);
  });

  it("getArcDistance returns later when target arc comes after guess", () => {
    const result = getArcDistance("Romance Dawn", "Arlong Park");
    expect(result.direction).toBe("later");
    expect(result.distance).toBe(4);
  });

  it("getArcDistance returns earlier when target arc comes before guess", () => {
    const result = getArcDistance("Enies Lobby", "Orange Town");
    expect(result.direction).toBe("earlier");
    expect(result.distance).toBe(14);
  });

  it("getArcDistance returns unknown for unrecognized arcs", () => {
    const result = getArcDistance("Unknown Arc", "Romance Dawn");
    expect(result.direction).toBe("unknown");
    expect(result.distance).toBe(-1);
  });

  it("getArcDistance returns unknown when target arc is unrecognized", () => {
    const result = getArcDistance("Romance Dawn", "Fake Arc");
    expect(result.direction).toBe("unknown");
    expect(result.distance).toBe(-1);
  });

  it("correct guess wins game immediately", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const state = applyArcGuess(initArcState(), luffy, luffy, 6);
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(true);
    expect(state.arcGuesses).toHaveLength(1);
    expect(state.arcGuesses[0].direction).toBe("same");
    expect(state.arcGuesses[0].distance).toBe(0);
  });

  it("wrong guess adds feedback with arc distance and direction", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const arlong = findCharByArc("Arlong Park")!;
    const state = applyArcGuess(initArcState(), arlong, luffy, 6);
    expect(state.isFinished).toBe(false);
    expect(state.isWon).toBe(false);
    expect(state.arcGuesses).toHaveLength(1);
    expect(state.arcGuesses[0].direction).toBe("earlier");
    expect(state.arcGuesses[0].distance).toBe(4);
    expect(state.arcGuesses[0].isCorrect).toBe(false);
    expect(state.guessedIds).toContain(arlong.id);
  });

  it("max guesses loses game", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const wrong = findCharByArc("Arlong Park")!;
    let state = initArcState();
    for (let i = 0; i < 6; i++) {
      state = applyArcGuess(state, wrong, luffy, 6);
    }
    expect(state.isFinished).toBe(true);
    expect(state.isWon).toBe(false);
    expect(state.arcGuesses).toHaveLength(6);
  });

  it("ignores guesses after finished", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const wrong = findCharByArc("Arlong Park")!;
    let state = initArcState();
    state = applyArcGuess(state, luffy, luffy, 6);
    expect(state.isFinished).toBe(true);

    const afterState = applyArcGuess(state, wrong, luffy, 6);
    expect(afterState).toBe(state);
    expect(afterState.arcGuesses).toHaveLength(1);
  });

  it("isArcComplete returns correct value", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    let state = initArcState();
    expect(isArcComplete(state)).toBe(false);
    state = applyArcGuess(state, luffy, luffy, 6);
    expect(isArcComplete(state)).toBe(true);
  });

  it("state can be serialized and deserialized safely", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const wrong = findCharByArc("Arlong Park")!;
    const state = applyArcGuess(initArcState(), wrong, luffy, 6);
    const json = JSON.stringify(state);
    const restored = JSON.parse(json);
    expect(restored.arcGuesses).toHaveLength(1);
    expect(restored.arcGuesses[0].direction).toBe("earlier");
    expect(restored.isFinished).toBe(false);
    expect(restored.guessedIds).toContain(wrong.id);
  });

  it("guesses field stays in sync with arcGuesses for contract compat", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const wrong = findCharByArc("Arlong Park")!;
    const state = applyArcGuess(initArcState(), wrong, luffy, 6);
    expect(state.guesses).toHaveLength(1);
    expect(state.guesses[0].characterId).toBe(wrong.id);
    expect(state.guesses[0].isCorrect).toBe(false);
    expect(state.guesses[0].categories).toEqual([]);
  });
});

describe("arc storage integration", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("saves and restores ArcState via ruleset storage", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const state = applyArcGuess(initArcState(), luffy, luffy, 6);

    saveRulesetDailyState(state, "casual", "arc");

    const restored = getRulesetDailyState("casual", "arc");
    expect(restored.isFinished).toBe(true);
    expect(restored.isWon).toBe(true);
    expect(restored.guessedIds).toContain(luffy.id);
  });

  it("arc state is isolated from other rulesets", () => {
    const luffy = findCharByArc("Romance Dawn")!;
    const state = applyArcGuess(initArcState(), luffy, luffy, 6);

    saveRulesetDailyState(state, "casual", "arc");

    const silhouetteState = getRulesetDailyState("casual", "silhouette");
    expect(silhouetteState.isFinished).toBe(false);
    expect(silhouetteState.guessedIds).toEqual([]);
  });
});

describe("arc contract", () => {
  runModeContractTests({
    ruleset: "arc",
    runKind: "daily",
    sampleCharacters: characters.slice(0, 10),
  });
});
