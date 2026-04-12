"use client";

import { Modal } from "@/components/Modal";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Play">
      <div className="flex flex-col gap-5 sm:gap-6">
        <p className="text-base font-medium leading-snug sm:text-lg">
          Guess the{" "}
          <span className="font-bold text-navy-900 dark:text-slate-100">
            One Piece character
          </span>{" "}
          in 6 tries!
        </p>

        <div className="flex flex-col gap-3">
          <h3 className="font-pirate text-lg font-semibold tracking-wide text-navy-800 dark:text-gold-400">
            Tile Colors
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm sm:text-base">
            <li className="flex items-center gap-3">
              <div className="tile-correct flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm">
                ✓
              </div>
              <span>
                <strong>Correct match</strong> (Exact hit)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="tile-partial flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm">
                ≈
              </div>
              <span>
                <strong>Partial match</strong> (Overlaps slightly)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="tile-wrong flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm">
                ✕
              </div>
              <span>
                <strong>No match</strong> (Completely wrong)
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-pirate text-lg font-semibold tracking-wide text-navy-800 dark:text-gold-400">
            Arrows
          </h3>
          <p className="text-sm leading-relaxed sm:text-base">
            Arrows show if the target value is <strong>Higher</strong> (↑) or{" "}
            <strong>Lower</strong> (↓).
            <br />
            <span className="mt-1 block text-navy-600 dark:text-slate-400">
              Used for: Bounty, Height, Age, First Arc.
            </span>
          </p>
        </div>

        <div className="mt-2 rounded-lg border border-gold-500/30 bg-gold-500/10 p-4 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-medium text-navy-800 dark:text-amber-200 sm:text-base">
            Tip: Use the clues to narrow down your guess!
          </p>
        </div>
      </div>
    </Modal>
  );
}
