import type { MonthlyCollectibleDef, MonthlyCollectibleType } from "./types";

function getCollectibleType(seasonKey: string): MonthlyCollectibleType {
  const month = Number(seasonKey.slice(5, 7));

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "bounty-poster";
  }

  return month % 2 === 0 ? "vivre-card" : "bounty-poster";
}

export function getMonthlyCollectible(
  seasonKey: string
): MonthlyCollectibleDef {
  const collectibleType = getCollectibleType(seasonKey);
  const readableType =
    collectibleType === "bounty-poster" ? "Bounty Poster" : "Vivre Card";

  return {
    seasonKey,
    label: `${seasonKey} ${readableType}`,
    collectibleType,
    targetFragments: 24,
  };
}
