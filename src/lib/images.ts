import type { Character, GuessResult } from "./types";

const LOCAL_IMAGE_PREFIX = "/characters/";
const LOCAL_IMAGE_SUFFIX = ".png";

export function getLocalCharacterImageUrl(characterId: string): string {
  return `${LOCAL_IMAGE_PREFIX}${characterId}${LOCAL_IMAGE_SUFFIX}`;
}

export function normalizeCharacterImageUrl(
  imageUrl: string,
  characterId: string
): string {
  if (imageUrl.startsWith(LOCAL_IMAGE_PREFIX)) {
    return imageUrl;
  }

  return getLocalCharacterImageUrl(characterId);
}

export function normalizeCharacterImage(character: Character): Character {
  const imageUrl = normalizeCharacterImageUrl(character.imageUrl, character.id);
  if (imageUrl === character.imageUrl) {
    return character;
  }

  return { ...character, imageUrl };
}

export function normalizeGuessImage(guess: GuessResult): GuessResult {
  const imageUrl = normalizeCharacterImageUrl(guess.imageUrl, guess.characterId);
  if (imageUrl === guess.imageUrl) {
    return guess;
  }

  return { ...guess, imageUrl };
}
