import test from "node:test";
import assert from "node:assert/strict";

import {
  bundleSourcePaths,
  ensureClassicRuntimeBundle,
  isBundleStaleFromStats,
} from "../scripts/tools/ensure-classic-runtime-bundle.mjs";

test("bundleSourcePaths includes manifest and runtime scripts", () => {
  const paths = bundleSourcePaths();
  assert.equal(paths[0], "scripts/classic-runtime-manifest.module.mjs");
  assert.equal(paths.includes("scripts/systems/ninjutsu.js"), false);
  assert.equal(paths.includes("scripts/systems/combat.js"), false);
  assert.equal(paths.includes("scripts/systems/movement.js"), false);
  assert.equal(paths.includes("scripts/systems/ai.js"), false);
  assert.equal(paths.includes("game.js"), false);
});

test("isBundleStaleFromStats detects newer source timestamps", () => {
  assert.equal(isBundleStaleFromStats(100, [80, 90, 100]), false);
  assert.equal(isBundleStaleFromStats(100, [80, 101]), true);
});

test("ensureClassicRuntimeBundle skips output when manifest is empty", async () => {
  const result = await ensureClassicRuntimeBundle({ quiet: true });
  assert.equal(result.scriptCount, 0);
  assert.equal(result.skipped, true);
});
