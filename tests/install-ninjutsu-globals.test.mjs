import test from "node:test";
import assert from "node:assert/strict";

import { installNinjutsuGlobals } from "../scripts/bootstrap/install-ninjutsu-globals.module.mjs";

test("installNinjutsuGlobals wires ninjutsu globals and compatibility object", () => {
  const target = {};
  installNinjutsuGlobals(target);
  assert.equal(Array.isArray(target.ninjuCatalog), true);
  assert.equal(typeof target.ninjuByType, "object");
  assert.equal(Array.isArray(target.defaultNinjuLoadout), true);
  assert.equal(typeof target.NindouNinjutsu, "object");
  assert.equal(target.NindouNinjutsu.catalog, target.ninjuCatalog);
  assert.equal(target.NindouNinjutsu.byType, target.ninjuByType);
  assert.equal(target.NindouNinjutsu.defaultLoadout, target.defaultNinjuLoadout);
});

test("useMoneyDart queues during active consumable instead of starting immediately", () => {
  const sounds = [];
  const unit = {
    id: "u1",
    name: "Blue",
    alive: true,
    controlMode: "player",
    skill: 10,
    consumableUse: { phase: "active", type: "backup3", startedAt: 1000, duration: 1500, queue: [] },
  };
  const target = {
    performance: { now: () => 1200 },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    moneyDartRule: () => ({ cost: 5, readyMs: 200, postThrowNinjuLockMs: 300 }),
    setMessage: () => {},
    playSound: (key) => sounds.push(key),
    clearDragState: () => {},
  };

  installNinjutsuGlobals(target);
  target.useMoneyDart();

  assert.equal(unit.skill, 5);
  assert.equal(unit.moneyDart, undefined);
  assert.equal(unit.consumableUse.pendingMoneyDart, true);
  assert.deepEqual(sounds, ["useNinju"]);
});

test("status ninjutsu during an active consumable spends skill before the timed restore", () => {
  const sounds = [];
  const messages = [];
  const pendingEffect = { type: "backup3", applyAt: 2500, applied: false, applyAfterNinjutsu: false };
  const unit = {
    id: "u1",
    name: "Blue",
    alive: true,
    controlMode: "player",
    skill: 10,
    skillMax: 18,
    consumableUse: {
      phase: "active",
      type: "backup3",
      startedAt: 1000,
      duration: 1500,
      queue: [],
      pendingEffect,
    },
  };
  const target = {
    performance: { now: () => 1500 },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    steelRule: () => ({ cost: 5, durationMs: 15000, castDurationMs: 300 }),
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
    maxSkill: 18,
    setMessage: (message) => messages.push(message),
    playSound: (key) => sounds.push(key),
    clearDragState: () => {},
  };

  installNinjutsuGlobals(target);
  target.useSteelNinju();

  assert.equal(unit.skill, 5);
  assert.equal(pendingEffect.applyAfterNinjutsu, false);
  assert.deepEqual(unit.consumableUse.pendingNinjutsu, [{ type: "steel", attackNinjuLevel: 0 }]);
  assert.deepEqual(sounds, ["useNinju"]);
  assert.equal(messages.at(-1), "Blue 已排入Steel。");
});
