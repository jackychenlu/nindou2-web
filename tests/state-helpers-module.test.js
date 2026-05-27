const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadStateHelperContext() {
  const context = createGameContext();
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/state-helpers.js",
  ]);
}

test("state helper ES module stays in sync with legacy state helpers", async () => {
  const context = loadStateHelperContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "state-helpers.module.mjs")).href;
  const stateHelperModule = await import(modulePath);
  const legacyStateHelpers = contextValue(context, "globalThis.NindouStateHelpers");
  const summary = stateHelperModule.summarizeStateHelpers(legacyStateHelpers);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(summary.moduleResult.soundKeys, ["soulLevelUp"]);
  assert.equal(stateHelperModule.formatDamage(7), "7");
  assert.equal(stateHelperModule.formatDamage(7.5), "7.50");
  assert.equal(stateHelperModule.formatMatchTime(125000), "02:05");
  assert.equal(stateHelperModule.pointInRect(2, 2, { x: 0, y: 0, w: 2, h: 2 }), true);

  const stateLike = {
    selectedId: "missing",
    units: [{ id: "dead", alive: false, controlMode: "player" }],
  };
  assert.equal(stateHelperModule.selectedHudUnit(stateLike)?.id, undefined);
});
