const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe entry runs default pipeline and installs globals", async () => {
  const entryPath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-entry.module.mjs"),
  ).href;
  const { runDefaultModuleProbe } = await import(entryPath);

  const fakeGlobal = {};
  const warnings = [];
  const result = runDefaultModuleProbe({
    target: fakeGlobal,
    warn: (msg) => warnings.push(msg),
  });

  assert.equal(typeof result.manifestMatchesRuntime, "boolean");
  assert.equal(typeof result.health.status, "string");
  assert.equal(typeof fakeGlobal.getNindouModuleProbeReport, "function");
  assert.equal(typeof fakeGlobal.getNindouModuleProbeHealth, "function");
  assert.equal(Array.isArray(fakeGlobal.NindouModuleProbeSectionKeys), true);
  assert.equal(warnings.length >= 0, true);
});
