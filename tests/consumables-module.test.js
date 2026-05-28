const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

async function loadConsumableModule() {
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "consumables.module.mjs")).href;
  return import(modulePath);
}

test("consumables ES module exposes the consumable helper contract", async () => {
  const consumableModule = await loadConsumableModule();
  const summary = consumableModule.summarizeConsumableHelpers();

  assert.equal(summary.isSynced, true);
  assert.equal(summary.legacyResult, undefined);
  assert.equal(consumableModule.itemLabel("backup3"), "神水");
  assert.equal(consumableModule.itemLabel("magicWater"), "魔水");
  assert.equal(consumableModule.isImplementedConsumable("x"), false);
  assert.deepEqual(consumableModule.itemCountsFromSlots(["backup3", "", "sake4", "backup3", "magicWater"]), { backup3: 2, sake4: 1, magicWater: 1 });

  const unit = { itemSlots: [], items: {}, gold: 0 };
  assert.equal(consumableModule.addInventoryItem(unit, "backup3", 2), true);
  assert.deepEqual(unit.itemSlots, ["backup3", "backup3"]);
  assert.equal(consumableModule.removeInventoryItem(unit, "backup3", 1, 0), true);
  assert.deepEqual(unit.items, { backup3: 1 });
});

test("queued 神水 waits for its execution before restoring skill", async () => {
  const consumableModule = await loadConsumableModule();
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
    consumableUse: { phase: "active", type: "sake4", startedAt: 1000, duration: 1500, queue: [] },
  };
  const stateLike = { units: [unit], roomItemSlots: ["backup3"], consumableEffects: [] };

  consumableModule.requestConsumableUse(stateLike, unit, "backup3", 0, {
    now: 1200,
    playSound: (key) => sounds.push(key),
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 2);
  assert.deepEqual(unit.consumableUse.queue, ["backup3"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.deepEqual(stateLike.consumableEffects, []);
  assert.equal(unit.disabledUntil, undefined);
  assert.equal(messages.at(-1), "青1 已排入神水。");
});

test("神水 visual/audio starts immediately but the skill restore lands after the delay", async () => {
  const consumableModule = await loadConsumableModule();
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
  };
  const stateLike = { units: [unit], roomItemSlots: ["backup3"], consumableEffects: [] };

  consumableModule.requestConsumableUse(stateLike, unit, "backup3", 0, {
    now: 1200,
    playSound: (key) => sounds.push(key),
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 2);
  assert.equal(unit.consumableUse.pendingEffect.applyAt, 2700);
  assert.deepEqual(sounds, ["clickItem", "spUp"]);
  assert.equal(stateLike.consumableEffects[0].type, "regen_sp");
  assert.equal(unit.disabledUntil, 2700);
  assert.equal(messages.at(-1), "青1 使用神水。");

  consumableModule.updateConsumables(stateLike, 2699, {
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 2);
  assert.equal(unit.consumableUse.pendingEffect.applied, false);

  consumableModule.updateConsumables(stateLike, 2700, {
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 18);
  assert.equal(unit.consumableUse, null);
  assert.equal(messages.at(-1), "青1 使用神水，技量已回滿。");
});

test("queued 神水 during active consumable does not front-load the restore", async () => {
  const consumableModule = await loadConsumableModule();
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
    consumableUse: { phase: "active", type: "sake4", startedAt: 1000, duration: 1500, queue: [] },
  };
  const stateLike = { units: [unit], roomItemSlots: ["backup3"], consumableEffects: [] };

  consumableModule.requestConsumableUse(stateLike, unit, "backup3", 0, {
    now: 1200,
    playSound: (key) => sounds.push(key),
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 2);
  assert.deepEqual(unit.consumableUse.queue, ["backup3"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.deepEqual(stateLike.consumableEffects, []);
  assert.equal(unit.disabledUntil, undefined);
  assert.equal(messages.at(-1), "青1 已排入神水。");
});

test("queued 神酒 waits for its execution before restoring skill and movement-free buff", async () => {
  const consumableModule = await loadConsumableModule();
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

  assert.equal(unit.skill, 1);
  assert.deepEqual(unit.consumableUse.queue, ["sake4"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.equal(unit.moveSkillFreeUntil, undefined);
  assert.equal(unit.buffAuraType, undefined);
  assert.equal(unit.buffAuraVisibleAt, undefined);
  assert.deepEqual(stateLike.consumableEffects, []);
});

test("神酒 golden aura appears when the 1.5-second item timing applies", async () => {
  const consumableModule = await loadConsumableModule();
  const unit = {
    id: "blue1",
    name: "青1",
    controlMode: "player",
    alive: true,
    skill: 4,
    skillMax: 18,
    items: { sake4: 1 },
    itemSlots: ["sake4"],
  };
  const stateLike = { units: [unit], roomItemSlots: ["sake4"], consumableEffects: [] };

  assert.equal(consumableModule.requestConsumableUse(stateLike, unit, "sake4", 0, { now: 2000 }), true);

  assert.equal(unit.buffAuraVisibleAt, undefined);

  consumableModule.updateConsumables(stateLike, 3500);

  assert.equal(unit.skill, 18);
  assert.equal(unit.moveSkillFreeUntil, 18500);
  assert.equal(unit.buffAuraType, "sake4");
  assert.equal(unit.buffAuraVisibleAt, 3500);
});

test("魔水 restores skill, grants 15-second buff, and uses magic-water effect frames", async () => {
  const consumableModule = await loadConsumableModule();
  const sounds = [];
  const messages = [];
  const unit = {
    id: "blue1",
    name: "青1",
    controlMode: "player",
    alive: true,
    skill: 4,
    skillMax: 18,
    items: { magicWater: 1 },
    itemSlots: ["magicWater"],
  };
  const stateLike = { units: [unit], roomItemSlots: ["magicWater"], consumableEffects: [] };

  const result = consumableModule.requestConsumableUse(stateLike, unit, "magicWater", 0, {
    now: 2000,
    playSound: (key) => sounds.push(key),
    setMessage: (message) => messages.push(message),
  });

  assert.equal(result, true);
  assert.equal(unit.skill, 4);
  assert.equal(unit.moveSkillFreeUntil, undefined);
  assert.equal(unit.magicWaterUntil, undefined);
  assert.equal(unit.buffAuraType, undefined);
  assert.equal(unit.buffAuraVisibleAt, undefined);
  assert.equal(stateLike.consumableEffects[0].type, "magic_water");
  assert.equal(stateLike.consumableEffects[0].duration, 1500);
  assert.equal(stateLike.consumableEffects[0].frameDurationMs, 37.5);
  assert.deepEqual(sounds, ["clickItem", "spUp"]);
  assert.equal(messages.at(-1), "青1 使用魔水。");

  consumableModule.updateConsumables(stateLike, 3499, {
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 4);
  assert.equal(unit.magicWaterUntil, undefined);

  consumableModule.updateConsumables(stateLike, 3500, {
    setMessage: (message) => messages.push(message),
  });

  assert.equal(unit.skill, 18);
  assert.equal(unit.moveSkillFreeUntil, 18500);
  assert.equal(unit.magicWaterUntil, 18500);
  assert.equal(unit.buffAuraType, "magicWater");
  assert.equal(unit.buffAuraVisibleAt, 3500);
  assert.equal(messages.at(-1), "青1 使用魔水，技量已回滿，15 秒內移動不消耗技，攻擊與防禦變為 2 倍。");
});
