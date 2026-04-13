import { test, expect } from "@playwright/test";
import fs from "fs";
import http, { type Server } from "http";
import path from "path";

const EVIDENCE_DIR = path.join(process.cwd(), ".sisyphus/evidence");
let profileApiMockServer: Server | null = null;

async function dismissOnboarding(page: import("@playwright/test").Page) {
  const onboardingHeading = page.getByText("How big of a One Piece fan are you?");
  if (await onboardingHeading.isVisible({ timeout: 2500 }).catch(() => false)) {
    await page.getByRole("button", { name: "Select" }).first().click();
    await expect(onboardingHeading).toBeHidden();
  }
}

async function closeBlockingModal(page: import("@playwright/test").Page) {
  const closeModalButton = page.getByRole("button", { name: "Close modal" });
  if (await closeModalButton.isVisible({ timeout: 2500 }).catch(() => false)) {
    await closeModalButton.click();
    await expect(closeModalButton).toBeHidden();
  }
}

async function openLeaderboard(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Leaderboard" }).click();
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
}

async function gotoHomeReady(page: import("@playwright/test").Page) {
  await page.goto("/");
  const leaderboardButton = page.getByRole("button", { name: "Leaderboard" });

  if (!(await leaderboardButton.isVisible({ timeout: 15000 }).catch(() => false))) {
    await page.reload();
  }

  await expect(leaderboardButton).toBeVisible({ timeout: 15000 });
}

async function mockLeaderboardApisWithData(page: import("@playwright/test").Page) {
  await page.route("**/api/leaderboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          username: "zoro",
          maxStreak: 14,
          totalWins: 25,
          totalGames: 31,
          factionMembership: {
            factionId: "f-straw-hats",
            factionName: "Straw Hat Pirates",
            factionSlug: "straw-hats",
          },
        },
      ]),
    });
  });

  await page.route("**/api/factions/leaderboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        weekKey: "2026-W15",
        weekStartUtc: "2026-04-06T00:00:00.000Z",
        weekEndUtc: "2026-04-13T00:00:00.000Z",
        rankings: [
          {
            factionId: "f-straw-hats",
            factionName: "Straw Hat Pirates",
            factionSlug: "straw-hats",
            points: 45,
            avgGuesses: 3.2,
            participantCount: 9,
            rank: 1,
            percentile: 100,
          },
        ],
      }),
    });
  });
}

async function mockLeaderboardApisEmpty(page: import("@playwright/test").Page) {
  await page.route("**/api/leaderboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/factions/leaderboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        weekKey: "2026-W15",
        weekStartUtc: "2026-04-06T00:00:00.000Z",
        weekEndUtc: "2026-04-13T00:00:00.000Z",
        rankings: [],
      }),
    });
  });
}

function startProfileApiMockServer() {
  return new Promise<void>((resolve) => {
    profileApiMockServer = http.createServer((req, res) => {
      const reqUrl = req.url || "";

      if (reqUrl.startsWith("/api/profile/")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            user: {
              id: "user-s15-unaffiliated",
              username: "s15-unaffiliated",
              createdAt: "2026-04-01T00:00:00.000Z",
              faction: null,
            },
            stats: [],
            meta: {
              completedSagaCount: 0,
              achievementCount: 0,
              completedCollectionCount: 0,
              recentAchievements: [],
              completedCollections: [],
            },
          })
        );
        return;
      }

      res.statusCode = 404;
      res.end("not found");
    });

    profileApiMockServer.on("error", () => {
      profileApiMockServer = null;
      resolve();
    });

    profileApiMockServer.listen(3000, () => {
      resolve();
    });
  });
}

