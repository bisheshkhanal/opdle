import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { ChallengesModal } from "../ChallengesModal";
import * as authClient from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

describe("ChallengesModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("shows signed-out state", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const onSignInClick = vi.fn();
    render(<ChallengesModal onClose={vi.fn()} onSignInClick={onSignInClick} />);

    expect(
      screen.getByText(/Sign in to play Tracked Challenges/i)
    ).toBeInTheDocument();

    const signInBtn = screen.getByRole("button", { name: /Sign In/i });
    signInBtn.click();
    expect(onSignInClick).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });

    const { container } = render(
      <ChallengesModal onClose={vi.fn()} onSignInClick={vi.fn()} />
    );
    // Loading spinner uses animate-spin
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  describe("signed in", () => {
    beforeEach(() => {
      vi.mocked(authClient.useSession).mockReturnValue({
        data: { user: { id: "123", name: "Luffy" }, expires: "never" },
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("renders packs tab by default with partial progress", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          json: async () => ({
            packs: [
              {
                id: "p1",
                title: "East Blue Pack",
                description: "Start of romance",
              },
            ],
          }),
        } as any)
        .mockResolvedValueOnce({
          json: async () => ({
            progress: {
              completed: 0,
              total: 5,
              percentage: 0,
            },
          }),
        } as any);

      render(<ChallengesModal onClose={vi.fn()} onSignInClick={vi.fn()} />);

      expect(screen.getByText("Packs")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("East Blue Pack")).toBeInTheDocument();
        expect(screen.getByText("Partial progress (0/5)")).toBeInTheDocument();
      });
    });

    it("handles empty history in history tab", async () => {
      // Packs fetch (default tab)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({ packs: [] }),
      } as any);

      render(<ChallengesModal onClose={vi.fn()} onSignInClick={vi.fn()} />);

      // Switch to history tab
      const historyTab = screen.getByRole("button", {
        name: "History & Streaks",
      });

      // History fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({ history: [] }),
      } as any);

      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(
          screen.getByText(/You haven't played any tracked challenges yet/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Current Streak")).toBeInTheDocument();
      });
    });

    it("shows history with success and expired states", async () => {
      // Packs fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({ packs: [] }),
      } as any);

      render(<ChallengesModal onClose={vi.fn()} onSignInClick={vi.fn()} />);

      // History fetch
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({
          history: [
            {
              id: "h1",
              challengeId: "chal-1",
              solvedAt: "2026-04-12T00:00:00Z",
              createdAt: "2026-04-12T00:00:00Z",
              guessCount: 3,
              isExpired: false,
            },
            {
              id: "h2",
              challengeId: "chal-2",
              solvedAt: null,
              createdAt: "2026-04-11T00:00:00Z",
              guessCount: 6,
              isExpired: true,
            },
          ],
        }),
      } as any);

      fireEvent.click(
        screen.getByRole("button", { name: "History & Streaks" })
      );

      await waitFor(() => {
        expect(screen.getByText("Challenge chal-1")).toBeInTheDocument();
        expect(screen.getByText("Solved in 3 guesses")).toBeInTheDocument();

        expect(screen.getByText("Challenge chal-2")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
        expect(screen.getByText("Expired")).toBeInTheDocument();
      });
    });
  });
});
