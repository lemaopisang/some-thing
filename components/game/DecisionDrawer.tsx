"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PendingDecision } from "@/lib/game/types";
import { useGameStore } from "@/lib/store/gameStore";

interface Props {
  decision?: PendingDecision;
}

export const DecisionDrawer = ({ decision }: Props) => {
  const act = useGameStore((state) => state.act);

  return (
    <AnimatePresence>
      {decision && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="fixed bottom-6 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 rounded-3xl border border-white/10 bg-black/80 p-6 text-white shadow-2xl backdrop-blur"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Decision</p>
            <h3 className="text-2xl font-semibold">{decision.title}</h3>
            {decision.description && <p className="text-sm text-white/60">{decision.description}</p>}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {decision.options.map((option) => (
              <button
                key={option.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white transition hover:border-emerald-400/60 hover:bg-emerald-400/10"
                onClick={() => act({ type: "decision", optionId: option.id })}
              >
                <p className="font-semibold text-white">{option.label}</p>
                <p className="text-xs text-white/60">{option.summary}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
