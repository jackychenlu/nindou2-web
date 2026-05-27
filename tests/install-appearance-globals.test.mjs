import test from "node:test";
import assert from "node:assert/strict";

import { installAppearanceGlobals } from "../scripts/bootstrap/install-appearance-globals.module.mjs";

test("installAppearanceGlobals wires appearance helpers and compatibility object", () => {
  const target = { images: { eyesFront: "f", eyeSide: "s" } };
  installAppearanceGlobals(target);

  assert.equal(typeof target.lookDefinitionByKey, "function");
  assert.equal(typeof target.unitLookDefinition, "function");
  assert.equal(typeof target.unitEyeFrontSprite, "function");
  assert.equal(typeof target.unitEyeSideSprite, "function");
  assert.equal(typeof target.NindouAppearance, "object");
  assert.equal(target.NindouAppearance.lookDefinitionByKey, target.lookDefinitionByKey);
});
