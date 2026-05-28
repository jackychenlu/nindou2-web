import test from "node:test";
import assert from "node:assert/strict";

import { installGameGlobals } from "../scripts/bootstrap/install-game-globals.module.mjs";

function makeTarget(overrides = {}) {
  const canvas = {
    width: 800,
    height: 600,
    getContext: () => ({
      clearRect: (...args) => target.calls.push(["clearRect", ...args]),
    }),
  };
  const selectors = new Map([["#game", canvas]]);
  const allSelectors = new Map([
    [".room-player-card", [{ dataset: { team: "blue", slot: "1" } }]],
    [".room-weapon-select", []],
    [".room-control-select", []],
    [".room-look-select", []],
    [".room-hp-input", []],
    [".room-skill-input", []],
    [".room-shop-item", []],
    [".room-shop-bag > div", []],
  ]);
  const storage = new Map();
  const target = {
    calls: [],
    document: {
      querySelector: (selector) => selectors.get(selector) || null,
      querySelectorAll: (selector) => allSelectors.get(selector) || [],
    },
    window: {
      localStorage: { getItem: (key) => storage.get(key) ?? null },
      requestAnimationFrame: (fn) => target.calls.push(["raf", fn]),
    },
    performance: { now: () => 1000 },
    defaultRoomMapKey: "country-10",
    defaultNinjuLoadout: ["heal1", null, null, null, null, null],
    isMatchActive: () => true,
    updateMatchState: (now) => target.calls.push(["updateMatchState", now]),
    updateCharging: (dt) => target.calls.push(["updateCharging", dt]),
    updateConsumables: (now) => target.calls.push(["updateConsumables", now]),
    updateNinju: (now) => target.calls.push(["updateNinju", now]),
    updateAi: (dt, now) => target.calls.push(["updateAi", dt, now]),
    updateProjectiles: (now) => target.calls.push(["updateProjectiles", now]),
    updateRestartHold: (now) => target.calls.push(["updateRestartHold", now]),
    drawBackdrop: () => target.calls.push(["drawBackdrop"]),
    drawBoard: () => target.calls.push(["drawBoard"]),
    drawMapMaskOverlay: () => target.calls.push(["drawMapMaskOverlay"]),
    drawDrag: () => target.calls.push(["drawDrag"]),
    drawMapObjects: () => target.calls.push(["drawMapObjects"]),
    drawMoveTrails: (now) => target.calls.push(["drawMoveTrails", now]),
    drawUnits: () => target.calls.push(["drawUnits"]),
    drawNinjuEffects: (now) => target.calls.push(["drawNinjuEffects", now]),
    drawMoneyDartShootAnimations: (now) => target.calls.push(["drawMoneyDartShootAnimations", now]),
    drawProjectiles: (now) => target.calls.push(["drawProjectiles", now]),
    drawAttacks: () => target.calls.push(["drawAttacks"]),
    drawGameHud: () => target.calls.push(["drawGameHud"]),
    drawNinjuBar: () => target.calls.push(["drawNinjuBar"]),
    drawFrame: () => target.calls.push(["drawFrame"]),
    drawResultOverlay: () => target.calls.push(["drawResultOverlay"]),
    updatePanel: () => target.calls.push(["updatePanel"]),
    ...overrides,
  };
  target.__selectors = selectors;
  target.__allSelectors = allSelectors;
  target.__storage = storage;
  return target;
}

test("installGameGlobals wires DOM refs, runtime state, and compatibility object", () => {
  const target = makeTarget();
  installGameGlobals(target);

  assert.equal(target.canvas, target.__selectors.get("#game"));
  assert.equal(target.roomCardEls.length, 1);
  assert.equal(target.roomSkillInputMax, 9999);
  assert.equal(typeof target.draw, "function");
  assert.equal(typeof target.startDrawLoop, "function");
  assert.equal(typeof target.NindouRuntimeState.getState, "function");
  assert.equal(target.NindouRuntimeState.getState(), target.state);
  assert.equal(target.NindouGame.state, target.state);
  assert.deepEqual(target.state.roomItemSlots, [
    "backup3",
    "backup3",
    "backup3",
    "backup3",
    "backup3",
    "magicWater",
    "magicWater",
    "magicWater",
    "magicWater",
    "magicWater",
  ]);
  assert.deepEqual(target.NindouRuntimeState.getSelectedNinjuLoadout(), ["heal1", null, null, null, null, null]);

  target.NindouRuntimeState.setSelectedNinjuLoadout(["fire1", null, null, null, null, null]);
  target.NindouRuntimeState.setEditNinjuDraft(["heal1", "support1", null, null, null, null]);
  target.NindouRuntimeState.setEditNinjuSlotIndex(3);

  assert.deepEqual(target.NindouRuntimeState.getSelectedNinjuLoadout(), ["fire1", null, null, null, null, null]);
  assert.deepEqual(target.NindouRuntimeState.getEditNinjuDraft(), ["heal1", "support1", null, null, null, null]);
  assert.equal(target.NindouRuntimeState.getEditNinjuSlotIndex(), 3);
});

test("installGameGlobals draw runs update and render hooks in match order", () => {
  const target = makeTarget();
  installGameGlobals(target);

  target.draw(1050);

  assert.deepEqual(target.calls.slice(0, 7).map((call) => call[0]), [
    "updateMatchState",
    "updateCharging",
    "updateConsumables",
    "updateNinju",
    "updateAi",
    "updateProjectiles",
    "updateRestartHold",
  ]);
  assert.equal(target.calls.some((call) => call[0] === "drawBoard"), true);
  assert.equal(target.calls.some((call) => call[0] === "raf"), false);
  assert.equal(target.startDrawLoop(), true);
  assert.equal(target.calls.at(-1)[0], "raf");
  assert.equal(target.startDrawLoop(), false);
});

test("installGameGlobals draw recovers transient render arrays after errors", () => {
  const errors = [];
  const target = makeTarget({
    console: { error: (...args) => errors.push(args) },
    drawBoard: () => {
      throw new Error("boom");
    },
  });
  installGameGlobals(target);
  target.state.moneyDartCasts = [{ id: 1 }];
  target.state.projectiles = [{ id: 2 }];
  target.state.ninjuDamageEffects = [{ id: 3 }];
  target.state.consumableEffects = [{ id: 4 }];

  target.draw(1050);

  assert.equal(errors.length, 1);
  assert.deepEqual(target.state.moneyDartCasts, []);
  assert.deepEqual(target.state.projectiles, []);
  assert.deepEqual(target.state.ninjuDamageEffects, []);
  assert.deepEqual(target.state.consumableEffects, []);
  assert.equal(target.calls.some((call) => call[0] === "raf"), false);
});
