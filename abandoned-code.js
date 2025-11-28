/* eslint-disable */
// Import the readline module for handling console input
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Custom Random class to mimic Dart's Random for nextInt and nextDouble.
 */
class Random {
  /**
   * Returns a non-negative random integer in the range from 0, inclusive, to [max], exclusive.
   * @param {number} max - The exclusive upper bound for the random number.
   * @returns {number}
   */
  nextInt(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Returns a random floating-point number in the range from 0.0, inclusive, to 1.0, exclusive.
   * @returns {number}
   */
  nextDouble() {
    return Math.random();
  }
}

/**
 * Prompts the user for input and returns a Promise that resolves with the input.
 * This is necessary because readline.question is asynchronous.
 * @param {string} promptText - The text to display as a prompt.
 * @returns {Promise<string>} - A Promise that resolves with the user's input.
 */
function askQuestion(promptText) {
  return new Promise(resolve => {
    rl.question(promptText, (answer) => {
      resolve(answer);
    });
  });
}

// --- Helper Classes (Defined first, as they are dependencies for other classes) ---

/**
 * Represents a temporary stat buff or debuff.
 */
class TempBuff {
  name;
  duration;
  stats; // Object containing stat modifications (e.g., {attackPower: 10, description: "..."})

  /**
   * @param {string} name 
   * @param {number} duration 
   * @param {Object} stats 
   */
  constructor(name, duration, stats) {
    this.name = name;
    this.duration = duration;
    this.stats = stats;
  }
}

/**
 * Represents a special skill the player can use.
 */
class Skill {
  name;
  description;
  use; // Function: (player: PlayerFarm, enemy: Monster) => void
  cooldown;
  turnsOnCooldown;

  /**
   * @param {string} name 
   * @param {Function} use 
   * @param {number} cooldown 
   * @param {string} description 
   */
  constructor(name, use, cooldown, description) {
    this.name = name;
    this.use = use;
    this.cooldown = cooldown;
    this.description = description;
    this.turnsOnCooldown = 0;
  }

  putOnCooldown() {
    this.turnsOnCooldown = this.cooldown;
  }
}

/**
 * Represents a permanent relic with a one-time effect and upgrade properties.
 */
class Relic {
  name;
  description;
  applyEffect; // Function: (player: PlayerFarm) => void
  upgradeCost;
  upgradeSuccessChance; // Percentage (e.g., 75 for 75%)
  level; // Current level of the relic

  /**
   * @param {string} name 
   * @param {string} description 
   * @param {Function} applyEffect 
   * @param {number} upgradeCost 
   * @param {number} upgradeSuccessChance 
   * @param {number} [level=1] 
   */
  constructor(name, description, applyEffect, upgradeCost, upgradeSuccessChance, level = 1) {
    this.name = name;
    this.description = description;
    this.applyEffect = applyEffect;
    this.upgradeCost = upgradeCost;
    this.upgradeSuccessChance = upgradeSuccessChance;
    this.level = level;
  }

  /**
   * Upgrades the relic, increasing its level and effect, but also cost and decreasing success chance.
   */
  upgrade() {
    this.level++;
    // The actual effect increase needs to be handled within the applyEffect function
    // when it's called again after upgrade. For this example, we only update cost/chance.
    this.upgradeCost = Math.round(this.upgradeCost * 1.5);
    this.upgradeSuccessChance = this.upgradeSuccessChance * 0.8;
    if (this.upgradeSuccessChance < 10) this.upgradeSuccessChance = 10; // Minimum success chance
  }
}


// --- Character Classes (Order matters due to inheritance) ---

/**
 * A base class for all combatants in the game (Player and Monsters).
 */
class Character {
  name;
  health;
  
  // Base stats that are permanently increased by upgrades/relics
  _baseMaxHP;
  _baseAttackPower;
  _baseDefense;

  // Getters for current effective stats (base + temporary buffs/debuffs)
  get maxHP() {
    let currentMaxHP = this._baseMaxHP;
    for (const buff of this.tempBuffs) {
      if (buff.stats.hasOwnProperty('maxHP')) {
        currentMaxHP += buff.stats.maxHP;
      }
    }
    return currentMaxHP > 0 ? currentMaxHP : 1;
  }
  
  get attackPower() {
    let currentAttackPower = this._baseAttackPower;
    for (const buff of this.tempBuffs) {
      if (buff.stats.hasOwnProperty('attackPower')) {
        currentAttackPower += buff.stats.attackPower;
      }
    }
    return currentAttackPower > 0 ? currentAttackPower : 1;
  }
  
  get defense() {
    let currentDefense = this._baseDefense;
    for (const buff of this.tempBuffs) {
      if (buff.stats.hasOwnProperty('defense')) {
        currentDefense += buff.stats.defense;
      }
    }
    return currentDefense > 0 ? currentDefense : 0;
  }

  tempBuffs = [];
  rand = new Random(); // Use the custom Random class

  /**
   * @param {string} name 
   * @param {number} health 
   * @param {number} attackPower 
   * @param {number} defense 
   */
  constructor(name, health, attackPower, defense) {
    this.name = name;
    this.health = health;
    this._baseMaxHP = health;
    this._baseAttackPower = attackPower;
    this._baseDefense = defense;
  }

  get isAlive() {
    return this.health > 0;
  }

  /**
   * Performs a basic attack on a target character.
   * @param {Character} target - The target of the attack.
   * @param {boolean} [useQTE=false] - Whether to use a Quick Time Event.
   */
  async attack(target, useQTE = false) {
    // Damage calculation based on original Dart logic: random factor + defense reduction
    let damage = Math.round((this.rand.nextDouble() * 0.2 + 0.9) * this.attackPower);
    damage = Math.max(1, damage - target.defense); // Defense reduces damage

    // Critical hit chance (only applies to PlayerFarm for now)
    if (this instanceof PlayerFarm && this.farmUpgrades.includes('Sharpened Tools') && this.rand.nextDouble() < 0.2) {
      damage = Math.round(damage * 1.75);
      console.log('\u{2728} CRITICAL HIT! \u{2728}');
    }

    // Quick Time Event (QTE) logic, only for player attacks
    if (useQTE && this instanceof PlayerFarm) {
      // Only trigger QTE with a chance
      if (this.rand.nextDouble() < 0.4) { // 40% chance for QTE
        const qteMultiplier = await this.performQTE();
        damage = Math.round(damage * qteMultiplier);
      }
    }

    target.health -= damage;
    if (target.health < 0) target.health = 0;
    console.log(`${this.name} attacks ${target.name} for ${damage} damage! \u{2694}`);
  }

  /**
   * Helper function to perform a Quick Time Event.
   * @returns {Promise<number>} - Damage multiplier based on QTE success.
   */
  async performQTE() {
    console.log('Quick Time Event! Press "A" for a bonus hit!');
    const startTime = Date.now();
    const qteInput = (await askQuestion('> ')).toLowerCase();
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (qteInput === 'a' && duration < 800) {
      console.log('Perfect timing! Bonus damage dealt. \u{1F3AF}');
      return 1.8; // Increased QTE bonus
    } else {
      console.log('Missed the bonus! \u{1F622}');
      return 0.7; // QTE fail reduces damage
    }
  }

