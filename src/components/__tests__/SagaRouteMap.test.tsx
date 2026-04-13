import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SagaRouteMap } from "../SagaRouteMap";
import { SAGA_CATALOG } from "../../lib/progression/sagaCatalog";
import type { SagaDef } from "../../lib/progression/types";
import type { TierProgression } from "../../lib/types";

const mockProgression = {
  sagas: {
    "east-blue": { progressCount: 3, uniqueSolvedIds: [] },
    arabasta: { progressCount: 1, uniqueSolvedIds: [] },
  },
  completedSagaCount: 1,
} as unknown as TierProgression;

describe("SagaRouteMap", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders all saga nodes", () => {
    render(<SagaRouteMap progression={mockProgression} />);

    SAGA_CATALOG.forEach((saga: SagaDef) => {
      expect(screen.getByText(saga.label)).toBeInTheDocument();
    });
  });

  it("shows Completed for completed sagas", () => {
    render(<SagaRouteMap progression={mockProgression} />);

    const eastBlueNode = screen
      .getByText("East Blue Saga")
      .closest("div[data-saga-id='east-blue']");
    expect(eastBlueNode).toHaveTextContent("Completed");
  });

  it("shows x/3 daily wins for unlocked sagas", () => {
    render(<SagaRouteMap progression={mockProgression} />);

    const arabastaNode = screen
      .getByText("Arabasta Saga")
      .closest("div[data-saga-id='arabasta']");
    expect(arabastaNode).toHaveTextContent("1/3 daily wins");
  });

  it("shows 0/3 daily wins for locked sagas", () => {
    render(<SagaRouteMap progression={mockProgression} />);

    const skyIslandNode = screen
      .getByText("Sky Island Saga")
      .closest("div[data-saga-id='sky-island']");
    expect(skyIslandNode).toHaveTextContent("0/3 daily wins");
  });

  it("calls onSagaClick when clicking an unlocked node", () => {
    const handleClick = vi.fn();
    render(
      <SagaRouteMap progression={mockProgression} onSagaClick={handleClick} />
    );

    const arabastaNode = screen
      .getByText("Arabasta Saga")
      .closest("div[data-saga-id='arabasta']");
    fireEvent.click(arabastaNode!);

    expect(handleClick).toHaveBeenCalledWith("arabasta");
  });

  it("does not call onSagaClick when clicking a locked node", () => {
    const handleClick = vi.fn();
    render(
      <SagaRouteMap progression={mockProgression} onSagaClick={handleClick} />
    );

    const skyIslandNode = screen
      .getByText("Sky Island Saga")
      .closest("div[data-saga-id='sky-island']");
    fireEvent.click(skyIslandNode!);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies highlight styling to the selected saga", () => {
    render(
      <SagaRouteMap progression={mockProgression} selectedSagaId="arabasta" />
    );

    const arabastaNode = screen
      .getByText("Arabasta Saga")
      .closest("div[data-saga-id='arabasta']");
    expect(arabastaNode).toHaveClass("ring-4");
  });
});
