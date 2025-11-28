import { FARM_UPGRADE_OPTIONS, SKILL_LIBRARY } from "@/lib/game/data";
import {
  BuffInstance,
  GameSession,
  PendingDecision,
  PlayerAction,
  PlayerState,
  EnemyState,
  LogEntry,
} from "@/lib/game/types";
import { clamp, makeLog, roll } from "@/lib/game/utils";

const BASE_PLAYER: Omit<PlayerState, "name"> = {
  health: 200,
  maxHealth: 200,
  attack: 30,
  defense: 20,
  coins: 0,
  mana: 100,
  skills: [
    {
      id: "fertilizing-strike",
      remainingCooldown: 0,
    },
  ],
  learnedSkillIds: ["fertilizing-strike"],
  buffs: [],
  upgrades: [],
  critChance: 0.05,
  critMultiplier: 1.75,
  regenPercent: 0.03,
};

const instantiatePlayer = (name: string): PlayerState => ({
  name,
  health: BASE_PLAYER.health,
  maxHealth: BASE_PLAYER.maxHealth,
  attack: BASE_PLAYER.attack,
  defense: BASE_PLAYER.defense,
  coins: BASE_PLAYER.coins,
  mana: BASE_PLAYER.mana,
  skills: BASE_PLAYER.skills.map((skill) => ({ ...skill })),
  learnedSkillIds: [...BASE_PLAYER.learnedSkillIds],
  buffs: [],
  upgrades: [],
  critChance: BASE_PLAYER.critChance,
  critMultiplier: BASE_PLAYER.critMultiplier,
  regenPercent: BASE_PLAYER.regenPercent,
});

const BOSS_INTERVAL = 5;

const cloneSession = (session: GameSession): GameSession => {
  if (typeof structuredClone === "function") {
    return structuredClone(session);
  }
  return JSON.parse(JSON.stringify(session)) as GameSession;
};

const ensureEnemy = (session: GameSession) => {
  if (session.enemy && session.enemy.health > 0) return session.enemy;
  const archetypes: EnemyState[] = [];
  const wave = session.wave;
  if (wave % BOSS_INTERVAL === 0) {
    archetypes.push(makeBoss(wave));
  } else {
    archetypes.push(makeEnemy(wave, "normal"));
    archetypes.push(makeEnemy(wave, "goblin"));
    archetypes.push(makeEnemy(wave, "mutant"));
    archetypes.push(makeEnemy(wave, "golem"));
    archetypes.push(makeEnemy(wave, "shadow"));
  }
  session.enemy = archetypes[Math.floor(Math.random() * archetypes.length)];
  session.log.push(makeLog(`${session.enemy.name} emerges from the mist.`, "enemy"));
  return session.enemy;
};

const makeEnemy = (wave: number, archetype: EnemyState["archetype"]): EnemyState => {
  const baseHp = 80 + wave * 14;
  const baseAtk = 10 + wave * 4;
  const baseDef = 5 + wave;
  return {
    id: crypto.randomUUID(),
    name: formatEnemyName(archetype, wave),
    health: baseHp,
    maxHealth: baseHp,
    attack: baseAtk,
    defense: baseDef,
    wave,
    archetype,
  };
};

const makeBoss = (wave: number): EnemyState => {
  const base = makeEnemy(wave, "boss");
  const multiplier = 1.8;
  return {
    ...base,
    name: `Abomination of Wave ${wave}`,
    health: Math.round(base.maxHealth * multiplier),
    maxHealth: Math.round(base.maxHealth * multiplier),
    attack: Math.round(base.attack * 1.6),
    defense: Math.round(base.defense * 1.4),
    archetype: "boss",
    phase: 1,
  };
};

const formatEnemyName = (archetype: EnemyState["archetype"], wave: number) => {
  switch (archetype) {
    case "goblin":
      return `Goblin Scavenger ${wave}`;
    case "mutant":
      return `Mutant Pest ${wave}`;
    case "golem":
      return `Rock Golem ${wave}`;
    case "shadow":
      return `Shadow Stalker ${wave}`;
    default:
      return `Wild Invader ${wave}`;
  }
};

const baseLog = (): LogEntry[] => [
  makeLog("A hush falls over the farm as you ready your tools.", "system"),
];

export const createBlankSession = (): GameSession => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  status: "idle",
  wave: 1,
  turn: 1,
  player: instantiatePlayer(""),
  enemy: null,
  log: baseLog(),
});

export const createNewSession = (name: string): GameSession => {
  const session = createBlankSession();
  session.player = instantiatePlayer(name);
  session.status = "running";
  ensureEnemy(session);
  session.log.push(makeLog(`Season begins. Defend ${name}'s land!`, "system"));
  return session;
};

const summarizeStats = (player: PlayerState) =>
  makeLog(
    `Stats · HP ${player.health}/${player.maxHealth} · ATK ${player.attack} · DEF ${player.defense}`,
    "system",
  );