  /**
   * Reduces the duration of all temporary buffs and debuffs.
   */
  reduceCooldownsAndBuffs() {
    // Create a copy of the array to iterate over, as we might modify it
    const currentBuffs = [...this.tempBuffs];
    const buffsToRemove = [];

    for (const buff of currentBuffs) {
      buff.duration--;
      if (buff.duration <= 0) {
        buffsToRemove.push(buff.name);
      } else {
        // Apply ongoing effects if any (like poison damage or burn damage)
        if (buff.name === 'Poison') {
          const poisonDamage = Math.round(this.maxHP * 0.04); // 4% of max HP per turn
          this.health -= poisonDamage;
          if (this.health < 0) this.health = 0;
          console.log(`\u{2620}\uFE0F ${this.name} takes ${poisonDamage} poison damage!`);
        } else if (buff.name === 'Burn') {
          const burnDamage = Math.round(this.maxHP * 0.02); // 2% of max HP per turn
          this.health -= burnDamage;
          if (this.health < 0) this.health = 0;
          console.log(`\u{1F525} ${this.name} takes ${burnDamage} burn damage!`);
        }
      }
    }

    // Remove expired buffs
    for (const buffName of buffsToRemove) {
      this.removeTempBuff(buffName);
    }
    
    this._recalculateStats(); // Recalculate stats after buff durations change
  }

  /**
   * Applies a temporary buff or debuff to the character.
   * @param {string} name - The name of the buff/debuff.
   * @param {number} duration - The duration in turns.
   * @param {Object} stats - An object containing stat modifications (e.g., {attackPower: 10}).
   */
  applyTempBuff(name, duration, stats) {
    // Print description first
    if (stats.hasOwnProperty('description')) {
      console.log(stats.description);
    } else {
      console.log(`You have been affected by ${name}.`);
    }

    // Check if buff already exists and revert its effects before reapplying
    const existingBuffIndex = this.tempBuffs.findIndex(buff => buff.name === name);
    if (existingBuffIndex !== -1) {
      const oldBuff = this.tempBuffs[existingBuffIndex];
      // Revert old buff's stat effects
      for (const stat in oldBuff.stats) {
        if (stat === 'attackPower') this._baseAttackPower -= oldBuff.stats[stat];
        if (stat === 'defense') this._baseDefense -= oldBuff.stats[stat];
        if (stat === 'maxHP') this._baseMaxHP -= oldBuff.stats[stat];
      }
      this.tempBuffs.splice(existingBuffIndex, 1); // Remove the old buff
      console.log(`Buff "${name}" duration refreshed and effect re-applied!`);
    } else {
       console.log(`${this.name} is affected by ${name} for ${duration} turns.`);
    }

    // Apply new buff effects
    const newBuff = new TempBuff(name, duration, stats);
    this.tempBuffs.push(newBuff);
    
    for (const stat in stats) {
      if (stat === 'attackPower') this._baseAttackPower += stats[stat];
      if (stat === 'defense') this._baseDefense += stats[stat];
      if (stat === 'maxHP') this._baseMaxHP += stats[stat];
    }

    console.log(`Buff received: ${name}`);
    this._recalculateStats(); // Recalculate stats immediately after applying buff
  }

  /**
   * Removes a temporary buff and reverts its effects.
   * @param {string} buffName - The name of the buff to remove.
   */
  removeTempBuff(buffName) {
    const buffIndex = this.tempBuffs.findIndex(buff => buff.name === buffName);
    if (buffIndex !== -1) {
      const buffData = this.tempBuffs.splice(buffIndex, 1)[0];
      for (const stat in buffData.stats) {
        // Revert the stat change
        if (stat === 'attackPower') this._baseAttackPower -= buffData.stats[stat];
        if (stat === 'defense') this._baseDefense -= buffData.stats[stat];
        if (stat === 'maxHP') this._baseMaxHP -= buffData.stats[stat];
      }
      console.log(`${this.name} is no longer affected by ${buffName}.`);
      this._recalculateStats(); // Recalculate stats after removing buff
    }
  }

  /**
   * Recalculates the character's effective stats based on base stats and active temporary buffs.
   * This method ensures the getters reflect the latest state.
   */
  _recalculateStats() {
    // The getters themselves already perform the calculation.
    // This call is mainly to ensure health is clamped if maxHP changes.
    if (this.health > this.maxHP) this.health = this.maxHP;
  }

  /**
   * Returns a formatted string of the character's current and max HP.
   * @returns {string}
   */
  displayHP() {
    let healthBar = '❤️';
    // Changed to 30 blocks for better granularity
    const healthPercentage = Math.round((this.health / this.maxHP) * 30); 
    for (let i = 0; i < 30; i++) {
      if (i < healthPercentage) {
        healthBar += '█';
      } else {
        healthBar += '░';
      }
    }
    return `${this.health} (${healthBar})`;
  }
}

/**
 * The player's specific character, representing their farm.
 */
class PlayerFarm extends Character {
  coins = 0;
  mana = 100;
  maxMana = 100; // This is the base max mana
  skills = [];
  relics = []; // Renamed from playerRelics for consistency
  farmUpgrades = [];
  defensivePath = false;

  // Static properties are declared here. Their actual values are assigned
  // in the initializePlayerFarmStaticData() function after all classes are defined.
  static essenceOfTheAncientFarm;
  static allPossibleSkills;
  static allPossibleRelics;

  /**
   * @param {string} name 
   */
  constructor(name) {
    // Boosted initial player stats
    super(name, 200, 30, 25); // Initial HP: 200, Attack: 30, Defense: 25
  }

  /**
   * Heals the player for a percentage of their max HP.
   */
  heal() {
    let healAmount = Math.round(this.maxHP * 0.3); // Increased base heal to 30%
    // Apply healing debuff if active
    if (this.tempBuffs.some(buff => buff.name === 'Healing Debuff')) {
      healAmount = Math.round(healAmount / 2);
      console.log('(\u{2620}\uFE0F Healing is halved due to a debuff!)');
    }

    this.health += healAmount;
    if (this.health > this.maxHP) this.health = this.maxHP;
    console.log(`You heal for ${healAmount} HP. \u{2728}`);
  }

  /**
   * Heals the player by a specified percentage.
   * @param {number} percent 
   */
  healPercent(percent) {
    // Apply healing debuff if active
    if (this.tempBuffs.some(buff => buff.name === 'Healing Debuff')) {
      percent /= 2; // Halve healing
      console.log('(\u{2620}\uFE0F Healing is halved due to a debuff!)');
    }

    let healAmount = Math.round(this.maxHP * percent);

    if (this.health >= this.maxHP) {
      // If already at full health, provide a MAX HP increase instead
      // Increased maxHpBoost range
      const maxHpBoost = Math.max(10, Math.min(30, Math.round(healAmount * 0.7))); 
      this._baseMaxHP += maxHpBoost;
      this.health += maxHpBoost; // Also increase current HP along with max HP
      console.log(`\u{2728} ${this.name} is already at full health, so your MAX HP increased by ${maxHpBoost}!`);
    } else {
      // Otherwise, perform a regular heal
      const actualHeal = Math.min(healAmount, this.maxHP - this.health);
      this.health += actualHeal;
      console.log(`You heal for ${actualHeal} HP from a special effect. \u{1F49A}`);
    }
  }

  /**
   * Damages the player by a specified percentage.
   * @param {number} percent 
   */
  damagePercent(percent) {
    let damageTaken = Math.round(this.maxHP * percent);
    this.health -= damageTaken;
    if (this.health < 0) this.health = 0;
    // Removed generic "from a special effect" as context usually makes it obvious
    console.log(`You take ${damageTaken} damage! \u{1F4A5}`);
  }

