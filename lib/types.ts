export type SkillId = 'fertilizing-strike' | 'protective-barrier'

export type SkillInstance = {
  id: SkillId
  cooldownRemaining: number
}

export type PlayerState = {
  name: string
  health: number
  maxHP: number
  attack: number
  defense: number
  coins: number
  upgrades: string[]
  skills: SkillInstance[]
  shield?: number
}

export type EnemyState = {
  id: string
  name: string
  description: string
  health: number
  maxHP: number
  attack: number
  defense: number
  isBoss: boolean
  wave: number
}

export type GameSnapshot = {
  player: PlayerState
  enemy: EnemyState
  logs: string[]
  wave: number
  timestamp: number
}
