import {
  MODULE_PROBE_ISSUE_MANIFEST_MISMATCH,
  MODULE_PROBE_ISSUE_UNSYNCED,
  resolveModuleProbeHealthMessage,
  resolveModuleProbeStatusCode,
} from "./module-probe-constants.module.mjs";

export function evaluateModuleProbeHealth({ runtime, manifestMatchesRuntime }) {
  const unsyncedKeys = runtime.summary.unsyncedKeys.slice();
  const unsyncedCount = unsyncedKeys.length;
  const sectionCount = runtime.summary.total;
  const isProbeSynced = unsyncedCount === 0;
  const isManifestSynced = manifestMatchesRuntime === true;
  const issues = [];
  if (!isProbeSynced) issues.push(MODULE_PROBE_ISSUE_UNSYNCED);
  if (!isManifestSynced) issues.push(MODULE_PROBE_ISSUE_MANIFEST_MISMATCH);
  const status = isManifestSynced && isProbeSynced ? "ok" : "warning";
  const statusCode = resolveModuleProbeStatusCode(issues);
  const message = resolveModuleProbeHealthMessage({ isProbeSynced, isManifestSynced });
  return {
    status,
    statusCode,
    message,
    issues,
    isProbeSynced,
    isManifestSynced,
    unsyncedCount,
    sectionCount,
    unsyncedKeys,
  };
}
