'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'
import { EnemyState, GameSnapshot, PlayerState, SkillInstance } from './types'
import {
  applyWaveRewards,
  calculateEnemyDamage,
  calculatePlayerDamage,
  createBasePlayer,
  describeStatus,
  spawnEnemy,
} from './logic/core'
import { defaultSkillLoadout, getSkillDefinition } from './logic/skills'

const storeStorage = localforage.createInstance({ name: 'battle-farm-saga', storeName: 'text_rpg' })

const MAX_LOGS = 180

type GameStore = {
  player: PlayerState
  enemy: EnemyState
  wave: number
  logs: string[]
  hasStarted: boolean
  lastSavedAt?: number
  initialize: (name?: string) => void
  resetRun: (name?: string) => void
  handleCommand: (cmd: string) => Promise<void>
  hydrateFromSnapshot: (snapshot: GameSnapshot) => void
  snapshot: () => GameSnapshot
  markSaved: (timestamp: number) => void
}

const clampLogs = (logs: string[]) => (logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs)

const entry = (text: string) => `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${text}`

const createSkillInstances = (): SkillInstance[] =>
  defaultSkillLoadout.map(id => ({ id, cooldownRemaining: 0 }))

const ensurePlayerShape = (player: PlayerState): PlayerState => {
  const skills = player.skills && player.skills.length > 0 ? player.skills : createSkillInstances()
  const shield = typeof player.shield === 'number' ? player.shield : 0
  return { ...player, skills, shield }
}

const reduceSkillCooldowns = (skills: SkillInstance[]) =>
  skills.map(skill => ({
    ...skill,
    cooldownRemaining: Math.max(0, skill.cooldownRemaining - 1),
  }))

const formatSkillLog = (player: PlayerState) => {
  if (!player.skills?.length) {
    return ['No skills learned yet. Visit the shop or survive more waves to unlock abilities.']
  }
  return player.skills.map((skill, index) => {
    const def = getSkillDefinition(skill.id)
    const status = skill.cooldownRemaining > 0 ? `CD ${skill.cooldownRemaining}` : 'Ready'
    return `${index + 1}. ${def.name} — ${status}`
  })
}

const resolveSkillSelection = (skills: SkillInstance[], token: string) => {
  if (!token) return undefined
  const trimmed = token.trim().toLowerCase()
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= skills.length) {
    return skills[numeric - 1]
  }
  return skills.find(skill => skill.id === trimmed)
}

const createInitialState = (name?: string) => {
  const player = ensurePlayerShape(createBasePlayer(name))
  const enemy = spawnEnemy(1)
  return {
    player,
    enemy,
    wave: 1,
    logs: [entry(`🌾 Welcome ${player.name}! Commands: attack, heal, skip, status, help, skills, skill <id>.`)],
    hasStarted: false,
  }
}

