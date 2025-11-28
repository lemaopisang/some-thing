import type { LogEntry, Tone } from "@/lib/game/types";

export const makeLog = (text: string, tone: Tone): LogEntry => ({
  id: crypto.randomUUID(),
  text,
  tone,
  timestamp: Date.now(),
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const roll = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
