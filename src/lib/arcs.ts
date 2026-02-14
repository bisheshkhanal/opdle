/**
 * Canonical ordered list of One Piece story arcs
 * Used for FirstArc "earlier/later" hint evaluation
 *
 * Order is chronological by story appearance (not publication order where different)
 */

export const ARC_ORDER: readonly string[] = [
  // East Blue Saga
  "Romance Dawn",
  "Orange Town",
  "Syrup Village",
  "Baratie",
  "Arlong Park",
  "Loguetown",

  // Arabasta Saga
  "Reverse Mountain",
  "Whisky Peak",
  "Little Garden",
  "Drum Island",
  "Arabasta",

  // Sky Island Saga
  "Jaya",
  "Skypiea",

  // Water 7 Saga
  "Long Ring Long Land",
  "Water 7",
  "Enies Lobby",
  "Post-Enies Lobby",

  // Thriller Bark Saga
  "Thriller Bark",

  // Summit War Saga
  "Sabaody Archipelago",
  "Amazon Lily",
  "Impel Down",
  "Marineford",
  "Post-War",

  // Fish-Man Island Saga
  "Return to Sabaody",
  "Fish-Man Island",

  // Dressrosa Saga
  "Punk Hazard",
  "Dressrosa",

  // Whole Cake Island Saga
  "Zou",
  "Whole Cake Island",

  // Wano Country Saga
  "Levely",
  "Wano Country",

  // Final Saga
  "Egghead",
  "Elbaph",
] as const;

/**
 * Common arc name aliases/misspellings
 */
const ARC_ALIASES: Record<string, string> = {
  "alabasta": "Arabasta",
  "alabaster": "Arabasta",
  "post war": "Post-War",
  "postwar": "Post-War",
  "post-enies lobby": "Post-Enies Lobby",
  "post enies lobby": "Post-Enies Lobby",
  "fishman island": "Fish-Man Island",
  "fish man island": "Fish-Man Island",
  "whole cake": "Whole Cake Island",
  "wci": "Whole Cake Island",
  "wano": "Wano Country",
  "return sabaody": "Return to Sabaody",
  "sabaody": "Sabaody Archipelago",
};

/**
 * Normalize arc name to canonical form
 */
function normalizeArcName(arcName: string): string {
  const trimmed = arcName.trim();
  const lower = trimmed.toLowerCase();

  // Check aliases first
  if (ARC_ALIASES[lower]) {
    return ARC_ALIASES[lower];
  }

  // Return original (case-insensitive match will happen in getArcIndex)
  return trimmed;
}

/**
 * Map arc name to its index in the canonical order
 * Returns -1 if arc is not found (treated as unknown)
 */
export function getArcIndex(arcName: string): number {
  const normalized = normalizeArcName(arcName);
  const index = ARC_ORDER.findIndex(
    (arc) => arc.toLowerCase() === normalized.toLowerCase()
  );
  return index;
}

/**
 * Compare two arcs and return their relative order
 * @returns "correct" if same arc, "higher" if guess is before target,
 *          "lower" if guess is after target, "unknown" if either arc not found
 */
export function compareArcs(
  guessArc: string | null | undefined,
  targetArc: string | null | undefined
): "correct" | "higher" | "lower" | "unknown" {
  if (!guessArc || !targetArc) {
    return "unknown";
  }

  const guessIndex = getArcIndex(guessArc);
  const targetIndex = getArcIndex(targetArc);

  // If either arc is not in our list, return unknown
  if (guessIndex === -1 || targetIndex === -1) {
    return "unknown";
  }

  if (guessIndex === targetIndex) {
    return "correct";
  }

  // If guess arc is earlier (smaller index), target is "higher" (later)
  // Arrow ↑ means "the answer is later in the story"
  if (guessIndex < targetIndex) {
    return "higher";
  }

  // If guess arc is later (larger index), target is "lower" (earlier)
  // Arrow ↓ means "the answer is earlier in the story"
  return "lower";
}

/**
 * Get all valid arc names for validation
 */
export function getValidArcs(): readonly string[] {
  return ARC_ORDER;
}

/**
 * Check if an arc name is valid
 */
export function isValidArc(arcName: string): boolean {
  return getArcIndex(arcName) !== -1;
}
