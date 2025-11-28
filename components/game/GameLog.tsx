"use client";

import { useEffect, useRef } from "react";
import { LogEntry } from "@/lib/game/types";

interface Props {
  entries: LogEntry[];
}

const toneStyles: Record<LogEntry["tone"], string> = {
  system: "text-zinc-300",
  player: "text-emerald-300",
  enemy: "text-rose-300",
  reward: "text-amber-300",
};

export const GameLog = ({ entries }: Props) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries]);

  return (
    <section className="flex flex-col rounded-3xl border border-white/10 bg-black/70 p-5 text-sm text-white/80">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Combat Log</p>
        <span className="text-[0.65rem] text-white/40">{entries.length} entries</span>
      </div>
      <div ref={viewportRef} className="mt-4 flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-2 text-left">
        {entries.map((entry) => (
          <p key={entry.id} className={`text-sm leading-relaxed ${toneStyles[entry.tone]}`}>
            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <span className="mx-2 text-white/20">·</span>
            {entry.text}
          </p>
        ))}
        {entries.length === 0 && <p className="text-white/40">Awaiting your first command...</p>}
      </div>
    </section>
  );
};
