import { describe, it, expect } from "vitest";
import {
  getLocalCharacterImageUrl,
  normalizeCharacterImageUrl,
  normalizeCharacterImage,
  normalizeGuessImage,
} from "../images";
import type { Character, GuessResult } from "../types";

const baseCharacter: Character = {
  id: "test-char",
  name: "Test Character",
  aliases: ["Test"],
  imageUrl: "/characters/test-char.png",
  gender: "Male",
  affiliationPrimary: "Test Crew",
  devilFruitType: ["Paramecia"],
  haki: ["O", "A"],
  bounty: 100000000,
  heightCm: 180,
  origin: "East Blue",
  firstArc: "Romance Dawn",
  minTier: "casual",
};

const baseGuess: GuessResult = {
  characterId: "test-char",
  characterName: "Test Character",
  imageUrl: "/characters/test-char.png",
  categories: [],
  isCorrect: false,
};

describe("images.ts", () => {
  describe("getLocalCharacterImageUrl", () => {
    it("returns the expected local image path", () => {
      expect(getLocalCharacterImageUrl("luffy")).toBe("/characters/luffy.png");
    });

    it("handles ids containing special characters", () => {
      expect(getLocalCharacterImageUrl("mr.2-bon_clay")).toBe(
        "/characters/mr.2-bon_clay.png"
      );
    });
  });

  describe("normalizeCharacterImageUrl", () => {
    it("converts remote URLs to local image paths", () => {
      expect(
        normalizeCharacterImageUrl("https://example.com/luffy.png", "luffy")
      ).toBe("/characters/luffy.png");
    });

    it("keeps already-local URLs unchanged", () => {
      expect(normalizeCharacterImageUrl("/characters/luffy.png", "luffy")).toBe(
        "/characters/luffy.png"
      );
    });
  });

  describe("normalizeCharacterImage", () => {
    it("returns the same object reference when image URL is already local", () => {
      const result = normalizeCharacterImage(baseCharacter);
      expect(result).toBe(baseCharacter);
    });

    it("returns a new object with normalized imageUrl when source URL is remote", () => {
      const remoteCharacter: Character = {
        ...baseCharacter,
        id: "remote-char",
        imageUrl: "https://example.com/remote-char.png",
      };

      const result = normalizeCharacterImage(remoteCharacter);

      expect(result).not.toBe(remoteCharacter);
      expect(result.imageUrl).toBe("/characters/remote-char.png");
      expect(remoteCharacter.imageUrl).toBe(
        "https://example.com/remote-char.png"
      );
    });
  });

  describe("normalizeGuessImage", () => {
    it("returns the same object reference when guess image URL is already local", () => {
      const result = normalizeGuessImage(baseGuess);
      expect(result).toBe(baseGuess);
    });

    it("returns a new object with normalized imageUrl when guess URL is remote", () => {
      const remoteGuess: GuessResult = {
        ...baseGuess,
        characterId: "remote-guess",
        imageUrl: "https://example.com/remote-guess.png",
      };

      const result = normalizeGuessImage(remoteGuess);

      expect(result).not.toBe(remoteGuess);
      expect(result.imageUrl).toBe("/characters/remote-guess.png");
      expect(remoteGuess.imageUrl).toBe("https://example.com/remote-guess.png");
    });
  });
});
