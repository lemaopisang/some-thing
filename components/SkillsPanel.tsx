'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useGameStore } from '@/lib/gameStore'
import { getSkillDefinition } from '@/lib/logic/skills'

const HOTKEYS = ['1', '2', '3', '4']

type Props = {
  onCommand: (cmd: string) => Promise<void>
}

export default function SkillsPanel({ onCommand }: Props) {
  const skills = useGameStore(state => state.player.skills)

  const triggerSkill = (index: number) => {
    const skill = skills[index]
    if (skill && skill.cooldownRemaining === 0) {
      void onCommand(`skill ${skill.id}`)
    }
  }

  useHotkeys('1', () => triggerSkill(0), [skills, onCommand])
  useHotkeys('2', () => triggerSkill(1), [skills, onCommand])
  useHotkeys('3', () => triggerSkill(2), [skills, onCommand])
  useHotkeys('4', () => triggerSkill(3), [skills, onCommand])

  return (
    <div className="glass-panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-300">Skills</p>
          <h3 className="text-lg font-semibold">Signature Techniques</h3>
        </div>
        <span className="text-xs text-slate-400">Keys 1-4</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {skills.map((skill, index) => {
          const def = getSkillDefinition(skill.id)
          const ready = skill.cooldownRemaining === 0
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onCommand(`skill ${skill.id}`)}
              disabled={!ready}
              className={`rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left transition ${
                ready ? 'hover:border-brand-400' : 'opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{def.name}</p>
                <span className="text-xs text-slate-400">{HOTKEYS[index] ?? ''}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{def.description}</p>
              <p className="mt-2 text-xs font-medium text-emerald-300">
                {ready ? 'Ready' : `Cooldown: ${skill.cooldownRemaining} turn(s)`}
              </p>
            </button>
          )
        })}
        {skills.length === 0 && <p className="text-sm text-slate-400">No skills unlocked yet.</p>}
      </div>
    </div>
  )
}
