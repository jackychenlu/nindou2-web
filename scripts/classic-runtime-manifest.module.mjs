export const CLASSIC_RUNTIME_SCRIPT_PATHS = Object.freeze([]);

export const CORE_RULE_SCRIPT_PATHS = Object.freeze([
  "scripts/data/config.js",
  "scripts/data/rule-modes.js",
]);

export const COMBAT_RULE_SCRIPT_PATHS = Object.freeze([
  "scripts/data/config.js",
  "scripts/data/weapons.js",
  "scripts/data/ninjutsu-definitions.js",
  "scripts/data/locales.js",
  "scripts/data/rule-modes.js",
  "scripts/systems/ninjutsu.js",
  "scripts/systems/combat.js",
]);

export const AI_RULE_SCRIPT_PATHS = Object.freeze([
  ...COMBAT_RULE_SCRIPT_PATHS,
]);
