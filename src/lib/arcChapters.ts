/**
 * Maps One Piece manga chapter ranges to canonical arc names
 * Used for automatic firstArc assignment based on debut chapter
 */

export interface ArcChapterRange {
  arc: string;
  start: number;
  end: number;
}

/**
 * Canonical chapter ranges for each arc in chronological order
 * Based on official One Piece manga volumes and arc divisions
 */
export const ARC_CHAPTER_RANGES: readonly ArcChapterRange[] = [
  // East Blue Saga
  { arc: "Romance Dawn", start: 1, end: 7 },
  { arc: "Orange Town", start: 8, end: 21 },
  { arc: "Syrup Village", start: 22, end: 41 },
  { arc: "Baratie", start: 42, end: 68 },
  { arc: "Arlong Park", start: 69, end: 95 },
  { arc: "Loguetown", start: 96, end: 100 },

  // Arabasta Saga
  { arc: "Reverse Mountain", start: 101, end: 105 },
  { arc: "Whisky Peak", start: 106, end: 114 },
  { arc: "Little Garden", start: 115, end: 129 },
  { arc: "Drum Island", start: 130, end: 154 },
  { arc: "Arabasta", start: 155, end: 217 },

  // Sky Island Saga
  { arc: "Jaya", start: 218, end: 236 },
  { arc: "Skypiea", start: 237, end: 302 },

  // Water 7 Saga
  { arc: "Long Ring Long Land", start: 303, end: 321 },
  { arc: "Water 7", start: 322, end: 374 },
  { arc: "Enies Lobby", start: 375, end: 430 },
  { arc: "Post-Enies Lobby", start: 431, end: 441 },

  // Thriller Bark Saga
  { arc: "Thriller Bark", start: 442, end: 489 },

  // Summit War Saga
  { arc: "Sabaody Archipelago", start: 490, end: 513 },
  { arc: "Amazon Lily", start: 514, end: 524 },
  { arc: "Impel Down", start: 525, end: 549 },
  { arc: "Marineford", start: 550, end: 580 },
  { arc: "Post-War", start: 581, end: 597 },

  // Fish-Man Island Saga
  { arc: "Return to Sabaody", start: 598, end: 602 },
  { arc: "Fish-Man Island", start: 603, end: 653 },

  // Dressrosa Saga
  { arc: "Punk Hazard", start: 654, end: 699 },
  { arc: "Dressrosa", start: 700, end: 801 },

  // Whole Cake Island Saga
  { arc: "Zou", start: 802, end: 824 },
  { arc: "Whole Cake Island", start: 825, end: 902 },

  // Wano Country Saga
  { arc: "Levely", start: 903, end: 908 },
  { arc: "Wano Country", start: 909, end: 1057 },

  // Final Saga
  { arc: "Egghead", start: 1058, end: 1125 },
  { arc: "Elbaph", start: 1126, end: 9999 }, // Ongoing
];

/**
 * Find the arc name for a given manga chapter number
 * @param chapter - The manga chapter number
 * @returns The arc name, or null if not found
 */
export function getArcFromChapter(chapter: number): string | null {
  const range = ARC_CHAPTER_RANGES.find(
    (r) => chapter >= r.start && chapter <= r.end
  );
  return range ? range.arc : null;
}

/**
 * Validate that all arcs are covered without gaps or overlaps
 */
export function validateArcRanges(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < ARC_CHAPTER_RANGES.length - 1; i++) {
    const current = ARC_CHAPTER_RANGES[i];
    const next = ARC_CHAPTER_RANGES[i + 1];

    // Check for gap
    if (current.end + 1 !== next.start) {
      errors.push(
        `Gap between ${current.arc} (ends ${current.end}) and ${next.arc} (starts ${next.start})`
      );
    }

    // Check for overlap
    if (current.end >= next.start) {
      errors.push(
        `Overlap between ${current.arc} and ${next.arc} at chapter ${current.end}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
