import {
  MODULE_PROBE_REPORT_VERSION,
  MODULE_PROBE_SCHEMA,
} from "./module-probe-constants.module.mjs";

export function buildModuleProbeRuntime({
  sections,
  schema = MODULE_PROBE_SCHEMA,
  reportVersion = MODULE_PROBE_REPORT_VERSION,
}) {
  const generatedAt = new Date().toISOString();
  const moduleProbe = Object.fromEntries(
    Object.entries(sections).map(([key, section]) => [key, section.summarize(section.legacy())]),
  );
  const probeKeys = Object.keys(moduleProbe);
  const unsyncedProbeKeys = probeKeys.filter((key) => !moduleProbe[key]?.isSynced).sort();
  const syncedProbeKeys = probeKeys.filter((key) => moduleProbe[key]?.isSynced).sort();
  const moduleProbeMeta = {
    schema,
    version: reportVersion,
    sectionKeys: probeKeys,
    sectionCount: probeKeys.length,
    syncedCount: syncedProbeKeys.length,
    unsyncedCount: unsyncedProbeKeys.length,
    hasUnsynced: unsyncedProbeKeys.length > 0,
    generatedAt,
  };
  const moduleProbeWarnings = unsyncedProbeKeys.map((key) => ({
    key,
    warning: sections[key]?.warning || `Module probe is out of sync: ${key}`,
  }));
  const moduleProbeSummary = {
    generatedAt,
    total: probeKeys.length,
    synced: probeKeys.length - unsyncedProbeKeys.length,
    unsynced: unsyncedProbeKeys.length,
    syncedKeys: syncedProbeKeys,
    unsyncedKeys: unsyncedProbeKeys,
  };
  const cloneWarnings = () => moduleProbeWarnings.map((entry) => ({ ...entry }));
  const cloneSummary = () => ({
    ...moduleProbeSummary,
    syncedKeys: moduleProbeSummary.syncedKeys.slice(),
    unsyncedKeys: moduleProbeSummary.unsyncedKeys.slice(),
  });
  const moduleProbeApi = {
    schema,
    reportVersion,
    isSynced: () => moduleProbeSummary.unsynced === 0,
    getMeta: () => ({ ...moduleProbeMeta, sectionKeys: moduleProbeMeta.sectionKeys.slice() }),
    getSummary: () => cloneSummary(),
    getWarnings: () => cloneWarnings(),
    getKeys: () => moduleProbeMeta.sectionKeys.slice(),
    getSyncedKeys: () => moduleProbeSummary.syncedKeys.slice(),
    getUnsyncedKeys: () => moduleProbeSummary.unsyncedKeys.slice(),
    getReport: (options = {}) => {
      const includeProbe = options.includeProbe !== false || options.keysOnly === true;
      const includeMeta = options.includeMeta !== false;
      const includeSummary = options.includeSummary !== false;
      const includeWarnings = options.includeWarnings !== false;
      const onlyUnsynced = options.onlyUnsynced === true;
      const keysOnly = options.keysOnly === true;
      const probePayload = onlyUnsynced
        ? Object.fromEntries(moduleProbeSummary.unsyncedKeys.map((key) => [key, moduleProbe[key]]))
        : moduleProbe;
      const normalizedProbe = keysOnly ? Object.keys(probePayload) : probePayload;
      return {
        reportVersion,
        optionsUsed: { includeMeta, includeSummary, includeWarnings, includeProbe, onlyUnsynced, keysOnly },
        ...(includeMeta ? { meta: moduleProbeApi.getMeta() } : {}),
        ...(includeSummary ? { summary: moduleProbeApi.getSummary() } : {}),
        ...(includeWarnings ? { warnings: moduleProbeApi.getWarnings() } : {}),
        ...(includeProbe ? { probe: normalizedProbe } : {}),
      };
    },
  };
  return {
    probe: moduleProbe,
    meta: moduleProbeMeta,
    warnings: moduleProbeWarnings,
    summary: moduleProbeSummary,
    api: moduleProbeApi,
  };
}