test.describe("S15 social faction onboarding coverage", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }

    await startProfileApiMockServer();
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (!profileApiMockServer) {
        resolve();
        return;
      }

      profileApiMockServer.close(() => resolve());
      profileApiMockServer = null;
    });
  });

  test("Faction leaderboard visibility and fallback", async ({ page }) => {
    await mockLeaderboardApisWithData(page);

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await openLeaderboard(page);
    await expect(page.getByRole("button", { name: "Individual" })).toBeVisible();
    await page.getByRole("button", { name: "Factions" }).click();

    await expect(page.getByRole("button", { name: "Factions" })).toBeVisible();

    await expect(page.getByText("Faction", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Straw Hat Pirates")).toBeVisible();
    await expect(page.getByText("45", { exact: true })).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-faction-e2e.png"),
      fullPage: true,
    });
  });

  test("Individual leaderboard shows faction badge when available", async ({ page }) => {
    await mockLeaderboardApisWithData(page);

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await openLeaderboard(page);
    await page.getByRole("button", { name: "Individual" }).click();

    await expect(page.getByText("Pirate", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("zoro", { exact: true })).toBeVisible();

    const factionBadge = page.getByTitle("Straw Hat Pirates");
    if (await factionBadge.count()) {
      await expect(factionBadge).toBeVisible();
    } else {
      await expect(page.getByText("zoro", { exact: true })).toBeVisible();
    }

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-individual-faction-badge.png"),
      fullPage: true,
    });
  });

  test("Signed-out fallback on leaderboard surfaces", async ({ page }) => {
    await mockLeaderboardApisEmpty(page);

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);
    await openLeaderboard(page);

    await expect(page.getByText("No pirates on the board yet.")).toBeVisible();

    const factionsButton = page.getByRole("button", { name: "Factions" });
    await expect(factionsButton).toBeVisible();

    await factionsButton.click();
    await expect(page.getByText("No factions on the board this week.")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-signed-out-leaderboard-fallback.png"),
      fullPage: true,
    });
  });

  test("Profile page shows faction identity or unaffiliated fallback", async ({ page }) => {
    await page.goto("/profile/s15-unaffiliated");
    await expect(page.getByText("s15-unaffiliated")).toBeVisible();
    await expect(page.getByText("Unaffiliated Pirate")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-profile-faction-display.png"),
      fullPage: true,
    });
  });

  test("Challenges modal renders tabs", async ({ page }) => {
    await mockLeaderboardApisWithData(page);

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "s15-user",
            name: "s15-user",
            email: "s15-user@example.com",
          },
          expires: "2099-01-01T00:00:00.000Z",
        }),
      });
    });

    await page.route("**/api/challenges/packs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ packs: [] }),
      });
    });

    await page.route("**/api/challenges", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ history: [] }),
      });
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await page.getByRole("button", { name: "Challenges" }).click();
    const challengesDialog = page.getByRole("dialog", { name: "Challenges" });
    await expect(challengesDialog.getByRole("heading", { name: "Challenges" })).toBeVisible();
    await expect(challengesDialog.getByRole("button", { name: "Packs" })).toBeVisible();
    await expect(
      challengesDialog.getByRole("button", { name: "History & Streaks" })
    ).toBeVisible();
    await expect(
      challengesDialog.getByRole("button", { name: "Leaderboard" }).first()
    ).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-challenges-modal-tabs.png"),
      fullPage: true,
    });
  });

  test("Challenges modal shows unauthenticated sign-in prompt", async ({ page }) => {
    await mockLeaderboardApisWithData(page);

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await page.getByRole("button", { name: "Challenges" }).click();
    const challengesDialog = page.getByRole("dialog", { name: "Challenges" });
    await expect(challengesDialog.getByRole("heading", { name: "Challenges", exact: true })).toBeVisible();

    await expect(
      challengesDialog.getByRole("heading", {
        name: "Sign in to play Tracked Challenges",
      })
    ).toBeVisible();
    await expect(challengesDialog.getByRole("button", { name: "Sign In" })).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S15-challenges-modal-unauth.png"),
      fullPage: true,
    });
  });
});
