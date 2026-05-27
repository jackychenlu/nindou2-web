import test from "node:test";
import assert from "node:assert/strict";

import { installMatchGlobals } from "../scripts/bootstrap/install-match-globals.module.mjs";

test("installMatchGlobals wires match helpers and compatibility object", () => {
  const target = {
    state: { units: [], result: null },
    performance: { now: () => 0 },
    clearDragState: () => {},
    syncBgm: () => {},
    playSound: () => null,
    setMessage: () => {},
  };
  installMatchGlobals(target);
  assert.equal(typeof target.checkVictory, "function");
  assert.equal(typeof target.finishMatch, "function");
  assert.equal(typeof target.NindouMatch, "object");
  assert.equal(typeof target.NindouMatch.runMatchFlowProbe, "function");
});
