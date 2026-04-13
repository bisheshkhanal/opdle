import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FourSeasBoard } from "../FourSeasBoard";
import { BOARD_ORDER } from "@/lib/fourSeas";
import type { FourSeaBoard, FourSeasState } from "@/lib/fourSeas";
import type { Character } from "@/lib/types";

// Mock the Autocomplete component to simplify testing
vi.mock("../Autocomplete", () => ({
  Autocomplete: ({
    disabled,
    onSelect,
    characters,
  }: {
    disabled: boolean;
    onSelect: (c: Character) => void;
    characters: Character[];
  }) => (
    <div data-testid="mock-autocomplete">
      <input data-testid="mock-input" disabled={disabled} onChange={() => {}} />
      <button
        data-testid="mock-select-btn"
        onClick={() => onSelect(characters[0])}
        disabled={disabled}
      >
        Select
      </button>
    </div>
  ),
}));

// Mock Image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} />,
}));

function makeCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    aliases: [],
    imageUrl: `/${id}.png`,
    gender: "Male",
    affiliation: ["Straw Hat Pirates"],
    devilFruit: "Gomu Gomu no Mi",
    devilFruitType: "Paramecia",
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    height: 174,
    age: 19,
    origin: "East Blue",
    status: "Alive",
    firstArc: "Romance Dawn",
  };
}

const mockAllCharacters = [
  makeCharacter("luffy", "Monkey D. Luffy"),
  makeCharacter("zoro", "Roronoa Zoro"),
  makeCharacter("nami", "Nami"),
  makeCharacter("usopp", "Usopp"),
  makeCharacter("sanji", "Sanji"),
];

const mockTargets: Record<string, Character> = {
  luffy: mockAllCharacters[0],
  zoro: mockAllCharacters[1],
  nami: mockAllCharacters[2],
  usopp: mockAllCharacters[3],
};

function createMockState(
  overrides: Partial<Record<string, Partial<FourSeaBoard>>> = {}
): FourSeasState {
  const boards = {} as Record<string, FourSeaBoard>;
  BOARD_ORDER.forEach((id, index) => {
    boards[id] = {
      boardId: id,
      targetCharacterId: Object.keys(mockTargets)[index],
      guesses: [],
      guessedIds: [],
      isFinished: false,
      isWon: false,
      ...overrides[id],
    };
  });

  return {
    boards: boards as Record<(typeof BOARD_ORDER)[number], FourSeaBoard>,
    boardOrder: BOARD_ORDER,
  };
}

describe("FourSeasBoard", () => {
  it("renders nothing if state is not initialized", () => {
    const { container } = render(
      <FourSeasBoard
        targetCharacters={{}}
        allCharacters={mockAllCharacters}
        state={null as unknown as FourSeasState}
        onGuess={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders 4 board panels with correct names", () => {
    const state = createMockState();
    render(
      <FourSeasBoard
        targetCharacters={mockTargets}
        allCharacters={mockAllCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("North Sea")).toBeInTheDocument();
    expect(screen.getByText("East Sea")).toBeInTheDocument();
    expect(screen.getByText("South Sea")).toBeInTheDocument();
    expect(screen.getByText("West Sea")).toBeInTheDocument();
  });

  it("shows active Autocomplete on unfinished boards", () => {
    const state = createMockState({
      north: { isFinished: true, isWon: true },
      east: { isFinished: false },
    });

    render(
      <FourSeasBoard
        targetCharacters={mockTargets}
        allCharacters={mockAllCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    // North is finished, shouldn't have active Autocomplete
    // Actually we have 4 boards. 1 is finished, 3 are not.
    const inputs = screen.getAllByTestId("mock-input");
    expect(inputs).toHaveLength(3);
    inputs.forEach((input) => {
      expect(input).not.toBeDisabled();
    });
  });

  it("shows Solved or Out of Guesses when a board is finished", () => {
    const state = createMockState({
      north: { isFinished: true, isWon: true },
      east: { isFinished: true, isWon: false },
    });

    render(
      <FourSeasBoard
        targetCharacters={mockTargets}
        allCharacters={mockAllCharacters}
        state={state}
        onGuess={vi.fn()}
      />
    );

    expect(screen.getByText("Solved!")).toBeInTheDocument();
    expect(screen.getByText("Out of Guesses")).toBeInTheDocument();
  });

  it("calls onGuess when an active board makes a guess", () => {
    const handleGuess = vi.fn();
    const state = createMockState();

    render(
      <FourSeasBoard
        targetCharacters={mockTargets}
        allCharacters={mockAllCharacters}
        state={state}
        onGuess={handleGuess}
      />
    );

    const btns = screen.getAllByTestId("mock-select-btn");
    // Click the first one (North)
    fireEvent.click(btns[0]);

    expect(handleGuess).toHaveBeenCalledWith("north", "luffy");
  });
});
