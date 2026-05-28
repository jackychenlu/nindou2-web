import test from "node:test";
import assert from "node:assert/strict";

import { installConsumablesGlobals } from "../scripts/bootstrap/install-consumables-globals.module.mjs";
import { installNinjutsuGlobals } from "../scripts/bootstrap/install-ninjutsu-globals.module.mjs";

test("installConsumablesGlobals wires consumable helpers and compatibility object", () => {
  const state = {
    units: [{ id: "u1", name: "Blue", alive: true, controlMode: "player", itemSlots: ["backup3"], items: { backup3: 1 }, skill: 0, skillMax: 18 }],
    roomItemSlots: ["backup3"],
    consumableEffects: [],
  };
  const target = {
    canControlUnit: (unit) => unit.controlMode === "player",
    selectedUnit: () => state.units[0],
    setMessage: () => {},
    playSound: () => {},
    performance: { now: () => 1000 },
    NindouRuntimeState: {
      getState: () => state,
    },
  };

  installConsumablesGlobals(target);

  assert.equal(typeof target.requestConsumableUse, "function");
  assert.equal(typeof target.updateConsumables, "function");
  assert.equal(typeof target.useItemSlot, "function");
  assert.equal(typeof target.maybeGrantMapItem, "function");
  assert.equal(typeof target.NindouConsumables, "object");
});

