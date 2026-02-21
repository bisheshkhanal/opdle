import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessRow } from "../GuessRow";
import type { GuessResult } from "@/lib/types";

describe("GuessRow", () => {
  it("renders character name and image", () => {
    const mockGuess: GuessResult = {
      characterId: "luffy",
      characterName: "Monkey D. Luffy",
      imageUrl: "https://example.com/luffy.jpg",
      categories: [
        {
          key: "gender",
          label: "Gender",
          value: "Male",
          displayValue: "Male",
          status: "correct",
        },
      ],
      isCorrect: true,
    };

    render(<GuessRow guess={mockGuess} />);

    expect(screen.getByText("Monkey D. Luffy")).toBeInTheDocument();
    expect(screen.getByAltText("Monkey D. Luffy")).toBeInTheDocument();
  });

  it("renders all tile statuses with correct CSS classes", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test Character",
      imageUrl: "https://example.com/test.jpg",
      categories: [
        {
          key: "gender",
          label: "Gender",
          value: "Male",
          displayValue: "Male",
          status: "correct",
        },
        {
          key: "affiliation",
          label: "Affiliation",
          value: "Pirates",
          displayValue: "Pirates",
          status: "wrong",
        },
        {
          key: "haki",
          label: "Haki",
          value: ["Armament"],
          displayValue: "Armament",
          status: "partial",
        },
        {
          key: "bounty",
          label: "Bounty",
          value: 100000000,
          displayValue: "100M",
          status: "higher",
        },
        {
          key: "height",
          label: "Height",
          value: 180,
          displayValue: "180cm",
          status: "lower",
        },
        {
          key: "origin",
          label: "Origin",
          value: null,
          displayValue: "?",
          status: "unknown",
        },
      ],
      isCorrect: false,
    };

    const { container } = render(<GuessRow guess={mockGuess} />);

    // Find all category cells using the guess-cell class
    const cells = container.querySelectorAll(".guess-cell");

    // correct (tile-correct class)
    expect(cells[0]).toHaveClass("tile-correct");
    expect(screen.getByText("Male")).toBeInTheDocument();

    // wrong (tile-wrong class)
    expect(cells[1]).toHaveClass("tile-wrong");
    expect(screen.getByText("Pirates")).toBeInTheDocument();

    // partial (tile-partial class)
    expect(cells[2]).toHaveClass("tile-partial");
    expect(screen.getByText("Armament")).toBeInTheDocument();

    // higher (tile-wrong class with up arrow)
    expect(cells[3]).toHaveClass("tile-wrong");
    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText("100M")).toBeInTheDocument();

    // lower (tile-wrong class with down arrow)
    expect(cells[4]).toHaveClass("tile-wrong");
    expect(screen.getByText("↓")).toBeInTheDocument();
    expect(screen.getByText("180cm")).toBeInTheDocument();

    // unknown (tile-unknown class with ?)
    expect(cells[5]).toHaveClass("tile-unknown");
    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBeGreaterThan(0);
  });

  it("applies animation class for latest guess", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "https://example.com/test.jpg",
      categories: [],
      isCorrect: false,
    };

    const { container } = render(
      <GuessRow guess={mockGuess} isLatest={true} />
    );

    const gridContainer = container.querySelector(".guess-table");
    expect(gridContainer).toHaveClass("guess-row-enter");
  });

  it("does not apply row-sweep class to latest guess", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "https://example.com/test.jpg",
      categories: [],
      isCorrect: false,
    };

    const { container } = render(
      <GuessRow guess={mockGuess} isLatest={true} />
    );

    const gridContainer = container.querySelector(".guess-table");
    expect(gridContainer).not.toHaveClass("row-sweep");
  });

  it("does not apply animation class when not latest guess", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "https://example.com/test.jpg",
      categories: [],
      isCorrect: false,
    };

    const { container } = render(
      <GuessRow guess={mockGuess} isLatest={false} />
    );

    const gridContainer = container.querySelector(".guess-table");
    expect(gridContainer).not.toHaveClass("guess-row-enter");
  });

  it("does not show arrows for non-numeric statuses", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "https://example.com/test.jpg",
      categories: [
        {
          key: "gender",
          label: "Gender",
          value: "Male",
          displayValue: "Male",
          status: "correct",
        },
        {
          key: "affiliation",
          label: "Affiliation",
          value: "Pirates",
          displayValue: "Pirates",
          status: "wrong",
        },
      ],
      isCorrect: false,
    };

    render(<GuessRow guess={mockGuess} />);

    // Should not have arrow characters
    expect(screen.queryByText("↑")).not.toBeInTheDocument();
    expect(screen.queryByText("↓")).not.toBeInTheDocument();
  });

  it("handles image loading errors with placeholder", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "invalid-url",
      categories: [],
      isCorrect: false,
    };

    const { container } = render(<GuessRow guess={mockGuess} />);
    const img = container.querySelector("img") as HTMLImageElement;

    // Simulate error
    img.dispatchEvent(new Event("error"));

    expect(img.src).toContain("placeholder");
  });

  it("has proper ARIA roles for accessibility", () => {
    const mockGuess: GuessResult = {
      characterId: "test",
      characterName: "Test",
      imageUrl: "https://example.com/test.jpg",
      categories: [
        {
          key: "gender",
          label: "Gender",
          value: "Male",
          displayValue: "Male",
          status: "correct",
        },
      ],
      isCorrect: true,
    };

    const { container } = render(<GuessRow guess={mockGuess} />);

    // Check for row role
    const row = container.querySelector("[role='row']");
    expect(row).toBeInTheDocument();

    // Check for cell roles
    const cells = container.querySelectorAll("[role='cell']");
    expect(cells.length).toBeGreaterThan(0);
  });
});
