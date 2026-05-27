const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadConsumableContext(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/consumables.js",
  ]);
}

test("consumables ES module stays in sync with legacy consumable helpers", async () => {
  const context = loadConsumableContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "consumables.module.mjs")).href;
  const consumableModule = await import(modulePath);
  const legacyConsumables = contextValue(context, "globalThis.NindouConsumables");
  const summary = consumableModule.summarizeConsumableHelpers(legacyConsumables);

  assert.equal(summary.isSynced, true);
  assert.equal(consumableModule.itemLabel("backup3"), "神水");
  assert.equal(consumableModule.isImplementedConsumable("x"), false);
  assert.deepEqual(consumableModule.itemCountsFromSlots(["backup3", "", "sake4", "backup3"]), { backup3: 2, sake4: 1 });

  const unit = { itemSlots: [], items: {}, gold: 0 };
  assert.equal(consumableModule.addInventoryItem(unit, "backup3", 2), true);
  assert.deepEqual(unit.itemSlots, ["backup3", "backup3"]);
  assert.equal(consumableModule.removeInventoryItem(unit, "backup3", 1, 0), true);
  assert.deepEqual(unit.items, { backup3: 1 });
});

test("queued 神水 restores skill immediately without starting effect sound or stun", () => {
  const sounds = [];
  const messages = [];
  const unit = {
    id: "blue1",
    name: "青1",
    controlMode: "player",
    alive: true,
    skill: 2,
    skillMax: 18,
    items: { backup3: 1 },
    itemSlots: ["backup3"],
    ninju: { type: "genki", pendingConsumables: [] },
  };
  const context = loadConsumableContext({
    state: { units: [unit], roomItemSlots: ["backup3"], consumableEffects: [] },
    canControlUnit: () => true,
    isStatusNinjuType: (type) => type === "genki",
    playSound: (key) => sounds.push(key),
    setMessage: (message) => messages.push(message),
  });

  context.requestConsumableUse(unit, "backup3", 0);

  assert.equal(unit.skill, 18);
  assert.deepEqual(Array.from(unit.ninju.pendingConsumables), ["backup3"]);
  assert.equal(unit.consumableUse, undefined);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.deepEqual(Array.from(context.state.consumableEffects), []);
  assert.equal(unit.disabledUntil, undefined);
  assert.equal(messages.at(-1), "青1 已排入神水。");
});

test("queued 神酒 restores skill and movement-free buff immediately without effect sound or stun", async () => {
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "consumables.module.mjs")).href;
  const consumableModule = await import(modulePath);
  const sounds = [];
  const unit = {
    id: "blue1",
    name: "青1",
    controlMode: "player",
    alive: true,
    skill: 1,
    skillMax: 18,
    items: { sake4: 1 },
    itemSlots: ["sake4"],
    consumableUse: { phase: "active", type: "backup3", startedAt: 1000, duration: 1500, queue: [] },
  };
  const stateLike = { units: [unit], roomItemSlots: ["sake4"], consumableEffects: [] };

  assert.equal(consumableModule.requestConsumableUse(stateLike, unit, "sake4", 0, {
    now: 1200,
    playSound: (key) => sounds.push(key),
  }), true);

  assert.equal(unit.skill, 18);
  assert.deepEqual(unit.consumableUse.queue, ["sake4"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.equal(unit.moveSkillFreeUntil, 16200);
  assert.equal(unit.buffAuraType, "sake4");
  assert.deepEqual(stateLike.consumableEffects, []);
});
