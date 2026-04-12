/**
 * Demo: proves the mode contract harness works for the classic ruleset.
 *
 * T7-T10 will follow the same pattern for their respective rulesets.
 */

import { describe } from "vitest";
import type { Character } from "../types";
import { runModeContractTests } from "./modeContract";

function makeCharacter(
  id: string,
  overrides: Partial<Character> = {}
): Character {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    aliases: [],
    imageUrl: `/characters/${id}.png`,
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: [],
    bounty: null,
    heightCm: null,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
    ...overrides,
  };
}

const sampleCharacters: Character[] = [
  makeCharacter("luffy", {
    name: "Monkey D. Luffy",
    firstArc: "Romance Dawn",
  }),
  makeCharacter("zoro", {
    name: "Roronoa Zoro",
    firstArc: "Romance Dawn",
  }),
  makeCharacter("nami", {
    name: "Nami",
    firstArc: "Orange Town",
  }),
  makeCharacter("usopp", {
    name: "Usopp",
    firstArc: "Syrup Village",
  }),
  makeCharacter("sanji", {
    name: "Sanji",
    firstArc: "Baratie",
  }),
];

describe("classic ruleset contract", () => {
  runModeContractTests({
    ruleset: "classic",
    runKind: "daily",
    sampleCharacters,
  });
});
