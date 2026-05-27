import {
  modeRuleProfiles,
  currentRuleModeKey,
  currentDeathModeKey,
  weaponDamageForMode,
  steelRule,
  hotBloodRule,
  healNinjuRule,
  specialNinjuRule,
  moneyDartRule,
  attackNinjuRule,
} from "../data/rule-modes.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function flashRule(stateLike = {}) {
  return attackNinjuRule("flash", stateLike);
}

function wildfireRule(stateLike = {}) {
  return attackNinjuRule("wildfire", stateLike);
}

function deathRule(stateLike = {}) {
  return attackNinjuRule("death", stateLike);
}

function freezeRule(stateLike = {}) {
  return attackNinjuRule("freeze", stateLike);
}

export function installRuleModeGlobals(target = globalThis) {
  const stateLike = () => resolveRuntimeState(target) || {};
  target.modeRuleProfiles = modeRuleProfiles;
  target.currentRuleModeKey = () => currentRuleModeKey(stateLike());
  target.currentDeathModeKey = () => currentDeathModeKey(stateLike());
  target.weaponDamageForMode = (weaponKey, fallbackDamage) =>
    weaponDamageForMode(weaponKey, fallbackDamage, stateLike());
  target.steelRule = () => steelRule(stateLike());
  target.hotBloodRule = () => hotBloodRule(stateLike());
  target.healNinjuRule = (type) => healNinjuRule(type, stateLike());
  target.specialNinjuRule = (type) => specialNinjuRule(type, stateLike());
  target.moneyDartRule = () => moneyDartRule(stateLike());
  target.attackNinjuRule = (type) => attackNinjuRule(type, stateLike());
  target.flashRule = () => flashRule(stateLike());
  target.wildfireRule = () => wildfireRule(stateLike());
  target.deathRule = () => deathRule(stateLike());
  target.freezeRule = () => freezeRule(stateLike());
  target.NindouRuleModes = {
    modeRuleProfiles,
    currentRuleModeKey: target.currentRuleModeKey,
    currentDeathModeKey: target.currentDeathModeKey,
    weaponDamageForMode: target.weaponDamageForMode,
    steelRule: target.steelRule,
    hotBloodRule: target.hotBloodRule,
    healNinjuRule: target.healNinjuRule,
    specialNinjuRule: target.specialNinjuRule,
    moneyDartRule: target.moneyDartRule,
    attackNinjuRule: target.attackNinjuRule,
    flashRule: target.flashRule,
    wildfireRule: target.wildfireRule,
    deathRule: target.deathRule,
    freezeRule: target.freezeRule,
  };
}
