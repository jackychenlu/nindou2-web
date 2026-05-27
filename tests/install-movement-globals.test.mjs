import test from "node:test";
import assert from "node:assert/strict";

import { installMovementGlobals } from "../scripts/bootstrap/install-movement-globals.module.mjs";

test("installMovementGlobals wires movement helpers and compatibility object", () => {
  const units = [
    { id: "u1", team: "blue", x: 5, y: 5, alive: true },
    { id: "u2", team: "grey", x: 7, y: 5, alive: true },
  ];
  const target = {
    inside: (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12,
    unitAt: (x, y) => units.find((unit) => unit.alive && unit.x === x && unit.y === y) || null,
    objectAt: () => null,
    isPermanentObstacle: () => false,
    isBlockedCell: () => false,
    isUnitInvincible: () => false,
  };

  installMovementGlobals(target);

  assert.equal(typeof target.movePath, "function");
  assert.equal(typeof target.skillMove, "function");
  assert.equal(typeof target.moveUnit, "function");
  assert.equal(typeof target.collideWithEnemy, "function");
  assert.equal(typeof target.reachableMoveCell, "function");
  assert.equal(typeof target.clearStraightPath, "function");
  assert.equal(typeof target.NindouMovement, "object");
  assert.equal(typeof target.NindouMovement.runMovementHelperProbe, "function");
});

test("installMovementGlobals installs side-effecting skill move flow", () => {
  const calls = [];
  const unit = { id: "u1", name: "青1", team: "blue", x: 5, y: 5, skill: 4, alive: true, kills: 0 };
  const target = {
    performance: { now: () => 1000 },
    inside: (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12,
    unitAt: (x, y) => (unit.alive && unit.x === x && unit.y === y ? unit : null),
    objectAt: () => null,
    isPermanentObstacle: () => false,
    isBlockedCell: () => false,
    isUnitInvincible: () => false,
    isUnitInNinjuGap: () => false,
    isUnitCastingNinju: () => false,
    canUnitMoveNow: () => true,
    weaponIsReady: () => true,
    isUnitDisabled: () => false,
    isStraightMove: (from, to) => from && to && (from.x === to.x || from.y === to.y),
    manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    updateFacing: (actor, cell) => { actor.facing = cell.x > actor.x ? "right" : "left"; },
    gainSoul: (actor, value) => calls.push(["soul", actor.id, value]),
    playSound: (key) => calls.push(["sound", key]),
    setMessage: (message) => calls.push(["message", message]),
    ARRIVE_TOTAL: 260,
  };

  installMovementGlobals(target);
  target.skillMove(unit, { x: 7, y: 5 });

  assert.equal(unit.x, 7);
  assert.equal(unit.y, 5);
  assert.equal(unit.skill, 2);
  assert.equal(unit.moveTrail.fromX, 5);
  assert.equal(unit.moveTrail.toX, 7);
  assert.equal(calls.some((call) => call[0] === "soul" && call[2] === 2), true);
  assert.equal(calls.some((call) => call[0] === "sound" && call[1] === "move"), true);
});

test("installMovementGlobals keeps collision and respawn behavior on module side", () => {
  const calls = [];
  const mover = { id: "u1", name: "青1", team: "blue", x: 5, y: 5, skill: 4, alive: true, kills: 0 };
  const enemy = { id: "u2", name: "灰1", team: "grey", x: 6, y: 5, hp: 30, maxHp: 100, alive: true };
  const state = { units: [mover, enemy] };
  const target = {
    performance: { now: () => 1000 },
    window: { setTimeout: (fn) => calls.push(["timeout", fn]) },
    NindouRuntimeState: { getState: () => state },
    inside: (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12,
    unitAt: (x, y) => state.units.find((unit) => unit.alive && unit.x === x && unit.y === y) || null,
    objectAt: () => null,
    isPermanentObstacle: () => false,
    isBlockedCell: () => false,
    isUnitInvincible: () => false,
    isUnitInNinjuGap: () => false,
    isUnitCastingNinju: () => false,
    canUnitMoveNow: () => true,
    weaponIsReady: () => true,
    isUnitDisabled: () => false,
    isStraightMove: (from, to) => from && to && (from.x === to.x || from.y === to.y),
    manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    updateFacing: () => {},
    defendedDamage: () => 30,
    collisionDamage: 30,
    recordDamage: (...args) => calls.push(["damage", args]),
    gainSoul: (actor, value) => calls.push(["soul", actor.id, value]),
    cancelDragIfPressed: () => {},
    playSound: (key) => calls.push(["sound", key]),
    setMessage: (message) => calls.push(["message", message]),
    formatDamage: (damage) => String(damage),
    checkVictory: () => calls.push(["victory"]),
    soulCombatGainSteps: 1,
    soulDeathGainSteps: 2,
    respawnMs: 1000,
    ARRIVE_TOTAL: 260,
  };

  installMovementGlobals(target);
  target.skillMove(mover, { x: 6, y: 5 });

  assert.equal(enemy.hp, 0);
  assert.equal(enemy.alive, false);
  assert.equal(mover.kills, 1);
  assert.equal(calls.some((call) => call[0] === "victory"), true);
});
