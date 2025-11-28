import localforage from 'localforage'
import { GameSnapshot } from './types'

const saveStore = localforage.createInstance({ name: 'battle-farm-saga', storeName: 'saves' })

const DEFAULT_SLOT = 'save-slot-1'

export async function saveSnapshot(snapshot: GameSnapshot, slot = DEFAULT_SLOT) {
  await saveStore.setItem(slot, snapshot)
  return snapshot
}

export async function loadSnapshot(slot = DEFAULT_SLOT) {
  return (await saveStore.getItem<GameSnapshot>(slot)) ?? null
}

export async function listSlots() {
  const slots: { key: string; snapshot: GameSnapshot }[] = []
  await saveStore.iterate((value, key) => {
    if (value) slots.push({ key, snapshot: value as GameSnapshot })
  })
  return slots
}
