import { describe, it, expect } from "vitest";
import characters from "./characters.v2.json";

const EXPECTED_CHARACTER_COUNT = 231;

describe("characters.v2.json data quality", () => {
  it("has the expected number of characters", () => {
    expect(characters.length).toBe(EXPECTED_CHARACTER_COUNT);
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
