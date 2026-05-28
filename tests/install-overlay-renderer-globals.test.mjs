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

test("installOverlayRendererGlobals wires result overlay", () => {
  const calls = [];
  const ctx = createContext(calls);
  const state = {
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

  assert.equal(typeof target.NindouOverlayRenderer.drawResultOverlay, "function");

  state.result = { winner: "blue", durationMs: 1200 };
  target.drawResultOverlay();

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "outline" && call[1] === "勝利"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillText" && call[1] === "青"), true);
});
