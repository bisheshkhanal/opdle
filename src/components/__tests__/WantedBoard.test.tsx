import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WantedBoard } from "../WantedBoard";
import { WantedState, initWantedState } from "../../lib/wanted";
import { Character } from "../../lib/types";

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

describe("WantedBoard", () => {
  it("renders wanted image with highest inset initially", () => {
    const state = initWantedState();
    render(
      <WantedBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    const img = screen.getByTestId("wanted-image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveStyle({ clipPath: "inset(35%)" });
  });

  it("calls onGuess when autocomplete makes a selection", () => {
    const state = initWantedState();
    const handleGuess = vi.fn();
    render(
      <WantedBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={handleGuess}
      />
    );

    fireEvent.click(screen.getByText("Guess Zoro"));
    expect(handleGuess).toHaveBeenCalledWith("zoro");
  });

  it("shows results feedback and updates inset when there are guesses", () => {
    const state: WantedState = {
      ...initWantedState(),
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
      <WantedBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Guesses (1 / 6)")).toBeInTheDocument();
    expect(screen.getByText("Zoro")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();

    const img = screen.getByTestId("wanted-image");
    expect(img).toHaveStyle({ clipPath: "inset(28%)" });
  });

  it("displays game over state and reveals full image on finish", () => {
    const state: WantedState = {
      ...initWantedState(),
      isFinished: true,
      isWon: true,
      revealStep: 0,
    };

    render(
      <WantedBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Luffy")).toBeInTheDocument();

    const img = screen.getByTestId("wanted-image");
    expect(img).toHaveStyle({ clipPath: "inset(0%)" });

    expect(screen.queryByTestId("mock-autocomplete")).not.toBeInTheDocument();
  });
});
