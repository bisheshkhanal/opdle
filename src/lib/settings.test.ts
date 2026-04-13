import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadSettings,
  saveSettings,
  updateSetting,
  DEFAULT_SETTINGS,
} from "./settings";
import type { UserSettings } from "./settings";

const SETTINGS_KEY = "onepiecedle_settings";

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get store() {
      return store;
    },
  };
}

describe("settings", () => {
  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    ls = mockLocalStorage();
    vi.stubGlobal("localStorage", ls);
  });

  describe("loadSettings", () => {
    it("returns defaults when localStorage is empty", () => {
      const result = loadSettings();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it("returns saved settings when present", () => {
      const saved: UserSettings = {
        progressiveHints: false,
        autoUseLogPose: false,
        notificationsOptIn: true,
        installPrompt: {
          dismissed: true,
          dismissedAt: "2023-01-01T00:00:00.000Z",
          completedDailiesCount: 5,
        },
      };
      ls.store[SETTINGS_KEY] = JSON.stringify(saved);

      const result = loadSettings();
      expect(result).toEqual(saved);
    });

    it("returns defaults when JSON parse fails", () => {
      ls.store[SETTINGS_KEY] = "{invalid json";

      const result = loadSettings();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it("merges saved partial settings with defaults", () => {
      ls.store[SETTINGS_KEY] = JSON.stringify({ progressiveHints: true });

      const result = loadSettings();
      expect(result.progressiveHints).toBe(true);
      expect(result.autoUseLogPose).toBe(true);
      expect(result.notificationsOptIn).toBe(false);
      expect(result.installPrompt).toEqual(DEFAULT_SETTINGS.installPrompt);
    });

    it("merges nested installPrompt with defaults", () => {
      ls.store[SETTINGS_KEY] = JSON.stringify({
        installPrompt: { dismissed: true },
      });

      const result = loadSettings();
      expect(result.installPrompt.dismissed).toBe(true);
      expect(result.installPrompt.dismissedAt).toBe(null);
      expect(result.installPrompt.completedDailiesCount).toBe(0);
    });
  });

  describe("saveSettings", () => {
    it("writes to localStorage with correct key", () => {
      const settings: UserSettings = {
        progressiveHints: false,
        autoUseLogPose: false,
        notificationsOptIn: true,
        installPrompt: {
          dismissed: false,
          dismissedAt: null,
          completedDailiesCount: 0,
        },
      };
      saveSettings(settings);

      expect(ls.setItem).toHaveBeenCalledWith(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );
    });
  });

  describe("updateSetting", () => {
    it("updates a single setting and returns the full settings object", () => {
      ls.store[SETTINGS_KEY] = JSON.stringify({
        progressiveHints: false,
        autoUseLogPose: true,
        notificationsOptIn: false,
      });

      const result = updateSetting("progressiveHints", true);
      expect(result.progressiveHints).toBe(true);
      expect(result.autoUseLogPose).toBe(true);
    });

    it("preserves other settings when updating one", () => {
      ls.store[SETTINGS_KEY] = JSON.stringify({
        progressiveHints: false,
        autoUseLogPose: true,
        notificationsOptIn: false,
      });

      const result = updateSetting("autoUseLogPose", false);
      expect(result.progressiveHints).toBe(false);
      expect(result.autoUseLogPose).toBe(false);
      expect(result.notificationsOptIn).toBe(false);
    });

    it("updates autoUseLogPose and persists it", () => {
      ls.store[SETTINGS_KEY] = JSON.stringify({
        progressiveHints: false,
        autoUseLogPose: true,
        notificationsOptIn: false,
      });

      const result = updateSetting("autoUseLogPose", false);
      expect(result.autoUseLogPose).toBe(false);
      expect(JSON.parse(ls.store[SETTINGS_KEY])).toEqual(result);
    });
  });

  describe("roundtrip", () => {
    it("persists settings across save and reload", () => {
      const settings: UserSettings = {
        progressiveHints: true,
        autoUseLogPose: false,
        notificationsOptIn: true,
        installPrompt: {
          dismissed: true,
          dismissedAt: "time",
          completedDailiesCount: 3,
        },
      };

      saveSettings(settings);

      const result = loadSettings();
      expect(result).toEqual(settings);
    });
  });
});
