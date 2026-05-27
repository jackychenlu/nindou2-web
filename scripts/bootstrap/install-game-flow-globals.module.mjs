import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function roomMapSelectValue(target) {
  return target.document?.querySelector?.("#roomMapSelect")?.value;
}

function bodyClassList(target) {
  return target.document?.body?.classList;
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installGameFlowGlobals(target = globalThis) {
  let restartHoldStartedAt = 0;
  let restartHoldTriggered = false;

  const resetRestartHold = () => {
    restartHoldStartedAt = 0;
    restartHoldTriggered = false;
  };

  const setRuleMode = (modeKey) => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    state.ruleModeKey = modeKey === "modified" ? modeKey : "original";
    target.updateRuleModeUi?.();
  };

  const setRoomMap = (mapKey) => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    const nextMapKey = target.roomMapDefinitions[mapKey] ? mapKey : target.defaultRoomMapKey;
    const mapChanged = state.roomMapKey !== nextMapKey;
    state.roomMapKey = nextMapKey;
    target.updateRoomMapUi?.();
    if (mapChanged && state.inRoom) state.objects = target.buildMapObjects();
  };

  const startBattleFromRoom = () => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    setRoomMap(roomMapSelectValue(target));
    state.inRoom = false;
    bodyClassList(target)?.remove("room-mode");
    resetRestartHold();
    target.resetGame();
    target.syncBgm();
    target.startBgm();
    if (typeof target.startDrawLoop === "function") target.startDrawLoop();
    else target.draw?.();
  };

  const returnToRoom = () => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    target.syncRoomInventoryFromPlayerUnit();
    if (state.endSoundInstance) {
      state.endSoundInstance.pause();
      state.endSoundInstance.currentTime = 0;
      state.endSoundInstance = null;
    }
    state.inRoom = true;
    state.result = null;
    state.resultClickableAt = 0;
    state.gameOver = false;
    state.matchStart = 0;
    state.matchEnd = 0;
    state.countdownStart = 0;
    state.pressedUnit = null;
    state.dragMoved = false;
    state.charging = false;
    state.attacks = [];
    state.projectiles = [];
    state.ninjuDamageEffects = [];
    state.consumableEffects = [];
    state.moneyDartCasts = [];
    state.cloneDecoys = [];
    target.clearDragState();
    resetRestartHold();
    bodyClassList(target)?.add("room-mode");
    target.updateRuleModeUi();
    target.updateDeathModeUi();
    target.updateRoomMapUi();
    target.renderRoomCards();
    target.syncBgm();
    target.startBgm();
    target.setMessage("回到房間。");
  };

  const returnToRoomFromResult = () => {
    returnToRoom();
  };

  const startRestartHold = (event) => {
    const state = resolveRuntimeState(target);
    if (event.code !== "KeyR" || state?.inRoom) return;
    if (!restartHoldStartedAt) restartHoldStartedAt = now(target);
  };

  const stopRestartHold = (event) => {
    if (event.code !== "KeyR") return;
    resetRestartHold();
  };

  const updateRestartHold = (currentNow) => {
    const state = resolveRuntimeState(target);
    if (!state || !restartHoldStartedAt || restartHoldTriggered || state.inRoom) return;
    if (currentNow - restartHoldStartedAt < 3000) return;
    restartHoldTriggered = true;
    returnToRoom();
  };

  Object.assign(target, {
    startBattleFromRoom,
    returnToRoom,
    returnToRoomFromResult,
    startRestartHold,
    stopRestartHold,
    resetRestartHold,
    updateRestartHold,
    setRuleMode,
    setRoomMap,
  });

  target.NindouGameFlow = {
    startBattleFromRoom,
    returnToRoom,
    returnToRoomFromResult,
    startRestartHold,
    stopRestartHold,
    resetRestartHold,
    updateRestartHold,
    setRuleMode,
    setRoomMap,
  };
}
