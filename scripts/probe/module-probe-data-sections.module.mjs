import { DATA_DOMAIN_MANIFEST } from "../shared/data-domain-manifest.module.mjs";
import { summarizeConfigConstants } from "../data/config.module.mjs";
import { summarizeWeaponCatalog } from "../data/weapons.module.mjs";
import { summarizeNinjutsuCatalog } from "../data/ninjutsu-definitions.module.mjs";
import { summarizeLocaleCatalog } from "../data/locales.module.mjs";
import { summarizeRuleModeProfiles } from "../data/rule-modes.module.mjs";
import { summarizeMapObjectBuilders } from "../data/map.module.mjs";
import { summarizeAssetCatalog } from "../data/assets.module.mjs";

const SUMMARY_BY_PROBE_KEY = {
  config: summarizeConfigConstants,
  weapons: summarizeWeaponCatalog,
  ninjutsu: summarizeNinjutsuCatalog,
  locales: summarizeLocaleCatalog,
  ruleModes: summarizeRuleModeProfiles,
  maps: summarizeMapObjectBuilders,
  assets: summarizeAssetCatalog,
};

function fallbackByType(type) {
  return type === "array" ? [] : {};
}

function valueByPath(root, path, fallback) {
  if (!path) return root ?? fallback;
  if (!root || typeof root !== "object") return fallback;
  const keys = path.split(".");
  let current = root;
  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) return fallback;
    current = current[key];
  }
  return current ?? fallback;
}

function makeDataSection({ warning, globalName, legacyPath, fallbackType, probeKey }) {
  const fallback = fallbackByType(fallbackType);
  return {
    warning,
    legacy: () => valueByPath(globalThis[globalName], legacyPath, fallback),
    summarize: SUMMARY_BY_PROBE_KEY[probeKey],
  };
}

export const DATA_PROBE_SECTIONS = Object.fromEntries(
  DATA_DOMAIN_MANIFEST.map((entry) => [
    entry.probeKey,
    makeDataSection(entry),
  ]),
);

export const DATA_PROBE_SECTION_KEYS = Object.freeze(Object.keys(DATA_PROBE_SECTIONS));
