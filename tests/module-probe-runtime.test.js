const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe runtime builds sorted summary and report options", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-runtime.module.mjs"),
  ).href;
  const { buildModuleProbeRuntime } = await import(modulePath);

  const runtime = buildModuleProbeRuntime({
    sections: {
      zeta: {
        warning: "zeta warning",
        legacy: () => ({ value: 1 }),
        summarize: () => ({ isSynced: true, value: "zeta" }),
      },
      alpha: {
        warning: "alpha warning",
        legacy: () => ({ value: 2 }),
        summarize: () => ({ isSynced: false, value: "alpha" }),
      },
      beta: {
        warning: "beta warning",
        legacy: () => ({ value: 3 }),
        summarize: () => ({ isSynced: false, value: "beta" }),
      },
    },
    schema: "probe/test/v1",
    reportVersion: 9,
  });

  assert.equal(runtime.meta.schema, "probe/test/v1");
  assert.equal(runtime.meta.version, 9);
  assert.deepEqual(runtime.meta.sectionKeys, ["zeta", "alpha", "beta"]);
  assert.deepEqual(runtime.summary.syncedKeys, ["zeta"]);
  assert.deepEqual(runtime.summary.unsyncedKeys, ["alpha", "beta"]);
  assert.equal(runtime.api.isSynced(), false);
  assert.deepEqual(runtime.api.getKeys(), ["zeta", "alpha", "beta"]);
  assert.deepEqual(runtime.api.getSyncedKeys(), ["zeta"]);
  assert.deepEqual(runtime.api.getUnsyncedKeys(), ["alpha", "beta"]);
  assert.deepEqual(
    runtime.api.getWarnings().map((entry) => entry.key),
    ["alpha", "beta"],
  );

  const unsyncedReport = runtime.api.getReport({ onlyUnsynced: true, keysOnly: true });
  assert.equal(unsyncedReport.reportVersion, 9);
  assert.deepEqual(unsyncedReport.probe, ["alpha", "beta"]);

  const minimalReport = runtime.api.getReport({
    includeMeta: false,
    includeSummary: false,
    includeWarnings: false,
    includeProbe: false,
  });
  assert.equal("meta" in minimalReport, false);
  assert.equal("summary" in minimalReport, false);
  assert.equal("warnings" in minimalReport, false);
  assert.equal("probe" in minimalReport, false);
});
