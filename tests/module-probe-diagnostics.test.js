const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe diagnostics snapshot includes health and report", async () => {
  const diagnosticsPath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-diagnostics.module.mjs"),
  ).href;
  const runtimePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-runtime.module.mjs"),
  ).href;
  const { createModuleProbeDiagnostics } = await import(diagnosticsPath);
  const { buildModuleProbeRuntime } = await import(runtimePath);

  const runtime = buildModuleProbeRuntime({
    sections: {
      alpha: { warning: "a", legacy: () => ({}), summarize: () => ({ isSynced: true }) },
      beta: { warning: "b", legacy: () => ({}), summarize: () => ({ isSynced: false }) },
    },
  });
  const health = {
    status: "warning",
    message: "Module probe has unsynced sections.",
    isProbeSynced: false,
    isManifestSynced: true,
    unsyncedCount: 1,
    sectionCount: 2,
    unsyncedKeys: ["beta"],
  };

  const diagnostics = createModuleProbeDiagnostics({ runtime, health });
  const snapshot = diagnostics.getSnapshot({ keysOnly: true, onlyUnsynced: true });
  assert.equal(typeof snapshot.generatedAt, "string");
  assert.equal(typeof snapshot.fingerprint, "string");
  assert.equal(snapshot.fingerprint.length > 0, true);
  assert.equal(snapshot.health.status, "warning");
  assert.deepEqual(snapshot.report.probe, ["beta"]);

  const snapshotJson = diagnostics.getSnapshotJson({ keysOnly: true, onlyUnsynced: true });
  assert.equal(snapshotJson.includes("\"fingerprint\""), true);
});
