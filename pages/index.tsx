import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createGame, GameInstance } from '../lib/gameEngine'
import TextOutput from '../components/TextOutput'
import CommandInput from '../components/CommandInput'

export default function Home() {
  const [game, setGame] = useState<GameInstance | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const g = createGame((entry: string) => {
      setLogs(prev => [...prev, entry])
    })
    setGame(g)
    g.start()
  }, [])

  const handleCommand = async (cmd: string) => {
    if (!game) return
    await game.handleCommand(cmd)
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Battle Farm Saga — Web Prototype</h1>
      <TextOutput logs={logs} />
      <CommandInput onSubmit={handleCommand} />
      <p className="mt-4 text-sm text-gray-500">This is an early web port of the CLI engine. The original CLI source is preserved in <code>lib/legacy/abandoned-code.js</code>.</p>
    </main>
  )
}
