import test from "node:test";
import assert from "node:assert/strict";

import { installWeaponGlobals } from "../scripts/bootstrap/install-weapons-globals.module.mjs";

test("installWeaponGlobals wires weapon globals and compatibility object", () => {
  const target = {};
  installWeaponGlobals(target);
  assert.equal(typeof target.defaultWeaponKey, "string");
  assert.equal(Array.isArray(target.weaponDefinitions), true);
  assert.equal(typeof target.weaponDefinitionByKey, "object");
  assert.equal(typeof target.weaponSoundKey, "function");
  assert.equal(typeof target.NindouWeapons, "object");
  assert.equal(target.NindouWeapons.defaultKey, target.defaultWeaponKey);
  assert.equal(target.NindouWeapons.definitions, target.weaponDefinitions);
  assert.equal(target.NindouWeapons.definitionByKey, target.weaponDefinitionByKey);
});
