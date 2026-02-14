import { describe, it, expect } from "vitest";
import { getValidArcs } from "../arcs";
import charactersData from "@/data/characters.v2.json";
import introChapters from "../../../scripts/intro_chapters.json";

describe("Roster validation", () => {
  const characters = charactersData as any[];
  const characterIds = new Set(characters.map(c => c.id));
  const requiredIds = new Set(Object.keys(introChapters));
  const validArcs = getValidArcs();

  it("should have exactly 115 characters", () => {
    expect(characters.length).toBe(115);
  });

  it("should match all IDs from intro_chapters.json", () => {
    expect(characterIds.size).toBe(requiredIds.size);
    expect(characterIds).toEqual(requiredIds);
  });

  it("should have no extra characters beyond intro_chapters.json", () => {
    const extraIds = [...characterIds].filter(id => !requiredIds.has(id));
    expect(extraIds).toEqual([]);
  });

  it("should have no missing characters from intro_chapters.json", () => {
    const missingIds = [...requiredIds].filter(id => !characterIds.has(id));
    expect(missingIds).toEqual([]);
  });

  it("should have valid firstArc for all characters", () => {
    const invalidArcs: string[] = [];

    for (const char of characters) {
      const arc = char.firstArc;
      if (arc !== "?" && !validArcs.includes(arc)) {
        invalidArcs.push(`${char.name}: ${arc}`);
      }
    }

    expect(invalidArcs).toEqual([]);
  });

  it("should have all required schema fields", () => {
    const requiredFields = [
      "id", "name", "aliases", "imageUrl", "gender",
      "affiliationPrimary", "devilFruitType", "haki",
      "bounty", "heightCm", "origin", "firstArc"
    ];

    const missingFields: string[] = [];

    for (const char of characters) {
      for (const field of requiredFields) {
        if (!(field in char)) {
          missingFields.push(`${char.name || char.id}: missing ${field}`);
        }
      }
    }

    expect(missingFields).toEqual([]);
  });
});