test("queued consumables during ninjutsu wait for their later execution", () => {
  const sounds = [];
  const state = {
    units: [{
      id: "u1",
      name: "Blue",
      alive: true,
      controlMode: "player",
      itemSlots: ["backup3", "sake4", "magicWater"],
      items: { backup3: 1, sake4: 1, magicWater: 1 },
      skill: 0,
      skillMax: 18,
      ninju: { type: "steel", phase: "active", pendingConsumables: [] },
    }],
    roomItemSlots: ["backup3", "sake4", "magicWater"],
    consumableEffects: [],
  };
  const target = {
    canControlUnit: (unit) => unit.controlMode === "player",
    selectedUnit: () => state.units[0],
    setMessage: () => {},
    playSound: (key) => sounds.push(key),
    isStatusNinjuType: () => true,
    performance: { now: () => 1000 },
    sake4MoveSkillFreeMs: 15000,
    NindouRuntimeState: {
      getState: () => state,
    },
  };

  installConsumablesGlobals(target);

  assert.equal(target.requestConsumableUse(state.units[0], "backup3", 0), true);
  assert.equal(state.units[0].skill, 0);
  assert.deepEqual(state.units[0].ninju.pendingConsumables, ["backup3"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.deepEqual(state.consumableEffects, []);

  state.units[0].skill = 1;
  assert.equal(target.requestConsumableUse(state.units[0], "sake4", 1), true);
  assert.equal(state.units[0].skill, 1);
  assert.equal(state.units[0].moveSkillFreeUntil, undefined);
  assert.equal(state.units[0].buffAuraType, undefined);
  assert.equal(state.units[0].buffAuraVisibleAt, undefined);
  assert.deepEqual(state.units[0].ninju.pendingConsumables, ["backup3", "sake4"]);
  assert.deepEqual(sounds, ["clickItem", "clickItem"]);
  assert.deepEqual(state.consumableEffects, []);

  state.units[0].skill = 2;
  assert.equal(target.requestConsumableUse(state.units[0], "magicWater", 2), true);
  assert.equal(state.units[0].skill, 2);
  assert.equal(state.units[0].moveSkillFreeUntil, undefined);
  assert.equal(state.units[0].magicWaterUntil, undefined);
  assert.equal(state.units[0].buffAuraType, undefined);
  assert.equal(state.units[0].buffAuraVisibleAt, undefined);
  assert.deepEqual(state.units[0].ninju.pendingConsumables, ["backup3", "sake4", "magicWater"]);
  assert.deepEqual(sounds, ["clickItem", "clickItem", "clickItem"]);
  assert.deepEqual(state.consumableEffects, []);
});

test("queued ninjutsu starts after the 1.5-second consumable restore", () => {
  const sounds = [];
  const messages = [];
  const unit = {
    id: "u1",
    name: "Blue",
    alive: true,
    controlMode: "player",
    itemSlots: ["backup3"],
    items: { backup3: 1 },
    skill: 2,
    skillMax: 18,
  };
  const state = {
    units: [unit],
    roomItemSlots: ["backup3"],
    consumableEffects: [],
  };
  let currentNow = 1000;
  const target = {
    canControlUnit: () => true,
    selectedUnit: () => unit,
    setMessage: (message) => messages.push(message),
    playSound: (key) => sounds.push(key),
    performance: { now: () => currentNow },
    defaultConsumableDisableMs: 1500,
    defaultConsumableInvincibleMs: 1500,
    ninjuChainGap: 500,
    ninjuChainMaxGap: 500,
    ninjuFollowupMoveAllowance: 2,
    maxSkill: 18,
    playerUnitId: "u1",
    startStatusNinjuActive: (actor, action, now, pendingNinjutsu, pendingMoneyDart, pendingConsumables, pendingConsumableEffects) => {
      actor.ninju = {
        type: action.type,
        phase: "active",
        startedAt: now,
        duration: 300,
        pendingNinjutsu,
        pendingMoneyDart,
        pendingConsumables,
        pendingConsumableEffects,
      };
    },
    isStatusNinjuType: () => true,
    NindouRuntimeState: {
      getState: () => state,
    },
  };

  installConsumablesGlobals(target);

  assert.equal(target.requestConsumableUse(unit, "backup3", 0), true);
  assert.equal(unit.skill, 2);
  assert.deepEqual(sounds, ["clickItem", "spUp"]);

  unit.consumableUse.pendingNinjutsu = [{ type: "steel", attackNinjuLevel: 0 }];

  target.updateConsumables(2500);

  assert.equal(unit.consumableUse, null);
  assert.equal(unit.ninju.type, "steel");
  assert.equal(unit.ninju.pendingConsumableEffects.length, 0);
  assert.equal(unit.skill, 18);
  assert.equal(messages.at(-1), "Blue 使用神水，技量已回滿。");
});

test("神水 restores at the 1.5-second item timing before queued ninjutsu starts", () => {
  const sounds = [];
  const messages = [];
  const unit = {
    id: "u1",
    name: "Blue",
    alive: true,
    controlMode: "player",
    itemSlots: ["backup3"],
    items: { backup3: 1 },
    skill: 18,
    skillMax: 18,
  };
  const state = {
    units: [unit],
    roomItemSlots: ["backup3"],
    consumableEffects: [],
  };
  let currentNow = 1000;
  const target = {
    canControlUnit: () => true,
    selectedUnit: () => unit,
    setMessage: (message) => messages.push(message),
    playSound: (key) => {
      sounds.push(key);
      return null;
    },
    performance: { now: () => currentNow },
    defaultConsumableDisableMs: 1500,
    defaultConsumableInvincibleMs: 1500,
    ninjuChainGap: 500,
    ninjuChainMaxGap: 500,
    ninjuFollowupMoveAllowance: 2,
    maxSkill: 18,
    playerUnitId: "u1",
    steelRule: () => ({ cost: 5, durationMs: 15000, castDurationMs: 300, defenseMultiplier: 2 }),
    hotBloodRule: () => ({ cost: 5, durationMs: 15000, castDurationMs: 300 }),
    moneyDartRule: () => ({ cost: 5, readyMs: 200, postThrowNinjuLockMs: 300 }),
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
    clearDragState: () => {},
    NindouRuntimeState: {
      getState: () => state,
    },
  };

  installNinjutsuGlobals(target);
  installConsumablesGlobals(target);

  assert.equal(target.requestConsumableUse(unit, "backup3", 0), true);
  assert.equal(unit.skill, 18);
  assert.deepEqual(sounds, ["clickItem", "spUp"]);

  currentNow = 1500;
  target.useSteelNinju();

  assert.equal(unit.skill, 13);
  assert.equal(unit.consumableUse.pendingEffect.applyAfterNinjutsu, false);
  assert.deepEqual(unit.consumableUse.pendingNinjutsu, [{ type: "steel", attackNinjuLevel: 0 }]);

  currentNow = 1600;
  target.useSteelNinju();

  assert.equal(unit.skill, 8);
  assert.deepEqual(unit.consumableUse.pendingNinjutsu, [
    { type: "steel", attackNinjuLevel: 0 },
    { type: "steel", attackNinjuLevel: 0 },
  ]);

  currentNow = 2499;
  target.updateConsumables(currentNow);

  assert.equal(unit.skill, 8);
  assert.equal(unit.consumableUse.pendingEffect.applied, false);
  assert.equal(unit.consumableUse.phase, "active");

  currentNow = 2500;
  target.updateConsumables(currentNow);

  assert.equal(unit.skill, 18);
  assert.equal(unit.consumableUse, null);
  assert.equal(unit.ninju.type, "steel");
  assert.equal(unit.skill, 18);

  currentNow = 2800;
  target.updateNinju(currentNow);

  assert.equal(unit.skill, 18);
  assert.equal(unit.steelUntil, 17800);
  assert.equal(unit.ninju.phase, "gap");

  currentNow = 3300;
  target.updateNinju(currentNow);

  assert.equal(unit.skill, 18);
  assert.equal(unit.ninju.phase, "active");

  currentNow = 3600;
  target.updateNinju(currentNow);

  assert.equal(unit.skill, 18);
  assert.equal(unit.steelUntil, 18600);
  assert.equal(unit.ninju, null);
  assert.equal(messages.at(-1), "Blue：忍術施放完成。");
});

test("queued money dart after consumable waits for follow-up move like ninjutsu chain", () => {
  const calls = [];
  const unit = {
    id: "u1",
    name: "Blue",
    alive: true,
    controlMode: "player",
    consumableUse: {
      phase: "active",
      type: "backup3",
      startedAt: 1000,
      duration: 1500,
      queue: [],
      pendingMoneyDart: true,
    },
  };
  const state = {
    units: [unit],
    roomItemSlots: [],
    consumableEffects: [],
  };
  const target = {
    canControlUnit: () => true,
    selectedUnit: () => unit,
    setMessage: () => {},
    playSound: () => {},
    startMoneyDart: (actor, now, playActivationSound) => {
      calls.push(["moneyDart", actor.id, now, playActivationSound]);
      actor.moneyDart = { startedAt: now };
    },
    performance: { now: () => 2500 },
    ninjuChainGap: 500,
    NindouRuntimeState: {
      getState: () => state,
    },
  };

  installConsumablesGlobals(target);

  target.updateConsumables(2500);
  assert.equal(unit.consumableUse.phase, "gap");
  assert.equal(unit.consumableUse.pendingMoneyDart, true);
  assert.equal(calls.length, 0);

  unit.consumableUse.gapMoves = 1;
  target.updateConsumables(2600);
  assert.deepEqual(calls, [["moneyDart", "u1", 2600, true]]);
  assert.equal(unit.consumableUse, null);
  assert.deepEqual(unit.moneyDart, { startedAt: 2600 });
});
