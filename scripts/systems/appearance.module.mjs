import { baseTeamLookDefinitions, lookDefinitions } from "../data/assets.module.mjs";

const TEAM_DEFAULT_LOOK_KEY = "__team_default__";

export function lookDefinitionByKey(key) {
  return lookDefinitions[key] || lookDefinitions.default;
}

export function baseLookDefinitionForTeam(team) {
  return baseTeamLookDefinitions[team] || baseTeamLookDefinitions.blue || lookDefinitions.default;
}

export function unitLookDefinition(unit) {
  if (!unit) return baseLookDefinitionForTeam("blue");
  if (unit.controlMode === "ai_red" || unit.appearanceKey === "red") return lookDefinitionByKey("red");
  if (unit.appearanceKey === TEAM_DEFAULT_LOOK_KEY) return baseLookDefinitionForTeam(unit.team);
  if (unit.team !== "blue") return targetLookDefinition(unit);
  return lookDefinitionByKey(unit.appearanceKey || "default");
}

function targetLookDefinition(unit) {
  if (!unit.appearanceKey) return baseLookDefinitionForTeam(unit.team);
  return lookDefinitions[unit.appearanceKey] || baseLookDefinitionForTeam(unit.team);
}

export function unitEyeFrontSprite(unit, imageMap = {}) {
  const look = unitLookDefinition(unit);
  return imageMap[look.eyeFrontImageKey] || imageMap.eyesFront;
}

export function unitEyeSideSprite(unit, imageMap = {}) {
  const look = unitLookDefinition(unit);
  return imageMap[look.eyeSideImageKey] || imageMap.eyeSide || imageMap.eyesFront;
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeAppearanceHelpers(legacy = {}) {
  const sampleUnits = [
    null,
    { team: "blue", appearanceKey: "default" },
    { team: "blue", appearanceKey: "zhaohuo" },
    { team: "blue", appearanceKey: "missing" },
    { team: "grey" },
    { team: "grey", appearanceKey: TEAM_DEFAULT_LOOK_KEY },
    { team: "grey", appearanceKey: "zhaohuo" },
    { team: "grey", appearanceKey: "red" },
    { team: "blue", controlMode: "ai_red" },
    { team: "grey", controlMode: "ai_red" },
  ];
  const summarizeLook = (look) => ({
    spriteSet: look?.spriteSet,
    moveSet: look?.moveSet,
    useNinjuSet: look?.useNinjuSet,
    moneyDartReadySet: look?.moneyDartReadySet,
    moneyDartShootSet: look?.moneyDartShootSet,
    drawEyes: look?.drawEyes,
    eyeFrontImageKey: look?.eyeFrontImageKey,
    eyeSideImageKey: look?.eyeSideImageKey,
  });
  const moduleLooks = sampleUnits.map((unit) => summarizeLook(unitLookDefinition(unit)));
  const legacyLooks = sampleUnits.map((unit) => summarizeLook(legacy.unitLookDefinition?.(unit)));

  return {
    moduleLooks,
    legacyLooks,
    isSynced: stable(moduleLooks) === stable(legacyLooks),
  };
}
