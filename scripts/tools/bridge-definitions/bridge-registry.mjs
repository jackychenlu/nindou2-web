import { createGlobalBridgeDefinition } from "./bridge-definition-factory.mjs";
import { stripImportsAndExports } from "./bridge-transform-utils.mjs";
import { generateConfigBridgeSection } from "../config-bridge-generator.mjs";
import { DATA_BRIDGE_KEYS } from "../../shared/data-domain-manifest.module.mjs";

const mapTail = `
function buildMapObjects() {
  const mapDefinition = currentRoomMapDefinition();
  return buildMapObjectsModule({
    mapDefinition,
    internalCellCoord,
    baseObjectHp: objectHp,
  });
}

function buildCountry10Objects() {
  return buildCountry10ObjectsModule({
    internalCellCoord,
    objectHp,
  });
}

function buildEvilCastle1Objects() {
  return buildEvilCastle1ObjectsModule({
    internalCellCoord,
  });
}

function buildEvilCastle2Objects() {
  return buildEvilCastle2ObjectsModule({
    internalCellCoord,
  });
}

function buildEvilCastleObjects(layout) {
  return buildEvilCastleObjectsModule(layout, {
    internalCellCoord,
  });
}

globalThis.NindouMaps = {
  mapObjectBuilders,
  buildMapObjects,
  buildCountry10Objects,
  buildEvilCastle1Objects,
  buildEvilCastle2Objects,
  buildEvilCastleObjects,
};
`;

