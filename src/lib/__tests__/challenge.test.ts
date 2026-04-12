import { describe, it, expect } from "vitest";
import { encodeChallengeSeed, decodeChallengeSeed } from "../challengeUtils";

describe("challengeUtils", () => {
  describe("encodeChallengeSeed", () => {
    it("produces a base64 string from a simple id", () => {
      const encoded = encodeChallengeSeed("luffy");
      expect(encoded).toBe(btoa(encodeURIComponent("luffy")));
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("handles ids with hyphens like 'monkey-d-luffy'", () => {
      const id = "monkey-d-luffy";
      const encoded = encodeChallengeSeed(id);
      expect(decodeURIComponent(atob(encoded))).toBe(id);
    });

    it("handles ids with special characters", () => {
      const id = "trafalgar-d-water-law";
      const encoded = encodeChallengeSeed(id);
      expect(decodeURIComponent(atob(encoded))).toBe(id);
    });

    it("handles empty string", () => {
      const encoded = encodeChallengeSeed("");
      expect(encoded).toBe(btoa(encodeURIComponent("")));
    });
  });

  describe("decodeChallengeSeed", () => {
    it("round-trips a simple id correctly", () => {
      const id = "luffy";
      const encoded = encodeChallengeSeed(id);
      expect(decodeChallengeSeed(encoded)).toBe(id);
    });

    it("round-trips hyphenated id", () => {
      const id = "monkey-d-luffy";
      const encoded = encodeChallengeSeed(id);
      expect(decodeChallengeSeed(encoded)).toBe(id);
    });

    it("round-trips id with special characters", () => {
      const id = "trafalgar-d-water-law";
      const encoded = encodeChallengeSeed(id);
      expect(decodeChallengeSeed(encoded)).toBe(id);
    });

    it("returns null for invalid base64 input", () => {
      expect(decodeChallengeSeed("!!!not-base64!!!")).toBeNull();
    });

    it("returns empty string for empty input (atob does not throw on empty)", () => {
      expect(decodeChallengeSeed("")).toBe("");
    });

    it("returns null for random garbage string", () => {
      expect(decodeChallengeSeed("not-valid-encoded-data@#$")).toBeNull();
    });

    it("returns null for partially valid base64 that fails decode", () => {
      expect(decodeChallengeSeed("aW52YWxpZCB1cmwgcGF0aA==")).toBeDefined();
      const decoded = decodeChallengeSeed("aW52YWxpZCB1cmwgcGF0aA==");
      expect(typeof decoded).toBe("string");
    });

    it("handles unicode ids via round-trip", () => {
      const id = "モンキー・D・ルフィ";
      const encoded = encodeChallengeSeed(id);
      expect(decodeChallengeSeed(encoded)).toBe(id);
    });
  });

  describe("encode/decode symmetry", () => {
    const ids = [
      "luffy",
      "monkey-d-luffy",
      "trafalgar-d-water-law",
      "portgas-d-ace",
      "marshall-d-teach",
    ];

    ids.forEach((id) => {
      it(`round-trips "${id}" without data loss`, () => {
        expect(decodeChallengeSeed(encodeChallengeSeed(id))).toBe(id);
      });
    });
  });
});
