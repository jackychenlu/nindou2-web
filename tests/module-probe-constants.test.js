const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe constants expose schema/version and health messages", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-constants.module.mjs"),
  ).href;
  const constants = await import(modulePath);

  assert.equal(constants.MODULE_PROBE_SCHEMA, "nindou-module-probe/v1");
  assert.equal(constants.MODULE_PROBE_REPORT_VERSION, 1);
  assert.equal(constants.MODULE_PROBE_ISSUE_UNSYNCED, "UNSYNCED_SECTIONS");
  assert.equal(constants.MODULE_PROBE_ISSUE_MANIFEST_MISMATCH, "MANIFEST_MISMATCH");
  assert.equal(
    constants.resolveModuleProbeHealthMessage({ isProbeSynced: true, isManifestSynced: true }),
    "Module probe is fully synced.",
  );
  assert.equal(
    constants.resolveModuleProbeHealthMessage({ isProbeSynced: false, isManifestSynced: false }),
    "Module probe has unsynced sections and manifest mismatch.",
  );
  assert.equal(constants.resolveModuleProbeStatusCode([]), "OK");
  assert.equal(constants.resolveModuleProbeStatusCode(["UNSYNCED_SECTIONS"]), "WARN");
});
