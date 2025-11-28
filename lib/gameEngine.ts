// A minimal browser-friendly game engine adapted from the CLI source.
// This file intentionally implements a small subset of the original
// logic so we can iterate quickly in the browser UI.

export type LogFn = (entry: string) => void

class SimpleRandom {
  nextInt(max: number) { return Math.floor(Math.random() * max) }
  nextDouble() { return Math.random() }
}

class Character {
  name: string
  health: number
  _baseMaxHP: number
  _baseAttackPower: number
  _baseDefense: number
  tempBuffs: any[] = []
  rand = new SimpleRandom()

  constructor(name:string, hp:number, atk:number, def:number){
    this.name = name
    this.health = hp
    this._baseMaxHP = hp
    this._baseAttackPower = atk
    this._baseDefense = def
  }

  get isAlive(){ return this.health > 0 }
  get maxHP(){ return this._baseMaxHP }
  get attackPower(){ return this._baseAttackPower }
  get defense(){ return this._baseDefense }
}

export class PlayerFarm extends Character {
  coins = 0
  constructor(name:string){
    super(name, 200, 30, 25)
  }

  healPercent(p:number){
    const amount = Math.round(this.maxHP * p)
    this.health = Math.min(this.maxHP, this.health + amount)
  }
}

export class Monster extends Character {
  constructor(wave:number, type='Grunt'){
    super(type, 80 + wave * 14, 10 + wave * 4, 5 + wave)
  }
}

export type GameInstance = {
  handleCommand: (cmd:string) => Promise<void>
  start: () => void
}

export function createGame(log: LogFn): GameInstance {
  let player = new PlayerFarm('Player')
  let wave = 1
  let currentEnemy: Monster | null = null

  function logf(s:string){ log(s) }

  async function start(){
    logf('Welcome to Battle Farm Saga (web prototype)')
    player = new PlayerFarm('Farmhand')
    player.health = player.maxHP
    spawnEnemy()
  }

  function spawnEnemy(){
    currentEnemy = (wave % 5 === 0) ? new Monster(wave, 'Boss') : new Monster(wave, 'Goblin')
    logf(`Wave ${wave} — encountered ${currentEnemy.name} (${currentEnemy.health} HP)`) 
  }

  async function enemyTurn(){
    if (!currentEnemy) return
    const dmg = Math.max(1, Math.round(currentEnemy.attackPower - player.defense/4))
    player.health = Math.max(0, player.health - dmg)
    logf(`${currentEnemy.name} hits ${player.name} for ${dmg} damage.`)
  }

  async function handleCommand(cmd:string){
    const normalized = cmd.trim().toLowerCase()
    if (!currentEnemy) { logf('No enemy present.'); return }

    if (normalized === 'attack'){
      const dmg = Math.max(1, Math.round(player.attackPower * (0.9 + Math.random()*0.3) - currentEnemy.defense))
      currentEnemy.health = Math.max(0, currentEnemy.health - dmg)
      logf(`${player.name} attacks ${currentEnemy.name} for ${dmg} damage.`)
    } else if (normalized === 'heal'){
      player.healPercent(0.3)
      logf(`${player.name} heals to ${player.health}/${player.maxHP} HP.`)
    } else if (normalized === 'skip'){
      logf(`${player.name} skips the turn.`)
    } else if (normalized === 'status'){
      logf(`${player.name}: ${player.health}/${player.maxHP} HP — ${currentEnemy.name}: ${currentEnemy.health}/${currentEnemy.maxHP} HP`)
    } else {
      logf(`Unknown command: ${cmd}. Try: attack, heal, skip, status`)
    }

    if (currentEnemy && currentEnemy.health <= 0){
      logf(`${currentEnemy.name} defeated!`) 
      player.coins += 10
      wave++
      currentEnemy = null
      spawnEnemy()
      return
    }

    // enemy acts
    await enemyTurn()

    if (!player.isAlive){
      logf(`${player.name} has fallen at wave ${wave}. Game over.`)
    }
  }

  return { handleCommand, start }
}
