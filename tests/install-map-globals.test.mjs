import test from "node:test";
import assert from "node:assert/strict";

import { installMapGlobals } from "../scripts/bootstrap/install-map-globals.module.mjs";

test("installMapGlobals wires map globals and compatibility object", () => {
  const target = {
    objectHp: 100,
    currentRoomMapDefinition: () => ({ objectLayout: "country-10" }),
    internalCellCoord: ({ x, y }) => ({ x, y }),
  };
  installMapGlobals(target);
  assert.equal(typeof target.buildMapObjects, "function");
  assert.equal(typeof target.buildCountry10Objects, "function");
  assert.equal(typeof target.buildEvilCastleObjects, "function");
  assert.equal(typeof target.NindouMaps, "object");
  assert.equal(target.NindouMaps.mapObjectBuilders, target.mapObjectBuilders);
  assert.deepEqual(target.NindouMaps.buildMapObjects(), target.buildMapObjects());
});
