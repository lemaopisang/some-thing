'use client'

import { FormEvent, useState } from 'react'

type Props = {
  onSubmit: (cmd: string) => Promise<void>
}

const suggestions = ['attack', 'heal', 'skip', 'status', 'skills', 'skill 1']

export default function CommandInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!value.trim()) return
    setPending(true)
    await onSubmit(value)
    setValue('')
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="command-input"
        placeholder="Type a command (attack, heal, skip, status, help)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        autoFocus
      />
      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-white/10 px-3 py-1 text-slate-200 transition hover:border-brand-400 hover:text-brand-400"
            onClick={() => {
              setValue(s)
            }}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-right text-slate-500">Press Enter to execute.</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? 'Executing...' : 'Send Command'}
      </button>
    </form>
  )
}

