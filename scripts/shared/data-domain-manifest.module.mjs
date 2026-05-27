export const DATA_DOMAIN_MANIFEST = Object.freeze([
  {
    probeKey: "config",
    bridgeKey: "config-nindou",
    warning: "Config module probe is out of sync with legacy config constants.",
    globalName: "NindouConfig",
    legacyPath: "",
    fallbackType: "object",
  },
  {
    probeKey: "weapons",
    bridgeKey: "weapons",
    warning: "Weapon module probe is out of sync with legacy weaponDefinitions.",
    globalName: "NindouWeapons",
    legacyPath: "definitions",
    fallbackType: "array",
  },
  {
    probeKey: "ninjutsu",
    bridgeKey: "ninjutsu-definitions",
    warning: "Ninjutsu module probe is out of sync with legacy ninjuCatalog.",
    globalName: "NindouNinjutsu",
    legacyPath: "catalog",
    fallbackType: "array",
  },
  {
    probeKey: "locales",
    bridgeKey: "locales",
    warning: "Locales module probe is out of sync with legacy roomLocaleText.",
    globalName: "NindouLocales",
    legacyPath: "localeText",
    fallbackType: "object",
  },
  {
    probeKey: "ruleModes",
    bridgeKey: "rule-modes",
    warning: "Rule modes module probe is out of sync with legacy modeRuleProfiles.",
    globalName: "NindouRuleModes",
    legacyPath: "modeRuleProfiles",
    fallbackType: "object",
  },
  {
    probeKey: "maps",
    bridgeKey: "map",
    warning: "Map module probe is out of sync with legacy mapObjectBuilders.",
    globalName: "NindouMaps",
    legacyPath: "mapObjectBuilders",
    fallbackType: "object",
  },
  {
    probeKey: "assets",
    bridgeKey: null,
    warning: "Asset module probe is out of sync with legacy asset data.",
    globalName: "NindouAssets",
    legacyPath: "",
    fallbackType: "object",
  },
]);

export const DATA_PROBE_KEYS = Object.freeze(DATA_DOMAIN_MANIFEST.map((entry) => entry.probeKey));
export const DATA_BRIDGE_KEYS = Object.freeze(
  DATA_DOMAIN_MANIFEST
    .map((entry) => entry.bridgeKey)
    .filter((key) => typeof key === "string" && key.length > 0),
);
