"use client";

import type {
  Character,
  DailyStats,
  GameMode,
  InfiniteStats,
  Tier,
} from "@/lib/types";
import type { UserSettings } from "@/lib/settings";
import { Modal } from "@/components/Modal";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsModal } from "@/components/StatsModal";
import { BountyBoard } from "@/components/BountyBoard";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal } from "@/components/AuthModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { ArchiveModal } from "@/components/ArchiveModal";

interface GameModalRegistryProps {
  tier: Tier;
  mode: GameMode;
  dailyStats: DailyStats;
  infiniteStats: InfiniteStats;
  discoveredIds: string[];
  settings: UserSettings;
  characters: Character[];
  handleSettingsChange: (settings: UserSettings) => void;

  showLeaderboard: boolean;
  closeLeaderboard: () => void;
  showStats: boolean;
  closeStats: () => void;
  showBountyBoard: boolean;
  closeBountyBoard: () => void;
  showSettings: boolean;
  closeSettings: () => void;
  showAuthModal: boolean;
  closeAuthModal: () => void;
  showHowToPlay: boolean;
  closeHowToPlay: () => void;
  showArchive: boolean;
  closeArchive: () => void;
}

export function GameModalRegistry({
  tier,
  mode,
  dailyStats,
  infiniteStats,
  discoveredIds,
  settings,
  characters,
  handleSettingsChange,
  showLeaderboard,
  closeLeaderboard,
  showStats,
  closeStats,
  showBountyBoard,
  closeBountyBoard,
  showSettings,
  closeSettings,
  showAuthModal,
  closeAuthModal,
  showHowToPlay,
  closeHowToPlay,
  showArchive,
  closeArchive,
}: GameModalRegistryProps) {
  return (
    <>
      <Modal
        isOpen={showLeaderboard}
        onClose={closeLeaderboard}
        title="Leaderboard"
      >
        <Leaderboard />
      </Modal>

      <Modal isOpen={showStats} onClose={closeStats} title="Statistics">
        <StatsModal
          dailyStats={dailyStats}
          infiniteStats={infiniteStats}
          tier={tier}
          mode={mode}
        />
      </Modal>

      <Modal
        isOpen={showBountyBoard}
        onClose={closeBountyBoard}
        title="Bounty Board"
        maxWidth="5xl"
      >
        <BountyBoard characters={characters} discoveredIds={discoveredIds} />
      </Modal>

      <SettingsModal
        isOpen={showSettings}
        onClose={closeSettings}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />

      <HowToPlayModal isOpen={showHowToPlay} onClose={closeHowToPlay} />

      <ArchiveModal
        isOpen={showArchive}
        onClose={closeArchive}
        characters={characters}
        tier={tier}
      />
    </>
  );
}
