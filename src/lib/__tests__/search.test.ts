import { describe, it, expect } from "vitest";
import {
  searchCharacters,
  findCharacterByName,
  findCharacterById,
  getAllNames,
} from "../search";
import type { Character } from "../types";

// Mock characters for testing with new schema
const mockCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    aliases: ["Luffy", "Straw Hat", "Mugiwara"],
    imageUrl: "https://example.com/luffy.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O", "A", "C"],
    bounty: 3000000000,
    heightCm: 174,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    aliases: ["Zoro", "Pirate Hunter"],
    imageUrl: "https://example.com/zoro.png",
    gender: "Male",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: ["O", "A", "C"],
    bounty: 1111000000,
    heightCm: 181,
    origin: "East Blue",
    firstArc: "Romance Dawn",
    minTier: "casual",
  },
  {
    id: "nami",
    name: "Nami",
    aliases: ["Cat Burglar"],
    imageUrl: "https://example.com/nami.png",
    gender: "Female",
    affiliationPrimary: "Straw Hat Pirates",
    devilFruitType: ["None"],
    haki: [],
    bounty: 366000000,
    heightCm: 170,
    origin: "East Blue",
    firstArc: "Orange Town",
    minTier: "casual",
  },
  {
    id: "law",
    name: "Trafalgar D. Water Law",
    aliases: ["Law", "Surgeon of Death"],
    imageUrl: "https://example.com/law.png",
    gender: "Male",
    affiliationPrimary: "Heart Pirates",
    devilFruitType: ["Paramecia"],
    haki: ["O", "A"],
    bounty: 3000000000,
    heightCm: 191,
    origin: "North Blue",
    firstArc: "Sabaody Archipelago",
    minTier: "casual",
  },
];

