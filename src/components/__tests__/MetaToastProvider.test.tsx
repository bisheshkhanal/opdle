import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetaToastProvider } from "@/components/MetaToastProvider";
import * as storage from "@/lib/storage";

vi.mock("@/lib/storage", () => ({
  getMetaInbox: vi.fn(),
  saveMetaInbox: vi.fn(),
}));

describe("MetaToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(storage.getMetaInbox).mockReturnValue([]);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders nothing when inbox is empty", () => {
    render(<MetaToastProvider />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows first toast with correct title/body", () => {
    vi.mocked(storage.getMetaInbox).mockReturnValue([
      {
        id: "t1",
        type: "achievement",
        title: "Test Achievement",
        body: "You did it!",
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<MetaToastProvider />);
    expect(screen.getByText("Test Achievement")).toBeInTheDocument();
    expect(screen.getByText("You did it!")).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("auto-dismisses after timeout and shows next toast", () => {
    vi.mocked(storage.getMetaInbox).mockReturnValue([
      {
        id: "t1",
        type: "achievement",
        title: "Test Achievement",
        body: "You did it!",
        createdAt: new Date().toISOString(),
      },
      {
        id: "t2",
        type: "saga",
        title: "Next Saga",
        body: "Saga unlocked!",
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<MetaToastProvider />);

    expect(screen.getByText("Test Achievement")).toBeInTheDocument();
    expect(screen.queryByText("Next Saga")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText("Test Achievement")).not.toBeInTheDocument();
    expect(screen.getByText("Next Saga")).toBeInTheDocument();
  });

  it("marks dismissed entries with dismissedAt timestamp", () => {
    const inbox = [
      {
        id: "t1",
        type: "monthly",
        title: "Month Done",
        body: "Yey",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ];
    // @ts-expect-error type override
    vi.mocked(storage.getMetaInbox).mockReturnValue(inbox);

    render(<MetaToastProvider />);

    act(() => {
      vi.advanceTimersByTime(4000);
      vi.advanceTimersByTime(300);
    });

    expect(storage.saveMetaInbox).toHaveBeenCalled();
    const saveCallArg = vi.mocked(storage.saveMetaInbox).mock.calls[0][0];
    expect(saveCallArg[0].id).toBe("t1");
    expect(saveCallArg[0].dismissedAt).toBeDefined();
    expect(new Date(saveCallArg[0].dismissedAt!).toISOString()).toBe(
      saveCallArg[0].dismissedAt
    );
  });

  it("does not re-show already-dismissed toasts on re-render", () => {
    vi.mocked(storage.getMetaInbox).mockReturnValue([
      {
        id: "t1",
        type: "log-pose",
        title: "Log Pose",
        body: "Used",
        createdAt: "2023-01-01T00:00:00.000Z",
        dismissedAt: "2023-01-02T00:00:00.000Z",
      },
    ]);

    render(<MetaToastProvider />);
    expect(screen.queryByText("Log Pose")).not.toBeInTheDocument();
  });
});
