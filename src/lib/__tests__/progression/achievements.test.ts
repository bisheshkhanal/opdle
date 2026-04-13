import charactersData from "../../../data/characters.v2.json";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACHIEVEMENT_CATALOG } from "../../progression/achievementCatalog";
import {
  getDevilFruitUserIds,
  getHakiUserIds,
  getMarineIds,
} from "../../progression/characterSets";
import { evaluateAchievements } from "../../progression/achievements";
import type {
  AchievementProgress,
  Character,
  StorageSchema,
} from "../../types";
import { validateCharacter } from "../../types";
import { FakeClock } from "../../../test/fakeClock";
import {
  createEmptyStorageV4,
  createFakeGuess,
} from "../../../test/progressionFixtures";

function toCharacters(): Character[] {
  const result: Character[] = [];

  for (const candidate of charactersData as unknown[]) {
    if (!validateCharacter(candidate)) {
      throw new Error("Dataset contains invalid character shape");
    }

    result.push(candidate);
  }

  return result;
}

function createState(): StorageSchema {
  return createEmptyStorageV4();
}

function addDailySolvedId(
  state: StorageSchema,
  tier: "casual" | "fan" | "nakama",
  characterId: string
): void {
  const dateKey = `${tier}:2026-04-13`;

  state.daily[dateKey] = {
    date: "2026-04-13",
    guesses: [createFakeGuess({ characterId, isCorrect: true })],
    guessedIds: [characterId],
    isFinished: true,
    isWon: true,
    streak: 1,
    maxStreak: 1,
  };
}

function addInfiniteSolvedId(
  state: StorageSchema,
  tier: "casual" | "fan" | "nakama",
  characterId: string
): void {
  state.infinite[tier] = {
    roundId: `${tier}-round`,
    seed: 12345,
    guesses: [createFakeGuess({ characterId, isCorrect: true })],
    guessedIds: [characterId],
    isFinished: true,
    isWon: true,
    hintUsed: false,
    totalWins: 1,
    totalGames: 1,
  };
}

describe("achievement evaluation", () => {
  const characters = toCharacters();
  let clock: FakeClock;

  beforeEach(() => {
    clock = new FakeClock("2026-04-13T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(clock.now());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("evaluates streak and first-guess achievements from win events", () => {
    const state = createState();

    const result = evaluateAchievements(
      {
        type: "daily-win",
        characterId: "luffy",
        guessCount: 1,
        streak: 3,
        maxStreak: 3,
      },
      state,
      characters
    );

    expect(Object.keys(result.achievementProgress)).toHaveLength(
      ACHIEVEMENT_CATALOG.length
    );
    expect(result.achievementProgress["streak-3"]).toMatchObject({
      progress: 3,
      target: 3,
      status: "unlocked",
    });
    expect(result.achievementProgress["perfect-navigator"]).toMatchObject({
      progress: 1,
      target: 1,
      status: "unlocked",
    });
    expect(result.inboxEntries).toHaveLength(2);
  });

  it("counts unique-solve achievements once per unique character id", () => {
    const state = createState();
    const hakiIds = getHakiUserIds(characters);
    const devilFruitIds = getDevilFruitUserIds(characters);

    addDailySolvedId(state, "casual", hakiIds[0]);
    addInfiniteSolvedId(state, "fan", hakiIds[0]);
    addDailySolvedId(state, "nakama", hakiIds[1]);
    addDailySolvedId(state, "casual", devilFruitIds[0]);
    addInfiniteSolvedId(state, "fan", devilFruitIds[0]);

    const result = evaluateAchievements(
      {
        type: "daily-win",
        characterId: hakiIds[0],
        guessCount: 4,
        streak: 2,
        maxStreak: 2,
      },
      state,
      characters
    );

    expect(result.achievementProgress["haki-master"]).toMatchObject({
      progress: 2,
      target: hakiIds.length,
      status: "revealed",
    });
    expect(
      result.achievementProgress["devil-fruit-encyclopedia"]
    ).toMatchObject({
      progress: 2,
      target: getDevilFruitUserIds(characters).length,
      status: "revealed",
    });
  });

  it("reveals hidden achievements before unlocking them", () => {
    const state = createState();
    const hakiIds = getHakiUserIds(characters);

    addDailySolvedId(state, "casual", hakiIds[0]);

    const firstPass = evaluateAchievements(
      {
        type: "daily-win",
        characterId: hakiIds[0],
        guessCount: 2,
        streak: 1,
        maxStreak: 1,
      },
      state,
      characters
    );

    expect(firstPass.achievementProgress["haki-master"]).toMatchObject({
      progress: 1,
      status: "revealed",
    });
    expect(firstPass.inboxEntries).toHaveLength(0);

    for (const tier of ["casual", "fan", "nakama"] as const) {
      state.daily[`${tier}:2026-04-14`] = {
        date: "2026-04-14",
        guesses: hakiIds.map((characterId) =>
          createFakeGuess({ characterId, isCorrect: true })
        ),
        guessedIds: [...hakiIds],
        isFinished: true,
        isWon: true,
        streak: 1,
        maxStreak: 1,
      };
    }

    const secondPass = evaluateAchievements(
      {
        type: "daily-win",
        characterId: hakiIds[1],
        guessCount: 3,
        streak: 1,
        maxStreak: 1,
      },
      state,
      characters
    );

    expect(secondPass.achievementProgress["haki-master"]).toMatchObject({
      progress: hakiIds.length,
      status: "unlocked",
    });
    expect(secondPass.inboxEntries.length).toBeGreaterThanOrEqual(1);
    expect(
      secondPass.inboxEntries.some((entry) => entry.title === "Haki Master")
    ).toBe(true);
  });

  it("does not re-emit inbox entries for already unlocked achievements", () => {
    const state = createState();
    const unlockedAt = clock.now().toISOString();
    state.achievementProgress = {
      ...state.achievementProgress,
      "streak-3": {
        progress: 3,
        target: 3,
        status: "unlocked",
        unlockedAt,
        lastUpdatedAt: unlockedAt,
        seasonKey: null,
      },
    } as Record<string, AchievementProgress>;

    const result = evaluateAchievements(
      {
        type: "infinite-win",
        characterId: "zoro",
        guessCount: 6,
        streak: 1,
        maxStreak: 1,
      },
      state,
      characters
    );

    expect(result.achievementProgress["streak-3"]).toMatchObject({
      progress: 3,
      status: "unlocked",
      unlockedAt,
    });
    expect(result.inboxEntries).toHaveLength(0);
  });

  it("tracks grand line navigator from the max completed saga count across tiers", () => {
    const state = createState();
    state.progressionByTier!.casual.completedSagaCount = 4;
    state.progressionByTier!.fan.completedSagaCount = 11;
    state.progressionByTier!.nakama.completedSagaCount = 7;

    const result = evaluateAchievements(
      {
        type: "daily-win",
        characterId: getMarineIds(characters)[0],
        guessCount: 5,
        streak: 2,
        maxStreak: 2,
      },
      state,
      characters
    );

    expect(result.achievementProgress["grand-line-navigator"]).toMatchObject({
      progress: 11,
      target: 11,
      status: "unlocked",
    });
  });
});