const applyBuff = (player: PlayerState, buff: BuffInstance) => {
  player.attack += buff.attackDelta ?? 0;
  player.defense += buff.defenseDelta ?? 0;
  player.maxHealth = Math.max(1, player.maxHealth + (buff.maxHealthDelta ?? 0));
  player.health = clamp(player.health, 0, player.maxHealth);
  player.buffs.push(buff);
};

const expireBuff = (player: PlayerState, buffId: string) => {
  const buff = player.buffs.find((b) => b.id === buffId);
  if (!buff) return;
  player.attack -= buff.attackDelta ?? 0;
  player.defense -= buff.defenseDelta ?? 0;
  player.maxHealth = Math.max(1, player.maxHealth - (buff.maxHealthDelta ?? 0));
  player.health = clamp(player.health, 0, player.maxHealth);
  player.buffs = player.buffs.filter((b) => b.id !== buffId);
};

const tickBuffs = (player: PlayerState, log: LogEntry[]) => {
  for (const buff of [...player.buffs]) {
    buff.duration -= 1;
    if (buff.duration <= 0) {
      expireBuff(player, buff.id);
      log.push(makeLog(`${buff.name} fades.`, "system"));
    }
  }
};

const healPlayer = (player: PlayerState, percent: number, log: LogEntry[], label: string) => {
  const heal = Math.round(player.maxHealth * percent);
  const before = player.health;
  player.health = clamp(player.health + heal, 0, player.maxHealth);
  const gained = player.health - before;
  log.push(makeLog(`${label} restores ${gained} HP.`, "player"));
};

const handlePlayerAttack = (session: GameSession, log: LogEntry[]) => {
  const { player, enemy } = session;
  if (!enemy) return;
  const variance = Math.random() * 0.2 + 0.9;
  let damage = Math.round(player.attack * variance);
  damage = Math.max(1, damage - enemy.defense);
  const critChance = player.upgrades.includes("sharpened-tools")
    ? player.critChance + 0.2
    : player.critChance;
  if (Math.random() < critChance) {
    damage = Math.round(damage * player.critMultiplier);
    log.push(makeLog("Critical hit!", "player"));
  }
  enemy.health = Math.max(0, enemy.health - damage);
  log.push(makeLog(`You strike ${enemy.name} for ${damage}.`, "player"));
};

const handleEnemyTurn = (session: GameSession, log: LogEntry[]) => {
  const { player, enemy } = session;
  if (!enemy || enemy.health <= 0) return;
  const variance = Math.random() * 0.3 + 0.85;
  let damage = Math.round(enemy.attack * variance);
  damage = Math.max(1, damage - player.defense);
  switch (enemy.archetype) {
    case "goblin":
      if (Math.random() < 0.25) {
        const steal = Math.round(player.attack * 0.08);
        player.attack = Math.max(5, player.attack - steal);
        log.push(makeLog("Goblin steals some of your strength!", "enemy"));
      }
      break;
    case "mutant":
      if (Math.random() < 0.3) {
        applyBuff(player, {
          id: crypto.randomUUID(),
          name: "Poison",
          duration: 3,
          description: "Healing reduced.",
          healModifier: -0.5,
        });
        log.push(makeLog("Toxic spores cling to you. Healing halved.", "enemy"));
      }
      break;
    case "golem":
      damage = Math.round(damage * 0.75);
      log.push(makeLog("Golem's stone hide dulls its blow, but it keeps marching.", "enemy"));
      break;
    case "shadow":
      if (Math.random() < 0.35) {
        applyBuff(player, {
          id: crypto.randomUUID(),
          name: "Vulnerable",
          duration: 2,
          defenseDelta: -10,
        });
        log.push(makeLog("Shadows slip past your guard. Defense reduced.", "enemy"));
      }
      break;
    case "boss":
      if (enemy.phase === 1 && enemy.health < enemy.maxHealth * 0.5) {
        enemy.phase = 2;
        enemy.attack = Math.round(enemy.attack * 1.3);
        enemy.defense = Math.round(enemy.defense * 1.2);
        log.push(makeLog("The Abomination mutates into a fiercer form!", "enemy"));
      }
      if (Math.random() < 0.3) {
        const smash = Math.round(player.maxHealth * 0.2);
        player.health = clamp(player.health - smash, 0, player.maxHealth);
        log.push(makeLog("Boss unleashes a ground smash!", "enemy"));
      }
      break;
    default:
      break;
  }
  player.health = clamp(player.health - damage, 0, player.maxHealth);
  log.push(makeLog(`${enemy.name} hits you for ${damage}.`, "enemy"));
};

const cooldownTick = (player: PlayerState) => {
  for (const skill of player.skills) {
    if (skill.remainingCooldown > 0) {
      const reduction = player.upgrades.includes("mystical-well") ? 2 : 1;
      skill.remainingCooldown = Math.max(0, skill.remainingCooldown - reduction);
    }
  }
};

