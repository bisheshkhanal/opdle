"use client";

import React from "react";
import { Modal } from "@/components/Modal";
import { updateSetting } from "@/lib/settings";
import type { UserSettings } from "@/lib/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const SETTINGS_CONFIG: {
  key: keyof UserSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "silhouetteReveal",
    label: "3D Silhouette Reveal",
    description: "Show a 3D character reveal animation when the game ends",
  },
  {
    key: "progressiveHints",
    label: "Progressive Hints",
    description: "Show progressively clearer hints after 3+ wrong guesses",
  },
  {
    key: "autoUseLogPose",
    label: "Auto-use Log Pose",
    description:
      "When enabled, Log Pose charges are automatically consumed to protect your streak on the first missed day. Log Pose is non-retroactive — if no charge exists when a missed day is first evaluated, the streak breaks.",
  },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-6">
        {SETTINGS_CONFIG.map(({ key, label, description }) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-navy-900 dark:text-slate-100">
                {label}
              </p>
              <p className="mt-0.5 text-sm text-navy-500 dark:text-slate-400">
                {description}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings[key]}
              aria-label={label}
              onClick={() =>
                onSettingsChange(updateSetting(key, !settings[key]))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings[key] ? "bg-gold-500" : "bg-navy-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  settings[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
