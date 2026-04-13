import { isValidArc } from "./arcs";
import type { AchievementId, SagaId } from "./progression/types";

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

/** Clue kind discriminant for Quote/Laugh mode */
export type CharacterClueKind = "quote" | "laugh" | "epithet" | "alias";

/** A structured clue record for hint-based game modes */
export interface CharacterClue {
  kind: CharacterClueKind;
  text: string;
  spoilerTier?: Tier;
  arc?: string;
}

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
  // Structured clue metadata for Quote/Laugh mode
  clues?: CharacterClue[];
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

export interface SagaProgress {
  uniqueSolvedIds: string[];
  unlockedAt?: string;
  completedAt?: string;
  progressCount: number;
}

export interface TierProgression {
  sagas: Record<SagaId, SagaProgress>;
  completedSagaCount: number;
}

export interface LogPoseConsumption {
  protectedDay: string;
  consumedAt: string;
  source: "streak-7";
}

export interface TierLogPose {
  charges: number;
  earnedMilestones: number[];
  lastEarnedAt?: string;
  consumptions: LogPoseConsumption[];
}

export interface AchievementProgress {
  progress: number;
  target: number;
  status: "locked" | "revealed" | "unlocked";
  unlockedAt?: string;
  lastUpdatedAt: string;
  seasonKey?: string | null;
}

export interface MonthlySeason {
  collectibleId: string;
  collectibleType: "bounty-poster" | "vivre-card";
  targetFragments: number;
  revealedDays: string[];
  revealedFragmentIndexes: number[];
  completedAt?: string;
}

export interface MonthlyCollections {
  activeSeasonKey: string;
  seasons: Record<string, MonthlySeason>;
}

export interface MetaInboxEntry {
  id: string;
  type: "achievement" | "saga" | "monthly" | "log-pose";
  title: string;
  body: string;
  createdAt: string;
  dismissedAt?: string;
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
  progressionByTier?: Record<Tier, TierProgression>;
  logPoseByTier?: Record<Tier, TierLogPose>;
  achievementProgress?: Record<AchievementId, AchievementProgress>;
  monthlyCollections?: MonthlyCollections;
  metaInbox?: MetaInboxEntry[];
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
const VALID_CLUE_KINDS: CharacterClueKind[] = [
  "quote",
  "laugh",
  "epithet",
  "alias",
];

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

  // Optional clues array
  if (c.clues !== undefined) {
    if (!Array.isArray(c.clues)) return false;
    for (const clue of c.clues) {
      if (typeof clue !== "object" || clue === null) return false;
      const cl = clue as Record<string, unknown>;
      if (!VALID_CLUE_KINDS.includes(cl.kind as CharacterClueKind))
        return false;
      if (typeof cl.text !== "string" || cl.text.length === 0) return false;
      if (
        cl.spoilerTier !== undefined &&
        !VALID_TIERS.includes(cl.spoilerTier as Tier)
      )
        return false;
      if (cl.arc !== undefined && typeof cl.arc !== "string") return false;
    }
  }

  return true;
}
