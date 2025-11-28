import { EnemyState, PlayerState, SkillId } from '../types'

export type SkillEffectContext = {
  player: PlayerState
  enemy: EnemyState
}

export type SkillEffectResult = {
  player: PlayerState
  enemy: EnemyState
  logs: string[]
  skipEnemyTurn?: boolean
}

export type SkillDefinition = {
  id: SkillId
  name: string
  description: string
  cooldown: number
  effect: (ctx: SkillEffectContext) => SkillEffectResult
}

const fertilizingStrike: SkillDefinition = {
  id: 'fertilizing-strike',
  name: 'Fertilizing Strike',
  description: 'Deal 120% attack damage and heal 10% of max HP.',
  cooldown: 3,
  effect: ({ player, enemy }) => {
    const healAmount = Math.round(player.maxHP * 0.1)
    const damage = Math.max(1, Math.round(player.attack * 1.2) - Math.round(enemy.defense * 0.4))
    const updatedEnemy: EnemyState = { ...enemy, health: Math.max(0, enemy.health - damage) }
    const updatedPlayer: PlayerState = {
      ...player,
      health: Math.min(player.maxHP, player.health + healAmount),
    }
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs: [
        `${player.name} channels fertile soil, dealing ${damage} damage and healing ${healAmount} HP.`,
      ],
    }
  },
}

const protectiveBarrier: SkillDefinition = {
  id: 'protective-barrier',
  name: 'Protective Barrier',
  description: 'Summon a shielding barrier that absorbs the next 25% max HP in damage.',
  cooldown: 4,
  effect: ({ player, enemy }) => {
    const shieldGain = Math.round(player.maxHP * 0.25)
    const currentShield = player.shield ?? 0
    const updatedPlayer: PlayerState = {
      ...player,
      shield: currentShield + shieldGain,
    }
    return {
      player: updatedPlayer,
      enemy,
      logs: [
        `${player.name} raises a living barrier shielding ${shieldGain} damage.`,
      ],
      skipEnemyTurn: false,
    }
  },
}

const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  [fertilizingStrike.id]: fertilizingStrike,
  [protectiveBarrier.id]: protectiveBarrier,
}

export const defaultSkillLoadout: SkillId[] = [fertilizingStrike.id, protectiveBarrier.id]

export const getSkillDefinition = (id: SkillId) => SKILL_DEFINITIONS[id]

export const listSkills = () => Object.values(SKILL_DEFINITIONS)
