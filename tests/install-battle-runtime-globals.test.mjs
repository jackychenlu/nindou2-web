import test from "node:test";
import assert from "node:assert/strict";

import { installBattleRuntimeGlobals } from "../scripts/bootstrap/install-battle-runtime-globals.module.mjs";

test("installBattleRuntimeGlobals wires match and charging helpers", () => {
  const messages = [];
  const sounds = [];
  const state = {
    inRoom: false,
    pressedUnit: { name: "青1", skill: 1, skillMax: 3 },
    gameOver: false,
    pressTime: 0,
    charging: false,
    countdownStart: 0,
    matchStart: 0,
    result: null,
    startSoundPlayed: false,
    lastFrame: 0,
  };
  const target = {
    performance: { now: () => 2000 },
    NindouRuntimeState: { getState: () => state },
    canUnitMoveNow: () => true,
    canUseConsumableFollowupMove: () => false,
    holdSeconds: 1,
    pointerIsOnUnit: () => true,
    maxSkill: 18,
    chargePerSecond: 2,
    setMessage: (message) => messages.push(message),
    playSound: (key) => sounds.push(key),
    attackNinjuConfigs: { flash: {} },
    specialNinjuConfigs: { clone: {} },
    useMoneyDart: () => sounds.push("moneyDart"),
    useSteelNinju: () => sounds.push("steel"),
    useHotBloodNinju: () => sounds.push("hotBlood"),
    useAttackNinju: (type) => sounds.push(type),
    useSpecialNinju: (type) => sounds.push(type),
    useGenkiNinju: () => sounds.push("genki"),
    useKakkiNinju: () => sounds.push("kakki"),
    useShinkiNinju: () => sounds.push("shinki"),
  };

  installBattleRuntimeGlobals(target);

  assert.equal(typeof target.NindouBattleRuntime.updateCharging, "function");
  target.updateCharging(0.5);
  assert.equal(state.charging, true);
  assert.equal(state.pressedUnit.skill, 2);
  target.updateMatchState(1000);
  assert.equal(state.matchStart, 1000);
  assert.deepEqual(sounds, []);
  assert.equal(target.isMatchActive(), true);
  target.useNinjuByType("flash");
  target.useNinjuByType("clone");
  assert.deepEqual(sounds.slice(-2), ["flash", "clone"]);
});
