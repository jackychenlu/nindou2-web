import test from "node:test";
import assert from "node:assert/strict";

import { installUnitRendererGlobals } from "../scripts/bootstrap/install-unit-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    shadowColor: "",
    shadowBlur: 0,
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("beginPath"),
    arc: (...args) => calls.push(["arc", ...args]),
    fill: () => calls.push("fill"),
    stroke: () => calls.push("stroke"),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    strokeRect: (...args) => calls.push(["strokeRect", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
    strokeText: (...args) => calls.push(["strokeText", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
    translate: (...args) => calls.push(["translate", ...args]),
    rotate: (...args) => calls.push(["rotate", ...args]),
    scale: (...args) => calls.push(["scale", ...args]),
    measureText: (text) => ({ width: String(text).length * 8 }),
  };
}

function createTarget(state, calls = []) {
  const ctx = createContext(calls);
  const maskCtx = createContext(calls);
  const frame = { width: 20, height: 30 };
  return {
    document: {
      querySelector: (selector) => (selector === "#game" ? { getContext: () => ctx } : null),
      createElement: (tag) => (tag === "canvas" ? { width: 0, height: 0, getContext: () => maskCtx } : null),
    },
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => state },
    images: {
      blueDown: frame,
      greyDown: frame,
      eyeFront: { width: 4, height: 3 },
      eyeSide: { width: 4, height: 3 },
      playerPointer: { width: 12, height: 18 },
    },
    roomLocaleText: { defaultLookOption: "預設", topHudName: "青1" },
    playerUnitId: 1,
    maxHp: 300,
    ARRIVE_TOTAL: 325,
    respawnPointerDuration: 1000,
    respawnPointerFrames: [frame],
    chargeRedFrames: [frame],
    chargeYellowFrames: [frame],
    weaponFrames: { weapon1: { hand: { down: [frame] } } },
    defaultWeaponKey: "weapon1",
    moneyDartPickupFrames: [frame],
    moneyDartReadyFrames: { b: [frame, frame, frame, frame], g: [frame, frame, frame, frame], zhaohuo: [{ id: "zr" }, { id: "zl" }, { id: "zu" }, { id: "zd" }] },
    moneyDartReadyOffsets: { down: { dx: 0, dy: 0 }, up: { dx: 0, dy: 0 }, left: { dx: 0, dy: 0 }, right: { dx: 0, dy: 0 } },
    moneyDartEyeOffsets: { down: { x: -2, y: 10, w: 4, h: 3 } },
    eyeOffsets: { down: { x: -2, y: 10, w: 4, h: 3 } },
    useNinjuSpriteOffset: { x: 0, y: 0 },
    unitLookDefinition: () => ({ spriteSet: "blue", drawEyes: true }),
    unitPosition: (unit) => ({ x: unit.x * 10, y: unit.y * 10 }),
    unitUseNinjuSprite: () => null,
    drawUnitImage: (sprite, p) => calls.push(["drawUnitImage", sprite, p]),
    activeMoneyDartCast: () => false,
    isSteelDefenseActive: (unit) => Boolean(unit.steelUntil && unit.steelUntil > 1000),
    isHotBloodActive: () => false,
    localizedControlModeLabel: (mode) => mode,
    roomTeamLabel: (team) => team,
    unitEyeFrontSprite: () => ({ width: 4, height: 3 }),
    unitEyeSideSprite: () => ({ width: 4, height: 3 }),
  };
}

test("installUnitRendererGlobals draws units and installs compatibility object", () => {
  const calls = [];
  const state = {
    selectedId: 2,
    charging: false,
    pressedUnit: null,
    cloneDecoys: [],
    units: [
      { id: 1, team: "blue", alive: true, x: 4, y: 5, facing: "down", hp: 300, maxHp: 300, hitFlash: 0 },
      { id: 2, team: "grey", alive: true, x: 7, y: 5, facing: "down", hp: 220, maxHp: 300, hitFlash: 0, controlMode: "player" },
    ],
  };
  const target = createTarget(state, calls);

  installUnitRendererGlobals(target);

  assert.equal(typeof target.NindouUnitRenderer.drawUnits, "function");
  assert.equal(typeof target.drawMoneyDartShootEye, "function");
  assert.equal(target.unitSprite(state.units[0]), target.images.blueDown);

  target.drawUnits();

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawUnitImage"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillText"), true);
});

test("activeBuffAuraType and money dart helpers keep classic behavior", () => {
  const calls = [];
  const state = { selectedId: 1, units: [], cloneDecoys: [] };
  const target = createTarget(state, calls);
  installUnitRendererGlobals(target);

  const unit = { id: 1, team: "blue", facing: "down", buffAuraType: "steel", steelUntil: 2000, moneyDart: { startedAt: 800 } };

  assert.equal(target.activeBuffAuraType(unit), "steel");
  assert.equal(target.moneyDartReadyFrame("down", unit), target.moneyDartReadyFrames.b[3]);
  target.drawMoneyDartShootEye(unit, "down", { x: 10, y: 20 }, { w: 4, h: 3 });

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
});

test("sake4 aura stays hidden until buffAuraVisibleAt", () => {
  const calls = [];
  const state = { selectedId: 1, units: [], cloneDecoys: [] };
  const target = createTarget(state, calls);
  let now = 1000;
  target.performance.now = () => now;
  installUnitRendererGlobals(target);

  const unit = { id: 1, team: "blue", facing: "down", buffAuraType: "sake4", moveSkillFreeUntil: 5000, buffAuraVisibleAt: 2500 };

  assert.equal(target.activeBuffAuraType(unit), "");
  now = 2600;
  assert.equal(target.activeBuffAuraType(unit), "sake4");
});

test("magicWater aura stays purple while using the same timed buff window", () => {
  const calls = [];
  const state = { selectedId: 1, units: [], cloneDecoys: [] };
  const target = createTarget(state, calls);
  let now = 1000;
  target.performance.now = () => now;
  installUnitRendererGlobals(target);

  const unit = { id: 1, team: "blue", facing: "down", buffAuraType: "magicWater", moveSkillFreeUntil: 5000, buffAuraVisibleAt: 2500 };

  assert.equal(target.activeBuffAuraType(unit), "");
  now = 2600;
  assert.equal(target.activeBuffAuraType(unit), "magicWater");
});

test("money dart ready frame follows zhaohuo appearance set", () => {
  const calls = [];
  const state = { selectedId: 1, units: [], cloneDecoys: [] };
  const target = createTarget(state, calls);
  target.unitLookDefinition = () => ({ spriteSet: "zhaohuo", moneyDartReadySet: "zhaohuo", drawEyes: false });
  installUnitRendererGlobals(target);

  const unit = { id: 1, team: "blue", appearanceKey: "zhaohuo", facing: "down" };
  assert.equal(target.moneyDartReadyFrame("down", unit), target.moneyDartReadyFrames.zhaohuo[3]);
});
