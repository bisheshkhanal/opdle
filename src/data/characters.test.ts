import { describe, it, expect } from "vitest";
import characters from "./characters.v2.json";

const EXPECTED_CHARACTER_COUNT = 231;

type OptionalEnrichmentFields = {
  age?: number | null;
  status?: "Alive" | "Deceased" | "Unknown" | null;
  crewHistory?: Array<{
    crew: string;
    role?: string;
    fromArc?: string;
    toArc?: string;
  }>;
  epithet?: string | null;
  quotesOrLaughs?: string[];
  provenance?: {
    source: string;
    scrapedAt: string;
    version: number;
  };
};

describe("characters.v2.json data quality", () => {
  it("has the expected number of characters", () => {
    expect(characters.length).toBe(EXPECTED_CHARACTER_COUNT);
  });

  it("keeps optional enrichment fields valid when present", () => {
    const validStatus = new Set(["Alive", "Deceased", "Unknown"]);

    const bad = characters.filter((c) => {
      const character = c as Record<string, unknown> & OptionalEnrichmentFields;

      if (
        character.age !== undefined &&
        character.age !== null &&
        typeof character.age !== "number"
      ) {
        return true;
      }

      if (
        character.status !== undefined &&
        character.status !== null &&
        !validStatus.has(character.status)
      ) {
        return true;
      }

      if (
        character.epithet !== undefined &&
        character.epithet !== null &&
        typeof character.epithet !== "string"
      ) {
        return true;
      }

      if (character.quotesOrLaughs !== undefined) {
        if (!Array.isArray(character.quotesOrLaughs)) {
          return true;
        }

        if (
          character.quotesOrLaughs.some(
            (quote: string) => typeof quote !== "string"
          )
        ) {
          return true;
        }
      }

      if (character.crewHistory !== undefined) {
        if (!Array.isArray(character.crewHistory)) {
          return true;
        }

        if (
          character.crewHistory.some((entry) => {
            if (!entry || typeof entry !== "object") {
              return true;
            }

            const crewEntry = entry as Record<string, unknown>;
            if (
              typeof crewEntry.crew !== "string" ||
              crewEntry.crew.length === 0
            ) {
              return true;
            }

            if (
              crewEntry.role !== undefined &&
              typeof crewEntry.role !== "string"
            ) {
              return true;
            }

            if (
              crewEntry.fromArc !== undefined &&
              typeof crewEntry.fromArc !== "string"
            ) {
              return true;
            }

            if (
              crewEntry.toArc !== undefined &&
              typeof crewEntry.toArc !== "string"
            ) {
              return true;
            }

            return false;
          })
        ) {
          return true;
        }
      }

      if (character.provenance !== undefined) {
        if (!character.provenance || typeof character.provenance !== "object") {
          return true;
        }

        const provenance = character.provenance as Record<string, unknown>;
        if (
          typeof provenance.source !== "string" ||
          provenance.source.length === 0
        ) {
          return true;
        }

        if (
          typeof provenance.scrapedAt !== "string" ||
          provenance.scrapedAt.length === 0
        ) {
          return true;
        }

        if (
          typeof provenance.version !== "number" ||
          !Number.isInteger(provenance.version)
        ) {
          return true;
        }
      }

      return false;
    });

    expect(bad).toEqual([]);
  });

  it("has no aliases containing pipe characters", () => {
    const bad = characters.filter((c) =>
      (c.aliases || []).some((a) => a.includes("|"))
    );
    expect(bad).toEqual([]);
  });

  it("has no aliases containing semicolons", () => {
    const bad = characters.filter((c) =>
      (c.aliases || []).some((a) => a.includes(";"))
    );
    expect(bad).toEqual([]);
  });

  it("has no aliases with adjacent double quotes", () => {
    const bad = characters.filter((c) =>
      (c.aliases || []).some((a) => a.includes('""'))
    );
    expect(bad).toEqual([]);
  });
});
