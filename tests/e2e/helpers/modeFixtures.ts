import type { Page } from "@playwright/test";

export interface GameFixture {
  page: Page;
}

export async function navigateToGame(page: Page): Promise<void> {
  await page.goto("http://localhost:3001");
  await page.waitForLoadState("networkidle");
}

export async function waitForGameReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  const gameBoard = page.locator(
    '[data-testid="game-board"], [data-testid="guess-input"], input[placeholder*="Search"], input[placeholder*="pirate"]'
  );
  await gameBoard.first().waitFor({ state: "visible", timeout: 15000 });
}
