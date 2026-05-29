import test from "node:test";
import assert from "node:assert/strict";

import { installAppBootstrapGlobals } from "../scripts/bootstrap/install-app-bootstrap-globals.module.mjs";

function elementStub() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, handler, options) {
      listeners.push({ type, handler, options });
    },
  };
}

test("installAppBootstrapGlobals wires startup helpers and room inventory callback", async () => {
  const elements = new Map();
  [
    "#game",
    "#resetBtn",
    "#battleStartBtn",
    "#teamEditBtn",
    "#teamShopBtn",
    "#roomShopClose",
    "#ninjuEditorReset",
    "#ninjuEditorCancel",
    "#ninjuEditorSave",
    "#musicVolume",
    "#sfxVolume",
    "#ruleModeSelect",
    "#deathModeSelect",
    "#roomMapSelect",
  ].forEach((selector) => elements.set(selector, elementStub()));
  const shopItems = [elementStub()];
  const shopSlots = [elementStub(), elementStub()];
  const calls = [];
  const state = { deathModeKey: "death_heal", inRoom: true };
  const target = {
    document: {
      querySelector: (selector) => elements.get(selector) || null,
      querySelectorAll: (selector) => {
        if (selector === ".room-shop-item") return shopItems;
        if (selector === ".room-shop-bag > div") return shopSlots;
        return [];
      },
    },
    window: elementStub(),
    NindouRuntimeState: {
      getState: () => state,
    },
    pointerDown: () => {},
    pointerMove: () => {},
    pointerUp: () => {},
    startRestartHold: () => {},
    stopRestartHold: () => {},
    resetGame: () => calls.push("reset"),
    startBgm: () => calls.push("bgm"),
    startBattleFromRoom: () => {},
    openNinjuEditor: () => {},
    openRoomShop: () => {},
    closeRoomShop: () => {},
    purchaseShopItem: () => {},
    removeRoomShopBagItem: () => {},
    resetNinjuEditorLoadout: () => {},
    closeNinjuEditor: () => {},
    saveNinjuEditor: () => {},
    applyVolumeControls: () => calls.push("volume"),
    setRuleMode: () => {},
    updateDeathModeUi: () => calls.push("deathUi"),
    setRoomMap: () => {},
    setupRuleModeSelect: () => calls.push("ruleSelect"),
    setupDeathModeSelect: () => calls.push("deathSelect"),
    setupWeaponSelects: () => calls.push("weaponSelect"),
    setupControlSelects: () => calls.push("controlSelect"),
    setupHpInputs: () => calls.push("hpInputs"),
    setupSkillInputs: () => calls.push("skillInputs"),
    setupRoomSlots: () => calls.push("roomSlots"),
    renderRoomShopBag: () => {},
    applyRoomLanguage: () => calls.push("language"),
    loadImages: () => {
      calls.push("loadImages");
      return Promise.resolve();
    },
    updateRuleModeUi: () => calls.push("ruleUi"),
    updateRoomMapUi: () => calls.push("mapUi"),
    draw: () => calls.push("draw"),
    startDrawLoop: () => calls.push("startDrawLoop"),
  };

  installAppBootstrapGlobals(target);

  assert.equal(typeof target.startGameApp, "function");
  assert.equal(typeof target.NindouAppBootstrap.startGameApp, "function");
  target.bindGameEvents();
  assert.equal(elements.get("#game").listeners.some((entry) => entry.type === "pointerdown"), true);
  elements.get("#deathModeSelect").listeners.find((entry) => entry.type === "change").handler({ target: { value: "death_command" } });
  assert.equal(state.deathModeKey, "death_command");
  await target.startGameApp();
  assert.equal(state.onRoomInventoryChanged, target.renderRoomShopBag);
  assert.equal(target.areGameAssetsReady(), true);
  assert.equal(await target.whenGameAssetsReady(), true);
  assert.equal(calls.filter((call) => call === "loadImages").length, 1);
  assert.deepEqual(calls.slice(-6), ["loadImages", "ruleUi", "deathUi", "mapUi", "volume", "reset", "bgm", "startDrawLoop"].slice(-6));
});

test("installAppBootstrapGlobals does not reset a battle that starts while images load", async () => {
  let resolveImages;
  const state = { deathModeKey: "death_heal", inRoom: true };
  const calls = [];
  const target = {
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    window: elementStub(),
    NindouRuntimeState: {
      getState: () => state,
    },
    setupRuleModeSelect: () => {},
    setupDeathModeSelect: () => {},
    setupWeaponSelects: () => {},
    setupControlSelects: () => {},
    setupHpInputs: () => {},
    setupSkillInputs: () => {},
    setupRoomSlots: () => {},
    applyRoomLanguage: () => {},
    loadImages: () => new Promise((resolve) => {
      resolveImages = resolve;
    }),
    updateRuleModeUi: () => calls.push("ruleUi"),
    updateDeathModeUi: () => calls.push("deathUi"),
    updateRoomMapUi: () => calls.push("mapUi"),
    applyVolumeControls: () => calls.push("volume"),
    resetGame: () => calls.push("reset"),
    startBgm: () => calls.push("bgm"),
    startDrawLoop: () => calls.push("startDrawLoop"),
  };

  installAppBootstrapGlobals(target);

  const started = target.startGameApp();
  state.inRoom = false;
  resolveImages();
  await started;

  assert.equal(calls.includes("reset"), false);
  assert.equal(calls.includes("startDrawLoop"), true);
});
