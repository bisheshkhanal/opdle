/**
 * Challenge mode seed encoding/decoding utilities.
 * Extracted from page.tsx for testability. The canonical copy remains in page.tsx.
 */

export function encodeChallengeSeed(characterId: string): string {
  try {
    return btoa(encodeURIComponent(characterId));
  } catch {
    return "";
  }
}

export function decodeChallengeSeed(seed: string): string | null {
  try {
    return decodeURIComponent(atob(seed));
  } catch {
    return null;
  }
}