  /**
   * Adds a new skill to the player's skills list.
   * @param {boolean} [forceNew=false] 
   */
  addNewSkill(forceNew = false) {
    const learnableSkills = PlayerFarm.allPossibleSkills.filter(s => !this.skills.some(existing => existing.name === s.name));

    if (learnableSkills.length > 0) {
      const newSkill = learnableSkills[this.rand.nextInt(learnableSkills.length)];
      this.skills.push(newSkill);
      console.log(`\u{2728} New skill acquired: ${newSkill.name}!`);
    } else if (forceNew) {
      // This path is for when Konami Code or Peddler 'forces' a new skill when all are learned
      this._baseAttackPower += 8;
      this._baseMaxHP += 15;
      this.health += 15;
      console.log('\u{2728} All skills learned! Instead, you feel a surge of power, gaining a significant attack and HP boost!');
    } else {
      console.log('You\'ve learned all available skills!');
    }
  }

  /**
   * Resets all player skill cooldowns.
   */
  resetAllSkillCooldowns() {
    for (const skill of this.skills) {
      skill.turnsOnCooldown = 0;
    }
    console.log('All your skills are ready to be used again! \u{1F504}');
  }

  /**
   * Adds a new relic and applies its effect immediately.
   * @param {Relic} newRelic 
   */
  addRelic(newRelic) {
    this.relics.push(newRelic);
    newRelic.applyEffect(this);
    this._recalculateStats(); // Recalculate stats after applying relic effect
  }

  /**
   * Reapplies all relic effects. Useful after relic upgrades/breakage.
   */
  applyRelicEffects() {
    // Store current health percentage to maintain relative health after stat changes
    const healthPercent = this.health / this.maxHP;

    // Reset base stats to their initial values before reapplying all permanent effects
    // This ensures a clean slate before applying all current permanent boosts.
    // Updated initial base stats
    this._baseMaxHP = 200; 
    this._baseAttackPower = 30;
    this._baseDefense = 25;
    this.maxMana = 100;

    // Reapply permanent buffs from story choices and farm upgrades
    if (this.defensivePath) {
      this._baseDefense += 60; // Reapply defense boost from story path (Dart value)
    }
    // Reapply other permanent farm upgrades if they modify _base stats
    // (e.g., if 'Sharpened Tools' or 'Mystical Well' had direct _base stat modifications)
    // Currently, these upgrades don't directly modify _base stats, but rather game mechanics.

    // Reapply each relic's effect based on its current level
    for (const relic of this.relics) {
      // The applyEffect function within the Relic class should be designed to apply
      // effects based on the relic's current 'level'.
      relic.applyEffect(this); 
    }
    this._recalculateStats(); // Ensure current health is clamped to new maxHP

    // Restore health based on the percentage before stat changes
    this.health = Math.round(this.maxHP * healthPercent);
  }

  /**
   * Adds a permanent farm upgrade.
   * @param {string} upgradeName 
   */
  addFarmUpgrade(upgradeName) {
    if (!this.farmUpgrades.includes(upgradeName)) {
      this.farmUpgrades.push(upgradeName);
    }
  }

  /**
   * Applies a permanent defense boost.
   */
  defenseBoost() {
    this._baseDefense += 60; // Matching Dart's value
    this._recalculateStats();
  }

  /**
   * Applies a permanent attack power boost.
   */
  attackBoost() {
    this._baseAttackPower += 25; // Matching Dart's value
    this._recalculateStats();
  }

  /**
   * Reduces cooldowns, buff durations, and applies passive upgrades.
   */
  reduceCooldownsAndBuffs() {
    super.reduceCooldownsAndBuffs(); // Handles temporary buffs
    for (const skill of this.skills) {
      const cooldownReduction = this.farmUpgrades.includes('Mystical Well') ? 2 : 1;
      if (skill.turnsOnCooldown > 0) {
        skill.turnsOnCooldown = Math.max(0, skill.turnsOnCooldown - cooldownReduction);
      }
    }
  }

  /**
   * Clears all temporary buffs and recalculates stats.
   */
  resetTemporaryBuffs() {
    // Collect names of all active buffs to remove
    const activeBuffNames = this.tempBuffs.map(buff => buff.name);
    for (const buffName of activeBuffNames) {
      this.removeTempBuff(buffName);
    }
    this._recalculateStats(); // Recalculate stats after clearing buffs
  }
  
  /**
   * Applies a permanent stat boost after a wave.
   */
  async waveClearUpgrade() {
    // Reverted to automatic stat increase as per user request
    this._baseAttackPower += 8; // Boosted wave clear attack
    this._baseMaxHP += 15; // Boosted wave clear HP
    this.health = this.maxHP; // Full HP on wave clear
    console.log('\n\u{1F3AF} You feel stronger after defending your land. HP restored and stats increased.');
    this._recalculateStats(); // Recalculate after permanent upgrade

    // Add Fertile Grounds effect if upgrade is present
    if (this.farmUpgrades.includes('Fertile Grounds')) {
      this.healPercent(0.05); // Fertile Grounds regenerates 5% max HP
      console.log('\u{1F331} Fertile Grounds invigorates you further!');
    }
  }

  /**
   * Passive healing that occurs in battle.
   */
  passiveHeal() {
    let healAmount = Math.round(this.maxHP * 0.03); // 3% of max HP per turn
    // Apply healing debuff if active
    if (this.tempBuffs.some(buff => buff.name === 'Healing Debuff')) {
      healAmount = Math.round(healAmount / 2);
    }
    this.health += healAmount;
    if (this.health > this.maxHP) this.health = this.maxHP;
    console.log(`A soothing aura heals ${this.name} for ${healAmount} HP. \u{1F33F}`);
  }
}

/**
 * Represents a standard enemy monster.
 */
class Monster extends Character {
  wave;
  type;

  /**
   * @param {number} wave 
   * @param {string} type 
   */
  constructor(wave, type = 'Normal') {
    // Adjusted monster base stats based on original Dart code
    super(
      type,
      80 + wave * 14, // Base health
      10 + wave * 4, // Base attack
      5 + wave * 1, // Base defense (kept original JS scaling for defense, as Dart didn't explicitly scale it for normal monsters)
    );
    this.wave = wave;
    this.type = type;
  }

  /**
   * Returns a formatted string of the monster's current and max HP.
   * @returns {string}
   */
  displayHP() {
    return `${this.health} / ${this.maxHP} HP`;
  }

  /**
   * Performs an attack on a target character. Includes monster-specific effects.
   * @param {Character} target 
   * @param {boolean} [useQTE=false] 
   */
  async attack(target, useQTE = false) {
    let damage = Math.round((this.rand.nextDouble() * 0.3 + 0.85) * this.attackPower); // Dart's random damage
    damage = Math.max(1, damage - target.defense); // Defense reduces damage

    // Monster-specific attack effects
    switch (this.type) {
      case 'Goblin Scavenger':
        if (this.rand.nextDouble() < 0.25) {
          const stolenAttack = Math.round(target.attackPower * 0.1);
          if (stolenAttack > 0 && target instanceof PlayerFarm) {
            target.applyTempBuff('Attack Debuff', 2, {'attackPower': -stolenAttack, 'description': 'The Goblin Scavenger nimbly pilfers your attack power!'});
          }
        }
        break;
      case 'Mutant Pest':
        if (this.rand.nextDouble() < 0.3) {
          if (target instanceof PlayerFarm) {
            target.applyTempBuff('Poison', 3, {'description': 'The Mutant Pest inflicts a potent poison! Your healing is halved.'}); // Increased duration
          }
        }
        break;
      case 'Rock Golem':
        damage = Math.round(damage * 0.7); // Rock Golem's attack is blunted
        console.log('\u{1F9F1} The Rock Golem\'s attack feels blunted by its stony hide.');
        break;
      case 'Shadow Stalker': // New enemy type
        if (this.rand.nextDouble() < 0.35) {
          if (target instanceof PlayerFarm) {
            target.applyTempBuff('Vulnerable', 2, {'defense': -10, 'description': 'The Shadow Stalker phases through your defenses, leaving you vulnerable!'});
          }
        }
        break;
    }

    target.health -= damage;
    if (target.health < 0) target.health = 0;
    console.log(`${this.name} attacks ${target.name} for ${damage} damage! \u{1F4A5}`);
  }
}

/**
 * A boss character with multiple phases and unique abilities.
 */
class Boss extends Monster {
  phase = 1;
  playerRef; // Reference to the actual player object
  bossAbilityCooldown = 3; // Cooldown for boss abilities
  turnsSinceLastAbility = 0; // Tracks turns since last ability use

