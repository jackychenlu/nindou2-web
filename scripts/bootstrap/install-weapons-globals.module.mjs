import {
  defaultWeaponKey,
  weaponDefinitions,
  weaponDefinitionByKey,
  weaponFrames,
  weaponVisualProfile,
  weaponDefinitionForKey,
  weaponSoundKey,
  weaponFrameSource,
  weaponAttackScale,
  weaponHandScale,
  weaponAttackOffset,
  weaponHandOffset,
  weaponAttackAnimationDurationMs,
  weaponAttackFrameDurationMs,
  buildWeaponAttackAnimationReport,
} from "../data/weapons.module.mjs";

export function installWeaponGlobals(target = globalThis) {
  target.defaultWeaponKey = defaultWeaponKey;
  target.weaponDefinitions = weaponDefinitions;
  target.weaponDefinitionByKey = weaponDefinitionByKey;
  target.weaponFrames = weaponFrames;
  target.weaponVisualProfile = weaponVisualProfile;
  target.weaponDefinitionForKey = weaponDefinitionForKey;
  target.weaponSoundKey = weaponSoundKey;
  target.weaponFrameSource = weaponFrameSource;
  target.weaponAttackScale = weaponAttackScale;
  target.weaponHandScale = weaponHandScale;
  target.weaponAttackOffset = weaponAttackOffset;
  target.weaponHandOffset = weaponHandOffset;
  target.weaponAttackAnimationDurationMs = weaponAttackAnimationDurationMs;
  target.weaponAttackFrameDurationMs = weaponAttackFrameDurationMs;
  target.buildWeaponAttackAnimationReport = buildWeaponAttackAnimationReport;
  target.NindouWeapons = {
    defaultKey: defaultWeaponKey,
    definitions: weaponDefinitions,
    definitionByKey: weaponDefinitionByKey,
    frames: weaponFrames,
    visualProfile: weaponVisualProfile,
    definitionForKey: weaponDefinitionForKey,
    soundKey: weaponSoundKey,
    frameSource: weaponFrameSource,
    attackScale: weaponAttackScale,
    handScale: weaponHandScale,
    attackOffset: weaponAttackOffset,
    handOffset: weaponHandOffset,
    attackAnimationDurationMs: weaponAttackAnimationDurationMs,
    attackFrameDurationMs: weaponAttackFrameDurationMs,
    buildAttackAnimationReport: buildWeaponAttackAnimationReport,
  };
}
