import {
  maxSkill,
  soulMaxLevel,
  soulStepsPerLevel,
  tachiMasterSkillMax,
} from "../data/config.module.mjs";

export const aiProfiles = {
  ai_beginner: {
    reactionMultiplier: 1,
    skillRegenMultiplier: 1,
    meleeAttackChance: 0.55,
    chaseChance: 0.84,
    thinkMinMs: 320,
    thinkRandMs: 360,
    steelUseChance: 0,
    moneyDartReadyChance: 0,
    moneyDartThrowChance: 0,
	deathSound: "death6",
	deathVolume: 1.0
  },
  ai_red: {
    reactionMultiplier: 0.35,
    skillRegenMultiplier: 0,
    meleeAttackChance: 0,
    chaseChance: 0.12,
    thinkMinMs: 260,
    thinkRandMs: 180,
    steelUseChance: 0,
    moneyDartReadyChance: 0,
    moneyDartThrowChance: 0,
	deathSound: "death3",
	deathVolume: 1.0
  },
  ai_tachi_master: {
    reactionMultiplier: 0.75,
    skillRegenMultiplier: 2,
    skillMax: tachiMasterSkillMax,
    meleeAttackChance: 0.72,
    chaseChance: 0.42,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 1,
    kakkiHpThreshold: 200,
    kakkiUseChance: 1,
    flashHpThreshold: 150,
    flashUseChance: 0.35,
    moneyDartReadyChance: 0.49,
    moneyDartThrowChance: 0.49,
    moneyDartLineDelayMs: 900,
  },
  ai_god: {
    reactionMultiplier: 0.1,
    skillRegenMultiplier: 4,
    meleeAttackChance: 0.65,
    chaseChance: 0.50,
    thinkMinMs: 50,
    thinkRandMs: 50,
    steelUseChance: 0.1,
    hotBloodUseChance: 0.1,
    wildfireUseChance: 1,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
  ai_money_dart_master: {
    reactionMultiplier: 0.5,
    skillRegenMultiplier: 2,
    meleeAttackChance: 0.86,
    chaseChance: 0.96,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 0.01,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
  ai_dart_only_master: {
    reactionMultiplier: 0.5,
    skillRegenMultiplier: 2,
    meleeAttackChance: 0,
    chaseChance: 0.98,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 0.01,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
};

export const tachiMasterMoveAggroMs = 500;
export const tachiMasterSoulSecondsPerLevel = 30;
export const tachiMasterSoulChargePerSecond = soulStepsPerLevel / tachiMasterSoulSecondsPerLevel;
export const aiRedRetaliationLineDelayMs = 500;

export function aiProfile(unit) {
  return aiProfiles[unit?.controlMode] || aiProfiles.ai_beginner;
}

export function isMoneyDartFocusedAi(unit) {
  return unit?.controlMode === "ai_money_dart_master" || unit?.controlMode === "ai_dart_only_master" || unit?.controlMode === "ai_tachi_master";
}

export function isRedGroupAi(unit) {
  return unit?.controlMode === "ai_red";
}

export function isTachiMasterAi(unit) {
  return unit?.controlMode === "ai_tachi_master";
}

export function trackAiRecentDamage(unit, now) {
  if (!unit) return;
  const damageTaken = unit.damageTaken || 0;
  if (!Number.isFinite(unit.aiLastDamageTaken)) {
    unit.aiLastDamageTaken = damageTaken;
    return;
  }
  if (damageTaken > unit.aiLastDamageTaken) {
    unit.aiRecentlyDamagedUntil = now + tachiMasterMoveAggroMs;
  }
  unit.aiLastDamageTaken = damageTaken;
}

export function isTachiMasterMoveReady(unit, profile, now) {
  if (!isTachiMasterAi(unit)) return true;
  const skillLimit = unit?.skillMax || profile?.skillMax || maxSkill;
  const skillReady = (unit?.skill || 0) >= skillLimit * 0.9;
  const recentlyDamaged = now < (unit?.aiRecentlyDamagedUntil || 0);
  return skillReady || recentlyDamaged;
}

export function updateTachiMasterSoulCharge(unit, dt) {
  if (!isTachiMasterAi(unit) || !Number.isFinite(dt) || dt <= 0) return;
  const maxSteps = soulStepsPerLevel * soulMaxLevel;
  unit.soulSteps = Math.min(maxSteps, Math.max(0, unit.soulSteps || 0) + tachiMasterSoulChargePerSecond * dt);
}

export function aiIgnoresSkillCosts(unit) {
  return isRedGroupAi(unit);
}

export function aiRedChargeDelay(distance) {
  return 500 + Math.max(0, distance - 1) * 100;
}

export function isDiagonalAdjacent(a, b) {
  return Boolean(a && b && Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1);
}

export function isOrthogonalLine(unit, target) {
  return Boolean(unit && target && (unit.x === target.x || unit.y === target.y));
}

export function isInNineGrid(unit, target) {
  return Boolean(unit && target && Math.max(Math.abs(unit.x - target.x), Math.abs(unit.y - target.y)) <= 1);
}

function stable(value) {
  return JSON.stringify(value);
}

export function runAiProfileProbe() {
  const tachi = { controlMode: "ai_tachi_master", skill: 16, skillMax: 18, soulSteps: 0, damageTaken: 4 };
  const lowSkillTachi = { controlMode: "ai_tachi_master", skill: 10, skillMax: 18, aiRecentlyDamagedUntil: 1200 };
  const red = { controlMode: "ai_red", x: 4, y: 4 };
  const target = { x: 6, y: 4 };
  const diagonal = { x: 5, y: 5 };
  const far = { x: 7, y: 7 };

  trackAiRecentDamage(tachi, 1000);
  tachi.damageTaken = 8;
  trackAiRecentDamage(tachi, 1100);
  updateTachiMasterSoulCharge(tachi, 30);
  updateTachiMasterSoulCharge(tachi, 999);

  return {
    profileKeys: Object.keys(aiProfiles),
    tachiProfile: aiProfile(tachi),
    fallbackProfile: aiProfile({ controlMode: "unknown" }),
    focusFlags: ["ai_money_dart_master", "ai_dart_only_master", "ai_tachi_master", "ai_beginner"].map((controlMode) => isMoneyDartFocusedAi({ controlMode })),
    redFlags: ["ai_red", "ai_god"].map((controlMode) => isRedGroupAi({ controlMode })),
    tachiFlags: ["ai_tachi_master", "ai_red"].map((controlMode) => isTachiMasterAi({ controlMode })),
    recentDamage: {
      aiLastDamageTaken: tachi.aiLastDamageTaken,
      aiRecentlyDamagedUntil: tachi.aiRecentlyDamagedUntil,
    },
    moveReady: [
      isTachiMasterMoveReady(tachi, aiProfile(tachi), 1100),
      isTachiMasterMoveReady(lowSkillTachi, aiProfile(lowSkillTachi), 1100),
      isTachiMasterMoveReady(lowSkillTachi, aiProfile(lowSkillTachi), 1300),
      isTachiMasterMoveReady({ controlMode: "ai_beginner", skill: 0 }, aiProfile({ controlMode: "ai_beginner" }), 1300),
    ],
    soulSteps: tachi.soulSteps,
    ignoresSkillCosts: [aiIgnoresSkillCosts(red), aiIgnoresSkillCosts(tachi)],
    redChargeDelays: [aiRedChargeDelay(0), aiRedChargeDelay(1), aiRedChargeDelay(4)],
    geometry: {
      diagonal: isDiagonalAdjacent(red, diagonal),
      orthogonal: isOrthogonalLine(red, target),
      nineGridA: isInNineGrid(red, diagonal),
      nineGridB: isInNineGrid(red, far),
    },
  };
}

export function summarizeAiProfileHelpers(legacy = {}) {
  const moduleResult = runAiProfileProbe();
  const legacyResult = legacy.runAiProfileProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
