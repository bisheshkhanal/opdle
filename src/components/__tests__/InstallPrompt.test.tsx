import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstallPrompt } from "../InstallPrompt";
import type { UserSettings } from "@/lib/settings";
import * as settingsModule from "@/lib/settings";

vi.mock("@/lib/settings", async () => {
  const actual = await vi.importActual("@/lib/settings");
  return {
    ...actual,
    updateSetting: vi.fn(),
  };
});

describe("InstallPrompt", () => {
  const mockOnSettingsChange = vi.fn();

  const defaultSettings: UserSettings = {
    progressiveHints: false,
    autoUseLogPose: true,
    notificationsOptIn: false,
    installPrompt: {
      dismissed: false,
      dismissedAt: null,
      completedDailiesCount: 0,
    },
  };

  const eligibleSettings: UserSettings = {
    ...defaultSettings,
    installPrompt: {
      dismissed: false,
      dismissedAt: null,
      completedDailiesCount: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0",
      configurable: true,
    });
  });

  it("does NOT render if fewer than 3 dailies completed", () => {
    const { container } = render(
      <InstallPrompt
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={new Event("beforeinstallprompt")}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does NOT render if already dismissed", () => {
    const dismissedSettings: UserSettings = {
      ...eligibleSettings,
      installPrompt: {
        ...eligibleSettings.installPrompt,
        dismissed: true,
      },
    };

    const { container } = render(
      <InstallPrompt
        settings={dismissedSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={new Event("beforeinstallprompt")}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does NOT render if eligible but NO install prompt event (and not iOS)", () => {
    const { container } = render(
      <InstallPrompt
        settings={eligibleSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={null}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when eligible and install prompt event exists", () => {
    render(
      <InstallPrompt
        settings={eligibleSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={new Event("beforeinstallprompt")}
      />
    );
    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
    expect(screen.getByText("Install App")).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("renders correctly on iOS (no install event needed)", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      configurable: true,
    });

    render(
      <InstallPrompt
        settings={eligibleSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={null}
      />
    );

    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
    expect(screen.getByText(/Tap the Share button below/)).toBeInTheDocument();
    expect(screen.queryByText("Install App")).not.toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("Dismiss button sets dismissed state", async () => {
    vi.mocked(settingsModule.updateSetting).mockReturnValue({
      ...eligibleSettings,
      installPrompt: {
        ...eligibleSettings.installPrompt,
        dismissed: true,
        dismissedAt: "2026-04-13T00:00:00Z",
      },
    });

    render(
      <InstallPrompt
        settings={eligibleSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={new Event("beforeinstallprompt")}
      />
    );

    fireEvent.click(screen.getByText("Later"));

    expect(settingsModule.updateSetting).toHaveBeenCalledWith(
      "installPrompt",
      expect.objectContaining({
        dismissed: true,
        dismissedAt: expect.any(String),
      })
    );

    expect(mockOnSettingsChange).toHaveBeenCalled();
  });

  it("Install button triggers event prompt and handles acceptance", async () => {
    vi.mocked(settingsModule.updateSetting).mockReturnValue({
      ...eligibleSettings,
      installPrompt: {
        ...eligibleSettings.installPrompt,
        dismissed: true,
        dismissedAt: "2026-04-13T00:00:00Z",
      },
    });

    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: "accepted" });
    const mockEvent = new Event("beforeinstallprompt") as any;
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = mockUserChoice;

    render(
      <InstallPrompt
        settings={eligibleSettings}
        onSettingsChange={mockOnSettingsChange}
        installPromptEvent={mockEvent}
      />
    );

    fireEvent.click(screen.getByText("Install App"));

    expect(mockPrompt).toHaveBeenCalled();

    await waitFor(() => {
      expect(settingsModule.updateSetting).toHaveBeenCalledWith(
        "installPrompt",
        expect.objectContaining({
          dismissed: true,
        })
      );
      expect(mockOnSettingsChange).toHaveBeenCalled();
    });
  });
});
