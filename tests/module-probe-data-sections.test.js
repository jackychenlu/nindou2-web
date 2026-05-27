const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe data section manifest stays stable", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-data-sections.module.mjs"),
  ).href;
  const { DATA_PROBE_SECTIONS, DATA_PROBE_SECTION_KEYS } = await import(modulePath);

  assert.deepEqual(DATA_PROBE_SECTION_KEYS, [
    "config",
    "weapons",
    "ninjutsu",
    "locales",
    "ruleModes",
    "maps",
    "assets",
  ]);
  assert.deepEqual(Object.keys(DATA_PROBE_SECTIONS), DATA_PROBE_SECTION_KEYS);
  for (const key of DATA_PROBE_SECTION_KEYS) {
    const section = DATA_PROBE_SECTIONS[key];
    assert.equal(typeof section.warning, "string");
    assert.equal(typeof section.legacy, "function");
    assert.equal(typeof section.summarize, "function");
  }
});
