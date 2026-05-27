import test from "node:test";
import assert from "node:assert/strict";

import { installRenderTuningGlobals } from "../scripts/bootstrap/install-render-tuning-globals.module.mjs";

test("installRenderTuningGlobals wires render tuning globals and compatibility object", () => {
  const target = {};
  installRenderTuningGlobals(target);

  assert.equal(typeof target.eyeOffsets, "object");
  assert.equal(Array.isArray(target.moneyDartShootYCorrection), true);
  assert.equal(typeof target.arriveFrameOffset, "function");
  assert.equal(typeof target.moneyDartVisualOffsets, "object");
  assert.equal(typeof target.NindouRenderTuning, "object");
  assert.equal(target.NindouRenderTuning.eyeOffsets, target.eyeOffsets);
});
