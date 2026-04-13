"use client";

import React, { useMemo } from "react";
import { Modal } from "@/components/Modal";
import { updateSetting } from "@/lib/settings";
import type { UserSettings } from "@/lib/settings";
import { usePushReminders } from "@/lib/hooks/usePushReminders";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const SETTINGS_CONFIG: {
  key:
    | "silhouetteReveal"
    | "progressiveHints"
    | "autoUseLogPose"
    | "notificationsOptIn";
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
  {
    key: "notificationsOptIn",
    label: "Daily Reminders",
    description: "Enable daily reminder notifications so you never miss a day",
  },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsModalProps) {
  const { isAuthenticated, permission, subscriptionStatus, requestPermission } =
    usePushReminders();

  const handleInstallPromptReset = () => {
    onSettingsChange(
      updateSetting("installPrompt", {
        dismissed: false,
        dismissedAt: null,
        completedDailiesCount: settings.installPrompt.completedDailiesCount,
      })
    );
  };

  const remindersChecked = useMemo(
    () => permission === "granted" && subscriptionStatus === "subscribed",
    [permission, subscriptionStatus]
  );

  const handleReminderToggle = async () => {
    const result = await requestPermission();

    onSettingsChange(updateSetting("notificationsOptIn", Boolean(result.ok)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-6">
        {SETTINGS_CONFIG.map(({ key, label, description }) => {
          if (key !== "notificationsOptIn") {
            return (
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
                    settings[key]
                      ? "bg-gold-500"
                      : "bg-navy-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          }

          if (!isAuthenticated) {
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-navy-900 dark:text-slate-100">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-navy-500 dark:text-slate-400">
                    Sign in to enable reminders
                  </p>
                </div>
              </div>
            );
          }

          if (permission === "denied") {
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-navy-900 dark:text-slate-100">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-navy-500 dark:text-slate-400">
                    Notifications blocked — enable in browser settings
                  </p>
                </div>
              </div>
            );
          }

          if (permission === "unsupported") {
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-navy-900 dark:text-slate-100">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-navy-500 dark:text-slate-400">
                    Notifications aren’t supported in this browser
                  </p>
                </div>
              </div>
            );
          }

          return (
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
                aria-checked={remindersChecked}
                aria-label={label}
                onClick={handleReminderToggle}
                disabled={subscriptionStatus === "subscribed"}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  remindersChecked
                    ? "bg-gold-500"
                    : "cursor-pointer bg-navy-300 dark:bg-slate-600"
                } ${subscriptionStatus === "subscribed" ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    remindersChecked ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}

        <div className="flex items-start justify-between gap-4 border-t border-navy-200 pt-4 dark:border-navy-800">
          <div className="flex-1">
            <p className="font-semibold text-navy-900 dark:text-slate-100">
              App Installation
            </p>
            <p className="mt-0.5 text-sm text-navy-500 dark:text-slate-400">
              Show the install prompt again if you previously dismissed it
            </p>
          </div>
          <button
            onClick={handleInstallPromptReset}
            disabled={!settings.installPrompt.dismissed}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              settings.installPrompt.dismissed
                ? "bg-navy-100 text-navy-900 hover:bg-navy-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-navy-900 dark:text-navy-700"
            }`}
          >
            {settings.installPrompt.dismissed ? "Reset" : "Active"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
