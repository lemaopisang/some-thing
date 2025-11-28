"use client";

import { HeroHeader } from "@/components/game/HeroHeader";
import { StatusPanel } from "@/components/game/StatusPanel";
import { GameLog } from "@/components/game/GameLog";
import { CommandPanel } from "@/components/game/CommandPanel";
import { DecisionDrawer } from "@/components/game/DecisionDrawer";
import { useGameStore } from "@/lib/store/gameStore";

export const GameScreen = () => {
  const session = useGameStore((state) => state.session);

  return (
    <div className="space-y-6">
      <HeroHeader />
      <StatusPanel player={session.player} enemy={session.enemy} wave={session.wave} status={session.status} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <GameLog entries={session.log} />
        <CommandPanel />
      </div>
      <DecisionDrawer decision={session.pendingDecision} />
    </div>
  );
};
