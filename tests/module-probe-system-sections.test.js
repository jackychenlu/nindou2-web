const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe system section manifest stays stable", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-system-sections.module.mjs"),
  ).href;
  const { SYSTEM_PROBE_SECTIONS, SYSTEM_PROBE_SECTION_KEYS } = await import(modulePath);

  assert.deepEqual(SYSTEM_PROBE_SECTION_KEYS, [
    "appearance",
    "stateHelpers",
    "grid",
    "audio",
    "match",
    "consumables",
    "movement",
    "ai",
    "combat",
  ]);
  assert.deepEqual(Object.keys(SYSTEM_PROBE_SECTIONS), SYSTEM_PROBE_SECTION_KEYS);
  for (const key of SYSTEM_PROBE_SECTION_KEYS) {
    const section = SYSTEM_PROBE_SECTIONS[key];
    assert.equal(typeof section.warning, "string");
    assert.equal(typeof section.legacy, "function");
    assert.equal(typeof section.summarize, "function");
  }
});
