import test from "node:test";
import assert from "node:assert/strict";

import { installRuleModeGlobals } from "../scripts/bootstrap/install-rule-modes-globals.module.mjs";

test("installRuleModeGlobals wires rule helpers and compatibility object", () => {
  const target = { state: { deathModeKey: "death_command" } };
  installRuleModeGlobals(target);
  assert.equal(typeof target.currentRuleModeKey, "function");
  assert.equal(typeof target.weaponDamageForMode, "function");
  assert.equal(typeof target.attackNinjuRule, "function");
  assert.equal(typeof target.NindouRuleModes, "object");
  assert.equal(target.NindouRuleModes.currentRuleModeKey(), target.currentRuleModeKey());
  assert.equal(target.NindouRuleModes.weaponDamageForMode("weapon4", 999), target.weaponDamageForMode("weapon4", 999));
  assert.deepEqual(target.NindouRuleModes.flashRule(), target.attackNinjuRule("flash"));
});

test("installRuleModeGlobals reads rule mode from runtime state bridge", () => {
  const runtimeState = { ruleModeKey: "original", deathModeKey: "death_heal" };
  const target = {
    NindouRuntimeState: {
      getState: () => runtimeState,
    },
  };
  installRuleModeGlobals(target);

  assert.equal(target.currentRuleModeKey(), "original");
  assert.equal(target.moneyDartRule().damage, 100);
  assert.equal(target.steelRule().cost, 6);

  runtimeState.ruleModeKey = "modified";
  assert.equal(target.currentRuleModeKey(), "modified");
  assert.equal(target.moneyDartRule().damage, 70);
});
