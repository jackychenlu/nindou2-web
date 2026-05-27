const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadGridContext() {
  const context = createGameContext({
    state: {
      roomMapKey: "country-10",
      units: [],
      objects: [],
      pointer: { cell: null },
    },
  });
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/grid.js",
  ]);
}

test("grid ES module stays in sync with legacy grid helpers", async () => {
  const context = loadGridContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "grid.module.mjs")).href;
  const gridModule = await import(modulePath);
  const legacyGrid = contextValue(context, "globalThis.NindouGrid");
  const summary = gridModule.summarizeGridHelpers(legacyGrid);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(plain(gridModule.internalCellCoord({ x: 1, y: 1 }, {
    mapDefinition: legacyGrid.roomMapDefinitions["country-10"],
    gridLike: legacyGrid.grid,
  })), { x: 2, y: 10 });
  assert.deepEqual(gridModule.directionVector("left"), { dx: -1, dy: 0 });
  assert.equal(gridModule.isPermanentObstacle(1, 5, {
    mapDefinition: legacyGrid.roomMapDefinitions["country-10"],
    gridLike: legacyGrid.grid,
  }), true);
  assert.equal(gridModule.pointToCell(-999, -999, legacyGrid.grid), null);
});
