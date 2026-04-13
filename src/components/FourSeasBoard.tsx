import { useMemo } from "react";
import Image from "next/image";
import type { Character } from "@/lib/types";
import type { FourSeasState, BoardId } from "@/lib/fourSeas";
import { BOARD_ORDER } from "@/lib/fourSeas";
import { Autocomplete } from "./Autocomplete";
import { GuessRow } from "./GuessRow";
import { getLocalCharacterImageUrl } from "@/lib/images";

interface FourSeasBoardProps {
  targetCharacters: Record<string, Character>;
  allCharacters: Character[];
  state: FourSeasState;
  onGuess: (boardId: BoardId, guessId: string) => void;
}

const BOARD_NAMES: Record<BoardId, string> = {
  north: "North Sea",
  east: "East Sea",
  south: "South Sea",
  west: "West Sea",
};

export function FourSeasBoard({
  targetCharacters,
  allCharacters,
  state,
  onGuess,
}: FourSeasBoardProps) {
  // If the game isn't fully initialized, just return null
  if (
    !state ||
    !state.boardOrder ||
    Object.keys(targetCharacters).length === 0
  ) {
    return null;
  }

  return (
    <div
      data-testid="four-seas-board"
      className="mx-auto my-6 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {BOARD_ORDER.map((boardId) => {
        const board = state.boards[boardId];
        if (!board) return null;

        const target = targetCharacters[board.targetCharacterId];
        const isFinished = board.isFinished;
        const isWon = board.isWon;

        return (
          <div
            key={boardId}
            role="region"
            className="flex flex-col gap-4 rounded-xl border border-parchment-300 bg-parchment-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
            aria-label={`${BOARD_NAMES[boardId]} Board`}
          >
            <div className="flex items-center justify-between border-b border-parchment-200 pb-2 dark:border-slate-700">
              <h3 className="font-display text-xl text-navy-800 dark:text-gold-200">
                {BOARD_NAMES[boardId]}
              </h3>
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {board.guesses.length} / 6
              </div>
            </div>

            <div className="flex flex-grow flex-col gap-2">
              {board.guesses.map((guess, index) => (
                <div
                  key={`${boardId}-guess-${index}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 shadow-sm ${
                    guess.isCorrect
                      ? "border border-tile-correct bg-tile-correct/20"
                      : "border border-tile-wrong/30 bg-tile-wrong/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-parchment-300 dark:border-slate-600">
                      <Image
                        src={getLocalCharacterImageUrl(guess.imageUrl)}
                        alt={guess.characterName}
                        fill
                        sizes="32px"
                        className="object-cover object-top"
                      />
                    </div>
                    <span className="line-clamp-1 font-display text-lg text-navy-800 dark:text-parchment-100">
                      {guess.characterName}
                    </span>
                  </div>
                  <div className="text-xl">{guess.isCorrect ? "✅" : "❌"}</div>
                </div>
              ))}

              {!isFinished ? (
                <div className="mt-2">
                  <Autocomplete
                    characters={allCharacters}
                    guessedIds={board.guessedIds}
                    onSelect={(char) => onGuess(boardId, char.id)}
                    disabled={isFinished}
                  />
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  {isWon ? (
                    <>
                      <div className="mb-2 font-bold text-emerald-600 dark:text-emerald-400">
                        Solved!
                      </div>
                      {target && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-500">
                            <Image
                              src={getLocalCharacterImageUrl(target.imageUrl)}
                              alt={target.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-bold text-navy-900 dark:text-slate-100">
                            {target.name}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-2 font-bold text-red-600 dark:text-red-400">
                        Out of Guesses
                      </div>
                      {target && (
                        <div className="flex flex-col items-center gap-2 opacity-80">
                          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-red-500">
                            <Image
                              src={getLocalCharacterImageUrl(target.imageUrl)}
                              alt={target.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-bold text-navy-900 dark:text-slate-100">
                            {target.name}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
