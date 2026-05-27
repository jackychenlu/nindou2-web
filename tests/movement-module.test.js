const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadMovementContext() {
  const context = createGameContext();
  return loadScripts(context, [
    "scripts/systems/movement.js",
  ]);
}

test("movement ES module stays in sync with legacy movement helpers", async () => {
  const context = loadMovementContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "movement.module.mjs")).href;
  const movementModule = await import(modulePath);
  const legacyMovement = contextValue(context, "globalThis.NindouMovement");
  const summary = movementModule.summarizeMovementHelpers(legacyMovement);

  assert.equal(summary.isSynced, true);
  assert.equal(movementModule.canUseConsumableFollowupMove({ consumableUse: { phase: "active", chainMoves: 1 } }), true);
  assert.equal(movementModule.canUseConsumableFollowupMove({ consumableUse: { phase: "gap", chainMoves: 1 } }), false);

  const enemy = { id: "enemy", team: "grey", x: 4, y: 2, alive: true };
  const ally = { id: "ally", team: "blue", x: 5, y: 2, alive: true };
  const unit = { id: "unit", team: "blue", x: 2, y: 2, alive: true };
  const units = [unit, enemy, ally];
  const options = {
    inside: (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8,
    unitAt: (x, y) => units.find((candidate) => candidate.alive && candidate.x === x && candidate.y === y) || null,
  };

  assert.deepEqual(plain(movementModule.reachableMoveCell(unit, { x: 6, y: 2 }, Infinity, options)), { x: 4, y: 2 });
  assert.equal(movementModule.movePath(unit, { x: 3, y: 3 }, Infinity, options), null);
  assert.equal(movementModule.clearStraightPath(unit, { x: 4, y: 2 }, enemy, options), true);
});
