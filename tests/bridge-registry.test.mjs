import test from "node:test";
import assert from "node:assert/strict";

import { BRIDGE_REGISTRY, BRIDGE_REGISTRY_ORDER } from "../scripts/tools/bridge-definitions/bridge-registry.mjs";
import { DATA_BRIDGE_KEYS } from "../scripts/shared/data-domain-manifest.module.mjs";

test("bridge registry order follows shared data bridge keys", () => {
  assert.deepEqual(BRIDGE_REGISTRY_ORDER, DATA_BRIDGE_KEYS);
  for (const key of BRIDGE_REGISTRY_ORDER) {
    assert.equal(typeof BRIDGE_REGISTRY[key], "object");
    assert.equal(BRIDGE_REGISTRY[key].key, key);
  }
});
