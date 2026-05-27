import { createModuleProbeSnapshotJson } from "./module-probe-serialization.module.mjs";
import { createModuleProbeFingerprint } from "./module-probe-fingerprint.module.mjs";

export function createModuleProbeDiagnostics({ runtime, health }) {
  const buildSnapshot = (options = {}) => ({
    generatedAt: new Date().toISOString(),
    health: { ...health, unsyncedKeys: health.unsyncedKeys.slice() },
    report: runtime.api.getReport(options),
  });
  const attachFingerprint = (snapshot) => ({
    ...snapshot,
    fingerprint: createModuleProbeFingerprint({
      health: snapshot.health,
      report: snapshot.report,
    }),
  });
  return {
    getSnapshot: (options = {}) => attachFingerprint(buildSnapshot(options)),
    getSnapshotJson: (options = {}) => createModuleProbeSnapshotJson(attachFingerprint(buildSnapshot(options))),
  };
}
