import test from "node:test";
import assert from "node:assert/strict";

import { installNinjutsuGlobals } from "../scripts/bootstrap/install-ninjutsu-globals.module.mjs";

test("installNinjutsuGlobals wires ninjutsu globals and compatibility object", () => {
  const target = {};
  installNinjutsuGlobals(target);
  assert.equal(Array.isArray(target.ninjuCatalog), true);
  assert.equal(typeof target.ninjuByType, "object");
  assert.equal(Array.isArray(target.defaultNinjuLoadout), true);
  assert.equal(typeof target.NindouNinjutsu, "object");
  assert.equal(target.NindouNinjutsu.catalog, target.ninjuCatalog);
  assert.equal(target.NindouNinjutsu.byType, target.ninjuByType);
  assert.equal(target.NindouNinjutsu.defaultLoadout, target.defaultNinjuLoadout);
});
