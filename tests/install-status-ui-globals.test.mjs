import test from "node:test";
import assert from "node:assert/strict";

import { installStatusUiGlobals } from "../scripts/bootstrap/install-status-ui-globals.module.mjs";

test("installStatusUiGlobals wires panel and message helpers", () => {
  const state = { message: "" };
  const unitInfoEl = { innerHTML: "" };
  const skillFillEl = { style: { width: "" } };
  const statusEl = { textContent: "" };
  const unit = { hp: 80.4, maxHp: 120, skill: 5, skillMax: 10 };
  const target = {
    document: {
      querySelector: (selector) => ({
        "#unitInfo": unitInfoEl,
        "#skillFill": skillFillEl,
        "#status": statusEl,
      })[selector] || null,
    },
    NindouRuntimeState: { getState: () => state },
    selectedHudUnit: () => unit,
    roomLocale: () => ({ panelSkill: "技", panelCell: "座標" }),
    displayCellCoord: () => ({ x: 2, y: 3 }),
    maxHp: 100,
    maxSkill: 18,
  };

  installStatusUiGlobals(target);

  assert.equal(typeof target.NindouStatusUi.updatePanel, "function");
  target.updatePanel();
  assert.equal(unitInfoEl.innerHTML.includes("HP: 80/120"), true);
  assert.equal(unitInfoEl.innerHTML.includes("技: 5.0 / 10"), true);
  assert.equal(skillFillEl.style.width, "50%");

  target.setMessage("測試訊息");
  assert.equal(state.message, "測試訊息");
  assert.equal(statusEl.textContent, "測試訊息");
});
