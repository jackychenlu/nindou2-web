import test from "node:test";
import assert from "node:assert/strict";

import { installCombatGlobals } from "../scripts/bootstrap/install-combat-globals.module.mjs";

test("installCombatGlobals wires combat helpers and compatibility object", () => {
  const target = {
    performance: { now: () => 1000 },
    inside: () => true,
    unitAt: () => null,
    objectAt: () => null,
    isUnitInvincible: () => false,
    NindouRuntimeState: {
      getState: () => ({ ruleModeKey: "original" }),
    },
  };

  installCombatGlobals(target);

  assert.equal(typeof target.weaponIsReady, "function");
  assert.equal(typeof target.attackCell, "function");
  assert.equal(typeof target.attackAimedWeapon, "function");
  assert.equal(typeof target.damageUnit, "function");
  assert.equal(typeof target.unitWeaponDamage, "function");
  assert.equal(typeof target.isMagicWaterActive, "function");
  assert.equal(typeof target.weaponAreaCells, "function");
  assert.equal(typeof target.NindouCombat, "object");
  assert.equal(typeof target.NindouCombat.runCombatHelperProbe, "function");
});

test("installCombatGlobals caps stacked magic water status multipliers at 2x", () => {
  const target = {
    performance: { now: () => 1000 },
    inside: () => true,
    unitAt: () => null,
    objectAt: () => null,
    isUnitInvincible: () => false,
    NindouRuntimeState: {
      getState: () => ({ ruleModeKey: "modified" }),
    },
  };

  installCombatGlobals(target);

  assert.equal(target.unitWeaponDamage({ weaponKey: "weapon4", hotBloodUntil: 2000, magicWaterUntil: 2000 }), 80);
  assert.equal(target.defendedDamage({ steelUntil: 2000, magicWaterUntil: 2000 }, 170), 85);
});

test("installCombatGlobals keeps single status multipliers unchanged", () => {
  const target = {
    performance: { now: () => 1000 },
    inside: () => true,
    unitAt: () => null,
    objectAt: () => null,
    isUnitInvincible: () => false,
    NindouRuntimeState: {
      getState: () => ({ ruleModeKey: "modified" }),
    },
  };

  installCombatGlobals(target);

  assert.equal(target.unitWeaponDamage({ weaponKey: "weapon4", hotBloodUntil: 2000 }), 80);
  assert.equal(target.unitWeaponDamage({ weaponKey: "weapon4", magicWaterUntil: 2000 }), 80);
  assert.equal(target.defendedDamage({ steelUntil: 2000 }, 170), 100);
  assert.equal(target.defendedDamage({ magicWaterUntil: 2000 }, 170), 85);
});

test("installCombatGlobals installs attackCell side effects", () => {
  const calls = [];
  const attacker = { id: 1, name: "青1", team: "blue", x: 5, y: 5, weaponKey: "weapon1", facing: "right", weaponReadyAt: 0, damageDone: 0, kills: 0 };
  const enemy = { id: 2, name: "灰1", team: "grey", x: 6, y: 5, hp: 300, maxHp: 300, alive: true, damageTaken: 0 };
  const state = { ruleModeKey: "original", attacks: [], units: [attacker, enemy] };
  const target = {
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => state },
    defaultWeaponKey: "weapon1",
    ARRIVE_TOTAL: 260,
    soulCombatGainSteps: 1,
    soulDeathGainSteps: 2,
    inside: (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12,
    unitAt: (x, y) => state.units.find((unit) => unit.alive && unit.x === x && unit.y === y) || null,
    objectAt: () => null,
    isUnitInvincible: () => false,
    isUnitDisabled: () => false,
    isUnitCastingNinju: () => false,
    isUnitInNinjuGap: () => false,
    activeMoneyDartCast: () => null,
    directionFromTarget: (from, to) => {
      if (to.x > from.x) return { name: "right", dx: 1, dy: 0 };
      if (to.x < from.x) return { name: "left", dx: -1, dy: 0 };
      if (to.y > from.y) return { name: "down", dx: 0, dy: 1 };
      if (to.y < from.y) return { name: "up", dx: 0, dy: -1 };
      return null;
    },
    updateFacing: (unit, cell) => { unit.facing = cell.x > unit.x ? "right" : "left"; },
    gainSoul: (unit, value) => calls.push(["soul", unit.id, value]),
    playSound: (key) => calls.push(["sound", key]),
    setMessage: (message) => calls.push(["message", message]),
    formatDamage: (damage) => String(damage),
    cancelDragIfPressed: () => {},
    checkVictory: () => calls.push(["victory"]),
  };

  installCombatGlobals(target);
  target.attackCell(attacker, { x: 6, y: 5 });

  assert.equal(enemy.hp < 300, true);
  assert.equal(attacker.damageDone > 0, true);
  assert.equal(enemy.damageTaken > 0, true);
  assert.equal(state.attacks.length, 1);
  assert.equal(attacker.weaponReadyAt > 1000, true);
  assert.equal(calls.some((call) => call[0] === "sound"), true);
});

test("installCombatGlobals handles lethal damage and kill credit", () => {
  const calls = [];
  const attacker = { id: 1, name: "青1", team: "blue", damageDone: 0, kills: 0 };
  const enemy = { id: 2, name: "灰1", team: "grey", hp: 20, alive: true, damageTaken: 0 };
  const target = {
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => ({ ruleModeKey: "original" }) },
    inside: () => true,
    unitAt: () => null,
    objectAt: () => null,
    isUnitInvincible: () => false,
    gainSoul: (unit, value) => calls.push(["soul", unit.id, value]),
    playSound: (key) => calls.push(["sound", key]),
    setMessage: (message) => calls.push(["message", message]),
    formatDamage: (damage) => String(damage),
    cancelDragIfPressed: () => calls.push(["cancel"]),
    checkVictory: () => calls.push(["victory"]),
    soulCombatGainSteps: 1,
    soulDeathGainSteps: 2,
  };

  installCombatGlobals(target);
  const damage = target.damageUnit(enemy, 50, "hit", true, attacker);

  assert.equal(damage, 50);
  assert.equal(enemy.alive, false);
  assert.equal(attacker.kills, 1);
  assert.equal(calls.some((call) => call[0] === "victory"), true);
});
