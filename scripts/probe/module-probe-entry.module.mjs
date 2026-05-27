import { PROBE_SECTIONS, PROBE_SECTION_KEYS } from "./module-probe-sections.module.mjs";
import { runModuleProbePipeline } from "./module-probe-pipeline.module.mjs";

export function runDefaultModuleProbe({ target = globalThis, warn = console.warn } = {}) {
  return runModuleProbePipeline({
    sections: PROBE_SECTIONS,
    sectionKeys: PROBE_SECTION_KEYS,
    target,
    warn,
  });
}
