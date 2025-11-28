'use client'

import { useHotkeys } from 'react-hotkeys-hook'

type Props = {
  onCommand: (cmd: string) => Promise<void>
}

const actions = [
  { label: 'Attack', command: 'attack', hotkey: 'A', description: 'Strike the current foe.', accent: 'bg-emerald-400/20 text-emerald-200' },
  { label: 'Heal', command: 'heal', hotkey: 'H', description: 'Restore 30% of max HP.', accent: 'bg-cyan-400/20 text-cyan-200' },
  { label: 'Skip', command: 'skip', hotkey: 'S', description: 'Hold position to draw fire.', accent: 'bg-amber-400/20 text-amber-200' },
  { label: 'Status', command: 'status', hotkey: 'L', description: 'Review current stats.', accent: 'bg-slate-400/20 text-slate-200' },
]

export default function ControlPanel({ onCommand }: Props) {
  useHotkeys('a', () => void onCommand('attack'), [onCommand])
  useHotkeys('h', () => void onCommand('heal'), [onCommand])
  useHotkeys('s', () => void onCommand('skip'), [onCommand])
  useHotkeys('l', () => void onCommand('status'), [onCommand])

  return (
    <div className="glass-panel grid gap-3 p-4 md:grid-cols-2">
      {actions.map((action) => (
        <button
          key={action.command}
          className="group flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-brand-400"
          onClick={() => onCommand(action.command)}
        >
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${action.accent}`}>
            <span>{action.label}</span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide opacity-80">
              {action.hotkey}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{action.description}</p>
        </button>
      ))}
    </div>
  )
}
