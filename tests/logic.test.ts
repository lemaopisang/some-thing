import { describe, expect, it } from 'vitest'
import { applyWaveRewards, calculateEnemyDamage, calculatePlayerDamage, createBasePlayer, spawnEnemy } from '../lib/logic/core'

const mockEnemy = spawnEnemy(3)

describe('combat helpers', () => {
  it('scales enemies based on wave', () => {
    const wave5 = spawnEnemy(5)
    const wave10 = spawnEnemy(10)
    expect(wave10.maxHP).toBeGreaterThan(wave5.maxHP)
    expect(wave10.attack).toBeGreaterThan(wave5.attack)
  })

  it('calculates player damage with minimum of 1', () => {
    const player = createBasePlayer('Tester')
    const damage = calculatePlayerDamage(player, { ...mockEnemy, defense: 999 })
    expect(damage).toBe(1)
  })

  it('calculates enemy retaliation', () => {
    const player = createBasePlayer('Tester')
    const damage = calculateEnemyDamage(mockEnemy, player)
    expect(damage).toBeGreaterThan(0)
  })

  it('applies wave rewards with heal and coins', () => {
    const player = createBasePlayer('Tester')
    const wounded = { ...player, health: 120 }
    const result = applyWaveRewards(wounded, 6)
    expect(result.player.coins).toBeGreaterThan(player.coins)
    expect(result.player.health).toBeGreaterThan(wounded.health)
    expect(result.attackBump).toBeGreaterThanOrEqual(0)
  })
})
