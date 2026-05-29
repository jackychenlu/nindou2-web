import { summarizeAppearanceHelpers } from "../systems/appearance.module.mjs";
import { summarizeStateHelpers } from "../systems/state-helpers.module.mjs";
import { summarizeGridHelpers } from "../systems/grid.module.mjs";
import { summarizeAudioHelpers } from "../systems/audio.module.mjs";
import { summarizeMatchFlow } from "../systems/match.module.mjs";
import { summarizeConsumableHelpers } from "../systems/consumables.module.mjs";
import { summarizeMovementHelpers } from "../systems/movement.module.mjs";
import { summarizeAiProfileHelpers } from "../systems/ai.module.mjs";
import { summarizeCombatHelpers } from "../systems/combat.module.mjs";

function makeSystemSection({ warning, globalName, summarize }) {
  return {
    warning,
    legacy: () => globalThis[globalName] || {},
    summarize,
  };
}

const SYSTEM_SECTION_DEFS = [
  {
    key: "appearance",
    warning: "Appearance module probe is out of sync with legacy appearance helpers.",
    globalName: "NindouAppearance",
    summarize: summarizeAppearanceHelpers,
  },
  {
    key: "stateHelpers",
    warning: "State helper module probe is out of sync with legacy state helpers.",
    globalName: "NindouStateHelpers",
    summarize: summarizeStateHelpers,
  },
  {
    key: "grid",
    warning: "Grid module probe is out of sync with legacy grid helpers.",
    globalName: "NindouGrid",
    summarize: summarizeGridHelpers,
  },
  {
    key: "audio",
    warning: "Audio module probe is out of sync with legacy audio helpers.",
    globalName: "NindouAudio",
    summarize: summarizeAudioHelpers,
  },
  {
    key: "match",
    warning: "Match module probe is out of sync with legacy match flow.",
    globalName: "NindouMatch",
    summarize: summarizeMatchFlow,
  },
  {
    key: "consumables",
    warning: "Consumables module probe is out of sync with installed consumable globals.",
    globalName: "NindouConsumables",
    summarize: summarizeConsumableHelpers,
  },
  {
    key: "movement",
    warning: "Movement module probe is out of sync with legacy movement helpers.",
    globalName: "NindouMovement",
    summarize: summarizeMovementHelpers,
  },
  {
    key: "ai",
    warning: "AI module probe is out of sync with legacy AI profile helpers.",
    globalName: "NindouAi",
    summarize: summarizeAiProfileHelpers,
  },
  {
    key: "combat",
    warning: "Combat module probe is out of sync with legacy combat helpers.",
    globalName: "NindouCombat",
    summarize: summarizeCombatHelpers,
  },
];

export const SYSTEM_PROBE_SECTIONS = Object.fromEntries(
  SYSTEM_SECTION_DEFS.map((entry) => [
    entry.key,
    makeSystemSection(entry),
  ]),
);

export const SYSTEM_PROBE_SECTION_KEYS = Object.freeze(Object.keys(SYSTEM_PROBE_SECTIONS));