const passiveRegen = (player: PlayerState, log: LogEntry[]) => {
  const regenBase = player.regenPercent + (player.upgrades.includes("fertile-grounds") ? 0.05 : 0);
  if (regenBase <= 0) return;
  const amount = Math.round(player.maxHealth * regenBase);
  const prev = player.health;
  player.health = clamp(player.health + amount, 0, player.maxHealth);
  const gained = player.health - prev;
  if (gained > 0) {
    log.push(makeLog(`Regeneration restores ${gained} HP.`, "reward"));
  }
};

const grantCoins = (player: PlayerState, wave: number, log: LogEntry[]) => {
  const loot = roll(6, 12) + wave * 2;
  player.coins += loot;
  log.push(makeLog(`You collect ${loot} coins from the field.`, "reward"));
};

const maybeGiveSkill = (player: PlayerState, log: LogEntry[]) => {
  const learnable = Object.keys(SKILL_LIBRARY).filter(
    (id) => !player.learnedSkillIds.includes(id),
  );
  if (learnable.length === 0) return;
  if (Math.random() < 0.35) {
    const newSkillId = learnable[Math.floor(Math.random() * learnable.length)];
    player.learnedSkillIds.push(newSkillId);
    player.skills.push({ id: newSkillId, remainingCooldown: 0 });
    log.push(makeLog(`New skill unlocked: ${SKILL_LIBRARY[newSkillId].name}.`, "reward"));
  }
};

const prepareNextWave = (session: GameSession) => {
  session.wave += 1;
  session.turn = 1;
  session.enemy = null;
  healPlayer(session.player, 0.2, session.log, "Wave respite");
  grantCoins(session.player, session.wave, session.log);
  maybeGiveSkill(session.player, session.log);
  if (session.wave % BOSS_INTERVAL === 0) {
    session.pendingDecision = makeFarmDecision();
  }
  ensureEnemy(session);
};

const makeFarmDecision = (): PendingDecision => ({
  id: crypto.randomUUID(),
  type: "farm-upgrade",
  title: "Choose a permanent farm upgrade",
  description: "The land remembers your deeds.",
  options: FARM_UPGRADE_OPTIONS,
});

const applyDecisionEffect = (session: GameSession, optionId: string) => {
  const decision = session.pendingDecision;
  if (!decision) return;
  const option = decision.options.find((opt) => opt.id === optionId);
  if (!option) return;
  for (const effect of option.effects) {
    switch (effect.type) {
      case "stat": {
        if (effect.stat === "attack") {
          session.player.attack += effect.amount;
        }
        if (effect.stat === "defense") {
          session.player.defense += effect.amount;
        }
        if (effect.stat === "maxHealth") {
          session.player.maxHealth = Math.max(1, session.player.maxHealth + effect.amount);
          session.player.health = clamp(session.player.health + effect.amount, 0, session.player.maxHealth);
        }
        break;
      }
      case "healPercent":
        healPlayer(session.player, effect.value, session.log, option.label);
        break;
      case "coins":
        session.player.coins += effect.amount;
        break;
      case "upgrade":
        if (!session.player.upgrades.includes(effect.upgradeId)) {
          session.player.upgrades.push(effect.upgradeId);
        }
        break;
      default:
        break;
    }
  }
  session.log.push(makeLog(`${option.label} embraced.`, "reward"));
  session.pendingDecision = undefined;
};

export const performPlayerAction = (session: GameSession, action: PlayerAction): GameSession => {
  if (session.status !== "running") return session;
  if (session.pendingDecision && action.type !== "decision") {
    return session;
  }

  const next = cloneSession(session);
  const log: LogEntry[] = [];
  next.turn += 1;

  switch (action.type) {
    case "attack":
      handlePlayerAttack(next, log);
      break;
    case "heal":
      healPlayer(next.player, 0.3, log, "You focus and breathe");
      break;
    case "skip":
      log.push(makeLog("You hold your ground, studying the foe.", "player"));
      break;
    case "skill": {
      const skillState = next.player.skills.find((s) => s.id === action.skillId);
      const definition = SKILL_LIBRARY[action.skillId];
      if (!skillState || !definition || skillState.remainingCooldown > 0) {
        log.push(makeLog("Skill not ready.", "system"));
        next.log.push(...log);
        return next;
      }
      const result = definition.execute({
        player: next.player,
        enemy: ensureEnemy(next),
        addBuff: (buff) => applyBuff(next.player, buff),
      });
      skillState.remainingCooldown = definition.cooldown;
      log.push(...result.log);
      break;
    }
    case "decision":
      applyDecisionEffect(next, action.optionId);
      next.log.push(...log);
      return next;
    default:
      break;
  }

  const enemy = ensureEnemy(next);
  if (enemy.health <= 0) {
    next.log.push(...log, makeLog(`${enemy.name} collapses.`, "system"));
    prepareNextWave(next);
    next.log.push(summarizeStats(next.player));
    return next;
  }

  handleEnemyTurn(next, log);
  if (next.player.health <= 0) {
    next.status = "defeat";
    next.log.push(...log, makeLog("You fall defending the fields...", "system"));
    return next;
  }

  tickBuffs(next.player, log);
  cooldownTick(next.player);
  passiveRegen(next.player, log);
  next.log.push(...log);
  return next;
};
