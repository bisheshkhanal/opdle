import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RulesetTabs } from "../RulesetTabs";
import type { Ruleset } from "@/lib/types";

describe("RulesetTabs", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all 6 tabs correctly", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tab-classic")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-silhouette")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-wanted")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-quote")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-arc")).toBeInTheDocument();
    expect(screen.getByTestId("ruleset-tab-four-seas")).toBeInTheDocument();
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
    expect(screen.getByTestId("ruleset-tab-four-seas")).toHaveAttribute(
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

  it("includes four-seas tab", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tab-four-seas")).toBeInTheDocument();
  });

  it("has aria-label on tablist for screen readers", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tabs")).toHaveAttribute(
      "aria-label",
      "Game mode"
    );
  });

  it("uses roving tabindex — only active tab is in tab order", () => {
    render(
      <RulesetTabs activeRuleset="wanted" onRulesetChange={mockOnChange} />
    );

    expect(screen.getByTestId("ruleset-tab-wanted")).toHaveAttribute(
      "tabIndex",
      "0"
    );
    expect(screen.getByTestId("ruleset-tab-classic")).toHaveAttribute(
      "tabIndex",
      "-1"
    );
    expect(screen.getByTestId("ruleset-tab-silhouette")).toHaveAttribute(
      "tabIndex",
      "-1"
    );
  });

  it("ArrowRight navigates to next tab", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    const tablist = screen.getByTestId("ruleset-tabs");
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(mockOnChange).toHaveBeenCalledWith("silhouette");
  });

  it("ArrowLeft wraps to last tab from first", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    const tablist = screen.getByTestId("ruleset-tabs");
    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(mockOnChange).toHaveBeenCalledWith("four-seas");
  });

  it("Home key navigates to first tab", () => {
    render(
      <RulesetTabs activeRuleset="four-seas" onRulesetChange={mockOnChange} />
    );

    const tablist = screen.getByTestId("ruleset-tabs");
    fireEvent.keyDown(tablist, { key: "Home" });
    expect(mockOnChange).toHaveBeenCalledWith("classic");
  });

  it("End key navigates to last tab", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    const tablist = screen.getByTestId("ruleset-tabs");
    fireEvent.keyDown(tablist, { key: "End" });
    expect(mockOnChange).toHaveBeenCalledWith("four-seas");
  });

  it("decorative SVG icons have aria-hidden", () => {
    render(
      <RulesetTabs activeRuleset="classic" onRulesetChange={mockOnChange} />
    );

    const svgs = screen.getByTestId("ruleset-tabs").querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });
});
