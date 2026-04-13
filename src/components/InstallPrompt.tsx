"use client";

import React, { useState, useEffect } from "react";
import { updateSetting, type UserSettings } from "@/lib/settings";

interface InstallPromptProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  installPromptEvent: Event | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt({
  settings,
  onSettingsChange,
  installPromptEvent,
}: InstallPromptProps) {
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  const { completedDailiesCount, dismissed } = settings.installPrompt;
  const isEligible = completedDailiesCount >= 3 && !dismissed;
  const canInstall = installPromptEvent !== null || isIos;

  if (!isEligible || !canInstall) {
    return null;
  }

  const handleDismiss = () => {
    const newSettings = updateSetting("installPrompt", {
      ...settings.installPrompt,
      dismissed: true,
      dismissedAt: new Date().toISOString(),
    });
    onSettingsChange(newSettings);
  };

  const handleInstall = async () => {
    if (installPromptEvent && "prompt" in installPromptEvent) {
      const event = installPromptEvent as BeforeInstallPromptEvent;
      if (typeof event.prompt === "function") {
        await event.prompt();
        const choiceResult = await event.userChoice;
        if (choiceResult.outcome === "accepted") {
          handleDismiss();
        }
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up rounded-xl border border-navy-300 bg-parchment-100 p-4 shadow-float dark:border-navy-600 dark:bg-navy-800 md:bottom-8 md:left-auto md:right-8 md:w-96"
    >
      <div className="flex flex-col gap-3">
        <h3
          id="install-prompt-title"
          className="font-display text-xl font-bold text-navy-900 dark:text-gold-300"
        >
          Add to Home Screen
        </h3>

        <p className="text-sm text-navy-700 dark:text-slate-300">
          {isIos
            ? "Tap the Share button below and select 'Add to Home Screen' for a better full-screen experience."
            : "Install OnePiecedle on your device for a fast, full-screen experience!"}
        </p>

        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-300 dark:hover:bg-navy-700"
          >
            Later
          </button>

          {!isIos && (
            <button
              onClick={handleInstall}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-900 shadow-soft transition-colors hover:bg-gold-400 dark:bg-gold-600 dark:text-white dark:hover:bg-gold-500"
            >
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
