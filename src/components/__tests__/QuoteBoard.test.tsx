import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuoteBoard } from "../QuoteBoard";
import { QuoteState, initQuoteState } from "../../lib/quote";
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
  id: "ace",
  name: "Portgas D. Ace",
  imageUrl: "/characters/ace.png",
  gender: "Male",
  affiliationPrimary: "Whitebeard Pirates",
  devilFruitType: ["Logia"],
  haki: ["O", "A", "C"],
  bounty: 550000000,
  heightCm: 185,
  origin: "South Blue",
  firstArc: "Arabasta",
  aliases: ["Fire Fist", "Ace"],
  minTier: "casual",
  clues: [{ kind: "laugh", text: "Puhahaha" }],
};

const mockCharacters = [
  mockTarget,
  { ...mockTarget, id: "zoro", name: "Zoro", clues: undefined },
];

describe("QuoteBoard", () => {
  it("renders starter clue on initial load", () => {
    const state = initQuoteState();
    render(
      <QuoteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByTestId("starter-clue")).toBeInTheDocument();
    expect(screen.getByText("Laugh")).toBeInTheDocument();
    expect(screen.getByText(/Puhahaha/)).toBeInTheDocument();
    expect(screen.queryByTestId("attribute-clues")).not.toBeInTheDocument();
  });

  it("calls onGuess when autocomplete makes a selection", () => {
    const state = initQuoteState();
    const handleGuess = vi.fn();
    render(
      <QuoteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={handleGuess}
      />
    );

    fireEvent.click(screen.getByText("Guess Zoro"));
    expect(handleGuess).toHaveBeenCalledWith("zoro");
  });

  it("shows attribute clues after wrong guess and guess history", () => {
    const state: QuoteState = {
      ...initQuoteState(),
      guessedIds: ["zoro"],
      clueIndex: 2,
      guesses: [
        {
          characterId: "zoro",
          characterName: "Zoro",
          imageUrl: "/characters/zoro.png",
          categories: [],
          isCorrect: false,
        },
      ],
    };

    render(
      <QuoteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByTestId("attribute-clues")).toBeInTheDocument();
    expect(screen.getByText("Gender")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByText("South Blue")).toBeInTheDocument();
    expect(screen.getByText("Guesses (1 / 6)")).toBeInTheDocument();
    expect(screen.getByText("Zoro")).toBeInTheDocument();
    expect(screen.getByText("❌")).toBeInTheDocument();
  });

  it("displays game over state on finish and hides input", () => {
    const state: QuoteState = {
      ...initQuoteState(),
      isFinished: true,
      isWon: true,
      clueIndex: 0,
    };

    render(
      <QuoteBoard
        targetCharacter={mockTarget}
        allCharacters={mockCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Portgas D. Ace")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-autocomplete")).not.toBeInTheDocument();
  });
});
