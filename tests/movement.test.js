const test = require("node:test");
const assert = require("node:assert/strict");

const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

function loadMovementRules(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/ninjutsu-definitions.js",
    "scripts/data/locales.js",
    "scripts/data/rule-modes.js",
    "scripts/systems/grid.js",
    "scripts/systems/state-helpers.js",
    "scripts/systems/ninjutsu.js",
    "scripts/systems/consumables.js",
    "scripts/systems/combat.js",
    "scripts/systems/movement.js",
  ]);
}

test("神酒效果期間移動不消耗技且可忽略目前技量不足", () => {
  let now = 1000;
  const messages = [];
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    moveSkillFreeUntil: 16000,
  };
  const context = loadMovementRules({
    performance: { now: () => now },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    setMessage: (message) => messages.push(message),
  });

  context.skillMove(unit, { x: 8, y: 5 });

  assert.equal(unit.skill, 0);
  assert.deepEqual({ x: unit.x, y: unit.y }, { x: 8, y: 5 });
  assert.equal(messages.at(-1), "blue1 在神酒效果期間移動，不消耗技。");
});

test("一般移動仍會照距離消耗技", () => {
  let now = 1000;
  const messages = [];
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 5,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    moveSkillFreeUntil: 0,
  };
  const context = loadMovementRules({
    performance: { now: () => now },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    setMessage: (message) => messages.push(message),
  });

  context.skillMove(unit, { x: 8, y: 5 });

  assert.equal(unit.skill, 2);
  assert.deepEqual({ x: unit.x, y: unit.y }, { x: 8, y: 5 });
  assert.equal(messages.at(-1), "blue1 消耗 3 技進行移動。");
});

test("道具使用期間可中間三段移動", () => {
  let now = 1000;
  const messages = [];
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 10,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    disabledUntil: 0,
  };
  const context = loadMovementRules({
    performance: { now: () => now },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    setMessage: (message) => messages.push(message),
  });
  const arriveTotal = contextValue(context, "ARRIVE_TOTAL");

  context.executeConsumableItem(unit, "backup3", now, []);
  assert.equal(unit.consumableUse.chainMoves, 3);
  context.skillMove(unit, { x: 6, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 7, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 8, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 9, y: 5 });

  assert.equal(unit.consumableUse.chainMoves, 0);
  assert.deepEqual({ x: unit.x, y: unit.y }, { x: 8, y: 5 });
  assert.equal(unit.skill, 15);
  assert.equal(messages.at(-1), "blue1：目前無法行動。");
});

test("神氣施放期間可中間三段移動", () => {
  let now = 1000;
  const messages = [];
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 120,
    maxHp: 300,
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    disabledUntil: 0,
  };
  const context = loadMovementRules({
    performance: { now: () => now },
    state: { deathModeKey: "death_heal", units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    localizedNinjuTypeLabel: () => "神氣",
    setMessage: (message) => messages.push(message),
  });
  const arriveTotal = contextValue(context, "ARRIVE_TOTAL");

  context.useShinkiNinju();
  context.skillMove(unit, { x: 6, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 7, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 8, y: 5 });
  now += arriveTotal + 1;
  context.skillMove(unit, { x: 9, y: 5 });

  assert.equal(unit.ninju.chainMoves, 0);
  assert.deepEqual({ x: unit.x, y: unit.y }, { x: 8, y: 5 });
  assert.equal(unit.skill, 7);
  assert.equal(messages.at(-1), "blue1：目前無法行動。");
});
