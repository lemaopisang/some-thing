'use client'

import { useEffect, useRef } from 'react'

export default function TextOutput({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [logs])

  return (
    <div ref={ref} className="log-area" role="log" aria-live="polite">
      {logs.map((line, idx) => (
        <div key={`${idx}-${line.slice(0, 8)}`} className="py-0.5">
          {line}
        </div>
      ))}
    </div>
  )
}

