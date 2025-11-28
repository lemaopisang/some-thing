import { describe, expect, it } from 'vitest'
import { createBasePlayer, spawnEnemy } from '../lib/logic/core'
import { defaultSkillLoadout, getSkillDefinition } from '../lib/logic/skills'

const createPlayerWithSkills = () => ({
  ...createBasePlayer('Tester'),
  skills: defaultSkillLoadout.map(id => ({ id, cooldownRemaining: 0 })),
})

describe('skills', () => {
  it('fertilizing strike damages enemy and heals player', () => {
    const skill = getSkillDefinition('fertilizing-strike')
    const player = createPlayerWithSkills()
    const wounded = { ...player, health: 100 }
    const enemy = spawnEnemy(3)
    const result = skill.effect({ player: wounded, enemy })
    expect(result.player.health).toBeGreaterThan(wounded.health)
    expect(result.enemy.health).toBeLessThan(enemy.health)
  })

  it('protective barrier increases shield value', () => {
    const skill = getSkillDefinition('protective-barrier')
    const player = createPlayerWithSkills()
    const enemy = spawnEnemy(2)
    const result = skill.effect({ player, enemy })
    expect(result.player.shield).toBeGreaterThan(player.shield ?? 0)
    expect(result.enemy.health).toEqual(enemy.health)
  })
})
