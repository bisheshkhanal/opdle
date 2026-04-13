import { useState, useEffect, useCallback, useMemo } from "react";
import type { Character, Ruleset, Tier, RunKind } from "@/lib/types";
import type { RulesetDailyState, RulesetInfiniteState } from "@/lib/types";
import { selectTarget } from "@/lib/selectors";
import { getUTCDateString } from "@/lib/daily";
import {
  getRulesetDailyState,
  saveRulesetDailyState,
  getRulesetInfiniteState,
  saveRulesetInfiniteState,
} from "@/lib/storage";

import { initSilhouetteState, applySilhouetteGuess } from "@/lib/silhouette";
import { initWantedState, applyWantedGuess } from "@/lib/wanted";
import { initQuoteState, applyQuoteGuess } from "@/lib/quote";
import { initArcState, applyArcGuess } from "@/lib/arc";
import type { SilhouetteState } from "@/lib/silhouette";
import type { WantedState } from "@/lib/wanted";
import type { QuoteState } from "@/lib/quote";
import type { ArcState } from "@/lib/arc";

export type RulesetState =
  | SilhouetteState
  | WantedState
  | QuoteState
  | ArcState;

function normalizeRulesetDailyState(
  ruleset: Exclude<Ruleset, "classic" | "four-seas">,
  state: RulesetDailyState
): RulesetState {
  switch (ruleset) {
    case "silhouette":
      return {
        ...initSilhouetteState(),
        ...state,
        revealStep: state.revealStep ?? 0,
      };
    case "wanted":
      return {
        ...initWantedState(),
        ...state,
        revealStep: state.revealStep ?? 0,
      };
    case "quote":
      return {
        ...initQuoteState(),
        ...state,
        clueIndex: state.clueIndex ?? 0,
      };
    case "arc":
      return {
        ...initArcState(),
        ...state,
        arcGuesses: [],
      };
  }
}

function normalizeRulesetInfiniteState(
  ruleset: Exclude<Ruleset, "classic" | "four-seas">,
  state: RulesetInfiniteState
): RulesetState {
  switch (ruleset) {
    case "silhouette":
      return {
        ...initSilhouetteState(),
        ...state,
        revealStep: state.revealStep ?? 0,
      };
    case "wanted":
      return {
        ...initWantedState(),
        ...state,
        revealStep: state.revealStep ?? 0,
      };
    case "quote":
      return {
        ...initQuoteState(),
        ...state,
        clueIndex: state.clueIndex ?? 0,
      };
    case "arc":
      return {
        ...initArcState(),
        ...state,
        arcGuesses: [],
      };
  }
}

export function useRulesetGame(
  ruleset: Exclude<Ruleset, "classic" | "four-seas">,
  runKind: RunKind,
  tier: Tier,
  allCharacters: Character[]
) {
  const [state, setState] = useState<RulesetState | null>(null);

  const targetCharacter = useMemo(() => {
    if (!allCharacters.length) return null;
    const result = selectTarget(allCharacters, {
      runKind,
      ruleset,
      tier,
      dateString: runKind === "daily" ? getUTCDateString() : undefined,
    });
    if (result.kind === "single") {
      return result.character;
    }
    return null;
  }, [allCharacters, runKind, ruleset, tier]);

  const initState = useCallback(() => {
    switch (ruleset) {
      case "silhouette":
        return initSilhouetteState();
      case "wanted":
        return initWantedState();
      case "quote":
        return initQuoteState();
      case "arc":
        return initArcState();
      default:
        return null;
    }
  }, [ruleset]);

  const applyGuess = useCallback(
    (currentState: RulesetState, guess: Character, target: Character) => {
      switch (ruleset) {
        case "silhouette":
          return applySilhouetteGuess(
            currentState as SilhouetteState,
            guess,
            target
          );
        case "wanted":
          return applyWantedGuess(currentState as WantedState, guess, target);
        case "quote":
          return applyQuoteGuess(currentState as QuoteState, guess, target);
        case "arc":
          return applyArcGuess(currentState as ArcState, guess, target);
        default:
          return currentState;
      }
    },
    [ruleset]
  );

  useEffect(() => {
    if (runKind === "daily") {
      const saved = getRulesetDailyState(tier, ruleset);
      if (saved) {
        setState(normalizeRulesetDailyState(ruleset, saved));
      } else {
        setState(initState());
      }
    } else if (runKind === "infinite") {
      const saved = getRulesetInfiniteState(tier, ruleset);
      if (saved) {
        setState(normalizeRulesetInfiniteState(ruleset, saved));
      } else {
        setState(initState());
      }
    }
  }, [ruleset, runKind, tier, initState]);

  const handleGuess = useCallback(
    (guessId: string) => {
      if (!state || !targetCharacter || state.isFinished) return;

      const guessChar = allCharacters.find((c) => c.id === guessId);
      if (!guessChar) return;

      const newState = applyGuess(state, guessChar, targetCharacter);
      setState(newState);

      if (runKind === "daily") {
        saveRulesetDailyState(newState, tier, ruleset);
      } else {
        saveRulesetInfiniteState(newState, tier, ruleset);
      }
    },
    [state, targetCharacter, allCharacters, ruleset, runKind, tier, applyGuess]
  );

  return {
    state,
    targetCharacter,
    handleGuess,
  };
}
