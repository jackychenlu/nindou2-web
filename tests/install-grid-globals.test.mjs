import test from "node:test";
import assert from "node:assert/strict";

import { installGridGlobals } from "../scripts/bootstrap/install-grid-globals.module.mjs";

test("installGridGlobals wires grid helpers and compatibility object", () => {
  const target = {
    grid: { cols: 22, rows: 12, cell: 44.5, left: -9, top: 5 },
    state: { roomMapKey: "country-10", units: [], objects: [], pointer: { cell: null } },
    defaultRoomMapKey: "country-10",
    roomMapDefinitions: { "country-10": { coordinateBottomInternalY: 10 } },
  };
  installGridGlobals(target);
  assert.equal(typeof target.pointToCell, "function");
  assert.equal(typeof target.cellCenter, "function");
  assert.equal(typeof target.currentRoomMapDefinition, "function");
  assert.equal(typeof target.NindouGrid, "object");
  assert.equal(typeof target.NindouGrid.runGridHelperProbe, "function");
});

test("installGridGlobals reads state/grid from runtime bridge getters", () => {
  const grid = { cols: 22, rows: 12, cell: 44.5, left: -9, top: 5 };
  const state = { roomMapKey: "country-10", units: [{ id: "u1", x: 1, y: 1, alive: true }], objects: [], pointer: { cell: { x: 1, y: 1 } } };
  const target = {
    defaultRoomMapKey: "country-10",
    roomMapDefinitions: { "country-10": { coordinateBottomInternalY: 10 } },
    NindouRuntimeState: {
      getState: () => state,
      getGrid: () => grid,
    },
  };
  installGridGlobals(target);
  assert.equal(target.unitAt(1, 1)?.id, "u1");
  assert.equal(target.pointToCell(grid.left + grid.cell + 2, grid.top + grid.cell + 2)?.x, 1);
});
