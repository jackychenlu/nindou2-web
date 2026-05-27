import {
  lookDefinitionByKey,
  baseLookDefinitionForTeam,
  unitLookDefinition,
  unitEyeFrontSprite,
  unitEyeSideSprite,
} from "../systems/appearance.module.mjs";

export function installAppearanceGlobals(target = globalThis) {
  const unitEyeFrontSpriteForRuntime = (unit) => unitEyeFrontSprite(unit, target.images || {});
  const unitEyeSideSpriteForRuntime = (unit) => unitEyeSideSprite(unit, target.images || {});

  Object.assign(target, {
    lookDefinitionByKey,
    baseLookDefinitionForTeam,
    unitLookDefinition,
    unitEyeFrontSprite: unitEyeFrontSpriteForRuntime,
    unitEyeSideSprite: unitEyeSideSpriteForRuntime,
  });

  target.NindouAppearance = {
    lookDefinitionByKey,
    baseLookDefinitionForTeam,
    unitLookDefinition,
    unitEyeFrontSprite: unitEyeFrontSpriteForRuntime,
    unitEyeSideSprite: unitEyeSideSpriteForRuntime,
  };
}
