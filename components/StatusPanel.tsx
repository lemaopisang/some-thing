'use client'

import { EnemyState, PlayerState } from '@/lib/types'

type Props = {
  player: PlayerState
  enemy: EnemyState
  wave: number
}

const StatBar = ({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) => (
  <div>
    <div className="flex justify-between text-xs text-slate-400">
      <span>{label}</span>
      <span>
        {value}/{max}
      </span>
    </div>
    <div className="mt-1 h-2 rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  </div>
)

export default function StatusPanel({ player, enemy, wave }: Props) {
  return (
    <div className="glass-panel space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-emerald-300">Wave {wave}</p>
        <h2 className="text-xl font-semibold">Current Status</h2>
        <p className="text-sm text-slate-400">Coins: {player.coins}</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-white">{player.name}</p>
          <StatBar label="Health" value={player.health} max={player.maxHP} tone="bg-emerald-400" />
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div>ATK: {player.attack}</div>
            <div>DEF: {player.defense}</div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-white">{enemy.name}</p>
          <p className="text-xs text-slate-400">{enemy.description}</p>
          <StatBar label="Enemy Health" value={enemy.health} max={enemy.maxHP} tone="bg-rose-400" />
        </div>
      </div>
    </div>
  )
}
