"use client";

import { useMemo } from "react";
import type { Character, Tier } from "@/lib/types";
import { getLogPose, loadStorage } from "@/lib/storage";
import { selectDailyCharacter, getUTCDateString } from "@/lib/daily";
import { getCharactersForTier } from "@/lib/tier";
import { getLocalCharacterImageUrl } from "@/lib/images";
import { Modal } from "@/components/Modal";
import { getSagaDef } from "@/lib/progression/sagaCatalog";
import { getSagaIdForArc } from "@/lib/progression/sagaMapping";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  tier: Tier;
}

interface ArchiveEntry {
  date: string;
  formattedDate: string;
  character: Character;
  isWon: boolean;
  isFinished: boolean;
  guessCount: number;
  tags: string[];
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatProtectedDay(protectedDay: string): string {
  return protectedDay.endsWith("+1") ? protectedDay.slice(0, -2) : protectedDay;
}

export function ArchiveModal({
  isOpen,
  onClose,
  characters,
  tier,
}: ArchiveModalProps) {
  const entries = useMemo<ArchiveEntry[]>(() => {
    const storage = loadStorage();
    const today = getUTCDateString();
    const tierPrefix = `${tier}:`;
    const logPose = getLogPose(tier);

    const tierCharacters = getCharactersForTier(characters, tier);

    const results: ArchiveEntry[] = [];

    for (const [key, dailyState] of Object.entries(storage.daily)) {
      if (!key.startsWith(tierPrefix)) continue;

      const date = key.slice(tierPrefix.length);
      if (date === today) continue;
      if (!dailyState.isFinished) continue;

      try {
        const target = selectDailyCharacter(tierCharacters, date, tier);
        const sagaId = getSagaIdForArc(target.firstArc);
        const sagaLabel = sagaId
          ? getSagaDef(sagaId).label.replace(/\s+Saga$/, "")
          : null;
        const wasProtected = logPose.consumptions.some(
          (consumption) => formatProtectedDay(consumption.protectedDay) === date
        );

        results.push({
          date,
          formattedDate: formatDate(date),
          character: target,
          isWon: dailyState.isWon,
          isFinished: dailyState.isFinished,
          guessCount: dailyState.guesses.length,
          tags: [
            ...(sagaLabel ? [`🗺️ ${sagaLabel}`] : []),
            ...(wasProtected ? ["🧭 Protected"] : []),
          ],
        });
      } catch {
        continue;
      }
    }

    results.sort((a, b) => b.date.localeCompare(a.date));
    return results;
  }, [characters, tier]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archive" maxWidth="3xl">
      {entries.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-navy-500 dark:text-slate-400">
            No past puzzles yet. Play your first daily game!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.date}
              className="flex items-center gap-3 rounded-lg border border-parchment-300/50 bg-parchment-50/50 p-3 transition-colors hover:bg-parchment-100/70 dark:border-slate-600/40 dark:bg-slate-800/40 dark:hover:bg-slate-700/50"
            >
              <img
                src={getLocalCharacterImageUrl(entry.character.id)}
                alt={entry.character.name}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 rounded-md object-contain object-top"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-800 dark:text-slate-100">
                  {entry.character.name}
                </p>
                <p className="text-xs text-navy-500 dark:text-slate-400">
                  {entry.formattedDate}
                </p>
                {entry.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tag.startsWith("🗺️") ? "bg-gold-400/15 text-gold-700 dark:bg-gold-500/15 dark:text-gold-200" : "bg-navy-100/80 text-navy-700 dark:bg-slate-700/80 dark:text-slate-200"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                <span
                  className={`text-sm font-bold ${entry.isWon ? "text-tile-correct dark:text-green-400" : "text-tile-wrong dark:text-red-400"}`}
                >
                  {entry.isWon ? "✅ Won" : "❌ Lost"}
                </span>
                <span className="text-xs text-navy-500 dark:text-slate-400">
                  {entry.guessCount}/{6}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
