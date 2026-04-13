"use client";

import { useState } from "react";
import type { GuessResult, GameMode, Ruleset, Character } from "@/lib/types";
import { shareResults, formatShareText } from "@/lib/share";
import { buildShareCardPayload } from "@/lib/share-card";

interface ResultsShareProps {
  guesses: GuessResult[];
  mode: GameMode;
  isWon: boolean;
  dateString?: string;
  streak?: number;
  hintUsed?: boolean;
  ruleset?: Ruleset;
  target?: Character;
  challengeMode?: boolean;
  factionId?: string;
}

export function ResultsShare({
  guesses,
  mode,
  isWon,
  dateString,
  streak,
  hintUsed,
  ruleset,
  target,
  challengeMode,
  factionId,
}: ResultsShareProps) {
  const [shareStatus, setShareStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [textShareStatus, setTextShareStatus] = useState<"idle" | "success">(
    "idle"
  );

  const generateImageBlob = async () => {
    if (!target) throw new Error("Missing target");
    const template = challengeMode ? "bounty" : "dossier";
    const fallbackDate = new Date().toISOString().split("T")[0];
    const payload = buildShareCardPayload({
      guesses,
      target,
      mode,
      date: dateString || fallbackDate,
      challengeLabel: challengeMode ? "Challenge" : undefined,
      template,
    });

    const params = new URLSearchParams({
      template: payload.template || "dossier",
      title: payload.title,
      guessCount: String(payload.guessCount || 0),
      emojiGrid: payload.emojiGrid || "",
      imageUrl: payload.silhouetteUrl || "",
    });

    const res = await fetch(`/og?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to generate image");
    return res.blob();
  };

  const handleShareCard = async () => {
    setShareStatus("loading");
    try {
      if (!target || guesses.length === 0) {
        // Fallback to text share if no target or no guesses
        await handleShareText();
        setShareStatus("idle");
        return;
      }

      const blob = await generateImageBlob();
      const file = new File([blob], "onepiecedle-result.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Onepiecedle Result",
            text: formatShareText(
              guesses,
              mode,
              isWon,
              dateString,
              streak,
              hintUsed,
              ruleset
            ),
            files: [file],
          });
          setShareStatus("success");
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "AbortError") {
            setShareStatus("idle");
          } else {
            throw e;
          }
        }
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ [file.type]: file }),
        ]);
        setShareStatus("success");
      }
    } catch (err) {
      console.error("Failed to share image:", err);
      setShareStatus("error");
    }

    setTimeout(() => {
      setShareStatus((prev) => (prev === "loading" ? "idle" : prev));
      setTimeout(() => setShareStatus("idle"), 2500);
    }, 100); // Small delay to let states settle
  };

  const handleShareText = async () => {
    const result = await shareResults(
      guesses,
      mode,
      isWon,
      dateString,
      streak,
      hintUsed,
      ruleset
    );
    if (result.success) {
      setTextShareStatus("success");
      setTimeout(() => setTextShareStatus("idle"), 2500);
    }
  };

  const factionClass = factionId
    ? `ring-2 ${factionId === "pirates" ? "ring-red-500/50" : "ring-blue-500/50"}`
    : "";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3.5">
      {target && guesses.length > 0 ? (
        <div className="flex w-full gap-3">
          <button
            onClick={handleShareCard}
            disabled={shareStatus === "loading"}
            className={`btn-success flex-1 transition-transform ${shareStatus === "success" ? "scale-105" : ""} font-display ${factionClass} disabled:opacity-70`}
            aria-live="polite"
          >
            {shareStatus === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : shareStatus === "success" ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Shared!
              </span>
            ) : shareStatus === "error" ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Error! Try text
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Share Card
              </span>
            )}
          </button>

          <button
            onClick={handleShareText}
            className={`btn-secondary px-4 transition-transform ${textShareStatus === "success" ? "scale-105" : ""} ${factionClass}`}
            aria-live="polite"
            title="Copy Text Only"
          >
            {textShareStatus === "success" ? (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={handleShareText}
          className={`btn-success transition-transform ${textShareStatus === "success" ? "scale-105" : ""} font-display ${factionClass}`}
          aria-live="polite"
        >
          {textShareStatus === "success" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Copy Results
            </span>
          )}
        </button>
      )}
      <span className="text-xs font-medium text-navy-500 dark:text-slate-400">
        {mode === "daily" ? "Daily Challenge" : "Infinite Mode"}
      </span>
    </div>
  );
}
