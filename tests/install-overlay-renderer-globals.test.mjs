import test from "node:test";
import assert from "node:assert/strict";

import { installOverlayRendererGlobals } from "../scripts/bootstrap/install-overlay-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "",
    textBaseline: "",
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    strokeRect: (...args) => calls.push(["strokeRect", ...args]),
    translate: (...args) => calls.push(["translate", ...args]),
    scale: (...args) => calls.push(["scale", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
  };
}

test("installOverlayRendererGlobals wires countdown and result overlays", () => {
  const calls = [];
  const ctx = createContext(calls);
  const state = {
    countdownStart: 1000,
    matchStart: 0,
    result: null,
    units: [
      { id: 2, team: "grey", name: "灰", kills: 1, damageDone: 20, damageTaken: 30 },
      { id: 1, team: "blue", name: "青", kills: 2, damageDone: 40, damageTaken: 50 },
    ],
  };
  const target = {
    document: {
      querySelector: (selector) => (selector === "#game" ? { width: 960, height: 680, getContext: () => ctx } : null),
    },
    NindouRuntimeState: { getState: () => state },
    grid: { left: 1, top: 2, cols: 3, rows: 4, cell: 5 },
    countdownTotalMs: 2500,
    localizedCountdownText: (step) => ["開始", "一", "二", "三"][step],
    drawOutlinedText: (...args) => calls.push(["outline", ...args]),
    roomLocale: () => ({
      victory: "勝利",
      defeat: "失敗",
      gameTime: "時間",
      resultHeaders: ["名", "隊", "殺", "傷", "受"],
    }),
    formatMatchTime: (value) => `${value}ms`,
    formatDamage: (value) => `${value}`,
  };

  installOverlayRendererGlobals(target);

  assert.deepEqual(target.countdownStep(300), { text: "三", color: "#fff1a8" });
  assert.equal(typeof target.NindouOverlayRenderer.drawResultOverlay, "function");

  target.drawCountdownOverlay(1300);
  state.result = { winner: "blue", durationMs: 1200 };
  target.drawResultOverlay();

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "outline" && call[1] === "三"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "outline" && call[1] === "勝利"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillText" && call[1] === "青"), true);
});
