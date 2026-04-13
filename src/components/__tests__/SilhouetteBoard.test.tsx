import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SilhouetteBoard } from "../SilhouetteBoard";
import { SilhouetteState, initSilhouetteState } from "../../lib/silhouette";
import { Character } from "../../lib/types";

// Mock Autocomplete
vi.mock("../Autocomplete", () => ({
  Autocomplete: ({ onSelect, disabled }: any) => (
    <div data-testid="mock-autocomplete">
      <button
        disabled={disabled}
        onClick={() => onSelect({ id: "zoro", name: "Zoro" })}
      >
        Guess Zoro
      </button>
    </div>
  ),
}));

const mockTarget: Character = {
  id: "luffy",
  name: "Luffy",
  imageUrl: "/characters/luffy.png",
  gender: "Male",
  affiliationPrimary: "Straw Hat Pirates",
  devilFruitType: ["Paramecia"],
  haki: ["O", "A", "C"],
  bounty: 3000000000,
  heightCm: 174,
  origin: "East Blue",
  firstArc: "Romance Dawn",
  aliases: [],
  tier: "casual",
};

const mockCharacters = [
  mockTarget,
  { ...mockTarget, id: "zoro", name: "Zoro" },
];

describe("SilhouetteBoard", () => {
  it("renders silhouette image with highest blur initially", () => {
    const state = initSilhouetteState();
    render(
      <SilhouetteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    const img = screen.getByTestId("silhouette-image");
    expect(img).toBeInTheDocument();
    // Step 0 should have the highest blur style (brightness 0 and blur 10px)
    expect(img).toHaveStyle({ filter: "brightness(0) blur(10px)" });
  });

  it("calls onGuess when autocomplete makes a selection", () => {
    const state = initSilhouetteState();
    const handleGuess = vi.fn();
    render(
      <SilhouetteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={handleGuess}
      />
    );

    fireEvent.click(screen.getByText("Guess Zoro"));
    expect(handleGuess).toHaveBeenCalledWith("zoro");
  });

  it("shows results feedback when there are guesses", () => {
    const state: SilhouetteState = {
      ...initSilhouetteState(),
      guessedIds: ["zoro"],
      guesses: [
        {
          characterId: "zoro",
          characterName: "Zoro",
          imageUrl: "/characters/zoro.png",
          categories: [],
          isCorrect: false,
        },
      ],
      revealStep: 1,
    };

    render(
      <SilhouetteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Guesses (1 / 6)")).toBeInTheDocument();
    expect(screen.getByText("Zoro")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();

    const img = screen.getByTestId("silhouette-image");
    expect(img).toHaveStyle({ filter: "brightness(0) blur(4px)" });
  });

  it("displays game over state and unblurs image on finish", () => {
    const state: SilhouetteState = {
      ...initSilhouetteState(),
      isFinished: true,
      isWon: true,
      revealStep: 0,
    };

    render(
      <SilhouetteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Luffy")).toBeInTheDocument();

    const img = screen.getByTestId("silhouette-image");
    expect(img).toHaveStyle({ filter: "brightness(1) blur(0px)" });

    // Autocomplete should be disabled/hidden
    expect(screen.queryByTestId("mock-autocomplete")).not.toBeInTheDocument();
  });
});
