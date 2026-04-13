/**
 * Unified target selector for all run kinds and rulesets.
 *
 * Pure functions — no Date.now(), no Math.random(), no side effects.
 * Deterministic: same inputs always produce same outputs.
 *
 * Existing daily/infinite selection logic is preserved by delegating
 * to the original functions in daily.ts and infinite.ts.
 */

import type { Character, Ruleset, RunKind, Tier } from "./types";
import { seededRandom } from "./daily";
import { getUTCDateString } from "./daily";
import { selectInfiniteCharacter } from "./infinite";
import { getCharactersForTier } from "./tier";

// ---------------------------------------------------------------------------
// Context & Result types
// ---------------------------------------------------------------------------

export interface SelectionContext {
  runKind: RunKind;
  ruleset: Ruleset;
  tier: Tier;
  /** For daily: date string (YYYY-MM-DD). Defaults to today if omitted. */
  dateString?: string;
  /** For infinite: round ID string. */
  roundId?: string;
  /** For infinite: optional seed variation used to force a new round target. */
  infiniteSeedModifier?: number;
  /** For challenge: encoded seed string. */
  challengeSeed?: string;
}

export interface SingleTarget {
  kind: "single";
  character: Character;
  /** Opaque seed that was used for selection. */
  seed: string;
}

export interface MultiTarget {
  kind: "multi";
  /** Exactly 4 characters for four-seas mode. */
  characters: Character[];
  seed: string;
}

export type SelectionResult = SingleTarget | MultiTarget;

// ---------------------------------------------------------------------------
// Main unified selector
// ---------------------------------------------------------------------------

/**
 * Select target character(s) for any run kind / ruleset combination.
 *
 * Rules:
 * - daily + classic/wanted/quote → each ruleset gets its own deterministic character
 *   via a ruleset-aware seed (${tier}:${ruleset}:${date})
 * - daily + four-seas → selects 4 linked targets via selectFourSeasTargets
 * - infinite + any ruleset → each ruleset gets its own character via ruleset-prefixed roundId
 * - challenge → uses challengeSeed as the deterministic seed
 */
export function selectTarget(
  allCharacters: Character[],
  context: SelectionContext
): SelectionResult {
  const tiered = getCharactersForTier(allCharacters, context.tier);

  if (tiered.length === 0) {
    throw new Error("No tier-eligible characters available for selection");
  }

  const { runKind, ruleset } = context;

  if (ruleset === "four-seas") {
    const seed = resolveSeed(context);
    const characters = selectFourSeasTargets(allCharacters, context.tier, seed);
    return { kind: "multi", characters, seed };
  }

  // Each non-four-seas ruleset selects its own character via a ruleset-aware seed.
  if (runKind === "daily") {
    const seed = buildDailySeed(context);
    const character = selectBySeed(tiered, seed);
    return { kind: "single", character, seed };
  }

  if (runKind === "infinite") {
    const baseRoundId = context.roundId ?? "default";
    const roundId =
      context.infiniteSeedModifier !== undefined
        ? `${context.ruleset}:${baseRoundId}:${context.infiniteSeedModifier}`
        : `${context.ruleset}:${baseRoundId}`;
    const character = selectInfiniteCharacter(tiered, roundId);
    return { kind: "single", character, seed: roundId };
  }

  if (runKind === "challenge") {
    const seed = context.challengeSeed ?? "default-challenge";
    const character = selectBySeed(tiered, seed);
    return { kind: "single", character, seed };
  }

  // Exhaustive check — TypeScript will error if a new RunKind is added
  // without handling it above.
  const _exhaustive: never = runKind;
  throw new Error(`Unhandled runKind: ${_exhaustive}`);
}

// ---------------------------------------------------------------------------
// Four Seas — 4 linked targets
// ---------------------------------------------------------------------------

/**
 * Grouping strategy for four-seas mode:
 *
 * 1. Same affiliationPrimary AND tier-eligible  (need >= 4 candidates)
 * 2. Same firstArc AND tier-eligible             (need >= 4 candidates)
 * 3. Fallback: 4 random tier-eligible characters from the seeded pool
 *
 * The strategy is chosen deterministically from the seed itself.
 */
export function selectFourSeasTargets(
  allCharacters: Character[],
  tier: Tier,
  seed: string
): Character[] {
  const tiered = getCharactersForTier(allCharacters, tier);
  const numericSeed = stringToSeed(seed);
  const rng = seededRandom(numericSeed);

  // Step 1: determine grouping strategy via seed
  const strategyRoll = rng();

  // Build candidate groups
  const byAffiliation = groupBy(tiered, (c) => c.affiliationPrimary);
  const byArc = groupBy(tiered, (c) => c.firstArc);

  // Collect viable groups (>= 4 members)
  const affiliationGroups = Object.values(byAffiliation).filter(
    (g) => g.length >= 4
  );
  const arcGroups = Object.values(byArc).filter((g) => g.length >= 4);

  let pool: Character[];

  if (strategyRoll < 0.5 && affiliationGroups.length > 0) {
    // Strategy 1: same affiliationPrimary
    const groupIndex = Math.floor(rng() * affiliationGroups.length);
    pool = affiliationGroups[groupIndex];
  } else if (arcGroups.length > 0) {
    // Strategy 2: same firstArc
    const groupIndex = Math.floor(rng() * arcGroups.length);
    pool = arcGroups[groupIndex];
  } else {
    // Strategy 3: fallback — use all tiered characters
    pool = tiered;
  }

  // Select exactly 4 distinct characters from the pool using seeded shuffle
  const shuffled = seededShuffle([...pool], rng);
  return shuffled.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveSeed(context: SelectionContext): string {
  if (context.runKind === "daily") {
    return buildDailySeed(context);
  }
  if (context.runKind === "infinite") {
    const baseRoundId = context.roundId ?? "default";
    return context.infiniteSeedModifier !== undefined
      ? `${baseRoundId}:${context.infiniteSeedModifier}`
      : baseRoundId;
  }
  if (context.runKind === "challenge") {
    return context.challengeSeed ?? "default-challenge";
  }
  return "unknown";
}

function buildDailySeed(context: SelectionContext): string {
  const date = context.dateString ?? getUTCDateString();
  return `${context.tier}:${context.ruleset}:${date}`;
}

function selectBySeed(characters: Character[], seed: string): Character {
  if (characters.length === 0) {
    throw new Error("No characters available for selection");
  }
  const numericSeed = stringToSeed(seed);
  const rng = seededRandom(numericSeed);
  const index = Math.floor(rng() * characters.length);
  return characters[index];
}

/**
 * Same hash algorithm as dateToSeed / roundIdToSeed.
 * Internal — consumers should use the public API.
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(array: T[], rng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}
