import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogPoseIndicator } from "../LogPoseIndicator";
import type { TierLogPose } from "../../lib/types";

function createLogPose(overrides: Partial<TierLogPose> = {}): TierLogPose {
  return {
    ...overrides,
    charges: overrides.charges ?? 0,
    earnedMilestones: overrides.earnedMilestones
      ? [...overrides.earnedMilestones]
      : [],
    consumptions: overrides.consumptions ? [...overrides.consumptions] : [],
  };
}

describe("LogPoseIndicator", () => {
  it("renders with 0 charges in dim styling", () => {
    render(<LogPoseIndicator logPose={createLogPose()} tier="casual" />);

    expect(screen.getByText("🧭")).toBeInTheDocument();
    expect(screen.getByText("Log Pose: 0/2 charges")).toBeInTheDocument();
    expect(
      screen.getByText("Log Pose: 0/2 charges").closest("div")
    ).toHaveClass("text-slate-500");
  });

  it("renders with 1 charge in accent styling", () => {
    render(
      <LogPoseIndicator logPose={createLogPose({ charges: 1 })} tier="fan" />
    );

    expect(screen.getByText("Log Pose: 1/2 charges")).toBeInTheDocument();
    expect(
      screen.getByText("Log Pose: 1/2 charges").closest("div")
    ).toHaveClass("text-gold-700");
  });

  it("renders with 2 charges in accent styling", () => {
    render(
      <LogPoseIndicator logPose={createLogPose({ charges: 2 })} tier="nakama" />
    );

    expect(screen.getByText("Log Pose: 2/2 charges")).toBeInTheDocument();
    expect(
      screen.getByText("Log Pose: 2/2 charges").closest("div")
    ).toHaveClass("text-gold-700");
  });

  it("shows the last protected day when one exists", () => {
    render(
      <LogPoseIndicator
        logPose={createLogPose({
          charges: 1,
          consumptions: [
            {
              protectedDay: "2026-04-13+1",
              consumedAt: "2026-04-14T12:00:00.000Z",
              source: "streak-7",
            },
          ],
        })}
        tier="casual"
      />
    );

    expect(screen.getByText("Last protected: 2026-04-13")).toBeInTheDocument();
  });

  it("does not show a protected day when none exists", () => {
    render(
      <LogPoseIndicator logPose={createLogPose({ charges: 1 })} tier="casual" />
    );

    expect(screen.queryByText(/undefined|null/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last protected:/i)).not.toBeInTheDocument();
  });
});