const storage = createJSONStorage<GameStore>(() => ({
  getItem: async (name) => {
    const raw = await storeStorage.getItem<string>(name)
    return raw ?? null
  },
  setItem: (name, value) => storeStorage.setItem(name, value),
  removeItem: (name) => storeStorage.removeItem(name),
}))

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      initialize: (name) => set(() => ({ ...createInitialState(name), hasStarted: true })),
      resetRun: (name) => set(() => ({ ...createInitialState(name), hasStarted: true })),
      handleCommand: async (rawCmd) => {
        const trimmed = rawCmd.trim()
        if (!trimmed) return

        const [commandToken, ...argTokens] = trimmed.split(/\s+/)
        const normalized = commandToken.toLowerCase()
        const logEntries: string[] = []

        set(state => {
          if (state.player.health <= 0) {
            return { ...state, logs: clampLogs([...state.logs, entry('💀 Your farm has already fallen. Reset to try again.')]) }
          }

          let player = ensurePlayerShape(state.player)
          let enemy = { ...state.enemy }
          let wave = state.wave
          let logs = clampLogs([...state.logs, entry(`> ${trimmed}`)])
          let turnConsumed = false

          const concludeEnemyTurn = () => {
            if (player.health <= 0 || enemy.health <= 0) return
            const dmg = calculateEnemyDamage(enemy, player)
            let damageAfterShield = dmg
            const shieldValue = player.shield ?? 0
            if (shieldValue > 0) {
              const absorbed = Math.min(shieldValue, damageAfterShield)
              damageAfterShield -= absorbed
              const remainingShield = shieldValue - absorbed
              player = { ...player, shield: remainingShield }
              if (absorbed > 0) {
                logEntries.push(`Barrier absorbs ${absorbed} damage${remainingShield > 0 ? ` (${remainingShield} shield left).` : '.'}`)
              }
            }
            player = { ...player, health: Math.max(0, player.health - damageAfterShield) }
            logEntries.push(`${enemy.name} strikes for ${damageAfterShield} damage.`)
            if (player.health <= 0) {
              logEntries.push(`${player.name} falls at wave ${wave}. 🌒`)
            }
          }

          const handleVictory = () => {
            const rewards = applyWaveRewards(player, wave)
            player = rewards.player
            logEntries.push(`${enemy.name} defeated! +${rewards.rewardCoins} coins, ${rewards.heal} HP restored.`)
            if (rewards.attackBump) logEntries.push(`Attack increased by ${rewards.attackBump}.`)
            if (rewards.defenseBump) logEntries.push(`Defense increased by ${rewards.defenseBump}.`)
            wave += 1
            enemy = spawnEnemy(wave)
            logEntries.push(`Wave ${wave} approaches: ${enemy.name}.`)
          }

          switch (normalized) {
            case 'attack': {
              const dmg = calculatePlayerDamage(player, enemy)
              enemy = { ...enemy, health: Math.max(0, enemy.health - dmg) }
              logEntries.push(`${player.name} attacks ${enemy.name} for ${dmg} damage.`)
              if (enemy.health <= 0) {
                handleVictory()
              } else {
                concludeEnemyTurn()
              }
              turnConsumed = true
              break
            }
            case 'heal': {
              const heal = Math.round(player.maxHP * 0.3)
              const nextHP = Math.min(player.maxHP, player.health + heal)
              player = { ...player, health: nextHP }
              logEntries.push(`${player.name} heals ${heal} HP (${nextHP}/${player.maxHP}).`)
              concludeEnemyTurn()
              turnConsumed = true
              break
            }
            case 'skip': {
              logEntries.push(`${player.name} steadies their stance.`)
              concludeEnemyTurn()
              turnConsumed = true
              break
            }
            case 'status': {
              logEntries.push(describeStatus(player, enemy))
              break
            }
            case 'skills': {
              logEntries.push(...formatSkillLog(player))
              break
            }
            case 'skill': {
              if (argTokens.length === 0) {
                logEntries.push('Usage: skill <number|id>. Example: "skill 1" or "skill fertilizing-strike".')
                break
              }
              const selectionToken = argTokens.join(' ').toLowerCase()
              const selected = resolveSkillSelection(player.skills, selectionToken)
              if (!selected) {
                logEntries.push(`No skill found for "${selectionToken}".`)
                break
              }
              if (selected.cooldownRemaining > 0) {
                logEntries.push('That skill is still recovering.')
                break
              }
              const definition = getSkillDefinition(selected.id)
              if (!definition) {
                logEntries.push('Skill data unavailable.')
                break
              }
              const result = definition.effect({ player, enemy })
              player = ensurePlayerShape(result.player)
              enemy = result.enemy
              logEntries.push(...result.logs)
              player = {
                ...player,
                skills: player.skills.map(skill =>
                  skill.id === selected.id ? { ...skill, cooldownRemaining: definition.cooldown } : skill,
                ),
              }
              if (enemy.health <= 0) {
                handleVictory()
              } else if (!result.skipEnemyTurn) {
                concludeEnemyTurn()
              }
              turnConsumed = true
              break
            }
            case 'help': {
              logEntries.push('Commands: attack, heal, skip, status, skills, skill <id>, help. Keyboard shortcuts: [A]ttack, [H]eal, [S]kip.')
              break
            }
            default: {
              logEntries.push(`Unknown command: ${trimmed}`)
              break
            }
          }

          if (turnConsumed) {
            player = {
              ...player,
              skills: reduceSkillCooldowns(player.skills ?? createSkillInstances()),
            }
          }

          logs = clampLogs([...logs, ...logEntries.map(entry)])

          return {
            ...state,
            player,
            enemy,
            wave,
            logs,
            hasStarted: true,
          }
        })
      },
      hydrateFromSnapshot: (snapshot) =>
        set(state => ({
          ...state,
          player: ensurePlayerShape(snapshot.player),
          enemy: snapshot.enemy,
          logs: clampLogs(snapshot.logs),
          wave: snapshot.wave,
          hasStarted: true,
        })),
      snapshot: () => {
        const { player, enemy, logs, wave } = get()
        return { player: ensurePlayerShape(player), enemy, logs, wave, timestamp: Date.now() }
      },
      markSaved: (timestamp) => set(state => ({ ...state, lastSavedAt: timestamp })),
    }),
    {
      name: 'battle-farm-saga-store',
      storage,
      partialize: ({ player, enemy, logs, wave, hasStarted, lastSavedAt }) => ({
        player,
        enemy,
        logs,
        wave,
        hasStarted,
        lastSavedAt,
      }),
    },
  ),
)
