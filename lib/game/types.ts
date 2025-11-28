export type Tone = "system" | "player" | "enemy" | "reward";

export interface LogEntry {
  id: string;
  text: string;
  tone: Tone;
  timestamp: number;
}

export interface BuffInstance {
  id: string;
  name: string;
  duration: number;
  attackDelta?: number;
  defenseDelta?: number;
  maxHealthDelta?: number;
  healModifier?: number;
  description?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  tags: Array<"offense" | "defense" | "healing">;
  execute: (context: SkillContext) => SkillResult;
}

export interface SkillInstance {
  id: string;
  remainingCooldown: number;
}

export interface SkillContext {
  player: PlayerState;
  enemy: EnemyState;
  addBuff?: (buff: BuffInstance) => void;
}

export interface SkillResult {
  log: LogEntry[];
}

export interface PlayerState {
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  coins: number;
  mana: number;
  skills: SkillInstance[];
  learnedSkillIds: string[];
  buffs: BuffInstance[];
  upgrades: string[];
  critChance: number;
  critMultiplier: number;
  regenPercent: number;
}

export type EnemyArchetype =
  | "normal"
  | "goblin"
  | "mutant"
  | "golem"
  | "shadow"
  | "boss";

export interface EnemyState {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  wave: number;
  archetype: EnemyArchetype;
  phase?: number;
}

export type GameStatus = "idle" | "running" | "victory" | "defeat";

export interface DecisionOption {
  id: string;
  label: string;
  summary: string;
  effects: DecisionEffect[];
}

export type DecisionEffect =
  | { type: "stat"; stat: "attack" | "defense" | "maxHealth"; amount: number }
  | { type: "healPercent"; value: number }
  | { type: "coins"; amount: number }
  | { type: "upgrade"; upgradeId: string };

export interface PendingDecision {
  id: string;
  type: "farm-upgrade" | "story-choice";
  title: string;
  description?: string;
  options: DecisionOption[];
}

export interface GameSession {
  id: string;
  createdAt: number;
  status: GameStatus;
  wave: number;
  turn: number;
  player: PlayerState;
  enemy: EnemyState | null;
  log: LogEntry[];
  pendingDecision?: PendingDecision;
}

export type PlayerAction =
  | { type: "attack" }
  | { type: "heal" }
  | { type: "skip" }
  | { type: "skill"; skillId: string }
  | { type: "decision"; optionId: string };
