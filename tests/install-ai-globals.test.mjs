import test from "node:test";
import assert from "node:assert/strict";

import { installAiGlobals } from "../scripts/bootstrap/install-ai-globals.module.mjs";

test("installAiGlobals wires ai helpers and compatibility object", () => {
  const target = {};
  installAiGlobals(target);

  assert.equal(typeof target.aiProfile, "function");
  assert.equal(typeof target.isRedGroupAi, "function");
  assert.equal(typeof target.updateTachiMasterSoulCharge, "function");
  assert.equal(typeof target.updateAi, "function");
  assert.equal(typeof target.aiMoveUnit, "function");
  assert.equal(typeof target.queueAiRedRetaliation, "function");
  assert.equal(typeof target.NindouAi, "object");
  assert.equal(typeof target.NindouAi.runAiProfileProbe, "function");
  assert.equal(typeof target.NindouAi.updateAi, "function");
});

test("installAiGlobals installs updateAi side effects", () => {
  const blue = { id: 1, team: "blue", controlMode: "player", x: 4, y: 4, hp: 300, alive: true };
  const grey = {
    id: 2,
    team: "grey",
    controlMode: "ai_beginner",
    x: 5,
    y: 4,
    hp: 300,
    skill: 0,
    moveT: 1,
    aiNextThink: 0,
    aiPlanKey: "1:4,4:5,4",
    aiActionAt: 0,
    alive: true,
  };
  const state = {
    gameOver: false,
    units: [blue, grey],
    attacks: [],
    message: "",
  };
  const target = {
    maxSkill: 18,
    aiSkillRegenPerSecond: 1,
    NindouRuntimeState: { getState: () => state },
    canControlUnit: (unit) => unit.controlMode === "player",
    isUnitCastingNinju: () => false,
    isUnitDisabled: () => false,
    isUnitInNinjuGap: () => false,
    isUnitInvincible: () => false,
    weaponIsReady: () => true,
    manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    attack: (unit, enemy) => {
      enemy.hp -= 50;
      state.attacks.push({ unit, enemy });
      state.message = `${unit.name || "灰1"} 命中 1 個目標。`;
    },
    neighbors: () => [],
    checkVictory: () => {},
    steelRule: () => ({ cost: 3, castDurationMs: 100 }),
    moneyDartRule: () => ({ cost: 2 }),
    statusNinjuRule: () => ({ cost: 4, castDurationMs: 100 }),
    isSteelDefenseActive: () => false,
    isHotBloodActive: () => false,
    isAttackNinjuType: () => false,
    consumeAttackNinjuSoulLevel: () => 0,
    playStatusNinjuSound: () => {},
    playStatusEnergyUpSequence: () => {},
    startHealNinjuCastEffects: () => {},
    startMoneyDart: () => {},
    throwMoneyDart: () => {},
  };
  installAiGlobals(target);

  target.updateAi(0.016, 100000);

  assert.equal(blue.hp, 250);
  assert.equal(state.attacks.length, 1);
  assert.equal(grey.aiNextThink > 100000, true);
});
