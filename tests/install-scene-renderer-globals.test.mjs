import test from "node:test";
import assert from "node:assert/strict";

import { installSceneRendererGlobals } from "../scripts/bootstrap/install-scene-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("beginPath"),
    arc: () => calls.push("arc"),
    fill: () => calls.push("fill"),
    stroke: () => calls.push("stroke"),
    moveTo: () => calls.push("moveTo"),
    lineTo: () => calls.push("lineTo"),
    strokeRect: (...args) => calls.push(["strokeRect", ...args]),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
  };
}

test("installSceneRendererGlobals wires scene drawing helpers", () => {
  const calls = [];
  const ctx = createContext(calls);
  const state = { pointer: { cell: { x: 1, y: 1 } } };
  const target = {
    document: {
      querySelector: (selector) => (selector === "#game" ? { width: 960, height: 680, getContext: () => ctx } : null),
    },
    NindouRuntimeState: { getState: () => state },
    grid: { left: 10, top: 20, cols: 3, rows: 3, cell: 30 },
    battleMapDrawInset: { left: 1, top: 2, right: 3, bottom: 4 },
    ui: { bottomTop: 100, bottomHeight: 40, leftPanelW: 80, midX: 120 },
    images: { arena: { id: "arena" }, bg: { id: "bg" } },
    currentRoomMapDefinition: () => ({ groundImageKey: "missing", fallbackImageKey: "bg", maskImageKey: "mask" }),
    cellRect: (x, y) => ({ x: x * 10, y: y * 10, w: 10, h: 10 }),
    isBlockedCell: (x, y) => x === 1 && y === 1,
    selectedUnit: () => ({ x: 1, y: 1 }),
    neighbors: () => [{ x: 1, y: 2 }],
    inside: () => true,
    unitAt: () => null,
  };

  installSceneRendererGlobals(target);

  assert.deepEqual(target.battleMapRect(), { x: 11, y: 22, w: 86, h: 84 });
  assert.equal(typeof target.drawBackdrop, "function");
  assert.equal(typeof target.NindouSceneRenderer.drawBoard, "function");

  target.drawBackdrop();
  target.drawBoard();

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "drawImage"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillRect" && call[1] === 10 && call[2] === 10), true);
});
