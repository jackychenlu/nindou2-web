const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe global bridge installs compatibility globals", async () => {
  const runtimeModulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-runtime.module.mjs"),
  ).href;
  const bridgeModulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-global-bridge.module.mjs"),
  ).href;
  const { buildModuleProbeRuntime } = await import(runtimeModulePath);
  const { installModuleProbeGlobals } = await import(bridgeModulePath);

  const runtime = buildModuleProbeRuntime({
    sections: {
      a: {
        warning: "a warning",
        legacy: () => ({}),
        summarize: () => ({ isSynced: true }),
      },
      b: {
        warning: "b warning",
        legacy: () => ({}),
        summarize: () => ({ isSynced: false }),
      },
    },
  });

  const fakeGlobal = {};
  const warnings = [];
  installModuleProbeGlobals({
    runtime,
    sectionKeys: ["a", "b"],
    manifestMatchesRuntime: true,
    health: {
      status: "warning",
      statusCode: "WARN",
      message: "Module probe has unsynced sections.",
      issues: ["UNSYNCED_SECTIONS"],
      isProbeSynced: false,
      isManifestSynced: true,
      unsyncedCount: 1,
      sectionCount: 2,
      unsyncedKeys: ["b"],
    },
    warn: (msg) => warnings.push(msg),
    target: fakeGlobal,
  });

  assert.equal(fakeGlobal.NindouModuleProbeApi, runtime.api);
  assert.equal(fakeGlobal.isNindouModuleProbeSynced, false);
  assert.deepEqual(fakeGlobal.NindouModuleProbeSectionKeys, ["a", "b"]);
  assert.equal(fakeGlobal.isNindouModuleProbeSectionManifestSynced, true);
  assert.deepEqual(fakeGlobal.getNindouModuleProbeUnsyncedKeys(), ["b"]);
  assert.equal(typeof fakeGlobal.getNindouModuleProbeReport, "function");
  assert.equal(warnings.includes("b warning"), true);
});