function transformMap(moduleSource) {
  const withoutExports = stripImportsAndExports(moduleSource);
  const renamed = withoutExports
    .replace(/\bfunction buildMapObjects\(/, "function buildMapObjectsModule(")
    .replace(/\bfunction buildCountry10Objects\(/, "function buildCountry10ObjectsModule(")
    .replace(/\bfunction buildEvilCastle1Objects\(/, "function buildEvilCastle1ObjectsModule(")
    .replace(/\bfunction buildEvilCastle2Objects\(/, "function buildEvilCastle2ObjectsModule(")
    .replace(/\bfunction buildEvilCastleObjects\(/, "function buildEvilCastleObjectsModule(")
    .replace(/\bbuildCountry10Objects\b/g, "buildCountry10ObjectsModule")
    .replace(/\bbuildEvilCastle1Objects\b/g, "buildEvilCastle1ObjectsModule")
    .replace(/\bbuildEvilCastle2Objects\b/g, "buildEvilCastle2ObjectsModule")
    .replace(/\bbuildEvilCastleObjects\b/g, "buildEvilCastleObjectsModule")
    .replace(/\bbuildMapObjects\b/g, "buildMapObjectsModule");
  return `${renamed}${mapTail}`;
}

const ruleModesTail = `
function flashRule() {
  return attackNinjuRule("flash");
}

function wildfireRule() {
  return attackNinjuRule("wildfire");
}

function deathRule() {
  return attackNinjuRule("death");
}

function freezeRule() {
  return attackNinjuRule("freeze");
}

globalThis.NindouRuleModes = {
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
  flashRule,
  wildfireRule,
  deathRule,
  freezeRule,
};
`;

function transformRuleModes(moduleSource) {
  let source = stripImportsAndExports(moduleSource);
  source = source
    .replace(/function currentRuleModeKey\(stateLike = \{\}\)/, "function currentRuleModeKey()")
    .replace(/function currentRuleProfile\(stateLike = \{\}\)/, "function currentRuleProfile()")
    .replace(/function currentDeathModeKey\(stateLike = \{\}\)/, "function currentDeathModeKey()")
    .replace(/function weaponDamageForMode\(weaponKey, fallbackDamage, stateLike = \{\}\)/, "function weaponDamageForMode(weaponKey, fallbackDamage)")
    .replace(/function steelRule\(stateLike = \{\}\)/, "function steelRule()")
    .replace(/function hotBloodRule\(stateLike = \{\}\)/, "function hotBloodRule()")
    .replace(/function healNinjuRule\(type, stateLike = \{\}\)/, "function healNinjuRule(type)")
    .replace(/function specialNinjuRule\(type, stateLike = \{\}\)/, "function specialNinjuRule(type)")
    .replace(/function moneyDartRule\(stateLike = \{\}\)/, "function moneyDartRule()")
    .replace(/function attackNinjuRule\(type, stateLike = \{\}\)/, "function attackNinjuRule(type)")
    .replace(/\bstateLike\b/g, "state");
  return `${source}${ruleModesTail}`;
}

export const BRIDGE_REGISTRY = Object.freeze({
  "config-nindou": {
    key: "config-nindou",
    moduleRelativePath: "scripts/data/config.module.mjs",
    classicRelativePath: "scripts/data/config.js",
    runScriptName: "sync:config-nindou",
    generate: generateConfigBridgeSection,
  },
  "weapons": createGlobalBridgeDefinition({
    key: "weapons",
    moduleRelativePath: "scripts/data/weapons.module.mjs",
    classicRelativePath: "scripts/data/weapons.js",
    runScriptName: "sync:weapons",
    globalName: "NindouWeapons",
    exportsMap: {
      defaultKey: "defaultWeaponKey",
      definitions: "weaponDefinitions",
      definitionByKey: "weaponDefinitionByKey",
      frames: "weaponFrames",
      visualProfile: "weaponVisualProfile",
      definitionForKey: "weaponDefinitionForKey",
      soundKey: "weaponSoundKey",
      frameSource: "weaponFrameSource",
      attackScale: "weaponAttackScale",
      handScale: "weaponHandScale",
      attackOffset: "weaponAttackOffset",
      handOffset: "weaponHandOffset",
      attackAnimationDurationMs: "weaponAttackAnimationDurationMs",
      attackFrameDurationMs: "weaponAttackFrameDurationMs",
      buildAttackAnimationReport: "buildWeaponAttackAnimationReport",
    },
  }),
  "ninjutsu-definitions": createGlobalBridgeDefinition({
    key: "ninjutsu-definitions",
    moduleRelativePath: "scripts/data/ninjutsu-definitions.module.mjs",
    classicRelativePath: "scripts/data/ninjutsu-definitions.js",
    runScriptName: "sync:ninjutsu-definitions",
    globalName: "NindouNinjutsu",
    stripImports: false,
    exportsMap: {
      catalog: "ninjuCatalog",
      byType: "ninjuByType",
      editorRowOrder: "ninjuEditorRowOrder",
      editorCatalog: "ninjuEditorCatalog",
      defaultLoadout: "defaultNinjuLoadout",
    },
  }),
  "locales": createGlobalBridgeDefinition({
    key: "locales",
    moduleRelativePath: "scripts/data/locales.module.mjs",
    classicRelativePath: "scripts/data/locales.js",
    runScriptName: "sync:locales",
    globalName: "NindouLocales",
    exportsMap: {
      controlModeLabels: "roomControlModeLabels",
      ruleModeLabels: "roomRuleModeLabels",
      deathModeLabels: "roomDeathModeLabels",
      localeText: "roomLocaleText",
      roomLocale: "roomLocale",
      localizedWeaponLabel: "localizedWeaponLabel",
      localizedControlModeLabel: "localizedControlModeLabel",
      localizedNinjuLabel: "localizedNinjuLabel",
      localizedNinjuTypeLabel: "localizedNinjuTypeLabel",
      roomTeamLabel: "roomTeamLabel",
      localizedCountdownText: "localizedCountdownText",
      localizedRuleModeLabel: "localizedRuleModeLabel",
      localizedDeathModeLabel: "localizedDeathModeLabel",
      localizedNinjuFontSize: "localizedNinjuFontSize",
    },
  }),
  "map": {
    key: "map",
    moduleRelativePath: "scripts/data/map.module.mjs",
    classicRelativePath: "scripts/data/map.js",
    runScriptName: "sync:map",
    transform: transformMap,
  },
  "rule-modes": {
    key: "rule-modes",
    moduleRelativePath: "scripts/data/rule-modes.module.mjs",
    classicRelativePath: "scripts/data/rule-modes.js",
    runScriptName: "sync:rule-modes",
    transform: transformRuleModes,
  },
});

export const BRIDGE_REGISTRY_ORDER = Object.freeze(DATA_BRIDGE_KEYS.slice());
