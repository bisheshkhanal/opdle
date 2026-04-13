import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MonthlyCollectionBoard } from "../MonthlyCollectionBoard";
import type { MonthlyCollections } from "@/lib/types";

describe("MonthlyCollectionBoard", () => {
  it("renders with empty collections", () => {
    const emptyCollections: MonthlyCollections = {
      activeSeasonKey: "",
      seasons: {},
    };

    render(<MonthlyCollectionBoard collections={emptyCollections} />);
    expect(
      screen.getByText(/No active collection season/i)
    ).toBeInTheDocument();
  });

  it("renders active season with some revealed fragments", () => {
    const collections: MonthlyCollections = {
      activeSeasonKey: "2026-04",
      seasons: {
        "2026-04": {
          collectibleId: "some-bounty",
          collectibleType: "bounty-poster",
          targetFragments: 30,
          revealedDays: ["2026-04-01", "2026-04-02"],
          revealedFragmentIndexes: [0, 5, 10],
        },
      },
    };

    render(<MonthlyCollectionBoard collections={collections} />);
    expect(screen.getByText("Season 2026-04")).toBeInTheDocument();
    expect(screen.getByText("3 / 30")).toBeInTheDocument();

    const tile0 = screen.getByTestId("fragment-tile-0");
    const tile1 = screen.getByTestId("fragment-tile-1");
    const tile5 = screen.getByTestId("fragment-tile-5");

    expect(tile0).toHaveClass("border-gold-500");
    expect(tile1).not.toHaveClass("border-gold-500");
    expect(tile5).toHaveClass("border-gold-500");

    expect(tile0).toHaveTextContent("📜");
    expect(tile1).toHaveTextContent("?");
  });

  it("shows completed season indicator", () => {
    const collections: MonthlyCollections = {
      activeSeasonKey: "2026-04",
      seasons: {
        "2026-04": {
          collectibleId: "some-vivre-card",
          collectibleType: "vivre-card",
          targetFragments: 5,
          revealedDays: ["1", "2", "3", "4", "5"],
          revealedFragmentIndexes: [0, 1, 2, 3, 4],
          completedAt: "2026-04-05T00:00:00Z",
        },
      },
    };

    render(<MonthlyCollectionBoard collections={collections} />);
    expect(screen.getByText("COMPLETE")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
  });
});
