import type { Character, Tier } from "./types";

export function getCharactersForTier(
  characters: Character[],
  tier: Tier
): Character[] {
  if (tier === "nakama") {
    return characters;
  }

  if (tier === "fan") {
    return characters.filter(
      (c) => c.minTier === "casual" || c.minTier === "fan"
    );
  }

  return characters.filter((c) => c.minTier === "casual");
}
