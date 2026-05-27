const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, loadCombatRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("ninjutsu ES module stays in sync with legacy ninjutsu data", async () => {
  const context = loadCombatRules();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "ninjutsu-definitions.module.mjs")).href;
  const ninjutsuModule = await import(modulePath);

  const legacyCatalog = contextValue(context, "ninjuCatalog");
  const summary = ninjutsuModule.summarizeNinjutsuCatalog(legacyCatalog);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(plain(summary.moduleMeta), plain(summary.legacyMeta));
  assert.deepEqual(ninjutsuModule.ninjuCatalog, plain(legacyCatalog));
  assert.deepEqual(ninjutsuModule.ninjuEditorCatalog, plain(contextValue(context, "ninjuEditorCatalog")));
  assert.deepEqual(ninjutsuModule.defaultNinjuLoadout, plain(contextValue(context, "defaultNinjuLoadout")));
  assert.deepEqual(ninjutsuModule.ninjuByType.clone, plain(contextValue(context, "ninjuByType.clone")));
});

test("classic ninjutsu bridge is generated from module source", () => {
  const fs = require("node:fs");
  const moduleText = fs.readFileSync(path.join(repoRoot, "scripts", "data", "ninjutsu-definitions.module.mjs"), "utf8");
  const classicText = fs.readFileSync(path.join(repoRoot, "scripts", "data", "ninjutsu-definitions.js"), "utf8");
  const moduleExportLines = moduleText
    .split(/\r?\n/)
    .filter((line) => line.trimStart().startsWith("export "));

  for (const line of moduleExportLines) {
    assert.equal(classicText.includes(line.replace(/^export\s+/, "")), true, `missing generated line: ${line}`);
  }
  assert.equal(classicText.includes("globalThis.NindouNinjutsu"), true);
});
