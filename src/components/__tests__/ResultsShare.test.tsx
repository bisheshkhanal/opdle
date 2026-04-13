import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ResultsShare } from "../ResultsShare";
import { shareResults } from "@/lib/share";
import { buildShareCardPayload } from "@/lib/share-card";
import type { Character, GuessResult } from "@/lib/types";

vi.mock("@/lib/share", () => ({
  shareResults: vi.fn(),
  formatShareText: vi.fn(() => "mock-text-fallback"),
}));

vi.mock("@/lib/share-card", () => ({
  buildShareCardPayload: vi.fn(),
}));

const mockTarget: Character = {
  id: "luffy",
  name: "Monkey D. Luffy",
  aliases: ["Straw Hat"],
  imageUrl: "luffy.png",
  gender: "Male",
  affiliation: ["Straw Hat Pirates"],
  devilFruit: "Gomu Gomu no Mi",
  devilFruitType: "Paramecia",
  haki: ["Observation", "Armament", "Conqueror"],
  bounty: 3000000000,
  height: 174,
  origin: "East Blue",
  firstArc: "Romance Dawn",
};

const mockGuesses: GuessResult[] = [
  {
    characterId: "luffy",
    name: "Monkey D. Luffy",
    imageUrl: "luffy.png",
    isCorrect: true,
    categories: [
      { key: "gender", status: "correct", value: "Male", label: "Gender" },
    ],
  },
];

describe("ResultsShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn(),
      },
    });

    // Mock fetch for image blob
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(["mock-image"], { type: "image/png" })),
      })
    ) as any;
    
    // Default buildShareCardPayload return
    vi.mocked(buildShareCardPayload).mockReturnValue({
      template: "dossier",
      title: "Monkey D. Luffy",
      mode: "daily",
      runKind: "daily",
      ruleset: "classic",
      guessCount: 1,
      emojiGrid: "🟩",
      shareText: "mock-share-text",
      textFallback: "mock-text-fallback",
      createdAtUtc: "2026-04-13T00:00:00.000Z",
    });

    global.ClipboardItem = vi.fn().mockImplementation((data) => data) as any;
  });

  it("renders buttons when target is provided", () => {
    render(<ResultsShare guesses={mockGuesses} mode="daily" isWon={true} target={mockTarget} />);
    expect(screen.getByText("Share Card")).toBeInTheDocument();
  });

  it("renders only text fallback when target is missing", () => {
    render(<ResultsShare guesses={mockGuesses} mode="daily" isWon={true} />);
    expect(screen.getByText("Copy Results")).toBeInTheDocument();
    expect(screen.queryByText("Share Card")).not.toBeInTheDocument();
  });

  it("handles text share fallback via shareResults", async () => {
    vi.mocked(shareResults).mockResolvedValue({ success: true, text: "copied" });
    render(<ResultsShare guesses={mockGuesses} mode="daily" isWon={true} target={mockTarget} />);
    
    const textButton = screen.getByTitle("Copy Text Only");
    fireEvent.click(textButton);
    
    await waitFor(() => {
      expect(shareResults).toHaveBeenCalledWith(mockGuesses, "daily", true, undefined, undefined, undefined, undefined);
    });
  });

  it("shows loading state and triggers image generation on Share Card click", async () => {
    render(<ResultsShare guesses={mockGuesses} mode="daily" isWon={true} target={mockTarget} />);
    
    const shareCardButton = screen.getByText("Share Card");
    fireEvent.click(shareCardButton);
    
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });
    
    expect(screen.getByText("Shared!")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error"))) as any;
    
    render(<ResultsShare guesses={mockGuesses} mode="daily" isWon={true} target={mockTarget} />);
    const shareCardButton = screen.getByText("Share Card");
    fireEvent.click(shareCardButton);
    
    await waitFor(() => {
      expect(screen.getByText("Error! Try text")).toBeInTheDocument();
    });
  });
});
