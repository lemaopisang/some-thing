'use client'

import { useMutation } from '@tanstack/react-query'
import { saveSnapshot, loadSnapshot } from '@/lib/persistence'
import { useGameStore } from '@/lib/gameStore'

export default function SavePanel() {
  const snapshot = useGameStore((state) => state.snapshot)
  const hydrate = useGameStore((state) => state.hydrateFromSnapshot)
  const markSaved = useGameStore((state) => state.markSaved)
  const lastSavedAt = useGameStore((state) => state.lastSavedAt)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const snap = snapshot()
      const saved = await saveSnapshot(snap)
      markSaved(saved.timestamp)
      return saved
    },
  })

  const loadMutation = useMutation({
    mutationFn: async () => {
      const snap = await loadSnapshot()
      if (snap) {
        hydrate(snap)
      }
      return snap
    },
  })

  return (
    <div className="glass-panel space-y-3 p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-300">Persistence</p>
        <h3 className="text-lg font-semibold">Saves & Sync</h3>
        <p className="text-sm text-slate-400">Quickly store your run in a local slot.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="flex-1 rounded-xl bg-emerald-400/80 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Quick Save'}
        </button>
        <button
          className="flex-1 rounded-xl border border-white/20 px-4 py-2 font-medium text-white transition hover:border-emerald-400 disabled:opacity-50"
          onClick={() => loadMutation.mutate()}
          disabled={loadMutation.isPending}
        >
          {loadMutation.isPending ? 'Loading…' : 'Load Slot'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Last saved:{' '}
        {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : 'never'}
      </p>
    </div>
  )
}
