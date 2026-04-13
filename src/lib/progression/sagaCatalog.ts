import { ARC_ORDER } from "../arcs";
import type { SagaDef, SagaId } from "./types";

export const SAGA_CATALOG: SagaDef[] = [
  {
    id: "east-blue",
    label: "East Blue Saga",
    arcs: [
      "Romance Dawn",
      "Orange Town",
      "Syrup Village",
      "Baratie",
      "Arlong Park",
      "Loguetown",
    ],
    themeColor: "gold",
  },
  {
    id: "arabasta",
    label: "Arabasta Saga",
    arcs: [
      "Reverse Mountain",
      "Whisky Peak",
      "Little Garden",
      "Drum Island",
      "Arabasta",
    ],
    themeColor: "amber",
  },
  {
    id: "sky-island",
    label: "Sky Island Saga",
    arcs: ["Jaya", "Skypiea"],
    themeColor: "sky",
  },
  {
    id: "water-7",
    label: "Water 7 Saga",
    arcs: ["Long Ring Long Land", "Water 7", "Enies Lobby", "Post-Enies Lobby"],
    themeColor: "cyan",
  },
  {
    id: "thriller-bark",
    label: "Thriller Bark Saga",
    arcs: ["Thriller Bark"],
    themeColor: "violet",
  },
  {
    id: "summit-war",
    label: "Summit War Saga",
    arcs: [
      "Sabaody Archipelago",
      "Amazon Lily",
      "Impel Down",
      "Marineford",
      "Post-War",
    ],
    themeColor: "red",
  },
  {
    id: "fish-man-island",
    label: "Fish-Man Island Saga",
    arcs: ["Return to Sabaody", "Fish-Man Island"],
    themeColor: "blue",
  },
  {
    id: "dressrosa",
    label: "Dressrosa Saga",
    arcs: ["Punk Hazard", "Dressrosa"],
    themeColor: "rose",
  },
  {
    id: "whole-cake-island",
    label: "Whole Cake Island Saga",
    arcs: ["Zou", "Whole Cake Island"],
    themeColor: "pink",
  },
  {
    id: "wano-country",
    label: "Wano Country Saga",
    arcs: ["Levely", "Wano Country"],
    themeColor: "emerald",
  },
  {
    id: "final",
    label: "Final Saga",
    arcs: ["Egghead", "Elbaph"],
    themeColor: "purple",
  },
];

const SAGA_BY_ID = new Map<SagaId, SagaDef>(
  SAGA_CATALOG.map((saga) => [saga.id, saga])
);

const ARC_TO_SAGA = new Map<string, SagaId>();

for (const saga of SAGA_CATALOG) {
  for (const arc of saga.arcs) {
    ARC_TO_SAGA.set(arc.toLowerCase(), saga.id);
  }
}

const catalogArcs = new Set(SAGA_CATALOG.flatMap((saga) => saga.arcs));
const missingArcs = ARC_ORDER.filter((arc) => !catalogArcs.has(arc));

if (missingArcs.length > 0) {
  throw new Error(`Saga catalog is missing arcs: ${missingArcs.join(", ")}`);
}

export function getSagaForArc(arcName: string): SagaId | null {
  return ARC_TO_SAGA.get(arcName.trim().toLowerCase()) ?? null;
}

export function getSagaDef(sagaId: SagaId): SagaDef {
  const saga = SAGA_BY_ID.get(sagaId);

  if (!saga) {
    throw new Error(`Unknown saga id: ${sagaId}`);
  }

  return saga;
}
