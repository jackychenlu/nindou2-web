export function installModuleProbeGlobals({
  runtime,
  sectionKeys,
  manifestMatchesRuntime,
  health,
  diagnostics,
  warn = console.warn,
  target = globalThis,
}) {
  const moduleProbeApi = runtime.api;
  target.NindouModuleProbe = runtime.probe;
  target.NindouModuleProbeMeta = runtime.meta;
  target.NindouModuleProbeWarnings = runtime.warnings;
  target.NindouModuleProbeSummary = runtime.summary;
  target.NindouModuleProbeApi = moduleProbeApi;
  target.NindouModuleProbeSectionKeys = sectionKeys.slice();
  target.isNindouModuleProbeSectionManifestSynced = manifestMatchesRuntime;
  target.NindouModuleProbeHealth = { ...health, unsyncedKeys: health.unsyncedKeys.slice() };
  target.NindouModuleProbeDiagnostics = diagnostics;
  target.isNindouModuleProbeSynced = moduleProbeApi.isSynced();
  target.getNindouModuleProbeMeta = () => moduleProbeApi.getMeta();
  target.getNindouModuleProbeReportVersion = () => moduleProbeApi.reportVersion;
  target.getNindouModuleProbeSummary = () => moduleProbeApi.getSummary();
  target.getNindouModuleProbeWarnings = () => moduleProbeApi.getWarnings();
  target.getNindouModuleProbeHealth = () => ({ ...health, unsyncedKeys: health.unsyncedKeys.slice() });
  target.getNindouModuleProbeSnapshot = (options = {}) => diagnostics.getSnapshot(options);
  target.getNindouModuleProbeSnapshotJson = (options = {}) => diagnostics.getSnapshotJson(options);
  target.getNindouModuleProbeKeys = () => moduleProbeApi.getKeys();
  target.getNindouModuleProbeUnsyncedKeys = () => moduleProbeApi.getUnsyncedKeys();
  target.getNindouModuleProbeSyncedKeys = () => moduleProbeApi.getSyncedKeys();
  target.getNindouModuleProbeReport = (options = {}) => moduleProbeApi.getReport(options);
  moduleProbeApi.getHealth = () => ({ ...health, unsyncedKeys: health.unsyncedKeys.slice() });
  moduleProbeApi.getSnapshot = (options = {}) => diagnostics.getSnapshot(options);
  moduleProbeApi.getSnapshotJson = (options = {}) => diagnostics.getSnapshotJson(options);

  if (!manifestMatchesRuntime) {
    warn("Module probe section manifest is out of sync with runtime keys.");
  }
  for (const entry of runtime.warnings) {
    warn(entry.warning);
  }
}
