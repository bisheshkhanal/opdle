import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ArcBoard } from "../ArcBoard";
import { ArcState, initArcState } from "../../lib/arc";
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
  minTier: "casual",
};

const mockCharacters = [
  mockTarget,
  { ...mockTarget, id: "zoro", name: "Zoro", firstArc: "Orange Town" },
];

describe("ArcBoard", () => {
  it("renders the arc mode prompt and autocomplete input", () => {
    const state = initArcState();
    render(
      <ArcBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(
      screen.getByText("Guess the character by their debut arc!")
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-autocomplete")).toBeInTheDocument();
  });

  it("calls onGuess when autocomplete makes a selection", () => {
    const state = initArcState();
    const handleGuess = vi.fn();
    render(
      <ArcBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={handleGuess}
      />
    );

    fireEvent.click(screen.getByText("Guess Zoro"));
    expect(handleGuess).toHaveBeenCalledWith("zoro");
  });

  it("shows guess feedback with arc distance and direction", () => {
    const state: ArcState = {
      ...initArcState(),
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
      arcGuesses: [
        {
          characterId: "zoro",
          characterName: "Zoro",
          imageUrl: "/characters/zoro.png",
          guessedArc: "Orange Town",
          targetArc: "Romance Dawn",
          distance: 1,
          direction: "earlier",
          isCorrect: false,
        },
      ],
    };

    render(
      <ArcBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Guesses (1 / 6)")).toBeInTheDocument();
    expect(screen.getByText("Zoro")).toBeInTheDocument();
    expect(screen.getByText("⬆️")).toBeInTheDocument();
    expect(screen.getByText("1 arc away")).toBeInTheDocument();
    expect(screen.getByText("Orange Town")).toBeInTheDocument();
  });

  it("displays game over state with correct answer", () => {
    const state: ArcState = {
      ...initArcState(),
      isFinished: true,
      isWon: true,
      guesses: [
        {
          characterId: "luffy",
          characterName: "Luffy",
          imageUrl: "/characters/luffy.png",
          categories: [],
          isCorrect: true,
        },
      ],
      guessedIds: ["luffy"],
      arcGuesses: [
        {
          characterId: "luffy",
          characterName: "Luffy",
          imageUrl: "/characters/luffy.png",
          guessedArc: "Romance Dawn",
          targetArc: "Romance Dawn",
          distance: 0,
          direction: "same",
          isCorrect: true,
        },
      ],
    };

    render(
      <ArcBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    const luffyElements = screen.getAllByText("Luffy");
    expect(luffyElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId("mock-autocomplete")).not.toBeInTheDocument();
  });
});