  /**
   * @param {number} wave 
   * @param {PlayerFarm} playerInstance - The actual player object.
   */
  constructor(wave, playerInstance) {
    super(wave, 'Dreadful Warden'); // Call Monster constructor
    this.name = `BOSS WAVE #${wave} - The Abomination`;
    // Adjusted boss base stats based on original Dart code and user feedback
    this._baseMaxHP = (80 + wave * 14) * 2; // Double normal monster HP
    this.health = this._baseMaxHP;
    this._baseAttackPower = (10 + wave * 4) * 2; // Double normal monster Attack
    this._baseDefense = (5 + wave * 1) * 2; // Double normal monster Defense
    this.playerRef = playerInstance; // Assign the player instance
    console.log(`\u{2620}\uFE0F The mighty ${this.name} appears, its presence ominous!`);
  }

  /**
   * Uses a random ability based on the current boss phase.
   */
  async useAbility() {
    if (!this.isAlive) return;
    const abilities = this.getAbilities();
    // In JavaScript, we need to bind 'this' if the ability function uses 'this'
    // or pass playerRef explicitly if the function expects it as an arg.
    // For simplicity, abilities are defined to directly use playerRef.
    abilities[this.rand.nextInt(abilities.length)]();
  }
  
  /**
   * Gets the list of available abilities for the current phase.
   * @returns {Array<Function>}
   */
  getAbilities() {
    // Phase transition logic
    if (this.phase === 1 && this.health <= (this._baseMaxHP * 0.5)) {
      this.phase = 2;
      console.log(`\n!!! The ${this.name} roars, transforming into its second, more menacing form!!! \u{1F47F}`);
      this._baseMaxHP = Math.round(this._baseMaxHP * 1.2); // Boss gains more HP in phase 2
      this.health += Math.round(this._baseMaxHP * 0.2); // Heal a bit on phase transition
      // Nerfed phase 2 defense increase
      this._baseAttackPower = Math.round(this._baseAttackPower * 1.5);
      this._baseDefense += 10; // Reduced defense increase
      this._recalculateStats(); // Recalculate boss stats after phase change
    }

    if (this.phase === 1) {
      return [
        () => {
          const damage = Math.round(this.playerRef.maxHP * 0.25);
          this.playerRef.health -= damage;
          if (this.playerRef.health < 0) this.playerRef.health = 0;
          console.log(`\u{1F300} The ${this.name} unleashes a devastating Ground Slam, dealing ${damage} area damage!`);
        },
        () => {
          // Reduced boss heal amount as per user feedback
          const healAmount = Math.round(this.maxHP * 0.1); // Reduced from 0.2 to 0.1
          this.health += healAmount;
          if (this.health > this.maxHP) this.health = this.maxHP;
          console.log(`\u{1F9B8} The ${this.name} begins to Regenerate, restoring ${healAmount} HP!`);
        },
        () => {
          this.playerRef.applyTempBuff('Attack Debuff', 3, {'attackPower': -15, 'description': `The ${this.name} emits a Terrifying Roar! Your attack power is temporarily reduced!`}); // Increased duration
        }
      ];
    } else { // Phase 2 abilities
      return [
        () => {
          const damage = Math.round(this.playerRef.maxHP * 0.4);
          this.playerRef.health -= damage;
          if (this.playerRef.health < 0) this.player.health = 0;
          console.log(`\u{1F525} The ${this.name} enters a furious rage, unleashing a Fiery Barrage for ${damage} damage!`);
        },
        () => {
          this.playerRef.applyTempBuff('Attack Debuff', 3, {'attackPower': -25, 'description': `The ${this.name} emits a Terrifying Roar! Your attack power is greatly reduced!`}); // Increased duration
        },
        () => {
          this.applyTempBuff('Defense Buff', 3, {'defense': 30, 'description': `The ${this.name} conjures a magical barrier, increasing its defense!`}); // Increased duration
        },
        () => {
          this.playerRef.applyTempBuff('Healing Debuff', 3, {'description': `The ${this.name} unleashes a crippling disease! Your healing is halved for 3 turns.`}); // Increased duration
        }
      ];
    }
  }
  
  /**
   * Overrides the default attack to use boss-specific abilities and handle cooldown.
   * @param {Character} target 
   * @param {boolean} [useQTE=false] 
   */
  async attack(target, useQTE = false) {
    // Boss performs a normal attack first
    await super.attack(target, useQTE); 

    this.turnsSinceLastAbility++;
    if (this.turnsSinceLastAbility >= this.bossAbilityCooldown) {
      await this.useAbility(); // Boss uses special ability
      this.turnsSinceLastAbility = 0;
    }
  }
}

// --- Initialization Function for PlayerFarm Static Properties ---
// This function must be called AFTER all relevant classes (Skill, Relic) are defined.
function initializePlayerFarmStaticData() {
  PlayerFarm.essenceOfTheAncientFarm = new Skill(
    'Essence of the Ancient Farm',
    async (p, e) => { // Made async to allow QTE if needed
      console.log('The ancient power within you surges, healing your wounds and striking your foe!'); // Text for Konami skill use
      let healAmount = Math.round(p.maxHP * 0.2);
      // Apply healing debuff if active for Konami skill heal
      if (p.tempBuffs.some(buff => buff.name === 'Healing Debuff')) {
        healAmount = Math.round(healAmount / 2);
        console.log('(\u{2620}\uFE0F Healing is halved due to a debuff!)');
      }
      p.health += healAmount;
      if (p.health > p.maxHP) p.health = p.maxHP;
      console.log(`You heal for ${healAmount} HP from the ancient power!`);

      let damage = Math.round(p.attackPower * 2.0); // Increased damage for Konami skill
      e.health -= damage;
      console.log(`The ancient power blasts ${e.name} for ${damage} damage!`);
    },
    8, // Increased cooldown
    'Heals you for 20% of your max HP and deals 200% of your attack power as damage. (CD: 8)'
  );

  PlayerFarm.allPossibleSkills = [
    new Skill('Fertilizing Strike', async (p, e) => { // Made async to allow QTE
      console.log('You strike the ground with a fertilized tool! It deals heavy damage to the enemy and heals you slightly.');
      let healAmount = Math.round(p.maxHP * 0.1);
      // Apply healing debuff if active
      if (p.tempBuffs.some(buff => buff.name === 'Healing Debuff')) {
        healAmount = Math.round(healAmount / 2);
        console.log('(\u{2620}\uFE0F Healing is halved due to a debuff!)');
      }
      
      let damage = Math.round(p.attackPower * 1.2);
      // QTE for offensive skills
      if (p.rand.nextDouble() < 0.4) {
        const qteMultiplier = await p.performQTE();
        damage = Math.round(damage * qteMultiplier);
      }

      e.health -= damage;
      p.health += healAmount;
      if (p.health > p.maxHP) p.health = p.maxHP;
      console.log(`It deals ${damage} damage to ${e.name} and heals you for ${healAmount} HP!`);
    }, 3, 'Deals 120% ATK damage and heals you for 10% of your Max HP. (CD: 3)'),
    new Skill('Protective Barrier', (p, e) => {
      console.log('You conjure a barrier of swirling leaves and vines, increasing your defense.');
      p.applyTempBuff('Defense Boost', 4, {'defense': 15, 'description': 'A barrier increases your defense!'}); // Increased duration
    }, 4, 'Increases your defense by 15 for 4 turns. (CD: 4)'),
    new Skill('Seed of Vigor', async (p, e) => { // Made async to allow QTE
      console.log('You plant a glowing seed, temporarily increasing your attack power.');
      p.applyTempBuff('Attack Boost', 3, {'attackPower': 25, 'description': 'A seed of vigor boosts your attack!'}); // Increased duration

      let damage = Math.round(p.attackPower * 0.5); // Small damage component
      // QTE for offensive skills
      if (p.rand.nextDouble() < 0.4) {
        const qteMultiplier = await p.performQTE();
        damage = Math.round(damage * qteMultiplier);
      }
      e.health -= damage;
      console.log(`You also deal ${damage} damage to ${e.name} as a side effect.`);
    }, 5, 'Increases your attack power by 25 for 3 turns. (CD: 5)'),
  ];

  PlayerFarm.allPossibleRelics = [
    new Relic('Amulet of Vitality', 'Increases your maximum HP.', (p) => p._baseMaxHP += 50, 200, 75),
    new Relic('Ring of Power', 'Increases your attack power.', (p) => p._baseAttackPower += 10, 150, 80),
    new Relic('Armor Fragment', 'Increases your defense.', (p) => p._baseDefense += 5, 100, 90),
    new Relic('Mystic Gem', 'Increases your mana regeneration.', (p) => p.maxMana += 20, 120, 85),
    new Relic('Swift Charm', 'Reduces all skill cooldowns.', (p) => p.resetAllSkillCooldowns(), 180, 70),
  ];
}


/**
 * A class to manage the overall game flow, including waves, battles, and events.
 */
class Game {
  player;
  wave = 1;
  usedEvents = new Set(); // Dart's Set directly translates to JavaScript Set

