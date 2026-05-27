const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadAiProfileContext() {
  const context = createGameContext();
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/ai.js",
  ]);
}

test("AI ES module stays in sync with legacy AI profile helpers", async () => {
  const context = loadAiProfileContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "ai.module.mjs")).href;
  const aiModule = await import(modulePath);
  const legacyAi = contextValue(context, "globalThis.NindouAi");
  const summary = aiModule.summarizeAiProfileHelpers(legacyAi);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(aiModule.aiProfile({ controlMode: "ai_tachi_master" }), plain(legacyAi.aiProfile({ controlMode: "ai_tachi_master" })));
  assert.equal(aiModule.isMoneyDartFocusedAi({ controlMode: "ai_dart_only_master" }), true);
  assert.equal(aiModule.isRedGroupAi({ controlMode: "ai_red" }), true);
  assert.equal(aiModule.isTachiMasterAi({ controlMode: "ai_beginner" }), false);
  assert.equal(aiModule.aiRedChargeDelay(4), 800);

  const tachi = { controlMode: "ai_tachi_master", skill: 0, soulSteps: 0, damageTaken: 1 };
  aiModule.trackAiRecentDamage(tachi, 1000);
  tachi.damageTaken = 3;
  aiModule.trackAiRecentDamage(tachi, 1200);
  aiModule.updateTachiMasterSoulCharge(tachi, 30);

  assert.equal(tachi.aiRecentlyDamagedUntil, 1700);
  assert.equal(tachi.soulSteps, 27);
  assert.equal(aiModule.isTachiMasterMoveReady(tachi, aiModule.aiProfile(tachi), 1300), true);
  assert.equal(aiModule.isOrthogonalLine({ x: 1, y: 1 }, { x: 1, y: 4 }), true);
  assert.equal(aiModule.isDiagonalAdjacent({ x: 1, y: 1 }, { x: 2, y: 2 }), true);
  assert.equal(aiModule.isInNineGrid({ x: 1, y: 1 }, { x: 3, y: 3 }), false);
});
