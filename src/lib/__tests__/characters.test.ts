import { describe, it, expect } from "vitest";
import characters from "../../data/characters.v2.json";
describe("character dataset", () => {
  it("has ~200 characters", () => {
    expect(characters.length).toBeGreaterThanOrEqual(195);
    expect(characters.length).toBeLessThanOrEqual(250);
  });
  it("has correct tier distribution", () => {
    const casual = characters.filter((c) => c.minTier === "casual").length;
    const fan = characters.filter((c) => c.minTier === "fan").length;
    const nakama = characters.filter((c) => c.minTier === "nakama").length;
    expect(casual).toBeGreaterThan(60);
    expect(fan).toBeGreaterThan(60);
    expect(nakama).toBeGreaterThan(40);
  });
  it("has no duplicate ids", () => {
    const ids = characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("all characters have required fields", () => {
    const required = [
      "id",
      "name",
      "aliases",
      "imageUrl",
      "gender",
      "affiliationPrimary",
      "devilFruitType",
      "haki",
      "bounty",
      "heightCm",
      "origin",
      "firstArc",
      "minTier",
    ];
    characters.forEach((c) => {
      required.forEach((f) => expect(c).toHaveProperty(f));
    });
  });
});
