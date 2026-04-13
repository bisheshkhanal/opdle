import type { Character } from "@/lib/types";

import type { SagaId } from "./types";
import { getSagaIdForArc } from "./sagaMapping";

const YONKO_CREWS = new Set([
  "Straw Hat Pirates",
  "Red Hair Pirates",
  "Blackbeard Pirates",
  "Beasts Pirates",
  "Big Mom Pirates",
]);

function uniqueCharacters(characters: Character[]): Character[] {
  const seen = new Set<string>();
  const result: Character[] = [];

  for (const character of characters) {
    if (seen.has(character.id)) {
      continue;
    }

    seen.add(character.id);
    result.push(character);
  }

  return result;
}

function idsFromCharacters(characters: Character[]): string[] {
  return uniqueCharacters(characters).map((character) => character.id);
}

export function getHakiUsers(characters: Character[]): Character[] {
  return characters.filter((character) => character.haki.length > 0);
}

export function getConquerorHakiUsers(characters: Character[]): Character[] {
  return characters.filter((character) => character.haki.includes("C"));
}

export function getDevilFruitUsers(characters: Character[]): Character[] {
  return characters.filter((character) =>
    character.devilFruitType.some((type) => type !== "None")
  );
}

export function getMarineCharacters(characters: Character[]): Character[] {
  return characters.filter((character) =>
    ["Marines", "CP0", "SWORD"].some((faction) =>
      character.affiliationPrimary.includes(faction)
    )
  );
}

export function getYonkoTargets(characters: Character[]): Character[] {
  return characters.filter((character) =>
    YONKO_CREWS.has(character.affiliationPrimary)
  );
}

export function getCharactersForSaga(
  characters: Character[],
  sagaId: SagaId
): Character[] {
  return characters.filter(
    (character) => getSagaIdForArc(character.firstArc) === sagaId
  );
}

export function getUniqueCharacterCount(
  characters: Character[],
  solvedIds: string[]
): number {
  const solved = new Set(solvedIds);
  return uniqueCharacters(characters).filter((character) =>
    solved.has(character.id)
  ).length;
}

export function getHakiUserIds(characters: Character[]): string[] {
  return idsFromCharacters(getHakiUsers(characters));
}

export function getConquerorHakiUserIds(characters: Character[]): string[] {
  return idsFromCharacters(getConquerorHakiUsers(characters));
}

export function getDevilFruitUserIds(characters: Character[]): string[] {
  return idsFromCharacters(getDevilFruitUsers(characters));
}

export function getMarineIds(characters: Character[]): string[] {
  return idsFromCharacters(getMarineCharacters(characters));
}

export function getYonkoTargetIds(characters: Character[]): string[] {
  return idsFromCharacters(getYonkoTargets(characters));
}
