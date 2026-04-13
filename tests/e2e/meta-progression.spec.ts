import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

import charactersData from "../../src/data/characters.v2.json";
import { normalizeCharacterImage } from "../../src/lib/images";
import { getUTCDateString, selectDailyCharacter } from "../../src/lib/daily";
import { getCharactersForTier } from "../../src/lib/tier";
import { validateCharacter } from "../../src/lib/types";
import type { Character, StorageSchema, Tier } from "../../src/lib/types";
import { getSagaForArc } from "../../src/lib/progression/sagaCatalog";
import { createEmptyLogPose, checkAndEarnCharge, checkMissedDayAndProtect } from "../../src/lib/progression/logPose";
import { createEmptyMonthlyCollections, getActiveSeason, getArchivedSeasons, recordDailyWinForMonthly } from "../../src/lib/progression/monthly";
import { createEmptyTierProgression, getSagaNodeStatus, recordDailyWin } from "../../src/lib/progression/sagas";
import { evaluateAchievements } from "../../src/lib/progression/achievements";

const APP_URL = "http://localhost:3001";
const EVIDENCE_DIR = path.join(process.cwd(), ".sisyphus/evidence");

const characters: Character[] = (charactersData as unknown[])
  .filter(validateCharacter)
  .map((character) => normalizeCharacterImage(character)) as Character[];

test.beforeAll(() => {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, `meta-progression-${safeTitle}.png`),
      fullPage: true,
    });
  }

  const clock = page.clock as unknown as { uninstall?: () => Promise<void> };
  await clock.uninstall?.();
});

async function installClock(page: Page, time: string): Promise<void> {
  await page.clock.install({ time: new Date(time) });
}

async function openGame(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("onepiecedle_onboarded", "true");
  });
  await page.goto(APP_URL);

  await expect(page.getByPlaceholder("Search for a pirate...")).toBeVisible();
}

async function setTier(page: Page, tier: Tier): Promise<void> {
  const label = tier[0].toUpperCase() + tier.slice(1);
  const button = page.getByRole("button", { name: new RegExp(`^${label}\\b`, "i") }).first();

  if ((await button.getAttribute("aria-pressed")) !== "true") {
    await button.click();
  }
}

async function solveDailyPuzzle(page: Page, character: Character): Promise<void> {
  const input = page.getByPlaceholder("Search for a pirate...");
  await input.fill(character.name);
  const option = page.getByRole("option", { name: character.name });
  await expect(option).toBeVisible();
  await option.click({ force: true });
  await expect(page.getByText("Victory!")).toBeVisible();
  await expect(page.getByRole("heading", { name: character.name })).toBeVisible();
}

async function readStorage(page: Page): Promise<StorageSchema> {
  return await page.evaluate(() => {
    const raw = localStorage.getItem("onepiecedle_v2");
    if (!raw) {
      throw new Error("Storage was not initialized");
    }

    return JSON.parse(raw) as StorageSchema;
  });
}

async function writeStorage(page: Page, storage: StorageSchema): Promise<void> {
  await page.evaluate((value) => {
    localStorage.setItem("onepiecedle_v2", JSON.stringify(value));
  }, storage);
}

function createDailyDate(date: string): Date {
  return new Date(`${date}T12:00:00.000Z`);
}

function getDailyTarget(
  tier: Tier,
  dateKey: string
): { dateKey: string; character: Character } {
  const tierCharacters = getCharactersForTier(characters, tier);
  const character = selectDailyCharacter(tierCharacters, dateKey, tier);

  return { dateKey, character };
}

function findDailyPairWithDifferentTargets(
  tier: Tier,
  startIso: string,
  limit = 120
): [
  { dateKey: string; character: Character },
  { dateKey: string; character: Character }
] {
  const tierCharacters = getCharactersForTier(characters, tier);
  const start = new Date(startIso);

  for (let offset = 0; offset < limit; offset += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + offset);
    const next = new Date(current);
    next.setUTCDate(current.getUTCDate() + 1);

    const currentDateKey = getUTCDateString(current);
    const nextDateKey = getUTCDateString(next);
    const currentCharacter = selectDailyCharacter(
      tierCharacters,
      currentDateKey,
      tier
    );
    const nextCharacter = selectDailyCharacter(tierCharacters, nextDateKey, tier);

    if (currentCharacter.id !== nextCharacter.id) {
      return [
        { dateKey: currentDateKey, character: currentCharacter },
        { dateKey: nextDateKey, character: nextCharacter },
      ];
    }
  }

  throw new Error("Unable to find consecutive daily targets that differ");
}

