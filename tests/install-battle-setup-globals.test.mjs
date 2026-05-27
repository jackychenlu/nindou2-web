import test from "node:test";
import assert from "node:assert/strict";

import { installBattleSetupGlobals } from "../scripts/bootstrap/install-battle-setup-globals.module.mjs";

function card(team, slot, active = true) {
  return {
    dataset: { team, slot: String(slot) },
    classList: { contains: (name) => name === "active-slot" && active },
  };
}

test("installBattleSetupGlobals wires reset and starting unit helpers", () => {
  const calls = [];
  const state = { inRoom: false };
  const target = {
    performance: { now: () => 1000 },
    Math: { random: () => 0 },
    document: { querySelectorAll: () => [card("blue", 1), card("grey", 1)] },
    NindouRuntimeState: { getState: () => state },
    defaultWeaponKey: "weapon1",
    maxHp: 300,
    maxSkill: 18,
    tachiMasterSkillMax: 18,
    roomSkillInputMax: 9999,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    currentRoomMapDefinition: () => ({}),
    shuffledCellsInArea: (area) => [{ x: area.xMin, y: area.yMin }],
    startingAreas: {
      blue: { xMin: 2, yMin: 3 },
      grey: { xMin: 16, yMin: 3 },
    },
    isBlockedCell: () => false,
    internalCellCoord: (cell) => cell,
    selectedControlMode: (team) => (team === "blue" ? "player" : "ai_red"),
    selectedWeaponKey: () => "weapon1",
    selectedLookKey: (team) => (team === "blue" ? "zhaohuo" : "__team_default__"),
    selectedHpValue: () => 300,
    selectedSkillValue: () => 18,
    buildMapObjects: () => [{ id: "map" }],
    applyRoomInventoryToPlayerUnit: () => calls.push("inventory"),
    setMessage: (message) => calls.push(message),
    updatePanel: () => calls.push("panel"),
  };

  installBattleSetupGlobals(target);

  const unit = target.makeUnit(1, "青1", "blue", 2, 3, "weapon1", "player", 300, 18, "default");
  assert.equal(unit.facing, "right");
  assert.equal(unit.aiNextThink, 0);

  target.resetGame();
  assert.equal(state.inRoom, false);
  assert.deepEqual(state.objects, [{ id: "map" }]);
  assert.equal(state.units.length, 2);
  assert.equal(state.units[0].appearanceKey, "zhaohuo");
  assert.equal(state.units[1].appearanceKey, "__team_default__");
  assert.equal(state.units[0].name, "青1");
  assert.equal(state.units[1].controlMode, "ai_red");
  assert.equal(calls.includes("開始。"), true);
  assert.equal(calls.includes("panel"), true);
  assert.equal(target.NindouBattleSetup.buildStartingUnits().length, 2);
});

test("installBattleSetupGlobals keeps finite skill without global roomSkillInputMax", () => {
  const target = {
    performance: { now: () => 1000 },
    Math: { random: () => 0 },
    NindouRuntimeState: { getState: () => ({}) },
    defaultWeaponKey: "weapon1",
    maxHp: 300,
    maxSkill: 18,
    tachiMasterSkillMax: 18,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  };

  installBattleSetupGlobals(target);

  const unit = target.makeUnit(1, "青1", "blue", 2, 3, "weapon1", "player", 300, 18, "default");
  assert.equal(unit.skill, 18);
  assert.equal(unit.skillMax, 18);
  assert.equal(Number.isFinite(unit.skill), true);
  assert.equal(Number.isFinite(unit.skillMax), true);
});
