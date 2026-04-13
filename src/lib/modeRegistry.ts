import type { Ruleset, RunKind } from "./types";

export interface RulesetDef {
  id: Ruleset;
  label: string;
  description: string;
  maxGuesses: number;
  supportedRunKinds: RunKind[];
  usesProgressiveReveal: boolean;
  usesClueProgression: boolean;
  isMultiBoard: boolean;
  boardCount: number;
}

export const RULESET_REGISTRY: Record<Ruleset, RulesetDef> = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "Compare attributes across 8 categories to find the character",
    maxGuesses: 6,
    supportedRunKinds: ["daily", "infinite", "challenge"],
    usesProgressiveReveal: false,
    usesClueProgression: false,
    isMultiBoard: false,
    boardCount: 1,
  },
  wanted: {
    id: "wanted",
    label: "Wanted",
    description:
      "Identify a character from their bounty poster with hidden clues",
    maxGuesses: 6,
    supportedRunKinds: ["daily", "infinite"],
    usesProgressiveReveal: false,
    usesClueProgression: true,
    isMultiBoard: false,
    boardCount: 1,
  },
  quote: {
    id: "quote",
    label: "Quote",
    description:
      "Guess who said a famous One Piece quote with progressive hints",
    maxGuesses: 6,
    supportedRunKinds: ["daily", "infinite"],
    usesProgressiveReveal: false,
    usesClueProgression: true,
    isMultiBoard: false,
    boardCount: 1,
  },
  "four-seas": {
    id: "four-seas",
    label: "Four Seas",
    description:
      "Play four parallel boards simultaneously across the four seas",
    maxGuesses: 6,
    supportedRunKinds: ["daily", "infinite"],
    usesProgressiveReveal: false,
    usesClueProgression: false,
    isMultiBoard: true,
    boardCount: 4,
  },
};

const ALL_RULESETS: Ruleset[] = Object.keys(RULESET_REGISTRY) as Ruleset[];

export function getRulesetDef(ruleset: Ruleset): RulesetDef {
  return RULESET_REGISTRY[ruleset];
}

export function isRulesetSupported(
  ruleset: Ruleset,
  runKind: RunKind
): boolean {
  return RULESET_REGISTRY[ruleset].supportedRunKinds.includes(runKind);
}

export function getSupportedRulesets(): Ruleset[] {
  return [...ALL_RULESETS];
}
