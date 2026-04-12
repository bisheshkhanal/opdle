import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RulesetTabs } from "../RulesetTabs";
import type { Ruleset } from "@/lib/types";

describe("RulesetTabs", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all 5 tabs correctly", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tab-classic")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-silhouette")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-wanted")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-quote")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-arc")).toBeInTheDocument();
  });

  it("sets aria-selected true only on the active tab", () => {
    render(
      <RulesetTabs activeRuleset="silhouette" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tab-classic")).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByTestId("ruleset-tab-silhouette")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByTestId("ruleset-tab-wanted")).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByTestId("ruleset-tab-quote")).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByTestId("ruleset-tab-arc")).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("calls onRulesetChange with correct ruleset when clicked", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    fireEvent.click(screen.getByTestId("ruleset-tab-wanted"));
    expect(mockOnChange).toHaveBeenCalledWith("wanted");
  });

  it("does not include four-seas tab", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    expect(
      screen.queryByTestId("ruleset-tab-four-seas")
    ).not.toBeInTheDocument();
  });
});