  static konamiSequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  konamiInput = [];
  konamiUses = 0;
  konamiLocked = false;

  rand = new Random(); // Use the custom Random class

  /**
   * Starts the game and the main game loop.
   */
  async start() {
    console.log('Welcome to Battle Farm Saga!');
    const name = await askQuestion('Enter your farm name: ') || 'Farm';
    this.player = new PlayerFarm(name);

    // No starting skill as per user request. Skills are acquired through events/shop.

    while (this.player.isAlive) {
      const enemy = this.generateEnemy(this.wave);
      console.log(`\n=== Wave ${this.wave} ===`);
      await this.storyArc(this.wave);
      await this.battle(enemy);

      if (!this.player.isAlive) {
        break;
      }

      // If player defeated the enemy
      if (enemy.health <= 0) {
        await this.player.waveClearUpgrade(); // This can have async input
        this.player.resetTemporaryBuffs();
        await this.handleEnemyDefeat(enemy); // This can have async input
        await this.checkFarmUpgradeOpportunity(); // This can have async input
        await this.showShop(); // This can have async input
      }

      this.wave++;
    }

    console.log(`\n\u{1F480} ${this.player.name} has fallen at wave ${this.wave}.`);
    console.log('\u{1F33E} Thanks for playing!');
  }

  /**
   * Generates a new enemy based on the current wave.
   * @param {number} wave - The current wave number.
   * @returns {Monster} - The generated monster or boss.
   */
  generateEnemy(wave) {
    if (wave % 5 === 0) {
      return new Boss(wave, this.player); // Pass the actual player instance to the Boss
    } else {
      const monsterTypes = ['Normal', 'Goblin Scavenger', 'Mutant Pest', 'Rock Golem', 'Shadow Stalker']; // Added new enemy
      const chosenType = monsterTypes[this.rand.nextInt(monsterTypes.length)];
      return new Monster(wave, chosenType);
    }
  }

  /**
   * Manages the turn-based battle between the player and an enemy.
   * @param {Monster} enemy - The enemy monster.
   */
  async battle(enemy) {
    let turnCount = 0;
    const isBossBattle = (enemy instanceof Boss);

    while (this.player.isAlive && enemy.health > 0) {
      turnCount++;
      console.log(`\n--- Turn ${turnCount} ---`);
      console.log(`${this.player.name}: ${this.player.displayHP()} | ${enemy.name}: ${enemy.displayHP()} | Coins: ${this.player.coins}\u{1FA99}`);

      await this.showOptions(enemy); // Player takes action, which can be async

      if (enemy.health <= 0 || !this.player.isAlive) {
        break;
      }

      // Enemy takes action after player's turn, if both are still alive
      await enemy.attack(this.player); // Enemy attack might have async QTE in Dart version

      if (enemy.health <= 0 || !this.player.isAlive) {
        break;
      }

      // Dynamic Enemy Scaling Logic (Adjusted to be less aggressive than previous JS versions)
      if (this.wave < 20 && !isBossBattle && turnCount > 10) {
        // Normal enemies below wave 20, stronger every turn after turn 10
        enemy._baseAttackPower += 1; // Additive scaling
        console.log(`The ${enemy.name} grows restless, its attacks becoming more fierce! 💪`);
      } else if (isBossBattle && turnCount > 20 && turnCount % 2 === 0) {
        // Boss enemies, stronger every 2 turns after turn 20
        enemy._baseAttackPower += 2; // Additive scaling
        console.log(`The ${enemy.name}'s power swells, consuming the battlefield! 💥`);
      } else if (this.wave <= 50 && !isBossBattle && turnCount > 15) {
        // Normal enemies up to wave 50, stronger every turn after turn 15
        enemy._baseAttackPower += 1; // Additive scaling
        console.log(`The ${enemy.name} begins to adapt, its movements becoming more lethal! 🗡️`);
      }

      // End of round effects
      this.player.passiveHeal(); // In-battle passive healing
      this.player.reduceCooldownsAndBuffs();
      enemy.reduceCooldownsAndBuffs();
    }
  }

  /**
   * Displays the player's action options during a battle.
   * @param {Monster} enemy - The enemy monster.
   */
  async showOptions(enemy) {
    console.log('Choose action: [1] Attack  [2] Heal  [3] Skill  [4] Skip');
    const input = await askQuestion('> ');

    switch (input) {
      case '1':
        await this.player.attack(enemy, true); // useQTE is true, so player.attack needs to be async
        break;
      case '2':
        this.player.heal();
        break;
      case '3':
        if (this.player.skills.length > 0) {
          console.log('Available Skills:');
          for (let i = 0; i < this.player.skills.length; i++) {
            const skill = this.player.skills[i];
            const skillStatus = skill.turnsOnCooldown > 0
                ? ` (CD: ${skill.turnsOnCooldown} turns)`
                : '';
            console.log(`${i + 1}. ${skill.name}: ${skill.description}${skillStatus}`);
          }
          const skillIndexStr = await askQuestion('Choose skill: ');
          const skillIndex = parseInt(skillIndexStr);
          if (!isNaN(skillIndex) && skillIndex > 0 && skillIndex <= this.player.skills.length) {
            const chosenSkill = this.player.skills[skillIndex - 1];
            if (chosenSkill.turnsOnCooldown === 0) {
              // Check if skill is healing or Konami before applying QTE logic
              const isHealingSkill = chosenSkill.name === 'Protective Barrier'; // Assuming this is the only non-damaging/non-Konami skill
              const isKonamiSkill = chosenSkill.name === PlayerFarm.essenceOfTheAncientFarm.name;

              if (!isHealingSkill && !isKonamiSkill && this.rand.nextDouble() < 0.4) { // 40% chance for QTE on non-healing/non-Konami skills
                const qteMultiplier = await this.player.performQTE();
                // Pass the multiplier to the skill's use function if it needs to apply it
                // This requires modifying the skill's use function to accept a multiplier.
                // For simplicity, I'll assume skills apply damage directly and QTE is handled within the skill's use.
                // Or, if the skill itself doesn't cause damage, no QTE.
                await chosenSkill.use(this.player, enemy); // Skills now async to support QTE within them
              } else {
                await chosenSkill.use(this.player, enemy); // Skills now async
              }
              chosenSkill.putOnCooldown();
            } else {
              console.log(`Skill "${chosenSkill.name}" is on cooldown for ${chosenSkill.turnsOnCooldown} more turns.`);
            }
          } else {
            console.log('Invalid skill choice.');
          }
        } else {
          console.log('You have no skills yet.');
        }
        break;
      case '4':
        console.log(`${this.player.name} skips the turn.`);
        break;
      default:
        console.log('Invalid choice.');
        break;
    }
  }

