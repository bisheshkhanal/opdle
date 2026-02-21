import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Autocomplete } from "../Autocomplete";
import type { Character } from "@/lib/types";

// Mock scrollIntoView since it's not implemented in jsdom
const scrollIntoViewMock = vi.fn();
HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

const mockCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy", "Straw Hat"],
    imageUrl: "https://example.com/luffy.jpg",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "Paramecia",
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Zoro", "Pirate Hunter"],
    imageUrl: "https://example.com/zoro.jpg",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "None",
    haki: ["O", "A", "C"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Romance Dawn",
  },
  {
    id: "nami",
    name: "Nami",
    aliases: ["Cat Burglar"],
    imageUrl: "https://example.com/nami.jpg",
    gender: "Female",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: "None",
    haki: ["O"],
    bounty: 366000000,
    heightCm: 170,
    origin: "East Blue",
    firstArc: "Orange Town",
  },
];

describe("Autocomplete", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
    scrollIntoViewMock.mockClear();
  });

  it("renders input with placeholder", () => {
    render(
      <Autocomplete
        characters={mockCharacters}
        guessedIds={[]}
        onSelect={mockOnSelect}
      />
    );

    expect(
      screen.getByPlaceholderText("Search for a pirate...")
    ).toBeInTheDocument();
  });

  it("shows results when typing a query", async () => {
    render(
      <Autocomplete
        characters={mockCharacters}
        guessedIds={[]}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByPlaceholderText("Search for a pirate...");
    fireEvent.change(input, { target: { value: "luffy" } });

    await waitFor(() => {
      expect(screen.getByText("Monkey D. Luffy")).toBeInTheDocument();
    });
  });

  it("calls onSelect when clicking a result", async () => {
    render(
      <Autocomplete
        characters={mockCharacters}
        guessedIds={[]}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByPlaceholderText("Search for a pirate...");
    fireEvent.change(input, { target: { value: "luffy" } });

    await waitFor(() => {
      expect(screen.getByText("Monkey D. Luffy")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Monkey D. Luffy"));

    expect(mockOnSelect).toHaveBeenCalledWith(mockCharacters[0]);
  });

  it("filters out already guessed characters", async () => {
    render(
      <Autocomplete
        characters={mockCharacters}
        guessedIds={["luffy"]}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByPlaceholderText("Search for a pirate...");
    fireEvent.change(input, { target: { value: "luffy" } });

    await waitFor(() => {
      expect(screen.queryByText("Monkey D. Luffy")).not.toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("moves selection down with ArrowDown key", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } }); // Match all characters

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      // First item should be selected by default
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      // Press ArrowDown to move to second item
      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        expect(options[0]).toHaveAttribute("aria-selected", "false");
        expect(options[1]).toHaveAttribute("aria-selected", "true");
      });
    });

    it("moves selection up with ArrowUp key", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } }); // Match all characters

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("option");

      // Press ArrowDown twice to get to third item
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        expect(options[2]).toHaveAttribute("aria-selected", "true");
      });

      // Press ArrowUp to move back to second item
      fireEvent.keyDown(input, { key: "ArrowUp" });

      await waitFor(() => {
        expect(options[1]).toHaveAttribute("aria-selected", "true");
        expect(options[2]).toHaveAttribute("aria-selected", "false");
      });
    });

    it("does not go below first item with ArrowUp", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("option");

      // First item selected by default
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      // Press ArrowUp - should stay at first item
      fireEvent.keyDown(input, { key: "ArrowUp" });

      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("does not go beyond last item with ArrowDown", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("option");
      const lastIndex = options.length - 1;

      // Move to last item
      for (let i = 0; i < lastIndex; i++) {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      }

      await waitFor(() => {
        expect(options[lastIndex]).toHaveAttribute("aria-selected", "true");
      });

      // Press ArrowDown again - should stay at last item
      fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(options[lastIndex]).toHaveAttribute("aria-selected", "true");
    });

    it("calls scrollIntoView when selection changes", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      scrollIntoViewMock.mockClear();

      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith(
          expect.objectContaining({ block: "nearest", behavior: "smooth" })
        );
      });
    });

    it("selects item with Enter key", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "zoro" } });

      await waitFor(() => {
        expect(screen.getByText("Roronoa Zoro")).toBeInTheDocument();
      });

      // Press Enter to select first (and only) result
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnSelect).toHaveBeenCalledWith(mockCharacters[1]);
    });

    it("closes dropdown with Escape key", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });

    it("has proper id attributes on options for aria-activedescendant", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "luffy" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("id", "character-option-luffy");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("updates aria-activedescendant when selection changes", async () => {
      render(
        <Autocomplete
          characters={mockCharacters}
          guessedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByPlaceholderText("Search for a pirate...");
      fireEvent.change(input, { target: { value: "a" } });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      expect(input).toHaveAttribute(
        "aria-activedescendant",
        "character-option-luffy"
      );

      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        expect(input).toHaveAttribute(
          "aria-activedescendant",
          "character-option-zoro"
        );
      });
    });
  });
});
