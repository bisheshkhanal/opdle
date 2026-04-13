import { useState, useEffect, useCallback, useMemo } from "react";
import type { Character, Tier, RunKind } from "@/lib/types";
import { selectTarget } from "@/lib/selectors";
import { getUTCDateString } from "@/lib/daily";
import { generateRoundId } from "@/lib/infinite";
import {
  getRulesetDailyState,
  saveRulesetDailyState,
  getRulesetInfiniteState,
  saveRulesetInfiniteState,
} from "@/lib/storage";
import {
  initFourSeasState,
  applyFourSeasGuess,
  serializeFourSeasState,
  deserializeFourSeasState,
  FourSeasState,
  BoardId,
} from "@/lib/fourSeas";

export function useFourSeasGame(
  runKind: RunKind,
  tier: Tier,
  allCharacters: Character[]
) {
  const [state, setState] = useState<FourSeasState | null>(null);

  const { targetCharactersArray, targetCharacterMap } = useMemo(() => {
    if (!allCharacters.length)
      return { targetCharactersArray: [], targetCharacterMap: {} };

    // We pass undefined for infinite to let selectTarget generate default or we provide it
    // Wait, the prompt says "For infinite: seed = some stable round-based string"
    // And page.tsx doesn't pass roundId right now. Let's just pass `runKind` and `tier` to selectTarget.
    // selectTarget delegates to selectFourSeasTargets using resolveSeed.

    const result = selectTarget(allCharacters, {
      runKind,
      ruleset: "four-seas",
      tier,
      dateString: runKind === "daily" ? getUTCDateString() : undefined,
    });

    if (result.kind === "multi") {
      const map: Record<string, Character> = {};
      for (const char of result.characters) {
        map[char.id] = char;
      }
      return {
        targetCharactersArray: result.characters,
        targetCharacterMap: map,
      };
    }
    return { targetCharactersArray: [], targetCharacterMap: {} };
  }, [allCharacters, runKind, tier]);

  const initState = useCallback(() => {
    if (targetCharactersArray.length !== 4) return null;
    return initFourSeasState(targetCharactersArray);
  }, [targetCharactersArray]);

  useEffect(() => {
    if (targetCharactersArray.length !== 4) return;

    if (runKind === "daily") {
      const saved = getRulesetDailyState(tier, "four-seas");
      const deserialized = deserializeFourSeasState(saved);
      if (deserialized) {
        setState(deserialized);
      } else {
        setState(initState());
      }
    } else if (runKind === "infinite") {
      const saved = getRulesetInfiniteState(tier, "four-seas");
      const deserialized = deserializeFourSeasState(saved);
      if (deserialized) {
        setState(deserialized);
      } else {
        setState(initState());
      }
    } else {
      // Challenge or other
      setState(initState());
    }
  }, [runKind, tier, initState, targetCharactersArray]);

  const handleFourSeasGuess = useCallback(
    (boardId: BoardId, guessId: string) => {
      if (!state || Object.keys(targetCharacterMap).length === 0) return;

      const guessChar = allCharacters.find((c) => c.id === guessId);
      if (!guessChar) return;

      const newState = applyFourSeasGuess(
        state,
        boardId,
        guessChar,
        targetCharacterMap
      );

      setState(newState);

      // Save to storage
      // The serialize function returns FourSeasSerialized, we cast to any for storage
      const serialized = serializeFourSeasState(newState) as any;
      if (runKind === "daily") {
        saveRulesetDailyState(serialized, tier, "four-seas");
      } else if (runKind === "infinite") {
        saveRulesetInfiniteState(serialized, tier, "four-seas");
      }
    },
    [state, targetCharacterMap, allCharacters, runKind, tier]
  );

  return {
    fourSeasState: state,
    targetCharacters: targetCharacterMap,
    handleFourSeasGuess,
  };
}
