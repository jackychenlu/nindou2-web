export const MODULE_PROBE_SCHEMA = "nindou-module-probe/v1";
export const MODULE_PROBE_REPORT_VERSION = 1;
export const MODULE_PROBE_ISSUE_UNSYNCED = "UNSYNCED_SECTIONS";
export const MODULE_PROBE_ISSUE_MANIFEST_MISMATCH = "MANIFEST_MISMATCH";

export function resolveModuleProbeHealthMessage({ isProbeSynced, isManifestSynced }) {
  if (!isManifestSynced && !isProbeSynced) {
    return "Module probe has unsynced sections and manifest mismatch.";
  }
  if (!isManifestSynced) {
    return "Module probe manifest is out of sync.";
  }
  if (!isProbeSynced) {
    return "Module probe has unsynced sections.";
  }
  return "Module probe is fully synced.";
}

export function resolveModuleProbeStatusCode(issues) {
  if (!Array.isArray(issues) || issues.length === 0) return "OK";
  return "WARN";
}
