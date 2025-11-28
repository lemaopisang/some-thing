import { EnemyState, GameSession, PlayerState } from "@/lib/game/types";

interface Props {
  player: PlayerState;
  enemy: EnemyState | null;
  wave: number;
  status: GameSession["status"];
}

const StatBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-wide text-white/80">
    <p className="text-[0.65rem] text-white/60">{label}</p>
    <p className="text-base font-semibold text-white">{value}</p>
  </div>
);

export const StatusPanel = ({ player, enemy, wave, status }: Props) => {
  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/60 p-6 text-white backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Wave</p>
          <p className="text-2xl font-semibold">{wave}</p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
          {status === "running" ? "Engaged" : status === "victory" ? "Victory" : status === "defeat" ? "Defeated" : "Idle"}
        </span>
      </header>
      <div className="grid gap-3">
        <div>
          <p className="text-sm text-white/60">{player.name || "Unnamed"}</p>
          <p className="text-xl font-semibold text-white">HP {player.health}/{player.maxHealth}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatBlock label="Attack" value={`${player.attack}`} />
          <StatBlock label="Defense" value={`${player.defense}`} />
          <StatBlock label="Coins" value={`${player.coins}`} />
        </div>
      </div>
      {enemy && (
        <div className="grid gap-3 border-t border-white/10 pt-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Enemy</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">{enemy.name}</p>
              <p className="text-lg font-semibold text-white">HP {enemy.health}/{enemy.maxHealth}</p>
            </div>
            <StatBlock label="ATK" value={`${enemy.attack}`} />
          </div>
        </div>
      )}
    </section>
  );
};
