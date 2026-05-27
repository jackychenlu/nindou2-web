import test from "node:test";
import assert from "node:assert/strict";

import { BRIDGE_MANIFEST, bridgeByKey, validateBridgeManifest } from "../scripts/tools/bridge-manifest.mjs";
import { DATA_BRIDGE_KEYS } from "../scripts/shared/data-domain-manifest.module.mjs";

test("bridge manifest includes config bridge and stable key order", () => {
  const keys = BRIDGE_MANIFEST.map((entry) => entry.key);
  assert.deepEqual(keys, DATA_BRIDGE_KEYS);
});

test("config bridge entry uses marker-patch generator", () => {
  const configEntry = bridgeByKey("config-nindou");
  assert.ok(configEntry);
  assert.equal(typeof configEntry.generate, "function");
  assert.equal(configEntry.runScriptName, "sync:config-nindou");
  assert.equal(configEntry.classicRelativePath, "scripts/data/config.js");
});

test("every bridge entry has executable sync shape", () => {
  for (const entry of BRIDGE_MANIFEST) {
    const hasGenerate = typeof entry.generate === "function";
    const hasTransform = typeof entry.transform === "function";
    assert.equal(hasGenerate || hasTransform, true, `bridge ${entry.key} should expose generate or transform`);
  }
});

test("validateBridgeManifest rejects duplicate keys", () => {
  assert.throws(
    () => validateBridgeManifest([
      { ...BRIDGE_MANIFEST[0], key: "dup" },
      { ...BRIDGE_MANIFEST[1], key: "dup" },
    ]),
    /Duplicate bridge key: dup/,
  );
});

test("validateBridgeManifest requires all data bridge keys", () => {
  assert.throws(
    () => validateBridgeManifest(BRIDGE_MANIFEST.filter((entry) => entry.key !== "map")),
    /missing required data bridge: map/,
  );
});
