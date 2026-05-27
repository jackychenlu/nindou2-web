const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe fingerprint is deterministic for identical payload", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-fingerprint.module.mjs"),
  ).href;
  const { createModuleProbeFingerprint } = await import(modulePath);
  const payload = { a: 1, b: { c: 2 } };
  const hash1 = createModuleProbeFingerprint(payload);
  const hash2 = createModuleProbeFingerprint(payload);
  assert.equal(hash1, hash2);
  assert.equal(typeof hash1, "string");
  assert.equal(hash1.length > 0, true);
});
