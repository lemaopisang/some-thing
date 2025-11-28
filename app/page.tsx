'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import CommandInput from '@/components/CommandInput'
import TextOutput from '@/components/TextOutput'
import ControlPanel from '@/components/ControlPanel'
import StatusPanel from '@/components/StatusPanel'
import SavePanel from '@/components/SavePanel'
import SkillsPanel from '@/components/SkillsPanel'
import { useGameStore } from '@/lib/gameStore'

export default function HomePage() {
  const logs = useGameStore(state => state.logs)
  const player = useGameStore(state => state.player)
  const enemy = useGameStore(state => state.enemy)
  const wave = useGameStore(state => state.wave)
  const handleCommand = useGameStore(state => state.handleCommand)
  const hasStarted = useGameStore(state => state.hasStarted)
  const initialize = useGameStore(state => state.initialize)

  useEffect(() => {
    if (!hasStarted) {
      initialize('Farmstead')
    }
  }, [hasStarted, initialize])

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-black via-slate-950 to-emerald-950">
      <Image
        src="/assets/holo-grid.svg"
        alt="grid pattern"
        fill
        priority
        className="pointer-events-none opacity-30"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-12">
        <header className="flex flex-col gap-4 rounded-2xl bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <Image src="/assets/farm-emblem.svg" alt="Farm emblem" width={64} height={64} />
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300">Text RPG Prototype</p>
              <h1 className="text-3xl font-semibold">Battle Farm Saga</h1>
              <p className="text-sm text-slate-300">Keyboard-first farming defense adventure built with Next.js</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 space-y-4">
            <TextOutput logs={logs} />
            <CommandInput onSubmit={handleCommand} />
            <ControlPanel onCommand={handleCommand} />
            <SkillsPanel onCommand={handleCommand} />
          </section>
          <aside className="lg:col-span-2 space-y-4">
            <StatusPanel player={player} enemy={enemy} wave={wave} />
            <SavePanel />
          </aside>
        </div>
      </div>
    </div>
  )
}
import { GameScreen } from "@/components/game/GameScreen";

export default function Home() {
  return <GameScreen />;
}
