import type { Character, TierProgression } from "@/lib/types";

import { getCharactersForSaga } from "./characterSets";
import { SAGA_CATALOG } from "./sagaCatalog";
import { getSagaNodeStatus, getSagaProgressText } from "./sagas";
import type { SagaId } from "./types";

export function getFilteredCharacterPool(
  characters: Character[],
  progression: TierProgression,
  selectedSagaId: SagaId | null
): Character[] {
  if (selectedSagaId === null) {
    return characters;
  }

  const status = getSagaNodeStatus(progression, selectedSagaId);

  if (status === "locked") {
    return characters;
  }

  return getCharactersForSaga(characters, selectedSagaId);
}

export function getSelectableSagas(progression: TierProgression): Array<{
  sagaId: SagaId;
  label: string;
  status: "locked" | "unlocked" | "completed";
  progressText: string;
}> {
  return SAGA_CATALOG.map((saga) => ({
    sagaId: saga.id,
    label: saga.label,
    status: getSagaNodeStatus(progression, saga.id),
    progressText: getSagaProgressText(progression, saga.id),
  }));
}
