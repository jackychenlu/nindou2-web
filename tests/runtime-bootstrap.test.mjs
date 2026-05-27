import test from "node:test";
import assert from "node:assert/strict";

import {
  RUNTIME_MODE_CLASSIC,
  RUNTIME_MODE_MODULE,
  REQUIRED_CLASSIC_GLOBALS,
  bootstrapRuntime,
  resolveRuntimeMode,
  missingClassicGlobals,
} from "../scripts/runtime-bootstrap.module.mjs";

test("resolveRuntimeMode defaults to classic", () => {
  assert.equal(resolveRuntimeMode({}), RUNTIME_MODE_CLASSIC);
});

test("resolveRuntimeMode prefers explicit global override", () => {
  assert.equal(resolveRuntimeMode({ NindouRuntimeMode: "module" }), RUNTIME_MODE_MODULE);
  assert.equal(resolveRuntimeMode({ NindouRuntimeMode: "classic" }), RUNTIME_MODE_CLASSIC);
});

test("resolveRuntimeMode reads document dataset when override not provided", () => {
  const target = {
    document: {
      documentElement: {
        dataset: {
          nindouRuntimeMode: "module",
        },
      },
    },
  };
  assert.equal(resolveRuntimeMode(target), RUNTIME_MODE_MODULE);
});

test("missingClassicGlobals returns empty when globals are present", () => {
  const target = Object.fromEntries(REQUIRED_CLASSIC_GLOBALS.map((key) => [key, {}]));
  assert.deepEqual(missingClassicGlobals(target), []);
});

test("missingClassicGlobals lists absent globals in required order", () => {
  const target = {
    NindouConfig: {},
    NindouWeapons: {},
  };
  const missing = missingClassicGlobals(target);
  assert.equal(missing[0], "NindouNinjutsu");
  assert.equal(missing.includes("NindouCombat"), true);
});

test("bootstrapRuntime in module mode skips classic loader and reports loadMode none", async () => {
  const target = {};
  const result = await bootstrapRuntime({
    target,
    mode: RUNTIME_MODE_MODULE,
    warn: () => {},
  });
  assert.equal(result.mode, RUNTIME_MODE_MODULE);
  assert.equal(result.loadMode, "none");
  assert.equal(result.loadedScriptCount, 0);
  assert.equal(result.appStarted, false);
});
