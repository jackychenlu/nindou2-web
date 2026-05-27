import test from "node:test";
import assert from "node:assert/strict";

import {
  DATA_BRIDGE_KEYS,
  DATA_DOMAIN_MANIFEST,
  DATA_PROBE_KEYS,
} from "../scripts/shared/data-domain-manifest.module.mjs";

test("data domain manifest keeps probe and bridge key order stable", () => {
  assert.deepEqual(DATA_PROBE_KEYS, [
    "config",
    "weapons",
    "ninjutsu",
    "locales",
    "ruleModes",
    "maps",
    "assets",
  ]);
  assert.deepEqual(DATA_BRIDGE_KEYS, [
    "config-nindou",
    "weapons",
    "ninjutsu-definitions",
    "locales",
    "rule-modes",
    "map",
  ]);
  assert.equal(DATA_DOMAIN_MANIFEST.length, DATA_PROBE_KEYS.length);
});