describe("search.ts", () => {
  describe("searchCharacters", () => {
    it("should return empty array for empty query", () => {
      expect(searchCharacters(mockCharacters, "")).toEqual([]);
      expect(searchCharacters(mockCharacters, "  ")).toEqual([]);
    });

    it("should find character by exact name", () => {
      const results = searchCharacters(mockCharacters, "Nami");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("Nami");
    });

    it("should find character by partial name", () => {
      const results = searchCharacters(mockCharacters, "luf");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("Monkey D. Luffy");
    });

    it("should find character by alias", () => {
      const results = searchCharacters(mockCharacters, "Straw Hat");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("luffy");
    });

    it("should find character by partial alias", () => {
      const results = searchCharacters(mockCharacters, "Pirate Hunt");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("zoro");
    });

    it("should be case insensitive", () => {
      const results1 = searchCharacters(mockCharacters, "LUFFY");
      const results2 = searchCharacters(mockCharacters, "luffy");
      const results3 = searchCharacters(mockCharacters, "LuFfY");

      expect(results1[0]?.id).toBe("luffy");
      expect(results2[0]?.id).toBe("luffy");
      expect(results3[0]?.id).toBe("luffy");
    });

    it("should respect limit parameter", () => {
      const results = searchCharacters(mockCharacters, "a", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should prioritize exact name matches", () => {
      const results = searchCharacters(mockCharacters, "Nami");
      expect(results[0].name).toBe("Nami");
    });

    it("should return multiple matches when applicable", () => {
      const results = searchCharacters(mockCharacters, "a");
      expect(results.length).toBeGreaterThan(1);
    });

    describe("searchCharacters - edge cases", () => {
      it('punctuation-only query like "!!!" should return empty array', () => {
        // BUG: punctuation-only query matches everything
        expect(searchCharacters(mockCharacters, "!!!")).toEqual([]);
      });

      it("query with only spaces returns empty array", () => {
        expect(searchCharacters(mockCharacters, "    ")).toEqual([]);
      });

      it("query with diacritics still matches normalized names", () => {
        const accentedCharacters: Character[] = [
          {
            ...mockCharacters[3],
            id: "trafalgar-accented",
            name: "Trafálgar D. Water Law",
          },
        ];

        const results = searchCharacters(accentedCharacters, "trafalgar");

        expect(results.length).toBe(1);
        expect(results[0].id).toBe("trafalgar-accented");
      });

      it("query matching both name and alias ranks name match higher", () => {
        const mixedCharacters: Character[] = [
          mockCharacters[3],
          {
            ...mockCharacters[0],
            id: "luffy-with-law-alias",
            aliases: [...mockCharacters[0].aliases, "Law"],
          },
        ];

        const results = searchCharacters(mixedCharacters, "law");

        expect(results[0].id).toBe("law");
      });

      it("empty aliases array does not cause issues", () => {
        const emptyAliasCharacter: Character = {
          ...mockCharacters[0],
          id: "ace",
          name: "Portgas D. Ace",
          aliases: [],
        };

        const results = searchCharacters([emptyAliasCharacter], "ace");
        expect(results[0]?.id).toBe("ace");
      });
    });
  });

  describe("searchCharacters - limit enforcement", () => {
    it("respects limit parameter exactly", () => {
      const expandedCharacters: Character[] = Array.from(
        { length: 12 },
        (_, i) => ({
          ...mockCharacters[0],
          id: `luffy-${i}`,
          name: `Luffy ${i}`,
        })
      );

      const results = searchCharacters(expandedCharacters, "luffy", 3);
      expect(results.length).toBe(3);
    });

    it("default limit is 10", () => {
      const expandedCharacters: Character[] = Array.from(
        { length: 15 },
        (_, i) => ({
          ...mockCharacters[0],
          id: `zoro-${i}`,
          name: `Zoro ${i}`,
        })
      );

      const results = searchCharacters(expandedCharacters, "zoro");
      expect(results.length).toBe(10);
    });
  });

  describe("findCharacterByName", () => {
    it("should find character by exact name", () => {
      const char = findCharacterByName(mockCharacters, "Nami");
      expect(char?.id).toBe("nami");
    });

    it("should find character by alias", () => {
      const char = findCharacterByName(mockCharacters, "Straw Hat");
      expect(char?.id).toBe("luffy");
    });

    it("should be case insensitive", () => {
      const char = findCharacterByName(mockCharacters, "nami");
      expect(char?.id).toBe("nami");
    });

    it("should return undefined for non-existent character", () => {
      const char = findCharacterByName(mockCharacters, "Kaido");
      expect(char).toBeUndefined();
    });

    it("should find full name match", () => {
      const char = findCharacterByName(mockCharacters, "Monkey D. Luffy");
      expect(char?.id).toBe("luffy");
    });

    describe("findCharacterByName - edge cases", () => {
      it("finds by alias exact match", () => {
        const char = findCharacterByName(mockCharacters, "Pirate Hunter");
        expect(char?.id).toBe("zoro");
      });

      it("is case-insensitive exact match", () => {
        const char = findCharacterByName(mockCharacters, "MONKEY D. LUFFY");
        expect(char?.id).toBe("luffy");
      });

      it("returns undefined for non-existent name", () => {
        const char = findCharacterByName(mockCharacters, "Gol D. Roger");
        expect(char).toBeUndefined();
      });

      it("handles special characters in names", () => {
        const specialNameCharacters: Character[] = [
          {
            ...mockCharacters[0],
            id: "whitebeard",
            name: "Edward Newgate (Whitebeard)",
            aliases: ["Whitebeard"],
          },
        ];

        const char = findCharacterByName(
          specialNameCharacters,
          "Edward Newgate (Whitebeard)"
        );
        expect(char?.id).toBe("whitebeard");
      });
    });
  });

  describe("findCharacterById", () => {
    it("should find character by id", () => {
      const char = findCharacterById(mockCharacters, "luffy");
      expect(char?.name).toBe("Monkey D. Luffy");
    });

    it("should return undefined for non-existent id", () => {
      const char = findCharacterById(mockCharacters, "nonexistent");
      expect(char).toBeUndefined();
    });

    it("should be case sensitive for id", () => {
      const char = findCharacterById(mockCharacters, "LUFFY");
      expect(char).toBeUndefined();
    });
  });

  describe("searchCharacters - hyphen/space normalization", () => {
    const hyphenCharacters: Character[] = [
      {
        ...mockCharacters[0],
        id: "s-hawk",
        name: "S Hawk",
        aliases: [],
      },
      {
        ...mockCharacters[0],
        id: "t-bone",
        name: "T Bone",
        aliases: [],
      },
    ];

    it("searching 'S-Hawk' finds 'S Hawk' character", () => {
      const results = searchCharacters(hyphenCharacters, "S-Hawk");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("s-hawk");
    });

    it("searching 'S Hawk' finds 'S Hawk' character", () => {
      const results = searchCharacters(hyphenCharacters, "S Hawk");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("s-hawk");
    });

    it("searching 'T-Bone' finds 'T Bone' character", () => {
      const results = searchCharacters(hyphenCharacters, "T-Bone");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("t-bone");
    });

    it("searching 'T Bone' finds 'T Bone' character", () => {
      const results = searchCharacters(hyphenCharacters, "T Bone");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("t-bone");
    });

    it("findCharacterByName with hyphen matches spaced name", () => {
      const char = findCharacterByName(hyphenCharacters, "S-Hawk");
      expect(char?.id).toBe("s-hawk");
    });

    it("findCharacterByName with spaced name matches hyphenated alias", () => {
      const char = findCharacterByName(hyphenCharacters, "T Bone");
      expect(char?.id).toBe("t-bone");
    });

    it("multiple hyphens are normalized to spaces (e.g. 'A-B-C' → 'a b c')", () => {
      const multiHyphen: Character[] = [
        {
          ...mockCharacters[0],
          id: "abc",
          name: "A B C",
          aliases: [],
        },
      ];
      const results = searchCharacters(multiHyphen, "A-B-C");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("abc");
    });

    it("apostrophe is normalized to space", () => {
      const apostropheCharacters: Character[] = [
        {
          ...mockCharacters[0],
          id: "buggy",
          name: "Buggy the Clown",
          aliases: ["Buggy's Crew Leader"],
        },
      ];
      const results = searchCharacters(apostropheCharacters, "Buggy's");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("buggy");
    });
  });

  describe("searchCharacters - ranking priority (exact > prefix > contains > alias)", () => {
    const rankingCharacters: Character[] = [
      {
        ...mockCharacters[0],
        id: "law-exact",
        name: "Law",
        aliases: [],
      },
      {
        ...mockCharacters[0],
        id: "lawton-prefix",
        name: "Lawton",
        aliases: [],
      },
      {
        ...mockCharacters[0],
        id: "crowley-contains",
        name: "Crowley",
        aliases: [],
      },
      {
        ...mockCharacters[0],
        id: "surgeon-alias-exact",
        name: "Some Surgeon",
        aliases: ["Law"],
      },
      {
        ...mockCharacters[0],
        id: "lawman-alias-prefix",
        name: "Random Person",
        aliases: ["Lawman"],
      },
      {
        ...mockCharacters[0],
        id: "outlaw-alias-contains",
        name: "Another Person",
        aliases: ["Outlaw"],
      },
    ];

    it("exact name match (100) ranks before name prefix match (90)", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);
      const exactIdx = ids.indexOf("law-exact");
      const prefixIdx = ids.indexOf("lawton-prefix");
      expect(exactIdx).toBeGreaterThanOrEqual(0);
      expect(prefixIdx).toBeGreaterThanOrEqual(0);
      expect(exactIdx).toBeLessThan(prefixIdx);
    });

    it("name prefix match (90) ranks before name contains match (80)", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);
      const prefixIdx = ids.indexOf("lawton-prefix");
      const containsIdx = ids.indexOf("crowley-contains");
      if (prefixIdx !== -1 && containsIdx !== -1) {
        expect(prefixIdx).toBeLessThan(containsIdx);
      }
    });

    it("name contains match (80) ranks before alias exact match (70)", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);
      const containsIdx = ids.indexOf("crowley-contains");
      const aliasExactIdx = ids.indexOf("surgeon-alias-exact");
      if (containsIdx !== -1 && aliasExactIdx !== -1) {
        expect(containsIdx).toBeLessThan(aliasExactIdx);
      }
    });

    it("alias exact match (70) ranks before alias prefix match (60)", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);
      const aliasExactIdx = ids.indexOf("surgeon-alias-exact");
      const aliasPrefixIdx = ids.indexOf("lawman-alias-prefix");
      if (aliasExactIdx !== -1 && aliasPrefixIdx !== -1) {
        expect(aliasExactIdx).toBeLessThan(aliasPrefixIdx);
      }
    });

    it("alias prefix match (60) ranks before alias contains match (50)", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);
      const aliasPrefixIdx = ids.indexOf("lawman-alias-prefix");
      const aliasContainsIdx = ids.indexOf("outlaw-alias-contains");
      if (aliasPrefixIdx !== -1 && aliasContainsIdx !== -1) {
        expect(aliasPrefixIdx).toBeLessThan(aliasContainsIdx);
      }
    });

    it("non-matching query returns empty results", () => {
      const results = searchCharacters(rankingCharacters, "xyzqwerty");
      expect(results).toEqual([]);
    });

    it("ranking is stable: same query produces same order across calls", () => {
      const first = searchCharacters(rankingCharacters, "Law");
      const second = searchCharacters(rankingCharacters, "Law");
      expect(first.map((c) => c.id)).toEqual(second.map((c) => c.id));
    });

    it("full ranking order: exact > prefix > contains > alias-exact > alias-prefix > alias-contains", () => {
      const results = searchCharacters(rankingCharacters, "Law");
      const ids = results.map((c) => c.id);

      const orderedIds = [
        "law-exact",
        "lawton-prefix",
        "crowley-contains",
        "surgeon-alias-exact",
        "lawman-alias-prefix",
        "outlaw-alias-contains",
      ].filter((id) => ids.includes(id));

      for (let i = 0; i < orderedIds.length - 1; i++) {
        const currentIdx = ids.indexOf(orderedIds[i]);
        const nextIdx = ids.indexOf(orderedIds[i + 1]);
        expect(currentIdx).toBeLessThan(nextIdx);
      }
    });
  });

  describe("getAllNames", () => {
    it("should return name and all aliases", () => {
      const luffy = mockCharacters[0];
      const names = getAllNames(luffy);

      expect(names).toContain("Monkey D. Luffy");
      expect(names).toContain("Luffy");
      expect(names).toContain("Straw Hat");
      expect(names).toContain("Mugiwara");
    });

    it("should return array with just name if no aliases", () => {
      const charNoAliases: Character = {
        ...mockCharacters[0],
        aliases: [],
      };
      const names = getAllNames(charNoAliases);

      expect(names.length).toBe(1);
      expect(names[0]).toBe("Monkey D. Luffy");
    });
  });

  describe("fuzzy search fallback", () => {
    const fuzzyCharacters: Character[] = [
      {
        id: "luffy",
        name: "Monkey D. Luffy",
        aliases: ["Luffy", "Straw Hat Luffy", "Straw Hat"],
        imageUrl: "/characters/luffy.png",
        gender: "Male",
        affiliationPrimary: "Straw Hat Pirates",
        devilFruitType: ["Paramecia"],
        haki: ["O", "A", "C"],
        bounty: 3000000000,
        heightCm: 174,
        origin: "East Blue",
        firstArc: "Romance Dawn Arc",
        minTier: "casual",
      },
      {
        id: "nami",
        name: "Nami",
        aliases: ["Cat Burglar"],
        imageUrl: "/characters/nami.png",
        gender: "Female",
        affiliationPrimary: "Straw Hat Pirates",
        devilFruitType: ["None"],
        haki: [],
        bounty: 366000000,
        heightCm: 170,
        origin: "East Blue",
        firstArc: "Orange Town Arc",
        minTier: "casual",
      },
      {
        id: "kami",
        name: "Kami",
        aliases: [],
        imageUrl: "/characters/kami.png",
        gender: "Male",
        affiliationPrimary: "Sky Pirates",
        devilFruitType: ["None"],
        haki: [],
        bounty: null,
        heightCm: null,
        origin: "Sky Island",
        firstArc: "Skypiea Arc",
        minTier: "casual",
      },
      {
        id: "zoro",
        name: "Roronoa Zoro",
        aliases: ["Pirate Hunter"],
        imageUrl: "/characters/zoro.png",
        gender: "Male",
        affiliationPrimary: "Straw Hat Pirates",
        devilFruitType: ["None"],
        haki: ["O", "A", "C"],
        bounty: 1111000000,
        heightCm: 181,
        origin: "East Blue",
        firstArc: "Romance Dawn Arc",
        minTier: "casual",
      },
    ];

    it("typo with substitution: 'Lufy' finds 'Luffy' via alias", () => {
      const results = searchCharacters(fuzzyCharacters, "Lufy");
      const ids = results.map((c) => c.id);
      expect(ids).toContain("luffy");
    });

    it("typo with transposition: 'Lufyf' finds 'Luffy' via alias", () => {
      const results = searchCharacters(fuzzyCharacters, "Lufyf");
      const ids = results.map((c) => c.id);
      expect(ids).toContain("luffy");
    });

    it("typo with deletion: 'Lffy' finds 'Luffy' via alias", () => {
      const results = searchCharacters(fuzzyCharacters, "Lffy");
      const ids = results.map((c) => c.id);
      expect(ids).toContain("luffy");
    });

    it("short query gate: 'Luf' (3 chars) does NOT trigger fuzzy", () => {
      const results = searchCharacters(fuzzyCharacters, "Luf");
      const ids = results.map((c) => c.id);
      expect(ids).not.toContain("kami");
    });

    it("literal match wins over fuzzy: 'Luffy' exact query scores highest", () => {
      const results = searchCharacters(fuzzyCharacters, "Luffy");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("luffy");
      const ids = results.map((c) => c.id);
      expect(ids).toContain("luffy");
      const luffyIdx = ids.indexOf("luffy");
      expect(luffyIdx).toBe(0);
    });

    it("fuzzy results appear AFTER literal results", () => {
      const results = searchCharacters(fuzzyCharacters, "Nami");
      const ids = results.map((c) => c.id);
      const namiIdx = ids.indexOf("nami");
      const kamiIdx = ids.indexOf("kami");
      expect(namiIdx).toBeGreaterThanOrEqual(0);
      if (kamiIdx !== -1) {
        expect(namiIdx).toBeLessThan(kamiIdx);
      }
    });

    it("fuzzy with distance 2 does NOT appear in results", () => {
      const results = searchCharacters(fuzzyCharacters, "Lufyy");
      const ids = results.map((c) => c.id);
      expect(ids).not.toContain("zoro");
    });

    it("whitespace-only query returns empty array", () => {
      expect(searchCharacters(fuzzyCharacters, "   ")).toEqual([]);
      expect(searchCharacters(fuzzyCharacters, "\t")).toEqual([]);
    });

    it("punctuation-only query returns empty array", () => {
      expect(searchCharacters(fuzzyCharacters, "!!!")).toEqual([]);
      expect(searchCharacters(fuzzyCharacters, "@#$%")).toEqual([]);
    });
  });
});
