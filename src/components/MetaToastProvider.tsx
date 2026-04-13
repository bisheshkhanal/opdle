"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getMetaInbox, saveMetaInbox } from "@/lib/storage";
import { MetaInboxEntry } from "@/lib/types";

const ICONS: Record<MetaInboxEntry["type"], string> = {
  achievement: "🏆",
  saga: "🗺️",
  monthly: "📅",
  "log-pose": "🧭",
};

export function MetaToastProvider() {
  const [inbox, setInbox] = useState<MetaInboxEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setInbox(getMetaInbox());
  }, []);

  const pendingToasts = inbox
    .filter((entry) => !entry.dismissedAt)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const activeToast = pendingToasts[0];

  const dismissToast = useCallback(
    (id: string) => {
      if (isExiting) return;
      setIsExiting(true);

      setTimeout(() => {
        setInbox((prev) => {
          const now = new Date().toISOString();
          const updated = prev.map((entry) =>
            entry.id === id ? { ...entry, dismissedAt: now } : entry
          );
          saveMetaInbox(updated);
          return updated;
        });
        setIsExiting(false);
      }, 300);
    },
    [isExiting]
  );

  useEffect(() => {
    if (!activeToast || isExiting) return;

    const timer = setTimeout(() => {
      dismissToast(activeToast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [activeToast, isExiting, dismissToast]);

  if (!isClient || !activeToast) return null;

  return (
    <div
      role="alert"
      className={`fixed bottom-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 transition-all duration-300 ${
        isExiting
          ? "translate-y-4 opacity-0"
          : "animate-in slide-in-from-bottom-5 fade-in"
      }`}
    >
      <div
        className="flex cursor-pointer items-start gap-4 rounded-lg border-2 border-gold-600 bg-navy-800 p-4 shadow-lg transition-colors hover:bg-navy-700"
        onClick={() => dismissToast(activeToast.id)}
      >
        <div className="flex-shrink-0 text-3xl" aria-hidden="true">
          {ICONS[activeToast.type]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold leading-tight text-gold-400">
            {activeToast.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-parchment-100">
            {activeToast.body}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismissToast(activeToast.id);
          }}
          className="p-1 text-gold-600 hover:text-gold-400"
          aria-label="Dismiss toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
