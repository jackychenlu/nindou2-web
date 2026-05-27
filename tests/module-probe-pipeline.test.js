const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe pipeline wires runtime to global bridge", async () => {
  const pipelinePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-pipeline.module.mjs"),
  ).href;
  const { runModuleProbePipeline } = await import(pipelinePath);

  const fakeGlobal = {};
  const warnings = [];
  const result = runModuleProbePipeline({
    sections: {
      alpha: {
        warning: "alpha warning",
        legacy: () => ({}),
        summarize: () => ({ isSynced: true }),
      },
      beta: {
        warning: "beta warning",
        legacy: () => ({}),
        summarize: () => ({ isSynced: false }),
      },
    },
    sectionKeys: ["alpha", "beta"],
    warn: (msg) => warnings.push(msg),
    target: fakeGlobal,
  });

  assert.equal(result.manifestMatchesRuntime, true);
  assert.equal(result.health.status, "warning");
  assert.equal(result.health.statusCode, "WARN");
  assert.deepEqual(result.health.issues, ["UNSYNCED_SECTIONS"]);
  assert.equal(fakeGlobal.isNindouModuleProbeSynced, false);
  assert.equal(fakeGlobal.NindouModuleProbeHealth.status, "warning");
  assert.equal(fakeGlobal.getNindouModuleProbeHealth().status, "warning");
  assert.equal(fakeGlobal.NindouModuleProbeApi.getHealth().status, "warning");
  assert.equal(typeof fakeGlobal.getNindouModuleProbeSnapshot, "function");
  assert.equal(typeof fakeGlobal.getNindouModuleProbeSnapshotJson, "function");
  assert.equal(typeof fakeGlobal.NindouModuleProbeDiagnostics.getSnapshot, "function");
  assert.equal(typeof fakeGlobal.NindouModuleProbeDiagnostics.getSnapshotJson, "function");
  assert.equal(fakeGlobal.getNindouModuleProbeSnapshot({ keysOnly: true }).report.reportVersion > 0, true);
  assert.equal(typeof fakeGlobal.getNindouModuleProbeSnapshot({ keysOnly: true }).fingerprint, "string");
  assert.equal(fakeGlobal.getNindouModuleProbeSnapshotJson({ keysOnly: true }).includes("\"reportVersion\""), true);
  assert.deepEqual(fakeGlobal.NindouModuleProbeSectionKeys, ["alpha", "beta"]);
  assert.deepEqual(fakeGlobal.getNindouModuleProbeUnsyncedKeys(), ["beta"]);
  assert.equal(warnings.includes("beta warning"), true);
});
