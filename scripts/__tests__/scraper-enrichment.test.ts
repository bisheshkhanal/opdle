import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildProvenance,
  cleanAliases,
  extractAge,
  extractEpithet,
  extractStatus,
} from "../scrape-characters";

describe("scraper enrichment helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cleanAliases removes wiki quote artifacts", () => {
    expect(
      cleanAliases(['"Luffy"', "|'Captain'|", ";The Future Pirate King;", ""])
    ).toEqual(["Luffy", "Captain", "The Future Pirate King"]);
  });

  it("extractAge returns null for absent or unparseable infoboxes", () => {
    expect(extractAge({})).toBeNull();
    expect(extractAge({ age: "Unknown" })).toBeNull();
    expect(extractAge({ age: "N/A" })).toBeNull();
  });

  it("extractStatus handles status values and absence", () => {
    expect(extractStatus({})).toBeNull();
    expect(extractStatus({ status: "Alive" })).toBe("Alive");
    expect(extractStatus({ status: "Deceased" })).toBe("Deceased");
    expect(extractStatus({ status: "Unknown" })).toBe("Unknown");
  });

  it("extractEpithet returns null when absent", () => {
    expect(extractEpithet({})).toBeNull();
  });

  it("buildProvenance returns wiki metadata with the current timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T00:00:00.000Z"));

    expect(buildProvenance("wiki")).toEqual({
      source: "wiki",
      scrapedAt: "2026-04-12T00:00:00.000Z",
      version: 1,
    });
  });
});
