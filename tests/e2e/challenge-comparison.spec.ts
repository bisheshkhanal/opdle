import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const EVIDENCE_DIR = path.join(process.cwd(), ".sisyphus/evidence");

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

async function gotoHomeReady(page: import("@playwright/test").Page) {
  await page.goto("/");
  const challengesButton = page.getByRole("button", { name: "Challenges" });

  if (!(await challengesButton.isVisible({ timeout: 15000 }).catch(() => false))) {
    await page.reload();
  }

  await expect(challengesButton).toBeVisible({ timeout: 15000 });
}

async function mockAuthenticatedSession(
  page: import("@playwright/test").Page,
  userId = "s16-user"
) {
  await page.route("**/api/auth/session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: userId,
          name: "S16 User",
          email: "s16@example.com",
        },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
}

async function seedWonDailyState(
  page: import("@playwright/test").Page,
  guessCount: number
) {
  await page.evaluate((count) => {
    const key = "onepiecedle_v2";
    const raw = window.localStorage.getItem(key);
    if (!raw) return;

    const storage = JSON.parse(raw) as Record<string, unknown> & {
      daily?: Record<string, unknown>;
      tier?: string;
      hasSelectedTier?: boolean;
    };

    storage.tier = "casual";
    storage.hasSelectedTier = true;

    if (!storage.daily || typeof storage.daily !== "object") {
      storage.daily = {};
    }

    const date = new Date().toISOString().split("T")[0];
    const dateKey = `casual:${date}`;
    const guesses = Array.from({ length: count }, (_, index) => ({
      characterId: `s16-guess-${index + 1}`,
      characterName: `S16 Guess ${index + 1}`,
      imageUrl: `/characters/s16-guess-${index + 1}.png`,
      categories: [
        {
          key: "gender",
          label: "Gender",
          status: index === count - 1 ? "correct" : "wrong",
          value: "Male",
          displayValue: "Male",
        },
      ],
      isCorrect: index === count - 1,
    }));

    (storage.daily as Record<string, unknown>)[dateKey] = {
      date,
      guesses,
      guessedIds: guesses.map((guess) => guess.characterId),
      isFinished: true,
      isWon: true,
      hintUsed: false,
      streak: 3,
      maxStreak: 7,
    };

    window.localStorage.setItem(key, JSON.stringify(storage));
  }, guessCount);
}

