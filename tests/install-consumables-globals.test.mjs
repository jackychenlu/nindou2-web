import test from "node:test";
import assert from "node:assert/strict";

import { installConsumablesGlobals } from "../scripts/bootstrap/install-consumables-globals.module.mjs";

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

test("queued consumables during ninjutsu restore skill immediately without effect sound", () => {
  const sounds = [];
  const state = {
    units: [{
      id: "u1",
      name: "Blue",
      alive: true,
      controlMode: "player",
      itemSlots: ["backup3", "sake4"],
      items: { backup3: 1, sake4: 1 },
      skill: 0,
      skillMax: 18,
      ninju: { type: "steel", phase: "active", pendingConsumables: [] },
    }],
    roomItemSlots: ["backup3", "sake4"],
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
  assert.equal(state.units[0].skill, 18);
  assert.deepEqual(state.units[0].ninju.pendingConsumables, ["backup3"]);
  assert.deepEqual(sounds, ["clickItem"]);
  assert.deepEqual(state.consumableEffects, []);

  state.units[0].skill = 1;
  assert.equal(target.requestConsumableUse(state.units[0], "sake4", 1), true);
  assert.equal(state.units[0].skill, 18);
  assert.equal(state.units[0].moveSkillFreeUntil, 16000);
  assert.equal(state.units[0].buffAuraType, "sake4");
  assert.deepEqual(state.units[0].ninju.pendingConsumables, ["backup3", "sake4"]);
  assert.deepEqual(sounds, ["clickItem", "clickItem"]);
  assert.deepEqual(state.consumableEffects, []);
});
