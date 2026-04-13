import { ARC_ORDER } from "@/lib/arcs";

import { SAGA_CATALOG, getSagaForArc } from "./sagaCatalog";
import type { SagaId } from "./types";

export function getSagaIdForArc(arcName: string): SagaId | null {
  return getSagaForArc(arcName);
}

export function getArcsForSaga(sagaId: SagaId): string[] {
  return SAGA_CATALOG.find((saga) => saga.id === sagaId)?.arcs ?? [];
}

export function validateAllArcsMapped(arcs: readonly string[] = ARC_ORDER): {
  unmapped: string[];
} {
  const unmapped = arcs.filter((arc) => getSagaIdForArc(arc) === null);
  return { unmapped };
}
