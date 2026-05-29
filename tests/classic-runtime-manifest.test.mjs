import test from "node:test";
import assert from "node:assert/strict";

import {
  CLASSIC_RUNTIME_SCRIPT_PATHS,
  CORE_RULE_SCRIPT_PATHS,
  COMBAT_RULE_SCRIPT_PATHS,
  AI_RULE_SCRIPT_PATHS,
} from "../scripts/classic-runtime-manifest.module.mjs";

test("classic runtime manifest keeps stable entry order", () => {
  assert.deepEqual(CLASSIC_RUNTIME_SCRIPT_PATHS, []);
});

test("classic runtime manifest has no duplicate script paths", () => {
  const unique = new Set(CLASSIC_RUNTIME_SCRIPT_PATHS);
  assert.equal(unique.size, CLASSIC_RUNTIME_SCRIPT_PATHS.length);
});

test("rule script subsets are ordered and composable", () => {
  assert.deepEqual(CORE_RULE_SCRIPT_PATHS, []);
  assert.deepEqual(COMBAT_RULE_SCRIPT_PATHS, []);
  assert.deepEqual(AI_RULE_SCRIPT_PATHS, []);
});

test("ai subset extends combat subset", () => {
  assert.equal(AI_RULE_SCRIPT_PATHS.length, COMBAT_RULE_SCRIPT_PATHS.length);
  assert.deepEqual(AI_RULE_SCRIPT_PATHS, COMBAT_RULE_SCRIPT_PATHS);
});
