import test from "node:test";
import assert from "node:assert/strict";

import { installStateHelpersGlobals } from "../scripts/bootstrap/install-state-helpers-globals.module.mjs";

test("installStateHelpersGlobals wires state helpers and compatibility object", () => {
  const target = {
    state: {
      selectedId: "u1",
      pressedUnit: null,
      dragMoved: true,
      charging: true,
      units: [{ id: "u1", alive: true, team: "blue", controlMode: "player", soulSteps: 0 }],
    },
    soulStepsPerLevel: 27,
    soulMaxLevel: 4,
    playSound: () => null,
  };
  installStateHelpersGlobals(target);

  assert.equal(typeof target.clearDragState, "function");
  assert.equal(typeof target.selectedUnit, "function");
  assert.equal(typeof target.gainSoul, "function");
  assert.equal(typeof target.NindouStateHelpers, "object");
  assert.equal(typeof target.NindouStateHelpers.runStateHelperProbe, "function");
});

test("installStateHelpersGlobals reads state from runtime bridge getter", () => {
  const state = {
    selectedId: "u1",
    pressedUnit: null,
    dragMoved: true,
    charging: true,
    units: [{ id: "u1", alive: true, team: "blue", controlMode: "player", soulSteps: 0 }],
  };
  const target = {
    NindouRuntimeState: {
      getState: () => state,
    },
    soulStepsPerLevel: 27,
    soulMaxLevel: 4,
    playSound: () => null,
  };
  installStateHelpersGlobals(target);
  assert.equal(target.selectedUnit()?.id, "u1");
  target.clearDragState();
  assert.equal(state.pressedUnit, null);
  assert.equal(state.dragMoved, false);
});
