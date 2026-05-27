const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

test("module probe section manifest and section shapes stay valid", async () => {
  const modulePath = pathToFileURL(
    path.join(repoRoot, "scripts", "probe", "module-probe-sections.module.mjs"),
  ).href;
  const { PROBE_SECTIONS, PROBE_SECTION_KEYS } = await import(modulePath);

  assert.deepEqual(Object.keys(PROBE_SECTIONS), PROBE_SECTION_KEYS);
  assert.equal(PROBE_SECTION_KEYS.length > 0, true);
  for (const key of PROBE_SECTION_KEYS) {
    const section = PROBE_SECTIONS[key];
    assert.equal(typeof section.warning, "string");
    assert.equal(section.warning.length > 0, true);
    assert.equal(typeof section.legacy, "function");
    assert.equal(typeof section.summarize, "function");
  }
});