function findTargetsForSaga(
  tier: Tier,
  targetSagaId: string,
  count: number,
  startIso: string,
  limit = 240
): Array<{ dateKey: string; character: Character; sagaId: string }> {
  const tierCharacters = getCharactersForTier(characters, tier);
  const start = new Date(startIso);
  const results: Array<{ dateKey: string; character: Character; sagaId: string }> = [];
  const usedDates = new Set<string>();

  for (let offset = 0; offset < limit && results.length < count; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const dateKey = getUTCDateString(date);
    const character = selectDailyCharacter(tierCharacters, dateKey, tier);
    const resolvedSagaId = getSagaForArc(character.firstArc);

    if (!resolvedSagaId || resolvedSagaId !== targetSagaId || usedDates.has(dateKey)) {
      continue;
    }

    usedDates.add(dateKey);
    results.push({ dateKey, character, sagaId: resolvedSagaId });
  }

  if (results.length < count) {
    throw new Error("Unable to find enough saga-matched daily targets");
  }

  return results;
}

test.describe("Meta progression time travel", () => {
  test("UTC day rollover changes the daily puzzle", async ({ page }) => {
    const [dayOne, dayTwo] = findDailyPairWithDifferentTargets(
      "casual",
      "2026-04-01T00:00:00.000Z"
    );

    await installClock(page, `${dayOne.dateKey}T12:00:00.000Z`);
    await openGame(page);

    await setTier(page, "casual");
    await solveDailyPuzzle(page, dayOne.character);

    const storageAfterDayOne = await readStorage(page);
    expect(storageAfterDayOne.daily[`casual:${dayOne.dateKey}`]).toMatchObject({
      isWon: true,
      isFinished: true,
    });

    await page.clock.setFixedTime(new Date(`${dayTwo.dateKey}T00:00:30.000Z`));
    await page.reload();

    await expect(page.getByPlaceholder("Search for a pirate...")).toBeVisible();
    await setTier(page, "casual");
    await solveDailyPuzzle(page, dayTwo.character);

    expect(dayOne.character.id).not.toBe(dayTwo.character.id);
  });

  test("Month rollover archives the old season and starts a new one", async ({ page }) => {
    test.slow();
    await installClock(page, "2026-04-30T12:00:00.000Z");
    await openGame(page);

    const aprilTarget = getDailyTarget("casual", "2026-04-30");
    await setTier(page, "casual");
    await solveDailyPuzzle(page, aprilTarget.character);

    const aprilStorage = await readStorage(page);
    aprilStorage.monthlyCollections = recordDailyWinForMonthly(
      aprilStorage.monthlyCollections ?? createEmptyMonthlyCollections(),
      createDailyDate("2026-04-30")
    );
    await writeStorage(page, aprilStorage);

    expect(getActiveSeason(aprilStorage.monthlyCollections ?? createEmptyMonthlyCollections())?.revealedDays).toEqual([
      "2026-04-30",
    ]);

    await page.clock.setFixedTime(new Date("2026-05-01T12:00:00.000Z"));
    await page.reload();
    await setTier(page, "casual");

    const mayTarget = getDailyTarget("casual", "2026-05-01");
    await solveDailyPuzzle(page, mayTarget.character);

    const mayStorage = await readStorage(page);
    mayStorage.monthlyCollections = recordDailyWinForMonthly(
      mayStorage.monthlyCollections ?? createEmptyMonthlyCollections(),
      createDailyDate("2026-05-01")
    );
    await writeStorage(page, mayStorage);

    const monthly = mayStorage.monthlyCollections ?? createEmptyMonthlyCollections();
    expect(monthly.activeSeasonKey).toBe("2026-05");
    expect(getArchivedSeasons(monthly).map(({ seasonKey }) => seasonKey)).toContain(
      "2026-04"
    );
    expect(getActiveSeason(monthly)?.revealedDays).toContain("2026-05-01");
  });

  test("Saga progression unlocks and completes per tier", async ({ page }) => {
    test.slow();
    await installClock(page, "2026-04-01T12:00:00.000Z");
    await openGame(page);

    const eastBlueWins = findTargetsForSaga("casual", "east-blue", 3, "2026-04-01T00:00:00.000Z");
    await setTier(page, "casual");

    let storage = await readStorage(page);
    storage.progressionByTier = storage.progressionByTier ?? {
      casual: createEmptyTierProgression(),
      fan: createEmptyTierProgression(),
      nakama: createEmptyTierProgression(),
    };

    for (let index = 0; index < 3; index += 1) {
      const win = eastBlueWins[index] ?? eastBlueWins[0];
      await page.clock.setFixedTime(new Date(`${win.dateKey}T12:00:00.000Z`));
      await page.reload();
      await setTier(page, "casual");
      await solveDailyPuzzle(page, win.character);

      storage = await readStorage(page);
      storage.progressionByTier = storage.progressionByTier ?? {
        casual: createEmptyTierProgression(),
        fan: createEmptyTierProgression(),
        nakama: createEmptyTierProgression(),
      };
      const result = recordDailyWin(
        storage.progressionByTier!.casual,
        win.character.id,
        win.character.firstArc,
        createDailyDate(win.dateKey)
      );
      storage.progressionByTier!.casual = result.progression;
      await writeStorage(page, storage);
    }

    expect(getSagaNodeStatus(storage.progressionByTier!.casual, "east-blue")).toBe(
      "completed"
    );
    expect(storage.progressionByTier!.casual.completedSagaCount).toBe(1);

    const arabastaWin = findTargetsForSaga("fan", "arabasta", 1, "2026-04-01T00:00:00.000Z")[0];
    await setTier(page, "fan");
    await page.clock.setFixedTime(new Date(`${arabastaWin.dateKey}T12:00:00.000Z`));
    await page.reload();
    await setTier(page, "fan");
    await solveDailyPuzzle(page, arabastaWin.character);

    storage = await readStorage(page);
    storage.progressionByTier = storage.progressionByTier ?? {
      casual: createEmptyTierProgression(),
      fan: createEmptyTierProgression(),
      nakama: createEmptyTierProgression(),
    };
    const fanResult = recordDailyWin(
      storage.progressionByTier!.fan,
      arabastaWin.character.id,
      arabastaWin.character.firstArc,
      createDailyDate(arabastaWin.dateKey)
    );
    storage.progressionByTier!.fan = fanResult.progression;
    await writeStorage(page, storage);

    expect(getSagaNodeStatus(storage.progressionByTier!.fan, "arabasta")).toBe(
      "unlocked"
    );
    expect(storage.progressionByTier!.casual.completedSagaCount).toBe(1);
    expect(storage.progressionByTier!.fan.completedSagaCount).toBe(0);
  });

  test("Monthly collection fragments reveal on win", async ({ page }) => {
    test.slow();
    await installClock(page, "2026-04-12T12:00:00.000Z");
    await openGame(page);

    const target = getDailyTarget("casual", "2026-04-12");
    await setTier(page, "casual");
    await solveDailyPuzzle(page, target.character);

    const storage = await readStorage(page);
    storage.monthlyCollections = recordDailyWinForMonthly(
      storage.monthlyCollections ?? createEmptyMonthlyCollections(),
      createDailyDate(target.dateKey)
    );
    await writeStorage(page, storage);

    const monthly = storage.monthlyCollections ?? createEmptyMonthlyCollections();
    expect(getActiveSeason(monthly)?.revealedDays).toContain(target.dateKey);
    expect(getActiveSeason(monthly)?.revealedFragmentIndexes).toHaveLength(1);
  });

  test("Log Pose auto-protection consumes a charge after a 7-day streak", async ({ page }) => {
    test.slow();
    await installClock(page, "2026-04-01T12:00:00.000Z");
    await openGame(page);

    let logPose = createEmptyLogPose();
    let lastDateKey = "";

    for (let index = 0; index < 7; index += 1) {
      const currentDate = new Date("2026-04-01T12:00:00.000Z");
      currentDate.setUTCDate(currentDate.getUTCDate() + index);
      const dateKey = getUTCDateString(currentDate);
      const target = getDailyTarget("casual", dateKey);

      await page.clock.setFixedTime(new Date(`${dateKey}T12:00:00.000Z`));
      await page.reload();
      await setTier(page, "casual");
      await solveDailyPuzzle(page, target.character);

      logPose = checkAndEarnCharge(logPose, index + 1, createDailyDate(dateKey)).logPose;
      lastDateKey = dateKey;
    }

    expect(logPose.charges).toBe(1);

    const protectedResult = checkMissedDayAndProtect(
      logPose,
      lastDateKey,
      getUTCDateString(new Date("2026-04-09T12:00:00.000Z")),
      true,
      createDailyDate("2026-04-09")
    );

    expect(protectedResult.wasProtected).toBe(true);
    expect(protectedResult.streakSurvived).toBe(true);
    expect(protectedResult.logPose.charges).toBe(0);
    expect(protectedResult.logPose.consumptions).toHaveLength(1);
  });

  test('Achievement toast delivery shows "Perfect Navigator"', async ({ page }) => {
    test.slow();
    await installClock(page, "2026-04-13T12:00:00.000Z");
    await openGame(page);

    const target = getDailyTarget("casual", "2026-04-13");
    await setTier(page, "casual");
    await solveDailyPuzzle(page, target.character);

    let storage = await readStorage(page);
    const achievementResult = evaluateAchievements(
      {
        type: "daily-win",
        characterId: target.character.id,
        guessCount: 1,
        streak: 1,
        maxStreak: 1,
      },
      {
        achievementProgress: storage.achievementProgress,
        daily: storage.daily,
        infinite: storage.infinite,
        progressionByTier: storage.progressionByTier,
      },
      characters
    );

    storage.achievementProgress = achievementResult.achievementProgress;
    storage.metaInbox = [...(storage.metaInbox ?? []), ...achievementResult.inboxEntries];
    await writeStorage(page, storage);

    await page.reload();

    await expect(page.locator('div[role="alert"]').filter({ hasText: "Perfect Navigator" })).toBeVisible();
  });
});