  /**
   * Triggers a special story event or decision at specific waves.
   * @param {number} wave - The current wave number.
   */
  async storyArc(wave) {
    if (wave % 5 === 0) {
      console.log(`\n\u{1F4DC} STORY ARC [${wave}]`);
      switch (wave) {
        case 5:
          console.log('A shadow farmer raids your field. The air grows cold, something darker looms...');
          break;
        case 10:
          console.log('A cult called Scorch appears — burning farms across the land. Their fires draw closer.');
          break;
        case 15:
          console.log('A rogue survivor, weary but wise, teaches you a mysterious skill, hoping it aids your fight.');
          this.player.addNewSkill();
          break;
        case 20:
          console.log('The Emberlord arrives, a being of pure flame. Fire rages around your barn, threatening everything.');
          break;
        case 25:
          console.log('You uncover the truth behind the blight. Will you DEFEND your land with unwavering resolve [1] or STRIKE BACK at the source of the corruption [2]?');
          const decision = await askQuestion('> ');
          if (decision === '1') {
            this.player.defensivePath = true;
            console.log('You fortify your land with ancient wards. Your defenses become unshakable!');
            this.player.defenseBoost();
            this.player.healPercent(0.75);
          } else {
            console.log('You prepare for a swift, decisive counterattack! Your offensive might grows immensely!');
            this.player.attackBoost();
          }
          break;
        case 30:
          console.log('Whispers of a hidden power echo through the fields. A choice awaits: seek KNOWLEDGE [1] or raw STRENGTH [2]?');
          const decision30 = await askQuestion('> ');
          if (decision30 === '1') {
            console.log('You delve into ancient farming texts, learning new ways to heal and sustain.');
            this.player._baseMaxHP += 30; // Direct modification to base stat
            this.player.health += 30;
          } else {
            console.log('You train relentlessly, pushing your physical limits for pure power.');
            this.player._baseAttackPower += 25; // Direct modification to base stat
          }
          break;
        case 35:
          console.log('The sky darkens. A terrible omen. You must choose a sacrifice: your maximum HEALTH [1] for immense power, or your current ATTACK [2] for a protective shield?');
          const decision35 = await askQuestion('> ');
          if (decision35 === '1') {
            console.log('You offer a portion of your vitality for raw destructive force!');
            this.player._baseMaxHP = Math.round(this.player._baseMaxHP * 0.8); // Direct modification to base stat
            if (this.player.health > this.player.maxHP) this.player.health = this.player.maxHP;
            this.player._baseAttackPower += 40; // Direct modification to base stat
          } else {
            console.log('You channel your aggressive urges into a defensive aura!');
            this.player._baseAttackPower = Math.round(this.player._baseAttackPower * 0.75); // Direct modification to base stat
            this.player._baseMaxHP += 200; // Direct modification to base stat
            this.player.healPercent(1.0);
          }
          break;
        case 40:
          console.log('A desperate plea reaches your farm. A neighboring village is under siege. Will you RISK ALL [1] to aid them, or PROTECT YOUR OWN [2]?');
          const decision40 = await askQuestion('> ');
          if (decision40 === '1') {
            console.log('You march to war! The village is saved, but you return weary. All skills cooldowns reset, but current HP reduced.');
            this.player.resetAllSkillCooldowns();
            this.player.damagePercent(0.3);
            this.player._baseAttackPower += 15; // Small permanent gain
          } else {
            console.log('You focus on your defenses. Your farm holds, but a sense of missed opportunity lingers. Small max HP gain.');
            this.player._baseMaxHP += 20; // Direct modification to base stat
          }
          break;
        default:
          console.log('The struggle continues, your farm standing strong against the growing darkness.');
          break;
      }
    }

    if (this.wave > 1 && this.wave % 3 === 0) {
      await this.triggerRandomEvent();
    }
  }

