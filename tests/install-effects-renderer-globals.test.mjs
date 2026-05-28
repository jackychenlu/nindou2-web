import test from "node:test";
import assert from "node:assert/strict";

import { installEffectsRendererGlobals } from "../scripts/bootstrap/install-effects-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    globalAlpha: 1,
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
  };
}

test("installEffectsRendererGlobals wires ninjutsu effect helpers", () => {
  const calls = [];
  const ctx = createContext(calls);
  const frame = { id: "frame" };
  const magicWaterFrames = Array.from({ length: 40 }, (_, index) => ({ id: `magic-water-frame-${index + 1}` }));
  const magicWaterEffectFrames = Array.from({ length: 40 }, (_, index) => ({ id: `magic-water-effect-frame-${index + 1}` }));
  const magicWaterFrameDurationMs = 1500 / magicWaterFrames.length;
  const unit = { id: 1, alive: true, x: 2, y: 3, ninju: { type: "genki", startedAt: 1000, duration: 1000 } };
  const state = {
    units: [unit],
    consumableEffects: [{ unitId: 1, type: "magic_water", startedAt: 1000, duration: 1500, frameDurationMs: magicWaterFrameDurationMs }],
    ninjuDamageEffects: [],
  };
  const target = {
    document: {
      querySelector: (selector) => (selector === "#game" ? { getContext: () => ctx } : null),
    },
    performance: { now: () => 1500 },
    NindouRuntimeState: { getState: () => state },
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
    regenHpSmallFrames: [frame],
    regenHpLargeFrames: [frame],
    consumableRegenSpFrames: [frame],
    consumableMagicWaterFrames: magicWaterFrames,
    consumableMagicWaterEffectFrames: magicWaterEffectFrames,
    defUpFrames: [frame],
    atkUpFrames: [frame],
    cloneNinjuFrames: [frame],
    cloneGreyNinjuFrames: [frame],
    cloneRedNinjuFrames: [frame],
    cloneZhaohuoNinjuFrames: [{ id: "zhaohuo-clone" }],
    smallIceBreakFrames: [frame],
    damageFailFrames: [frame],
    faintedFrames: [frame],
    damageSuccessSmallFrames: [frame],
    damageSuccessMiddleFrames: [frame],
    damageSuccessBigFrames: [frame],
    damageSuccessNinjuSuccessFrames: [frame],
    playSound: () => {},
    unitPosition: (candidate) => ({ x: candidate.x * 10, y: candidate.y * 10 }),
    isUnitCastingNinju: (candidate) => Boolean(candidate.ninju),
  };

  installEffectsRendererGlobals(target);

  assert.equal(typeof target.NindouEffectsRenderer.addNinjuDamageEffect, "function");
  assert.deepEqual(target.ninjuDamageEffectPlacement("flashHit"), { x: 0, y: 40, w: 55, h: 32 });
  assert.equal(target.ninjuCastFrames("clone", { appearanceKey: "zhaohuo", team: "blue" })[0].id, "zhaohuo-clone");
  assert.equal(target.ninjuCastFrames("clone", { appearanceKey: "xiahoulan", team: "blue" })[0].id, "zhaohuo-clone");

  target.addNinjuDamageEffect("genki", unit);
  assert.equal(state.ninjuDamageEffects.length, 1);
  target.drawNinjuEffects(1500);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);

  const drawnMagicWaterFrameIds = [];
  const drawnMagicWaterEffectFrameIds = [];
  for (let index = 0; index < magicWaterFrames.length; index++) {
    target.drawConsumableEffects(1000 + index * magicWaterFrameDurationMs);
    const consumableDraws = calls.filter((call) => Array.isArray(call) && call[0] === "drawImage").slice(-2);
    drawnMagicWaterFrameIds.push(consumableDraws[0][1].id);
    drawnMagicWaterEffectFrameIds.push(consumableDraws[1][1].id);
  }
  assert.deepEqual(drawnMagicWaterFrameIds, magicWaterFrames.map((frame) => frame.id));
  assert.deepEqual(drawnMagicWaterEffectFrameIds, magicWaterEffectFrames.map((frame) => frame.id));
});
