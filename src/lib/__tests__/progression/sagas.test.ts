import { describe, expect, it } from "vitest";

import { SAGA_CATALOG } from "../../progression/sagaCatalog";
import {
  createEmptyTierProgression,
  getAllSagaStatuses,
  getSagaNodeStatus,
  getSagaProgressText,
  recordDailyWin,
} from "../../progression/sagas";
import type { SagaId } from "../../progression/types";

function createDate(index: number): Date {
  const date = new Date("2026-04-01T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + index);
  return date;
}

function createWin(
  sagaId: SagaId,
  arc: string,
  targetCharacterId: string,
  dayIndex: number
) {
  return {
    sagaId,
    arc,
    targetCharacterId,
    now: createDate(dayIndex),
  };
}

describe("saga progression evaluation", () => {
  it("completes East Blue on casual without affecting another tier", () => {
    const casual = createEmptyTierProgression();
    const fan = createEmptyTierProgression();

    const wins = [
      createWin("east-blue", "Romance Dawn", "luffy", 0),
      createWin("east-blue", "Orange Town", "zoro", 1),
      createWin("east-blue", "Baratie", "sanji", 2),
    ];

    let progression = casual;
    for (const win of wins) {
      const result = recordDailyWin(
        progression,
        win.targetCharacterId,
        win.arc,
        win.now
      );
      progression = result.progression;
    }

    expect(getSagaNodeStatus(progression, "east-blue")).toBe("completed");
    expect(progression.sagas["east-blue"].progressCount).toBe(3);
    expect(progression.completedSagaCount).toBe(1);
    expect(getSagaNodeStatus(fan, "east-blue")).toBe("locked");
  });

  it("counts the same daily target only once across days", () => {
    const progression = createEmptyTierProgression();

    const first = recordDailyWin(
      progression,
      "luffy",
      "Romance Dawn",
      createDate(0)
    );
    const second = recordDailyWin(
      first.progression,
      "luffy",
      "Romance Dawn",
      createDate(1)
    );

    expect(first.events).toHaveLength(1);
    expect(second.events).toHaveLength(0);
    expect(second.progression.sagas["east-blue"].uniqueSolvedIds).toEqual([
      "luffy",
    ]);
    expect(second.progression.sagas["east-blue"].progressCount).toBe(1);
  });

  it("progresses different sagas independently", () => {
    let progression = createEmptyTierProgression();

    const eastBlue = recordDailyWin(
      progression,
      "luffy",
      "Romance Dawn",
      createDate(0)
    );
    progression = eastBlue.progression;

    const arabasta = recordDailyWin(
      progression,
      "vivi",
      "Arabasta",
      createDate(1)
    );
    progression = arabasta.progression;

    expect(progression.sagas["east-blue"].progressCount).toBe(1);
    expect(progression.sagas.arabasta.progressCount).toBe(1);
    expect(getSagaNodeStatus(progression, "east-blue")).toBe("unlocked");
    expect(getSagaNodeStatus(progression, "arabasta")).toBe("unlocked");
    expect(progression.completedSagaCount).toBe(0);
  });

  it("completes all 11 sagas and counts them", () => {
    let progression = createEmptyTierProgression();

    SAGA_CATALOG.forEach((saga, sagaIndex) => {
      const arc = saga.arcs[0];
      for (let winIndex = 0; winIndex < 3; winIndex += 1) {
        const result = recordDailyWin(
          progression,
          `${saga.id}-${winIndex}`,
          arc,
          createDate(sagaIndex * 3 + winIndex)
        );
        progression = result.progression;
      }
    });

    expect(progression.completedSagaCount).toBe(11);
    for (const saga of SAGA_CATALOG) {
      expect(getSagaNodeStatus(progression, saga.id)).toBe("completed");
    }
  });

  it("returns the expected node status and progress text", () => {
    let progression = createEmptyTierProgression();

    expect(getSagaNodeStatus(progression, "east-blue")).toBe("locked");
    expect(getSagaProgressText(progression, "east-blue")).toBe(
      "0/3 daily wins"
    );

    progression = recordDailyWin(
      progression,
      "luffy",
      "Romance Dawn",
      createDate(0)
    ).progression;

    expect(getSagaNodeStatus(progression, "east-blue")).toBe("unlocked");
    expect(getSagaProgressText(progression, "east-blue")).toBe(
      "1/3 daily wins"
    );

    progression = recordDailyWin(
      progression,
      "zoro",
      "Orange Town",
      createDate(1)
    ).progression;

    expect(getSagaProgressText(progression, "east-blue")).toBe(
      "2/3 daily wins"
    );

    progression = recordDailyWin(
      progression,
      "sanji",
      "Baratie",
      createDate(2)
    ).progression;

    expect(getSagaNodeStatus(progression, "east-blue")).toBe("completed");
    expect(getSagaProgressText(progression, "east-blue")).toBe("Completed");
  });

  it("emits unlock and completion events at the right milestones", () => {
    let progression = createEmptyTierProgression();

    const unlock = recordDailyWin(
      progression,
      "luffy",
      "Romance Dawn",
      createDate(0)
    );
    progression = unlock.progression;

    expect(unlock.events).toEqual([
      {
        type: "saga-unlocked",
        sagaId: "east-blue",
        sagaLabel: "East Blue Saga",
        timestamp: "2026-04-01T00:00:00.000Z",
      },
    ]);

    progression = recordDailyWin(
      progression,
      "zoro",
      "Orange Town",
      createDate(1)
    ).progression;
    const completion = recordDailyWin(
      progression,
      "sanji",
      "Baratie",
      createDate(2)
    );

    expect(completion.events).toEqual([
      {
        type: "saga-completed",
        sagaId: "east-blue",
        sagaLabel: "East Blue Saga",
        timestamp: "2026-04-03T00:00:00.000Z",
      },
    ]);
  });

  it("returns statuses for all sagas", () => {
    const progression = createEmptyTierProgression();
    const statuses = getAllSagaStatuses(progression);

    expect(Object.keys(statuses)).toHaveLength(11);
    expect(statuses["east-blue"]).toEqual({
      status: "locked",
      progressCount: 0,
    });
  });
});
