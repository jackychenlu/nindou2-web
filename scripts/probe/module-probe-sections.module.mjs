import { DATA_PROBE_SECTIONS } from "./module-probe-data-sections.module.mjs";
import { SYSTEM_PROBE_SECTIONS } from "./module-probe-system-sections.module.mjs";

export const PROBE_SECTIONS = {
  ...DATA_PROBE_SECTIONS,
  ...SYSTEM_PROBE_SECTIONS,
};

export const PROBE_SECTION_KEYS = Object.freeze(Object.keys(PROBE_SECTIONS));
