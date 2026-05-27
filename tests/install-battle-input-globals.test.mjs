import test from "node:test";
import assert from "node:assert/strict";

import { installBattleInputGlobals } from "../scripts/bootstrap/install-battle-input-globals.module.mjs";

function createTarget(state, calls = []) {
  const unit = { id: 1, name: "青1", team: "blue", alive: true, x: 4, y: 5, skill: 3 };
  const enemy = { id: 2, name: "灰1", team: "grey", alive: true, x: 6, y: 5, skill: 3 };
  state.units = [unit, enemy];
  state.selectedId = unit.id;
  return {
    document: {
      querySelector: (selector) => (selector === "#game"
        ? { width: 960, height: 720, getBoundingClientRect: () => ({ left: 10, top: 20, width: 960, height: 720 }) }
        : null),
    },
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => state },
    ARRIVE_TOTAL: 325,
    pointToCell: (x, y) => ({ x: Math.floor(x / 10), y: Math.floor(y / 10) }),
    pointInRect: (x, y, rect) => x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h,
    itemSlotRect: () => ({ x: 900, y: 900, w: 10, h: 10 }),
    currentNinjuButtonList: () => [],
    isMatchActive: () => true,
    startBgm: () => calls.push("startBgm"),
    returnToRoomFromResult: () => calls.push("returnToRoomFromResult"),
    useItemSlot: (index) => calls.push(["useItemSlot", index]),
    useNinjuByType: (type) => calls.push(["useNinjuByType", type]),
    unitAt: (x, y) => state.units.find((candidate) => candidate.x === x && candidate.y === y) || null,
    selectedUnit: () => state.units.find((candidate) => candidate.id === state.selectedId),
    canControlUnit: (candidate) => candidate.team === "blue",
    isUnitDisabled: () => false,
    updateFacingFromPointer: (candidate) => { candidate.facing = "right"; calls.push(["updateFacingFromPointer", candidate.id]); },
    setMessage: (message) => { state.message = message; calls.push(["setMessage", message]); },
    throwMoneyDart: (...args) => calls.push(["throwMoneyDart", ...args]),
    manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    attack: (...args) => calls.push(["attack", ...args]),
    attackAimedWeapon: (...args) => calls.push(["attackAimedWeapon", ...args]),
    cellCenter: (x, y) => ({ x: x * 10, y: y * 10 }),
    dragMoveTargetCell: () => ({ x: 5, y: 5 }),
    skillMove: (candidate, cell) => { calls.push(["skillMove", candidate.id, cell]); candidate.x = cell.x; candidate.y = cell.y; candidate.skill -= 1; },
  };
}

test("installBattleInputGlobals maps pointer coordinates and selects controllable unit", () => {
  const calls = [];
  const state = {
    inRoom: false,
    result: null,
    gameOver: false,
    pointer: { x: 0, y: 0, cell: null },
    pressedUnit: null,
    dragging: false,
    charging: false,
  };
  const target = createTarget(state, calls);
  installBattleInputGlobals(target);

  assert.equal(typeof target.NindouBattleInput.pointerDown, "function");
  target.pointerDown({ clientX: 50, clientY: 70, buttons: 1 });

  assert.deepEqual(state.pointer.cell, { x: 4, y: 5 });
  assert.equal(state.pressedUnit?.id, 1);
  assert.equal(state.selectedId, 1);
  assert.equal(state.message, "青1：請持續按住以累積技量。");
});

test("pointerUp commits drag movement and clears drag state", () => {
  const calls = [];
  const state = {
    inRoom: false,
    result: null,
    gameOver: false,
    pointer: { x: 0, y: 0, cell: null },
    pressedUnit: null,
    dragMoved: false,
    charging: false,
  };
  const target = createTarget(state, calls);
  installBattleInputGlobals(target);

  state.pressedUnit = state.units[0];
  state.charging = true;
  state.dragMoved = true;
  target.pointerUp({ clientX: 60, clientY: 70, buttons: 0 });

  assert.equal(state.units[0].x, 5);
  assert.equal(state.units[0].skill, 2);
  assert.equal(state.pressedUnit, null);
  assert.equal(state.charging, false);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "skillMove"), true);
});
