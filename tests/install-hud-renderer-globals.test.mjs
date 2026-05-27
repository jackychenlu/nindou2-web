import test from "node:test";
import assert from "node:assert/strict";

import { installHudRendererGlobals } from "../scripts/bootstrap/install-hud-renderer-globals.module.mjs";

function createContext(calls) {
  return {
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    strokeRect: (...args) => calls.push(["strokeRect", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
    beginPath: () => calls.push("beginPath"),
    arc: (...args) => calls.push(["arc", ...args]),
    ellipse: (...args) => calls.push(["ellipse", ...args]),
    fill: () => calls.push("fill"),
    stroke: () => calls.push("stroke"),
    fillText: (...args) => calls.push(["fillText", ...args]),
    strokeText: (...args) => calls.push(["strokeText", ...args]),
  };
}

function createTarget(state, calls = []) {
  const ctx = createContext(calls);
  const unit = state.units[0];
  return {
    document: { querySelector: (selector) => (selector === "#game" ? { width: 960, height: 720, getContext: () => ctx } : null) },
    performance: { now: () => 1000 },
    NindouRuntimeState: {
      getState: () => state,
      getSelectedNinjuLoadout: () => ["moneyDart", "steel", "genki"],
    },
    images: {
      blueIcon: { width: 12, height: 12 },
      moneyPanel: { width: 20, height: 10 },
      moneyDartButton: { width: 65, height: 30 },
      steelButton: { width: 65, height: 30 },
      healButton: { width: 65, height: 30 },
      backup3Item: { width: 32, height: 32 },
    },
    imageSources: { backup3Item: "backup3.png", sake4Item: "sake4.png" },
    itemSlotStartX: 510,
    itemSlotY: 552,
    itemSlotW: 36,
    itemSlotH: 34,
    itemSlotGap: 4,
    soulStepsPerLevel: 100,
    soulMaxLevel: 4,
    playerUnitId: unit.id,
    grid: { left: 120, cols: 12, cell: 44 },
    maxHp: 300,
    maxSkill: 20,
    ARRIVE_TOTAL: 325,
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
    ninjuByType: {
      moneyDart: { label: "錢" },
      steel: { label: "鋼" },
      genki: { label: "氣" },
    },
    roomLocale: () => ({
      topHudName: "青1",
      topHudLevel: "段",
      topHudRole: "忍",
      cellLabel: "座標",
      hpBadge: "體",
      skillBadge: "技",
      weaponBadge: "武",
      repBadge: "德",
      goldBadge: "金",
      itemBadge: "道",
      ninjuBadge: "術",
      ninjuCasting: "施",
      ninjuMovable: "動",
      secondsSuffix: "秒",
      ninjuSkillCostPrefix: "需",
    }),
    selectedHudUnit: () => unit,
    displayCellCoord: (candidate) => ({ x: candidate.x, y: candidate.y }),
    teamAliveCount: (team) => state.units.filter((candidate) => candidate.team === team && candidate.alive).length,
    localizedNinjuLabel: (ninju) => ninju.label,
    localizedNinjuFontSize: (size) => size,
    applyOffset: (point, offset) => ({ x: point.x + offset.x, y: point.y + offset.y }),
    moneyDartRule: () => ({ cost: 1 }),
    steelRule: () => ({ cost: 7, available: true }),
    healNinjuRule: () => ({ cost: 7, available: true }),
    attackNinjuRule: () => ({ cost: 0, available: true }),
    specialNinjuRule: () => ({ cost: 0, available: true }),
    isUnitCastingNinju: () => false,
    isUnitInNinjuGap: () => false,
    isSteelDefenseActive: () => false,
    isHotBloodActive: () => false,
    activeMoneyDartCast: () => false,
    isUnitDisabled: () => false,
    canUseNinjuDuringConsumable: () => false,
  };
}

test("installHudRendererGlobals wires HUD helpers and runtime loadout bridge", () => {
  const calls = [];
  const state = {
    units: [
      { id: 1, team: "blue", alive: true, x: 4, y: 5, hp: 260, maxHp: 300, skill: 18, skillMax: 20, soulSteps: 120, itemSlots: ["backup3"] },
      { id: 2, team: "grey", alive: true, x: 8, y: 5, hp: 300, maxHp: 300, skill: 18, skillMax: 20, itemSlots: [] },
    ],
  };
  const target = createTarget(state, calls);

  installHudRendererGlobals(target);

  assert.equal(typeof target.NindouHudRenderer.drawGameHud, "function");
  assert.equal(typeof target.currentNinjuButtonList, "function");
  assert.deepEqual(target.currentNinjuButtonList().map((button) => button.type), ["moneyDart", "steel", "genki"]);

  target.drawGameHud();

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillRect"), true);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === "fillText"), true);
  assert.deepEqual(target.itemSlotRect(2), { x: 590, y: 552, w: 36, h: 34 });
  assert.equal(target.itemIconSourceByType("backup3"), "backup3.png");
});

test("drawNinjuBar renders low-skill prompt through module HUD globals", () => {
  const calls = [];
  const state = {
    units: [
      { id: 1, team: "blue", alive: true, x: 4, y: 5, hp: 260, maxHp: 300, skill: 1, skillMax: 20, soulSteps: 0, itemSlots: [] },
    ],
  };
  const target = createTarget(state, calls);

  installHudRendererGlobals(target);
  target.drawNinjuBar();

  const textCalls = calls.filter((call) => Array.isArray(call) && call[0] === "fillText");
  assert.equal(textCalls.some((call) => String(call[1]).includes("需")), true);
});
