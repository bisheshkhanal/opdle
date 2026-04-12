import { isValidArc } from "./arcs";

// Tile status for visual encoding
export type TileStatus =
  | "correct"
  | "partial"
  | "wrong"
  | "higher"
  | "lower"
  | "unknown";

export interface CategoryResult {
  key: string;
  label: string;
  status: TileStatus;
  value: string | number | string[] | null;
  displayValue: string;
}

export interface GuessResult {
  characterId: string;
  characterName: string;
  imageUrl: string;
  categories: CategoryResult[];
  isCorrect: boolean;
}

// Haki types are stored as initials (O=Observation, A=Armament, C=Conqueror)
export type HakiType = "O" | "A" | "C";

// Devil Fruit types
export type DevilFruitType = "Paramecia" | "Zoan" | "Logia" | "None";

// Character status
export type CharacterStatus = "Alive" | "Deceased" | "Unknown";

// Gender
export type Gender = "Male" | "Female" | "Unknown" | "Other";

export type Tier = "casual" | "fan" | "nakama";

/**
 * Character schema for Classic mode
 * Required fields are enforced at runtime validation
 */
export interface Character {
  id: string;
  name: string;
  aliases: string[];
  imageUrl: string;
  gender: Gender;
  affiliationPrimary: string;
  devilFruitType: DevilFruitType[];
  haki: HakiType[];
  bounty: number | null;
  heightCm: number | null;
  origin: string;
  firstArc: string;
  minTier: Tier;
  // Spoiler-free fields for future UI features
  bountyHistory?: Array<{ amount: number; arc: string }>;
  devilFruitRevealedInArc?: string | null;
  hakiRevealedInArc?: Partial<Record<HakiType, string>>;
}

export type GameMode = "daily" | "infinite";

// Run kind: HOW a round is initiated (time-based, free-play, or shared link)
export type RunKind = "daily" | "infinite" | "challenge";

// Ruleset: WHAT gameplay rules are used (category comparison, reveal mechanics, etc.)
export type Ruleset =
  | "classic"
  | "silhouette"
  | "wanted"
  | "quote"
  | "arc"
  | "four-seas";

export interface GameState {
  mode: GameMode;
  guesses: GuessResult[];
  targetCharacterId: string;
  isFinished: boolean;
  isWon: boolean;
}

export interface DailyState {
  date: string;
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  hintUsed?: boolean;
  streak: number;
  maxStreak: number;
}

export interface InfiniteState {
  roundId: string;
  seed: number;
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  hintUsed?: boolean;
  totalWins: number;
  totalGames: number;
}

export interface DailyStats {
  streak: number;
  maxStreak: number;
  winDistribution: Record<number, number>;
}

export interface InfiniteStats {
  totalWins: number;
  totalGames: number;
  streak: number;
  maxStreak: number;
  winDistribution: Record<number, number>;
}

/**
 * Lean state for non-classic daily rulesets.
 * Keyed by "tier:ruleset:YYYY-MM-DD" in StorageSchema.rulesetDaily.
 * No streak/win counts — those are tracked at the classic tier level.
 */
export interface RulesetDailyState {
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  clueIndex?: number;
  revealStep?: number;
}

/**
 * Lean state for non-classic infinite rulesets.
 * Keyed by "tier:ruleset" in StorageSchema.rulesetInfinite.
 * No streak/win counts — those are tracked at the classic tier level.
 */
export interface RulesetInfiniteState {
  guesses: GuessResult[];
  guessedIds: string[];
  isFinished: boolean;
  isWon: boolean;
  clueIndex?: number;
  revealStep?: number;
}

export interface StorageSchema {
  version: number;
  tier: Tier;
  hasSelectedTier: boolean;
  daily: Record<string, DailyState>;
  infinite: Record<Tier, InfiniteState>;
  dailyStats: Record<Tier, DailyStats>;
  infiniteStats: Record<Tier, InfiniteStats>;
  /** Optional: per-ruleset daily state, keyed "tier:ruleset:YYYY-MM-DD" */
  rulesetDaily?: Record<string, RulesetDailyState>;
  /** Optional: per-ruleset infinite state, keyed "tier:ruleset" */
  rulesetInfinite?: Record<string, RulesetInfiniteState>;
}

const VALID_GENDERS: Gender[] = ["Male", "Female", "Unknown", "Other"];
const VALID_DEVIL_FRUITS: DevilFruitType[] = [
  "Paramecia",
  "Zoan",
  "Logia",
  "None",
];
const VALID_HAKI: HakiType[] = ["O", "A", "C"];
const VALID_TIERS: Tier[] = ["casual", "fan", "nakama"];

/**
 * Runtime validation for Character
 */
export function validateCharacter(obj: unknown): obj is Character {
  if (typeof obj !== "object" || obj === null) return false;
  const c = obj as Record<string, unknown>;

  // Required strings
  if (typeof c.id !== "string" || c.id.length === 0) return false;
  if (typeof c.name !== "string" || c.name.length === 0) return false;
  if (typeof c.imageUrl !== "string" || c.imageUrl.length === 0) return false;
  if (typeof c.affiliationPrimary !== "string") return false;
  if (typeof c.origin !== "string") return false;
  if (typeof c.firstArc !== "string" || !isValidArc(c.firstArc)) return false;

  // Tier enum
  if (!VALID_TIERS.includes(c.minTier as Tier)) return false;

  // Gender enum
  if (!VALID_GENDERS.includes(c.gender as Gender)) return false;

  // Devil fruit type array
  if (!Array.isArray(c.devilFruitType)) return false;
  for (const df of c.devilFruitType) {
    if (!VALID_DEVIL_FRUITS.includes(df as DevilFruitType)) return false;
  }

  // Haki array
  if (!Array.isArray(c.haki)) return false;
  for (const h of c.haki) {
    if (!VALID_HAKI.includes(h as HakiType)) return false;
  }

  // Aliases array
  if (!Array.isArray(c.aliases)) return false;

  // Nullable numbers (must be null or finite — reject NaN, Infinity, -Infinity)
  if (
    c.bounty !== null &&
    (typeof c.bounty !== "number" || !Number.isFinite(c.bounty))
  )
    return false;
  if (
    c.heightCm !== null &&
    (typeof c.heightCm !== "number" || !Number.isFinite(c.heightCm))
  )
    return false;

  return true;
}
