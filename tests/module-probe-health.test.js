const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe health evaluates sync and manifest flags", async () => {
  const healthPath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-health.module.mjs"),
  ).href;
  const { evaluateModuleProbeHealth } = await import(healthPath);

  const okHealth = evaluateModuleProbeHealth({
    runtime: { summary: { total: 2, unsyncedKeys: [] } },
    manifestMatchesRuntime: true,
  });
  assert.equal(okHealth.status, "ok");
  assert.equal(okHealth.statusCode, "OK");
  assert.equal(okHealth.isProbeSynced, true);
  assert.equal(okHealth.isManifestSynced, true);
  assert.equal(okHealth.unsyncedCount, 0);
  assert.deepEqual(okHealth.issues, []);

  const warnHealth = evaluateModuleProbeHealth({
    runtime: { summary: { total: 3, unsyncedKeys: ["b", "c"] } },
    manifestMatchesRuntime: false,
  });
  assert.equal(warnHealth.status, "warning");
  assert.equal(warnHealth.statusCode, "WARN");
  assert.equal(warnHealth.isProbeSynced, false);
  assert.equal(warnHealth.isManifestSynced, false);
  assert.equal(warnHealth.unsyncedCount, 2);
  assert.deepEqual(warnHealth.unsyncedKeys, ["b", "c"]);
  assert.deepEqual(warnHealth.issues, ["UNSYNCED_SECTIONS", "MANIFEST_MISMATCH"]);
});
