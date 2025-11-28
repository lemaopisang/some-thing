import { SkillDefinition, DecisionOption } from "@/lib/game/types";
import { makeLog } from "@/lib/game/utils";

export const SKILL_LIBRARY: Record<string, SkillDefinition> = {
  "fertilizing-strike": {
    id: "fertilizing-strike",
    name: "Fertilizing Strike",
    description: "Deal 120% damage and heal for 10% of max HP.",
    cooldown: 3,
    tags: ["offense", "healing"],
    execute: ({ player, enemy }) => {
      const damage = Math.round(player.attack * 1.2);
      enemy.health = Math.max(0, enemy.health - damage);
      const heal = Math.round(player.maxHealth * 0.1);
      player.health = Math.min(player.maxHealth, player.health + heal);
      return {
        log: [
          makeLog(`You strike ${enemy.name} for ${damage} and nurture yourself for ${heal}.`, "player"),
        ],
      };
    },
  },
  "protective-barrier": {
    id: "protective-barrier",
    name: "Protective Barrier",
    description: "Gain +15 defense for 3 turns.",
    cooldown: 4,
    tags: ["defense"],
    execute: ({ addBuff }) => {
      addBuff?.({
        id: crypto.randomUUID(),
        name: "Protective Barrier",
        duration: 3,
        defenseDelta: 15,
        description: "Swirling vines deflect incoming blows.",
      });
      return {
        log: [makeLog("Vines weave into a barrier, bolstering your defenses.", "player")],
      };
    },
  },
  "seed-of-vigor": {
    id: "seed-of-vigor",
    name: "Seed of Vigor",
    description: "Gain +20 attack for 3 turns and deal chip damage.",
    cooldown: 5,
    tags: ["offense"],
    execute: ({ player, enemy, addBuff }) => {
      const damage = Math.round(player.attack * 0.5);
      enemy.health = Math.max(0, enemy.health - damage);
      addBuff?.({
        id: crypto.randomUUID(),
        name: "Seed of Vigor",
        duration: 3,
        attackDelta: 20,
        description: "You feel sap coursing through your grip.",
      });
      return {
        log: [
          makeLog(
            `You plant a radiant seed, gaining focus and shaving ${damage} HP from ${enemy.name}.`,
            "player",
          ),
        ],
      };
    },
  },
  "essence-ancient": {
    id: "essence-ancient",
    name: "Essence of the Ancient Farm",
    description: "Heal 20% max HP and deal 200% damage.",
    cooldown: 8,
    tags: ["offense", "healing"],
    execute: ({ player, enemy }) => {
      const heal = Math.round(player.maxHealth * 0.2);
      const damage = Math.round(player.attack * 2);
      player.health = Math.min(player.maxHealth, player.health + heal);
      enemy.health = Math.max(0, enemy.health - damage);
      return {
        log: [
          makeLog(
            `Ancient roots surge through you. You restore ${heal} HP and blast ${enemy.name} for ${damage}.`,
            "player",
          ),
        ],
      };
    },
  },
};

export const FARM_UPGRADE_OPTIONS: DecisionOption[] = [
  {
    id: "fertile-grounds",
    label: "Fertile Grounds",
    summary: "+5% wave-end regeneration",
    effects: [{ type: "upgrade", upgradeId: "fertile-grounds" }],
  },
  {
    id: "sharpened-tools",
    label: "Sharpened Tools",
    summary: "Unlock 20% crit chance",
    effects: [{ type: "upgrade", upgradeId: "sharpened-tools" }],
  },
  {
    id: "mystical-well",
    label: "Mystical Well",
    summary: "Reduce skill cooldowns by 1",
    effects: [{ type: "upgrade", upgradeId: "mystical-well" }],
  },
];
