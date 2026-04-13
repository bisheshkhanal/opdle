import { describe, expect, it } from "vitest";

import {
  createEmptyTierProgression,
  recordDailyWin,
} from "../../progression/sagas";
import {
  getFilteredCharacterPool,
  getSelectableSagas,
} from "../../progression/sagaFilter";
import { selectInfiniteCharacter } from "../../infinite";
import type { Character } from "../../types";

const characters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy"],
    imageUrl: "https://example.com/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Zoro"],
    imageUrl: "https://example.com/zoro.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: ["O", "A", "C"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Orange Town",
    minTier: "casual",
  },
  {
    id: "vivi",
    name: "Nefertari Vivi",
    aliases: ["Vivi"],
    imageUrl: "https://example.com/vivi.png",
    gender: "Female",
    affiliationPrimary: "Alabasta Kingdom",
    devilFruitType: ["None"],
    haki: [],
    bounty: 0,
    heightCm: 169,
    origin: "Grand Line",
    firstArc: "Arabasta",
    minTier: "casual",
  },
];

function createProgressionWithWins(
  winCount: number,
  arc: string
): ReturnType<typeof createEmptyTierProgression> {
  let progression = createEmptyTierProgression();

  for (let index = 0; index < winCount; index += 1) {
    progression = recordDailyWin(
      progression,
      `${arc}-${index}`,
      arc,
      new Date(`2026-04-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`)
    ).progression;
  }

  return progression;
}

describe("sagaFilter", () => {
  it("returns the full pool when sagaId is null", () => {
    const progression = createEmptyTierProgression();

    expect(getFilteredCharacterPool(characters, progression, null)).toEqual(
      characters
    );
  });

  it("returns the full pool when the selected saga is locked", () => {
    const progression = createEmptyTierProgression();

    expect(
      getFilteredCharacterPool(characters, progression, "east-blue")
    ).toEqual(characters);
  });

  it("filters to a saga once it is unlocked", () => {
    const progression = createProgressionWithWins(1, "Romance Dawn");

    expect(
      getFilteredCharacterPool(characters, progression, "east-blue").map(
        (character) => character.id
      )
    ).toEqual(["luffy", "zoro"]);
  });

  it("filters to a saga once it is completed", () => {
    const progression = createProgressionWithWins(3, "Arabasta");

    expect(
      getFilteredCharacterPool(characters, progression, "arabasta").map(
        (character) => character.id
      )
    ).toEqual(["vivi"]);
  });

  it("returns all 11 sagas with their statuses and progress text", () => {
    let progression = createEmptyTierProgression();
    progression = recordDailyWin(
      progression,
      "luffy",
      "Romance Dawn",
      new Date("2026-04-01T00:00:00.000Z")
    ).progression;

    for (const characterId of ["vivi-1", "vivi-2", "vivi-3"]) {
      progression = recordDailyWin(
        progression,
        characterId,
        "Arabasta",
        new Date("2026-04-02T00:00:00.000Z")
      ).progression;
    }

    const sagas = getSelectableSagas(progression);

    expect(sagas).toHaveLength(11);
    expect(sagas[0]).toEqual({
      sagaId: "east-blue",
      label: "East Blue Saga",
      status: "unlocked",
      progressText: "1/3 daily wins",
    });
    expect(sagas.find((saga) => saga.sagaId === "arabasta")).toEqual({
      sagaId: "arabasta",
      label: "Arabasta Saga",
      status: "completed",
      progressText: "Completed",
    });
    expect(sagas.find((saga) => saga.sagaId === "final")).toEqual({
      sagaId: "final",
      label: "Final Saga",
      status: "locked",
      progressText: "0/3 daily wins",
    });
  });

  it("handles empty character pools", () => {
    const progression = createProgressionWithWins(3, "Romance Dawn");

    expect(getFilteredCharacterPool([], progression, "east-blue")).toEqual([]);
    expect(getFilteredCharacterPool([], progression, null)).toEqual([]);
  });

  it("passes the saga filter through infinite selection", () => {
    const selected = selectInfiniteCharacter(characters, "round-1", "arabasta");

    expect(selected.id).toBe("vivi");
  });
});