  /**
   * Triggers a random event that can be beneficial or harmful to the player.
   */
  async triggerRandomEvent() {
    const events = [
      'Mysterious Merchant', 'Lightning Storm', 'Lost Cow Returns', 'Strange Seed Sprouts',
      'Fairy Circle Discovered', 'Bandit Ambush', 'Wandering Peddler', 'Mysterious Chest',
      'Forgotten Lore', 'Raging Wildfire', 'Bountiful Harvest', 'Foul Blight',
      'Lost Adventurer', 'Meteor Shower', 'Ancient Relic Discovered' // New event
    ];
    let chosen;
    const availableEvents = events.filter(e => !this.usedEvents.has(e));

    if (availableEvents.length > 0 && this.rand.nextDouble() < 0.7) {
      chosen = availableEvents[this.rand.nextInt(availableEvents.length)];
      this.usedEvents.add(chosen);
    } else {
      chosen = events[this.rand.nextInt(events.length)];
    }

    console.log(`\n\u{2728} Random Event: ${chosen} !`);
    switch (chosen) {
      case 'Mysterious Merchant':
        console.log('A cloaked figure appears, offering ancient farming secrets for a price. You gain a rare skill!');
        this.player.addNewSkill();
        break;
      case 'Lightning Storm':
        console.log('A sudden, fierce lightning storm crackles overhead! Both you and the enemy take significant damage.');
        this.player.damagePercent(0.15);
        break;
      case 'Lost Cow Returns':
        console.log('Your prized cow, thought lost, returns to the farm, bringing good fortune! You feel invigorated.');
        this.player.healPercent(0.35);
        break;
      case 'Strange Seed Sprouts':
        console.log('A strange, glowing seed sprouts into a vibrant, mystical plant. Your maximum vitality increases!');
        this.player._baseMaxHP += 15; // Direct modification
        this.player.health += 15;
        break;
      case 'Fairy Circle Discovered':
        console.log('You stumble upon a hidden fairy circle. Their magic temporarily boosts your strength!');
        this.player.applyTempBuff('Attack Boost', 3, {'attackPower': 15, 'description': 'A fairy\'s blessing boosts your attack!'}); // Increased duration
        break;
      case 'Bandit Ambush':
        console.log('A group of desperate bandits ambushes you! You take unexpected damage defending your goods.');
        this.player.damagePercent(0.2);
        break;
      case 'Wandering Peddler':
        console.log('A friendly peddler approaches with a cart full of strange wares.');
        console.log('[1] Buy a Skill Scroll (50 Coins)');
        console.log('[2] Buy a Potent HP Potion (30 Coins)');
        console.log('[3] Buy a temporary Strength Brew (20 Coins)');
        console.log('[4] Decline');
        const choicePeddler = await askQuestion('> ');
        switch (choicePeddler) {
          case '1':
            if (this.player.coins >= 50) {
              this.player.coins -= 50;
              this.player.addNewSkill(true);
              console.log('You bought a skill scroll!');
            } else {
              console.log('Not enough coins!');
            }
            break;
          case '2':
            if (this.player.coins >= 30) {
              this.player.coins -= 30;
              this.player.healPercent(0.5);
              console.log('You drank a potent HP potion!');
            } else {
              console.log('Not enough coins!');
            }
            break;
          case '3':
            if (this.player.coins >= 20) {
              this.player.coins -= 20;
              this.player.applyTempBuff('Attack Boost', 3, {'attackPower': 20, 'description': 'You drank a strength brew!'}); // Increased duration
              console.log('You drank a strength brew!');
            } else {
              console.log('Not enough coins!');
            }
            break;
          default:
            console.log('You wave goodbye to the peddler.');
            break;
        }
        break;
      case 'Mysterious Chest':
        console.log('You find a mysterious, ornate chest! Do you try to open it? [Y/N]');
        const choiceChest = (await askQuestion('> ')).toLowerCase();
        if (choiceChest === 'y') {
          if (this.rand.nextDouble() < 0.6) {
            const reward = this.rand.nextInt(3);
            if (reward === 0) {
              console.log('The chest springs open, revealing shimmering gold! You gain 50 coins!');
              this.player.coins += 50;
            } else if (reward === 1) {
              console.log('A comforting warmth emanates from the chest, restoring your health!');
              this.player.healPercent(0.4);
            } else {
              console.log('A surge of energy flows into you! Your attack power permanently increases by 10!');
              this.player._baseAttackPower += 10; // Direct modification
            }
          } else {
            const penalty = this.rand.nextInt(2);
            if (penalty === 0) {
              console.log('A puff of noxious gas escapes! You take 100 damage.');
              this.player.health = Math.max(0, this.player.health - 100);
            } else {
              console.log('A curse emanates from the chest! Your attack power is temporarily reduced!');
              this.player.applyTempBuff('Attack Debuff', 3, {'attackPower': -10, 'description': 'A curse reduces your attack power!'}); // Increased duration
            }
          }
        } else {
          console.log('You decide against opening the ominous chest.');
        }
        break;
      case 'Forgotten Lore':
        console.log('You uncover ancient, dust-covered scrolls of forgotten farming techniques. Will you focus on ENHANCING VITALITY [1] or mastering POTENT TECHNIQUES [2]?');
        const choiceLore = await askQuestion('> ');
        if (choiceLore === '1') {
          this.player._baseMaxHP += 20; // Direct modification
          this.player.health += 20;
          console.log('You gain a deeper understanding of life, increasing your max HP!');
        } else {
          this.player._baseAttackPower += 10; // Direct modification
          console.log('You learn combat secrets, increasing your attack power!');
        }
        break;
      case 'Raging Wildfire':
        console.log('A raging wildfire approaches your farm! Do you try to FIGHT it [1] or EVACUATE [2]?');
        const choiceFire = await askQuestion('> ');
        if (choiceFire === '1') {
          console.log('You bravely fight the flames! It\'s arduous work...');
          if (this.rand.nextDouble() < 0.6) {
            this.player.damagePercent(0.2);
            console.log('You manage to push back the fire, but not without taking some damage.');
            this.player._baseAttackPower += 5; // Small reward for fighting
          } else {
            this.player.damagePercent(0.4);
            console.log('The fire overwhelms you, causing significant damage!');
          }
        } else {
          console.log('You evacuate your livestock and valuables. The farm is safe, but you lose some time.');
          this.player.applyTempBuff('Attack Debuff', 1, {'attackPower': -5, 'description': 'You lose energy from evacuating.'});
        }
        break;
      case 'Bountiful Harvest':
        console.log('Your crops yield an unexpectedly bountiful harvest! You feel completely refreshed.');
        this.player.healPercent(1.0);
        break;
      case 'Foul Blight':
        console.log('A mysterious blight spreads across your fields, weakening your resolve!');
        this.player.applyTempBuff('Attack Debuff', 3, {'attackPower': -10, 'description': 'A blight weakens your attack!'}); // Increased duration
        break;
      case 'Lost Adventurer':
        console.log('You encounter a lost and injured adventurer. Do you help them [1] or leave them [2]?');
        const choiceAdventurer = await askQuestion('> ');
        if (choiceAdventurer === '1') {
          console.log('You tend to their wounds. Grateful, they share some of their loot with you!');
          this.player.coins += 20 + this.rand.nextInt(10);
          this.player.healPercent(0.1);
        } else {
          console.log('You leave the adventurer to their fate. A sense of unease washes over you.');
        }
        break;
      case 'Meteor Shower':
        console.log('A sudden meteor shower rains down! Both you and your foe take collateral damage!');
        this.player.damagePercent(0.1);
        break;
      case 'Ancient Relic Discovered': // New event logic
        console.log('You unearth a hidden chamber, revealing a shimmering ancient relic!');
        const newRelic = PlayerFarm.allPossibleRelics[this.rand.nextInt(PlayerFarm.allPossibleRelics.length)];
        this.player.addRelic(newRelic);
        console.log(`\u{1F381} You found a mysterious Relic: ${newRelic.name}!`);
        break;
    }
  }

  /**
   * Logic for the Konami Code secret.
   */
  async checkKonami() {
    if (this.konamiLocked) {
      console.log('The whispers of that ancient power have faded. Its power is locked from your SOUL.');
      this.player.coins += 1;
      return;
    }
    if (this.konamiUses >= 3) {
      this.konamiLocked = true;
      console.log("A booming voice echoes from YOUR mind: 'Enough. Power abused becomes curse. Your link is severed.'");
      return;
    }

    const nextExpectedInput = Game.konamiSequence[this.konamiInput.length];
    console.log('You encountered The Well. It is said that it can grant power from THE ANCIENTS, with a unique sequence..');
    console.log('The air hums with anticipation from the well. A voice echoes from your mind, you cant clearly hear it but... ');
    console.log(`"${nextExpectedInput}."`);
    const input = (await askQuestion('> ')).toLowerCase();

    if (input === nextExpectedInput) {
      this.konamiInput.push(input);
      console.log('The well emits a little glow... perhaps do it again?');

      if (this.konamiInput.length === Game.konamiSequence.length) {
        this.konamiInput = [];
        this.konamiUses++;

        if (!this.player.skills.some(s => s.name === PlayerFarm.essenceOfTheAncientFarm.name)) {
          this.player.skills.push(PlayerFarm.essenceOfTheAncientFarm);
          console.log('\u{1F33F} You have unlocked the legendary "Essence of the Ancient Farm" skill!');
          this.player._baseAttackPower += 60; // Boosted Konami attack
          this.player._baseMaxHP += 90; // Boosted Konami HP
          this.player.health += 90;
          console.log('Your farm resonates with ancient power, granting permanent stats!');
        } else {
          if (PlayerFarm.essenceOfTheAncientFarm.turnsOnCooldown > 0) {
            PlayerFarm.essenceOfTheAncientFarm.turnsOnCooldown = 0;
            console.log('The Ancient Well revitalizes your "Essence of the Ancient Farm" skill!');
          } else {
            console.log('The Ancient Well offers no further power for this skill at the moment.');
          }
        }

        if (this.konamiUses >= 3) {
          this.konamiLocked = true;
          console.log("A booming voice whispers from your SOUL: 'ENOUGH. Power abused becomes curse. Your link is severed.'");
        }
      }
    } else {
      console.log('The Well emits a water drop sound and a click. Sounds like a reset..');
      this.konamiInput = [];
    }
  }

