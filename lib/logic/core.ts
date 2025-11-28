import { EnemyState, PlayerState } from '../types'

const enemyNames = [
  'Goblin Scavenger',
  'Mutant Pest',
  'Rock Golem',
  'Shadow Stalker',
  'Ember Raider',
]

const randomFactor = () => 0.85 + Math.random() * 0.35
const makeId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

export const createBasePlayer = (name = 'Farmstead'): PlayerState => ({
  name,
  health: 200,
  maxHP: 200,
  attack: 32,
  defense: 20,
  coins: 0,
  upgrades: [],
  skills: [],
  shield: 0,
})

export const spawnEnemy = (wave: number): EnemyState => {
  const isBoss = wave % 5 === 0
  const name = isBoss ? `Abomination ${wave}` : enemyNames[(wave - 1) % enemyNames.length]
  const hp = Math.round((110 + wave * 18) * (isBoss ? 1.9 : 1))
  const attack = Math.round((18 + wave * 3.2) * (isBoss ? 1.45 : 1))
  const defense = Math.round((6 + wave * 1.2) * (isBoss ? 1.35 : 1))
  return {
    id: `${wave}-${makeId()}`,
    name,
    description: isBoss ? 'A colossal guardian warped by the blight.' : 'A raider testing the farm defenses.',
    health: hp,
    maxHP: hp,
    attack,
    defense,
    isBoss,
    wave,
  }
}

export const calculatePlayerDamage = (player: PlayerState, enemy: EnemyState) => {
  const critChance = player.upgrades.includes('Sharpened Tools') ? 0.2 : 0.05
  const crit = Math.random() < critChance ? 1.75 : 1
  const damage = Math.round(player.attack * randomFactor() * crit) - enemy.defense
  return Math.max(1, damage)
}

export const calculateEnemyDamage = (enemy: EnemyState, player: PlayerState) => {
  const damage = Math.round(enemy.attack * randomFactor()) - Math.round(player.defense * 0.6)
  return Math.max(1, damage)
}

export const applyWaveRewards = (player: PlayerState, wave: number) => {
  const rewardCoins = 10 + wave * 2
  const heal = Math.round(player.maxHP * 0.15)
  const attackBump = wave % 4 === 0 ? 2 : 0
  const defenseBump = wave % 6 === 0 ? 1 : 0

  return {
    player: {
      ...player,
      coins: player.coins + rewardCoins,
      attack: player.attack + attackBump,
      defense: player.defense + defenseBump,
      health: Math.min(player.maxHP, player.health + heal),
    },
    rewardCoins,
    heal,
    attackBump,
    defenseBump,
  }
}

export const describeStatus = (player: PlayerState, enemy: EnemyState) =>
  `${player.name}: ${player.health}/${player.maxHP} HP — ${enemy.name}: ${enemy.health}/${enemy.maxHP} HP`
