import charactersData from "../../../data/characters.v2.json";
import { describe, expect, it } from "vitest";

import { validateCharacter, type Character } from "../../types";
import {
  getCharactersForSaga,
  getConquerorHakiUserIds,
  getConquerorHakiUsers,
  getDevilFruitUserIds,
  getDevilFruitUsers,
  getHakiUserIds,
  getHakiUsers,
  getMarineCharacters,
  getMarineIds,
  getUniqueCharacterCount,
  getYonkoTargetIds,
  getYonkoTargets,
} from "../../progression/characterSets";

function toCharacters(): Character[] {
  const result: Character[] = [];

  for (const candidate of charactersData as unknown[]) {
    if (!validateCharacter(candidate)) {
      throw new Error("Dataset contains invalid character shape");
    }
    result.push(candidate);
  }

  return result;
}

const characters = toCharacters();

describe("progression character sets", () => {
  it("selects haki users and conqueror haki users", () => {
    const hakiUsers = getHakiUsers(characters);
    expect(hakiUsers.every((character) => character.haki.length > 0)).toBe(
      true
    );

    const conquerorUsers = getConquerorHakiUsers(characters);
    expect(
      conquerorUsers.every((character) => character.haki.includes("C"))
    ).toBe(true);
  });

  it("selects devil fruit users and marine characters", () => {
    const devilFruitUsers = getDevilFruitUsers(characters);
    expect(
      devilFruitUsers.every((character) =>
        character.devilFruitType.some(
          (type: Character["devilFruitType"][number]) => type !== "None"
        )
      )
    ).toBe(true);

    const marineCharacters = getMarineCharacters(characters);
    expect(
      marineCharacters.every((character) =>
        ["Marines", "CP0", "SWORD"].some((faction) =>
          character.affiliationPrimary.includes(faction)
        )
      )
    ).toBe(true);
  });

  it("selects yonko targets and saga characters", () => {
    const yonkoTargets = getYonkoTargets(characters);
    expect(
      yonkoTargets.every((character) =>
        [
          "Straw Hat Pirates",
          "Red Hair Pirates",
          "Blackbeard Pirates",
          "Beasts Pirates",
          "Big Mom Pirates",
        ].includes(character.affiliationPrimary)
      )
    ).toBe(true);

    const eastBlueCharacters = getCharactersForSaga(characters, "east-blue");
    expect(
      eastBlueCharacters.every((character) =>
        [
          "Romance Dawn",
          "Orange Town",
          "Syrup Village",
          "Baratie",
          "Arlong Park",
          "Loguetown",
        ].includes(character.firstArc)
      )
    ).toBe(true);
  });

  it("returns matching ids for id-based helpers", () => {
    expect(getHakiUserIds(characters)).toEqual(
      getHakiUsers(characters).map((character) => character.id)
    );
    expect(getConquerorHakiUserIds(characters)).toEqual(
      getConquerorHakiUsers(characters).map((character) => character.id)
    );
    expect(getDevilFruitUserIds(characters)).toEqual(
      getDevilFruitUsers(characters).map((character) => character.id)
    );
    expect(getMarineIds(characters)).toEqual(
      getMarineCharacters(characters).map((character) => character.id)
    );
    expect(getYonkoTargetIds(characters)).toEqual(
      getYonkoTargets(characters).map((character) => character.id)
    );
  });

  it("counts solved characters without double counting duplicate ids", () => {
    const sampleIds = characters.slice(0, 5).map((character) => character.id);
    expect(
      getUniqueCharacterCount(characters, [...sampleIds, sampleIds[0]])
    ).toBe(5);
  });

  it("returns empty arrays for empty input", () => {
    expect(getHakiUsers([])).toEqual([]);
    expect(getConquerorHakiUsers([])).toEqual([]);
    expect(getDevilFruitUsers([])).toEqual([]);
    expect(getMarineCharacters([])).toEqual([]);
    expect(getYonkoTargets([])).toEqual([]);
    expect(getCharactersForSaga([], "east-blue")).toEqual([]);
    expect(getHakiUserIds([])).toEqual([]);
    expect(getConquerorHakiUserIds([])).toEqual([]);
    expect(getDevilFruitUserIds([])).toEqual([]);
    expect(getMarineIds([])).toEqual([]);
    expect(getYonkoTargetIds([])).toEqual([]);
    expect(getUniqueCharacterCount([], ["any"])).toBe(0);
  });
});