  /**
   * Offers the player a choice of permanent farm upgrades after a boss wave.
   */
  async checkFarmUpgradeOpportunity() {
    if (this.wave % 5 === 0 && this.wave > 0) {
      console.log('\n\u{1F3E1} Your farm has proven its worth! Choose a permanent upgrade:');
      console.log('[1] Fertile Grounds: Regenerates 5% of your Max HP after each wave!');
      console.log('[2] Sharpened Tools: 20% chance for critical hits (175% damage)!');
      console.log('[3] Mystical Well: Reduces skill cooldowns by an additional 1 turn!');
      const choice = await askQuestion('> ');

      switch (choice) {
        case '1':
          this.player.addFarmUpgrade('Fertile Grounds');
          console.log('Your fields become Fertile Grounds, subtly healing you over time!');
          break;
        case '2':
          this.player.addFarmUpgrade('Sharpened Tools');
          console.log('Your tools are Sharpened, granting you a chance for devastating critical hits!');
          break;
        case '3':
          this.player.addFarmUpgrade('Mystical Well');
          console.log('A Mystical Well appears, allowing your skills to recharge at an accelerated rate!');
          break;
        default:
          console.log('Invalid choice. No upgrade chosen for now.');
          break;
      }
    }
  }

  /**
   * Handles rewards for defeating an enemy, including coin and relic drops.
   * @param {Monster} enemy - The defeated enemy.
   */
  async handleEnemyDefeat(enemy) {
    let dropChance = 0.3;
    let minCoins = 5;
    let maxCoins = 15;

    if (enemy instanceof Boss) {
      dropChance = 0.8;
      minCoins = 20;
      maxCoins = 50;
      if (this.rand.nextDouble() < 0.5) {
        const newRelic = PlayerFarm.allPossibleRelics[this.rand.nextInt(PlayerFarm.allPossibleRelics.length)];
        this.player.addRelic(newRelic);
        console.log(`\u{1F381} The ${enemy.name} dropped a mysterious Relic: ${newRelic.name}!`);
      }
    } else if (enemy.type === 'Goblin Scavenger') {
      dropChance = 0.5;
      minCoins = 8;
      maxCoins = 18;
    }

    if (this.rand.nextDouble() < dropChance) {
      const coinsDropped = minCoins + this.rand.nextInt(maxCoins - minCoins + 1);
      this.player.coins += coinsDropped;
      console.log(`\u{1FA99} The ${enemy.name} dropped ${coinsDropped} coins!`);
    } else {
      console.log(`No coins dropped from ${enemy.name} this time.`);
    }
  }

  /**
   * Displays the shop where the player can buy items.
   */
  async showShop() {
    let choice;
    do {
      console.log(`\n\u{1F6D2} Welcome to the Farm Supply Shop! Your Coins: ${this.player.coins}\u{1FA99}`);
      console.log('What would you like to buy?');
      console.log('[1] HP Potion (Heals 50% Max HP) - 40 Coins');
      console.log('[2] Attack Potion (Temporary +25 Attack for 3 turns) - 30 Coins'); // Updated duration
      console.log('[3] Skill Scroll (Learn a new skill if available) - 60 Coins');
      console.log('[4] Wish for Power in the Well (1 Coins)');
      console.log('[5] View/Upgrade Relics'); // New option for relics
      console.log('[6] Leave Shop');
      choice = await askQuestion('> ');

      switch (choice) {
        case '1':
          if (this.player.coins >= 40) {
            this.player.coins -= 40;
            this.player.healPercent(0.5);
            console.log('You bought and used an HP Potion!');
          } else {
            console.log('Not enough coins!');
          }
          break;
        case '2':
          if (this.player.coins >= 30) {
            this.player.coins -= 30;
            this.player.applyTempBuff('Attack Boost', 3, {'attackPower': 25, 'description': 'You bought and drank an Attack Potion! You feel stronger.'}); // Increased duration
            console.log('You bought and drank an Attack Potion! You feel stronger for 3 turns.');
          } else {
            console.log('Not enough coins!');
          }
          break;
        case '3':
          if (this.player.coins >= 60) {
            if (this.player.skills.length < PlayerFarm.allPossibleSkills.length) {
              this.player.coins -= 60;
              this.player.addNewSkill(true);
              console.log('You bought a Skill Scroll! A new skill awakens within you.');
            } else {
              console.log('You already know all skills! Maybe save your coins for something else.');
            }
          } else {
            console.log('Not enough coins!');
          }
          break;
        case '4':
          if (this.player.coins >= 1) {
            this.player.coins -= 1;
            await this.checkKonami(); // Await Konami check
          } else {
            console.log('You need at least 1 coins to seek these whispers.');
          }
          break;
        case '5': // New case for relic shop
          await this._relicShopMenu(); // Await relic menu
          break;
        case '6':
          console.log('You leave the shop.');
          this.player.coins += 5;
          console.log('\u{1FA99} You gained 5 coins for your visit!');
          break;
        default:
          console.log('Invalid choice.');
          break;
      }
    } while (choice !== '6');
  }

  /**
   * Menu for viewing and upgrading relics.
   */
  async _relicShopMenu() {
    if (this.player.relics.length === 0) {
      console.log('You have no relics to view or upgrade.');
      return;
    }
    let choice;
    do {
      console.log('\n=== Your Relics ===');
      for (let i = 0; i < this.player.relics.length; i++) {
        const relic = this.player.relics[i];
        console.log(`${i + 1}. ${relic.name}: ${relic.description} (Lvl ${relic.level})`);
      }
      console.log('\n[U] Upgrade a relic');
      console.log('[B] Back to shop');
      choice = (await askQuestion('Choose an option: ')).toLowerCase();

      if (choice === 'u') {
        console.log('Which relic would you like to upgrade?');
        const indexStr = await askQuestion('Enter number: ');
        const index = parseInt(indexStr);
        if (!isNaN(index) && index > 0 && index <= this.player.relics.length) {
        const relicToUpgrade = this.player.relics[index - 1];
          console.log(`Upgrading ${relicToUpgrade.name} (Lvl ${relicToUpgrade.level})...`);
          console.log(`Cost: ${relicToUpgrade.upgradeCost} coins. Success Chance: ${Math.round(relicToUpgrade.upgradeSuccessChance)}%`);
          const confirm = (await askQuestion('Proceed? (y/n): ')).toLowerCase();
          if (confirm === 'y') {
            if (this.player.coins >= relicToUpgrade.upgradeCost) {
              this.player.coins -= relicToUpgrade.upgradeCost;
              if (this.rand.nextDouble() * 100 < relicToUpgrade.upgradeSuccessChance) {
                relicToUpgrade.upgrade();
                console.log(`Success! The ${relicToUpgrade.name} is now Level ${relicToUpgrade.level}! ✨`);
                this.player.applyRelicEffects(); // Reapply all relic effects
              } else {
                console.log(`Oh no! The upgrade failed and the ${relicToUpgrade.name} shattered! 💥`);
                this.player.relics.splice(index - 1, 1); // Remove the broken relic
                this.player.applyRelicEffects(); // Reapply to remove the broken relic's effects
              }
            } else {
              console.log('Not enough coins to upgrade!');
            }
          }
        } else {
          console.log('Invalid choice.');
        }
      }
    } while (choice !== 'b');
  }
}

/**
 * The entry point of the application.
 */
async function main() {
  // Initialize static properties AFTER all classes are defined
  initializePlayerFarmStaticData();

  const game = new Game();
  await game.start();
  rl.close(); // Close the readline interface when the game finishes
}

// Call the main function to start the game
main();