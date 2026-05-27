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
  const unit = { id: 1, alive: true, x: 2, y: 3, ninju: { type: "genki", startedAt: 1000, duration: 1000 } };
  const state = {
    units: [unit],
    consumableEffects: [{ unitId: 1, type: "regen_sp", startedAt: 1000, duration: 1000 }],
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
    defUpFrames: [frame],
    atkUpFrames: [frame],
    cloneNinjuFrames: [frame],
    cloneGreyNinjuFrames: [frame],
    cloneRedNinjuFrames: [frame],
    smallIceBreakFrames: [frame],
    damageFailFrames: [frame],
    faintedFrames: [frame],
    damageSuccessSmallFrames: [frame],
    damageSuccessMiddleFrames: [frame],
    damageSuccessBigFrames: [frame],
    damageSuccessNinjuSuccessFrames: [frame],
    unitPosition: (candidate) => ({ x: candidate.x * 10, y: candidate.y * 10 }),
    isUnitCastingNinju: (candidate) => Boolean(candidate.ninju),
  };

  installEffectsRendererGlobals(target);

  assert.equal(typeof target.NindouEffectsRenderer.addNinjuDamageEffect, "function");
  assert.deepEqual(target.ninjuDamageEffectPlacement("flashHit"), { x: 0, y: 35, w: 74, h: 74 });

  target.addNinjuDamageEffect("genki", unit);
  assert.equal(state.ninjuDamageEffects.length, 1);

  target.drawNinjuEffects(1500);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
});
