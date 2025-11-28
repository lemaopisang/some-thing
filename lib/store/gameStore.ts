"use client";

import { create, type StoreApi } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import localforage from "localforage";
import { GameSession, PlayerAction } from "@/lib/game/types";
import { createBlankSession, createNewSession, performPlayerAction } from "@/lib/game/engine";

const createNoopStorage = (): StateStorage => ({
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
});

const storage: StateStorage = typeof window === "undefined" ? createNoopStorage() : localforage;

interface GameStore {
  session: GameSession;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  start: (name: string) => void;
  act: (action: PlayerAction) => void;
  reset: () => void;
  clearSave: () => void;
}

type SetState = StoreApi<GameStore>["setState"];
type GetState = StoreApi<GameStore>["getState"];

const storeCreator = (set: SetState, get: GetState) => ({
      session: createBlankSession(),
      hydrated: false,
      setHydrated: (value: boolean) => set({ hydrated: value }),
      start: (name: string) => {
        const trimmed = name.trim() || "Unnamed Farm";
        set({ session: createNewSession(trimmed) });
      },
      act: (action: PlayerAction) => {
        const current = get().session;
        const updated = performPlayerAction(current, action);
        set({ session: updated });
      },
      reset: () => set({ session: createBlankSession() }),
      clearSave: () => {
        storage.removeItem("text-rpg-session");
        set({ session: createBlankSession() });
      },
    });

export const useGameStore = create<GameStore>()(
  persist(storeCreator, {
    name: "text-rpg-session",
    storage: createJSONStorage(() => storage),
    onRehydrateStorage: () => (state: GameStore | undefined) => {
      state?.setHydrated(true);
    },
  }),
);
