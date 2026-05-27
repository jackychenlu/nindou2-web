import test from "node:test";
import assert from "node:assert/strict";

import { installConfigGlobals } from "../scripts/bootstrap/install-config-globals.module.mjs";

test("installConfigGlobals wires config globals and compatibility object", () => {
  const target = {};
  installConfigGlobals(target);
  assert.equal(typeof target.roomMapDefinitions, "object");
  assert.equal(typeof target.ninjutsuRuleProfiles, "object");
  assert.equal(typeof target.attackNinjuOutcomeTables, "object");
  assert.equal(typeof target.roomMapDefinitionEntries, "function");
  assert.equal(typeof target.NindouConfig, "object");
  assert.equal(target.NindouConfig.roomMapDefinitions, target.roomMapDefinitions);
  assert.equal(target.NindouConfig.ninjutsuRuleProfiles, target.ninjutsuRuleProfiles);
});
