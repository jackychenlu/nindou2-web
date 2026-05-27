import test from "node:test";
import assert from "node:assert/strict";

import { installMovementRendererGlobals } from "../scripts/bootstrap/install-movement-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    globalAlpha: 1,
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("beginPath"),
    rect: (...args) => calls.push(["rect", ...args]),
    clip: () => calls.push("clip"),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
  };
}

function createTarget(state, calls = []) {
  const ctx = createContext(calls);
  const frame = { width: 20, height: 30 };
  return {
    document: { querySelector: (selector) => (selector === "#game" ? { getContext: () => ctx } : null) },
    performance: { now: () => 1100 },
    NindouRuntimeState: { getState: () => state },
    ARRIVE_TOTAL: 300,
    PREARRIVE_TOTAL: 120,
    PREARRIVE_FRAME_MS: 60,
    ARRIVE_FRAME_MS: 60,
    movePrearriveFrames: { blue: { right: [frame, frame], down: [frame] } },
    moveArriveFrames: { blue: { right: [frame, frame, frame, frame, frame], down: [frame] } },
    useNinjuFrames: { blue: [frame, frame] },
    dragArrowFrames: { right: [frame], left: [frame], up: [frame], down: [frame] },
    moveEffectOffsets: { arrive: { down: { x: 1, y: 2 } } },
    unitLookDefinition: () => ({ moveSet: "blue", useNinjuSet: "blue" }),
    cellCenter: (x, y) => ({ x: x * 10, y: y * 10 }),
    arriveFrameOffset: (direction, x, y, width, height) => ({ x: x - width / 2, y: y - height / 2 }),
    isUnitCastingNinju: (unit) => Boolean(unit.ninju?.phase === "active"),
    canDraggedUnitMoveNow: () => true,
    dragMoveTargetCell: () => ({ x: 4, y: 2 }),
    reachableMoveCell: () => ({ x: 4, y: 2 }),
    manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    directionFromTarget: () => "right",
  };
}

test("installMovementRendererGlobals wires movement drawing helpers", () => {
  const calls = [];
  const state = {
    units: [{
      team: "blue",
      x: 2,
      y: 2,
      fromX: 1,
      fromY: 2,
      moveT: 0.25,
      moveTrail: { startedAt: 1000, fromX: 1, fromY: 2, facing: "right" },
    }],
    charging: false,
    pointer: { x: 0, y: 0 },
  };
  const target = createTarget(state, calls);

  installMovementRendererGlobals(target);

  assert.equal(typeof target.NindouMovementRenderer.drawMoveTrails, "function");
  assert.equal(target.unitMoveDirection(state.units[0]), "right");
  const position = target.unitPosition(state.units[0]);
  assert.equal(position.x > 10 && position.x < 20, true);
  assert.equal(state.units[0].moveT, 0.33);

  target.drawMoveTrails(1050);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
});

test("drawDrag uses runtime state bridge and reachable movement globals", () => {
  const calls = [];
  const unit = { team: "blue", x: 2, y: 2, fromX: 2, fromY: 2, moveT: 1, skill: 3 };
  const state = {
    units: [unit],
    pressedUnit: unit,
    charging: true,
    dragMoved: true,
    pointer: { x: 80, y: 20 },
  };
  const target = createTarget(state, calls);

  installMovementRendererGlobals(target);
  target.drawDrag();
  target.updateFacingFromPointer(unit);

  assert.equal(unit.facing, "right");
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
});

test("unitUseNinjuSprite keeps classic progress frame selection", () => {
  const state = { units: [] };
  const target = createTarget(state);
  installMovementRendererGlobals(target);

  const sprite = target.unitUseNinjuSprite({
    team: "blue",
    moneyDart: null,
    ninju: { phase: "active", startedAt: 1000, duration: 400 },
  });

  assert.deepEqual(sprite, { width: 20, height: 30 });
});
