/**
 * User settings persistence — separate from main game storage.
 * Uses its own localStorage key `onepiecedle_settings`.
 */

export interface UserSettings {
  silhouetteReveal: boolean;
  progressiveHints: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  silhouetteReveal: false,
  progressiveHints: false,
};

const SETTINGS_KEY = "onepiecedle_settings";

/**
 * Load user settings from localStorage.
 * Returns defaults when unavailable.
 */
export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save user settings to localStorage.
 */
export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable or full
  }
}

/**
 * Update a single setting and persist the result.
 * Returns the full updated settings object.
 */
export function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): UserSettings {
  const current = loadSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
}
