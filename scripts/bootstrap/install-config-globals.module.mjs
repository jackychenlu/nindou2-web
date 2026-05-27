import * as config from "../data/config.module.mjs";

export function installConfigGlobals(target = globalThis) {
  Object.assign(target, config);
  target.NindouConfig = {
    weaponCooldownMs: config.weaponCooldownMs,
    weaponDamage: config.weaponDamage,
    objectHp: config.objectHp,
    maxSkill: config.maxSkill,
    tachiMasterSkillMax: config.tachiMasterSkillMax,
    soulStepsPerLevel: config.soulStepsPerLevel,
    soulMaxLevel: config.soulMaxLevel,
    ninjuFollowupMoveAllowance: config.ninjuFollowupMoveAllowance,
    countdownTotalMs: config.countdownTotalMs,
    grid: config.grid,
    battleMapDrawInset: config.battleMapDrawInset,
    defaultRoomMapKey: config.defaultRoomMapKey,
    roomMapDefinitions: config.roomMapDefinitions,
    ui: config.ui,
    startingAreas: config.startingAreas,
    itemSlotStartX: config.itemSlotStartX,
    itemSlotY: config.itemSlotY,
    itemSlotW: config.itemSlotW,
    itemSlotH: config.itemSlotH,
    itemSlotGap: config.itemSlotGap,
    ninjutsuRuleProfiles: config.ninjutsuRuleProfiles,
  };
}
