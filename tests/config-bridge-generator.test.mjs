import test from "node:test";
import assert from "node:assert/strict";

import { buildConfigBridgeBlock } from "../scripts/tools/config-bridge-generator.mjs";
import {
  CONFIG_BRIDGE_END_MARKER,
  CONFIG_BRIDGE_START_MARKER,
  CONFIG_LITERAL_KEYS,
  CONFIG_SCALAR_KEYS,
  NINDOU_CONFIG_EXPORT_KEYS,
} from "../scripts/tools/config-bridge-spec.mjs";

test("buildConfigBridgeBlock renders markers and declared keys", () => {
  const configModule = Object.fromEntries(
    [...CONFIG_LITERAL_KEYS, ...CONFIG_SCALAR_KEYS].map((key) => [key, key.includes("Rect") || key.endsWith("Types") || key === "ui" || key === "startingAreas" || key === "grid" || key === "battleMapDrawInset" || key === "roomMapDefinitions" ? {} : 1]),
  );
  configModule.defaultRoomMapKey = "country-1";
  configModule.ninjutsuRuleProfiles = {};
  const block = buildConfigBridgeBlock(configModule);
  assert.equal(block.includes(CONFIG_BRIDGE_START_MARKER), true);
  assert.equal(block.includes(CONFIG_BRIDGE_END_MARKER), true);
  assert.equal(block.includes("Run: npm run sync:config-nindou"), true);
  for (const key of [...CONFIG_LITERAL_KEYS, ...CONFIG_SCALAR_KEYS]) {
    assert.equal(block.includes(`const ${key} =`), true);
  }
  for (const key of NINDOU_CONFIG_EXPORT_KEYS) {
    assert.equal(block.includes(`  ${key}`), true);
  }
});
