import test from "node:test";
import assert from "node:assert/strict";

import { installGameFlowGlobals } from "../scripts/bootstrap/install-game-flow-globals.module.mjs";

function classListStub(calls) {
  return {
    add: (name) => calls.push(`add:${name}`),
    remove: (name) => calls.push(`remove:${name}`),
  };
}

test("installGameFlowGlobals wires room, map, rule, and restart helpers", () => {
  const calls = [];
  const state = {
    inRoom: true,
    roomMapKey: "country-10",
    result: { winner: "blue" },
    endSoundInstance: { pause: () => calls.push("pause"), currentTime: 5 },
  };
  const target = {
    performance: { now: () => 1000 },
    NindouRuntimeState: { getState: () => state },
    document: {
      body: { classList: classListStub(calls) },
      querySelector: (selector) => (selector === "#roomMapSelect" ? { value: "evil-castle-1" } : null),
    },
    roomMapDefinitions: { "country-10": {}, "evil-castle-1": {} },
    defaultRoomMapKey: "country-10",
    areGameAssetsReady: () => true,
    buildMapObjects: () => [{ id: "map" }],
    updateRoomMapUi: () => calls.push("mapUi"),
    updateRuleModeUi: () => calls.push("ruleUi"),
    updateDeathModeUi: () => calls.push("deathUi"),
    resetGame: () => calls.push("reset"),
    syncBgm: () => calls.push("syncBgm"),
    startBgm: () => calls.push("startBgm"),
    startDrawLoop: () => calls.push("startDrawLoop"),
    syncRoomInventoryFromPlayerUnit: () => calls.push("syncInventory"),
    clearDragState: () => calls.push("clearDrag"),
    renderRoomCards: () => calls.push("cards"),
    setMessage: (message) => calls.push(message),
  };

  installGameFlowGlobals(target);

  assert.equal(typeof target.NindouGameFlow.startBattleFromRoom, "function");
  target.setRuleMode("modified");
  assert.equal(state.ruleModeKey, "modified");
  target.setRoomMap("evil-castle-1");
  assert.equal(state.roomMapKey, "evil-castle-1");
  assert.deepEqual(state.objects, [{ id: "map" }]);

  target.startBattleFromRoom();
  assert.equal(state.inRoom, false);
  assert.equal(calls.includes("remove:room-mode"), true);
  assert.equal(calls.includes("startDrawLoop"), true);

  target.startRestartHold({ code: "KeyR" });
  target.updateRestartHold(4500);
  assert.equal(state.inRoom, true);
  assert.equal(state.result, null);
  assert.equal(calls.includes("回到房間。"), true);
  target.stopRestartHold({ code: "KeyR" });
});

test("startBattleFromRoom waits for images before leaving the room", async () => {
  let resolveAssets;
  let ready = false;
  const calls = [];
  const state = {
    inRoom: true,
    roomMapKey: "country-10",
  };
  const target = {
    NindouRuntimeState: { getState: () => state },
    document: {
      body: { classList: classListStub(calls) },
      querySelector: (selector) => (selector === "#roomMapSelect" ? { value: "country-10" } : null),
    },
    roomMapDefinitions: { "country-10": {} },
    defaultRoomMapKey: "country-10",
    areGameAssetsReady: () => ready,
    whenGameAssetsReady: () => new Promise((resolve) => {
      resolveAssets = () => {
        ready = true;
        resolve(true);
      };
    }),
    updateRoomMapUi: () => calls.push("mapUi"),
    resetGame: () => calls.push("reset"),
    syncBgm: () => calls.push("syncBgm"),
    startBgm: () => calls.push("startBgm"),
    startDrawLoop: () => calls.push("startDrawLoop"),
  };

  installGameFlowGlobals(target);

  assert.equal(target.startBattleFromRoom(), false);
  assert.equal(state.inRoom, true);
  assert.equal(calls.includes("reset"), false);

  resolveAssets();
  await Promise.resolve();

  assert.equal(state.inRoom, false);
  assert.equal(calls.includes("reset"), true);
  assert.equal(calls.includes("startDrawLoop"), true);
});
