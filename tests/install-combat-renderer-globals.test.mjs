import test from "node:test";
import assert from "node:assert/strict";

import { installCombatRendererGlobals } from "../scripts/bootstrap/install-combat-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    globalAlpha: 1,
    lineCap: "",
    strokeStyle: "",
    lineWidth: 0,
    fillStyle: "",
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    beginPath: () => calls.push("beginPath"),
    arc: (...args) => calls.push(["arc", ...args]),
    stroke: () => calls.push("stroke"),
  };
}

test("installCombatRendererGlobals wires map and attack render helpers", () => {
  const calls = [];
  const ctx = createContext(calls);
  const frame = { width: 10, height: 10, naturalWidth: 10 };
  const state = {
    objects: [{ type: "crate", x: 1, y: 2, alive: true, breakable: true, hp: 50, maxHp: 100 }],
    attacks: [{ from: { x: 1, y: 1 }, to: { x: 2, y: 1 }, direction: "right", weaponKey: "weapon1", startedAt: 900, duration: 200, side: 1 }],
    projectiles: [{ id: 1 }],
    moneyDartCasts: [],
    units: [],
  };
  const target = {
    document: { querySelector: (selector) => (selector === "#game" ? { getContext: () => ctx } : null) },
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => state },
    images: {},
    grid: { cell: 44 },
    objectHp: 100,
    cellCenter: (x, y) => ({ x: x * 10, y: y * 10 }),
    weaponFrames: { weapon1: { attack: { right: [frame] }, hand: { right: [] } } },
    defaultWeaponKey: "weapon1",
    weaponAttackScale: () => 1,
    weaponHandScale: () => 1,
    weaponAttackOffset: () => ({ x: 0, y: 0 }),
    weaponHandOffset: () => ({ x: 0, y: 0 }),
    applyOffset: (point, offset) => ({ x: point.x + offset.x, y: point.y + offset.y }),
    moneyDartVisualOffsets: { shoot: { scale: 1, down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } } },
    moneyDartShootYCorrection: [],
  };

  installCombatRendererGlobals(target);

  assert.equal(typeof target.NindouCombatRenderer.drawAttacks, "function");
  target.drawMapObjects();
  target.drawAttacks();
  target.drawProjectiles();

  assert.equal(state.projectiles.length, 0);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillRect"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
});

test("moneyDartShootPlacement keeps classic directional offsets", () => {
  const target = {
    document: { querySelector: () => null },
    NindouRuntimeState: { getState: () => ({}) },
    moneyDartVisualOffsets: {
      shoot: {
        scale: 2,
        down: { x: 1, y: 2 },
        up: { x: 3, y: 4 },
        left: { x: 5, y: 6 },
        right: { x: 7, y: 8 },
      },
    },
    moneyDartShootYCorrection: [0, 2],
  };
  installCombatRendererGlobals(target);
  assert.deepEqual(target.moneyDartShootPlacement("right", { width: 10, height: 20 }, { x: 100, y: 200 }, 1), {
    x: 107,
    y: 206,
    w: 20,
    h: 40,
  });
});
