import { isValidArc } from "./arcs";

// Tile status for visual encoding
export type TileStatus = "correct" | "partial" | "wrong" | "higher" | "lower" | "unknown";

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
  devilFruitType: DevilFruitType;
  haki: HakiType[];
  bounty: number | null;
  heightCm: number | null;
  origin: string;
  firstArc: string;
}

export type GameMode = "daily" | "infinite";

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
  totalWins: number;
  totalGames: number;
}

export interface StorageSchema {
  version: number;
  daily: Record<string, DailyState>;
  infinite: InfiniteState;
  stats: {
    dailyStreak: number;
    dailyMaxStreak: number;
    infiniteTotalWins: number;
    infiniteTotalGames: number;
  };
}

const VALID_GENDERS: Gender[] = ["Male", "Female", "Unknown", "Other"];
const VALID_DEVIL_FRUITS: DevilFruitType[] = ["Paramecia", "Zoan", "Logia", "None"];
const VALID_HAKI: HakiType[] = ["O", "A", "C"];

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

  // Gender enum
  if (!VALID_GENDERS.includes(c.gender as Gender)) return false;

  // Devil fruit type enum
  if (!VALID_DEVIL_FRUITS.includes(c.devilFruitType as DevilFruitType)) return false;

  // Haki array
  if (!Array.isArray(c.haki)) return false;
  for (const h of c.haki) {
    if (!VALID_HAKI.includes(h as HakiType)) return false;
  }

  // Aliases array
  if (!Array.isArray(c.aliases)) return false;

  // Nullable numbers
  if (c.bounty !== null && typeof c.bounty !== "number") return false;
  if (c.heightCm !== null && typeof c.heightCm !== "number") return false;

  return true;
}
