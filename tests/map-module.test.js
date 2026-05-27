const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadMapContext(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/grid.js",
    "scripts/data/map.js",
  ]);
}

test("map ES module stays in sync with legacy map object builders", async () => {
  const context = loadMapContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "map.module.mjs")).href;
  const mapModule = await import(modulePath);

  const legacyBuilders = contextValue(context, "mapObjectBuilders");
  const summary = mapModule.summarizeMapObjectBuilders(legacyBuilders);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(summary.moduleKeys, Object.keys(legacyBuilders));
  assert.deepEqual(plain(summary.moduleObjectCounts), plain(summary.legacyObjectCounts));

  for (const [mapKey, mapDefinition] of context.roomMapDefinitionEntries()) {
    context.state.roomMapKey = mapKey;
    const legacyObjects = plain(context.buildMapObjects());
    const moduleObjects = mapModule.buildMapObjects({
      mapDefinition,
      internalCellCoord: context.internalCellCoord,
      baseObjectHp: context.objectHp,
    });
    assert.deepEqual(plain(moduleObjects), legacyObjects);
  }
});

test("classic map bridge is generated from module source", () => {
  const classicPath = path.join(repoRoot, "scripts", "data", "map.js");
  const classicSource = fs.readFileSync(classicPath, "utf8");

  assert.equal(classicSource.includes("// AUTO-GENERATED FILE."), true);
  assert.equal(classicSource.includes("// Run: npm run sync:map"), true);
  assert.equal(classicSource.includes("globalThis.NindouMaps = {"), true);
  assert.equal(classicSource.includes("import "), false);
  assert.equal(classicSource.includes("export function "), false);
});
