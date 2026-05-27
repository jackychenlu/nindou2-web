const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe serialization returns stable JSON string", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-serialization.module.mjs"),
  ).href;
  const { createModuleProbeSnapshotJson } = await import(modulePath);

  const json = createModuleProbeSnapshotJson({
    generatedAt: "2026-01-01T00:00:00.000Z",
    health: { status: "ok", unsyncedKeys: [] },
    report: { reportVersion: 1 },
  });

  assert.equal(typeof json, "string");
  assert.equal(json.includes("\"reportVersion\": 1"), true);
});