test.describe("S16 challenge lifecycle and comparison coverage", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }
  });

  test("Challenge modal surfaces unauthenticated sign-in fallback", async ({ page }) => {
    await page.route("**/api/auth/session**", async (route) => {
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

    await expect(
      challengesDialog.getByRole("heading", { name: "Challenges", exact: true })
    ).toBeVisible();
    await expect(
      challengesDialog.getByRole("heading", {
        name: "Sign in to play Tracked Challenges",
      })
    ).toBeVisible();
    await expect(challengesDialog.getByRole("button", { name: "Sign In" })).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S16-challenge-comparison-e2e.png"),
      fullPage: true,
    });
  });

  test("Challenge modal authenticated tabs render across packs/history/leaderboard", async ({ page }) => {
    await mockAuthenticatedSession(page);

    await page.route("**/api/challenges**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      if (pathname === "/api/challenges/packs") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            packs: [
              {
                id: "east-blue-pack",
                title: "East Blue Pack",
                description: "Starter tracked challenges.",
              },
            ],
          }),
        });
        return;
      }

      if (pathname === "/api/challenges") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            history: [],
          }),
        });
        return;
      }

      if (pathname.startsWith("/api/challenges/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            challenge: { title: "S16 Tracked Challenge" },
            history: [],
          }),
        });
        return;
      }

      await route.continue();
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await page.getByRole("button", { name: "Challenges" }).click();
    const challengesDialog = page.getByRole("dialog", { name: "Challenges" });

    await expect(challengesDialog.getByRole("button", { name: "Packs" })).toBeVisible();
    await expect(
      challengesDialog.getByRole("button", { name: "History & Streaks" })
    ).toBeVisible();
    await expect(challengesDialog.getByRole("button", { name: "Leaderboard" })).toBeVisible();

    await challengesDialog.getByRole("button", { name: "Packs" }).click();
    await expect(challengesDialog.getByText("East Blue Pack")).toBeVisible();

    await challengesDialog.getByRole("button", { name: "History & Streaks" }).click();
    await expect(challengesDialog.getByText("Past Challenges")).toBeVisible();

    await challengesDialog.getByRole("button", { name: "Leaderboard" }).click();
    await expect(challengesDialog.getByPlaceholder("Enter Challenge ID")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S16-challenges-auth-tabs.png"),
      fullPage: true,
    });
  });

  test("Share card invocation is available after won daily state", async ({ page }) => {
    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await seedWonDailyState(page, 3);
    await page.reload();

    await expect(
      page.getByRole("button", { name: /Copy Results|Copied!/ })
    ).toBeVisible();

    const copyResultsButton = page.getByRole("button", {
      name: /Copy Results|Copied!/, 
    });
    await copyResultsButton.click();

    await expect(
      page.getByRole("button", {
        name: /Copy Results|Copied!/,
      })
    ).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S16-share-card-invocation.png"),
      fullPage: true,
    });
  });

  test("Daily comparison visualization renders chart and percentile messaging", async ({ page }) => {
    await mockAuthenticatedSession(page, "s16-comparison-user");

    await page.route("**/api/daily-results**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          date: "2026-04-13",
          tier: "casual",
          sampleSize: 12,
          totalWins: 10,
          avgGuesses: 3.4,
          rank: 2,
          percentile: 85,
          userGuessCount: 3,
          percentileMethod: "percent_rank",
          guessDistribution: [0, 2, 4, 3, 1, 0],
          trendWindowDays: 7,
          trendData: [
            {
              date: "2026-04-07",
              sampleSize: 7,
              totalWins: 5,
              avgGuesses: 4.1,
              guessDistribution: [0, 1, 2, 1, 1, 0],
              percentile: 70,
            },
            {
              date: "2026-04-08",
              sampleSize: 8,
              totalWins: 6,
              avgGuesses: 3.9,
              guessDistribution: [0, 1, 3, 1, 1, 0],
              percentile: 74,
            },
            {
              date: "2026-04-09",
              sampleSize: 9,
              totalWins: 7,
              avgGuesses: 3.6,
              guessDistribution: [0, 2, 3, 1, 1, 0],
              percentile: 77,
            },
            {
              date: "2026-04-10",
              sampleSize: 10,
              totalWins: 8,
              avgGuesses: 3.5,
              guessDistribution: [0, 2, 4, 1, 1, 0],
              percentile: 81,
            },
            {
              date: "2026-04-11",
              sampleSize: 10,
              totalWins: 8,
              avgGuesses: 3.5,
              guessDistribution: [0, 2, 4, 1, 1, 0],
              percentile: 83,
            },
            {
              date: "2026-04-12",
              sampleSize: 11,
              totalWins: 9,
              avgGuesses: 3.4,
              guessDistribution: [0, 2, 4, 2, 1, 0],
              percentile: 84,
            },
            {
              date: "2026-04-13",
              sampleSize: 12,
              totalWins: 10,
              avgGuesses: 3.4,
              guessDistribution: [0, 2, 4, 3, 1, 0],
              percentile: 85,
            },
          ],
          factionSlice: {
            factionSlug: "straw-hats",
            sampleSize: 5,
            totalWins: 4,
            avgGuesses: 3.1,
            guessDistribution: [0, 1, 2, 1, 0, 0],
          },
        }),
      });
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await seedWonDailyState(page, 3);
    await page.reload();

    await expect(page.getByTestId("distribution-chart")).toBeVisible();
    await expect(page.getByTestId("percentile-messaging")).toBeVisible();
    await expect(page.getByTestId("trend-section")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S16-daily-comparison-visualization.png"),
      fullPage: true,
    });
  });

  test("Expired challenge response degrades gracefully", async ({ page }) => {
    await mockAuthenticatedSession(page, "s16-expired-user");

    await page.route("**/api/challenges**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      if (pathname === "/api/challenges/packs") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ packs: [] }),
        });
        return;
      }

      if (pathname === "/api/challenges") {
        await route.fulfill({
          status: 410,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Challenge expired",
            history: [],
          }),
        });
        return;
      }

      await route.continue();
    });

    await gotoHomeReady(page);
    await dismissOnboarding(page);
    await closeBlockingModal(page);

    await page.getByRole("button", { name: "Challenges" }).click();
    const challengesDialog = page.getByRole("dialog", { name: "Challenges" });
    await challengesDialog.getByRole("button", { name: "History & Streaks" }).click();

    await expect(
      challengesDialog.getByRole("heading", { name: "Challenges", exact: true })
    ).toBeVisible();

    const emptyState = challengesDialog.getByText(
      "You haven't played any tracked challenges yet."
    );
    const streakCard = challengesDialog.getByText("Current Streak");

    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const hasStreakCard = await streakCard.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasEmptyState || hasStreakCard).toBeTruthy();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-S16-challenge-comparison-e2e-error.png"),
      fullPage: true,
    });
  });
});
