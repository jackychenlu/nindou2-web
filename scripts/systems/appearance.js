// ===== Appearance =====
const TEAM_DEFAULT_LOOK_KEY = "__team_default__";

function lookDefinitionByKey(key) {
  return lookDefinitions[key] || lookDefinitions.default;
}

function baseLookDefinitionForTeam(team) {
  return baseTeamLookDefinitions[team] || baseTeamLookDefinitions.blue || lookDefinitions.default;
}

function unitLookDefinition(unit) {
  if (!unit) return baseLookDefinitionForTeam("blue");
  if (unit.controlMode === "ai_red" || unit.appearanceKey === "red") return lookDefinitionByKey("red");
  if (unit.appearanceKey === TEAM_DEFAULT_LOOK_KEY) return baseLookDefinitionForTeam(unit.team);
  if (unit.team !== "blue") return unit.appearanceKey ? (lookDefinitions[unit.appearanceKey] || baseLookDefinitionForTeam(unit.team)) : baseLookDefinitionForTeam(unit.team);
  return lookDefinitionByKey(unit.appearanceKey || "default");
}

function unitEyeFrontSprite(unit) {
  const look = unitLookDefinition(unit);
  return images[look.eyeFrontImageKey] || images.eyesFront;
}

function unitEyeSideSprite(unit) {
  const look = unitLookDefinition(unit);
  return images[look.eyeSideImageKey] || images.eyeSide || images.eyesFront;
}

globalThis.NindouAppearance = {
  lookDefinitionByKey,
  baseLookDefinitionForTeam,
  unitLookDefinition,
  unitEyeFrontSprite,
  unitEyeSideSprite,
};
