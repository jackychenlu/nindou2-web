import { ninjutsuRuleProfiles } from "./config.module.mjs";

export const modeRuleProfiles = {
  modified: {
    weapons: {
      weapon4: { damage: 40 },
      weapon6: { damage: 13 },
      weapon7: { damage: 70 },
      weapon8: { damage: 20 },
    },
    ninjutsu: ninjutsuRuleProfiles.modified,
  },
  original: {
    weapons: {
      weapon4: { damage: 50 },
      weapon6: { damage: 25 },
      weapon8: { damage: 50 },
    },
    ninjutsu: ninjutsuRuleProfiles.original,
  },
};

export function currentRuleModeKey(stateLike = {}) {
  if (typeof stateLike?.ruleModeKey === "string") {
    if (stateLike.ruleModeKey === "modified") return "modified";
    return "original";
  }
  if (stateLike?.useOriginalMode) return "original";
  return "modified";
}

export function currentRuleProfile(stateLike = {}) {
  const modeKey = currentRuleModeKey(stateLike);
  return modeRuleProfiles[modeKey] || modeRuleProfiles.modified;
}

export function currentDeathModeKey(stateLike = {}) {
  if (typeof stateLike?.deathModeKey === "string") {
    return stateLike.deathModeKey === "death_heal" ? "death_heal" : "death_command";
  }
  return "death_heal";
}

export function weaponDamageForMode(weaponKey, fallbackDamage, stateLike = {}) {
  const weaponRule = currentRuleProfile(stateLike).weapons?.[weaponKey];
  return weaponRule?.damage ?? fallbackDamage;
}

export function steelRule(stateLike = {}) {
  return currentRuleProfile(stateLike).ninjutsu?.steel || {};
}

export function hotBloodRule(stateLike = {}) {
  return currentRuleProfile(stateLike).ninjutsu?.hotBlood || {};
}

export function healNinjuRule(type, stateLike = {}) {
  const baseRule = currentRuleProfile(stateLike).ninjutsu?.[type] || {};
  if (type !== "genki" && type !== "kakki" && type !== "shinki") return baseRule;
  const deathModeKey = currentDeathModeKey(stateLike);
  if (deathModeKey === "death_heal") {
    if (type === "genki" && currentRuleModeKey(stateLike) === "modified") {
      const healRule = modeRuleProfiles.original?.ninjutsu?.genki || {};
      return {
        ...healRule,
        available: true,
      };
    }
    return {
      ...baseRule,
      available: true,
    };
  }
  return {
    ...baseRule,
    available: false,
  };
}

export function specialNinjuRule(type, stateLike = {}) {
  return currentRuleProfile(stateLike).ninjutsu?.[type] || {};
}

export function moneyDartRule(stateLike = {}) {
  return currentRuleProfile(stateLike).ninjutsu?.moneyDart || {};
}

export function attackNinjuRule(type, stateLike = {}) {
  return currentRuleProfile(stateLike).ninjutsu?.[type] || {};
}

export function summarizeRuleModeProfiles(legacyProfiles = {}) {
  const moduleModes = Object.keys(modeRuleProfiles);
  const legacyModes = Object.keys(legacyProfiles);
  const moduleWeaponKeysByMode = Object.fromEntries(
    moduleModes.map((mode) => [mode, Object.keys(modeRuleProfiles[mode]?.weapons || {})]),
  );
  const legacyWeaponKeysByMode = Object.fromEntries(
    legacyModes.map((mode) => [mode, Object.keys(legacyProfiles[mode]?.weapons || {})]),
  );
  const moduleNinjutsuKeysByMode = Object.fromEntries(
    moduleModes.map((mode) => [mode, Object.keys(modeRuleProfiles[mode]?.ninjutsu || {})]),
  );
  const legacyNinjutsuKeysByMode = Object.fromEntries(
    legacyModes.map((mode) => [mode, Object.keys(legacyProfiles[mode]?.ninjutsu || {})]),
  );
  const modeOrderSynced = moduleModes.length === legacyModes.length
    && moduleModes.every((mode, index) => mode === legacyModes[index]);
  const weaponKeysSynced = JSON.stringify(moduleWeaponKeysByMode) === JSON.stringify(legacyWeaponKeysByMode);
  const ninjutsuKeysSynced = JSON.stringify(moduleNinjutsuKeysByMode) === JSON.stringify(legacyNinjutsuKeysByMode);
  return {
    moduleModes,
    legacyModes,
    moduleWeaponKeysByMode,
    legacyWeaponKeysByMode,
    moduleNinjutsuKeysByMode,
    legacyNinjutsuKeysByMode,
    isSynced: modeOrderSynced && weaponKeysSynced && ninjutsuKeysSynced,
  };
}
