import {
  itemLabel,
  isImplementedConsumable,
  itemCountsFromSlots,
  firstEmptyItemSlot,
  setUnitInventorySlots,
  roomInventoryUnit,
  applyRoomInventoryToPlayerUnit,
  notifyRoomInventoryChanged,
  syncRoomInventoryFromPlayerUnit,
  addInventoryItem,
  removeInventoryItem,
  addGold,
  maybeGrantMapItem,
  applyConsumableUseDefault,
  startConsumableUseEffect,
  restoreConsumableSkill,
  applySake4MoveSkillFree,
  executeConsumableItem as executeConsumableItemModule,
  requestConsumableUse as requestConsumableUseModule,
  updateConsumables as updateConsumablesModule,
  summarizeConsumableHelpers,
} from "../systems/consumables.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function runtimeNow(target) {
  return target.performance?.now?.() ?? 0;
}

function runtimeCallbacks(target) {
  return {
    canControlUnit: target.canControlUnit,
    setMessage: target.setMessage,
    playSound: target.playSound,
    now: runtimeNow(target),
    defaultConsumableDisableMs: target.defaultConsumableDisableMs,
    defaultConsumableInvincibleMs: target.defaultConsumableInvincibleMs,
    ninjuChainMaxGap: target.ninjuChainMaxGap,
    ninjuFollowupMoveAllowance: target.ninjuFollowupMoveAllowance,
    sake4MoveSkillFreeMs: target.sake4MoveSkillFreeMs,
    maxSkill: target.maxSkill,
    playerUnitId: target.playerUnitId,
    startStatusNinjuActive: target.startStatusNinjuActive,
    mapItemDropChance: target.mapItemDropChance,
    mapGoldDropTypes: target.mapGoldDropTypes,
    mapItemDropTypes: target.mapItemDropTypes,
    mapConsumableDropTypes: target.mapConsumableDropTypes,
  };
}

export function installConsumablesGlobals(target = globalThis) {
  const stateLike = () => resolveRuntimeState(target);
  const roomInventoryUnitRuntime = () => roomInventoryUnit(stateLike(), target.canControlUnit);
  const applyRoomInventoryToPlayerUnitRuntime = () => applyRoomInventoryToPlayerUnit(stateLike(), target.canControlUnit);
  const notifyRoomInventoryChangedRuntime = () => notifyRoomInventoryChanged(stateLike());
  const syncRoomInventoryFromPlayerUnitRuntime = (unit) => syncRoomInventoryFromPlayerUnit(stateLike(), unit);
  const maybeGrantMapItemRuntime = (object, unit) => maybeGrantMapItem(object, unit, runtimeCallbacks(target));
  const applyConsumableUseDefaultRuntime = (unit, now) => applyConsumableUseDefault(unit, now, runtimeCallbacks(target));
  const startConsumableUseEffectRuntime = (unit, now, type = "regen_sp") =>
    startConsumableUseEffect(stateLike(), unit, now, type, runtimeCallbacks(target));
  const restoreConsumableSkillRuntime = (unit) => restoreConsumableSkill(unit, runtimeCallbacks(target));
  const applySake4MoveSkillFreeRuntime = (unit, now) => applySake4MoveSkillFree(unit, now, runtimeCallbacks(target));
  const executeConsumableItemRuntime = (unit, type, now, queue = [], chainMoves = target.ninjuFollowupMoveAllowance || 0, pendingNinjutsu = []) =>
    executeConsumableItemModule(stateLike(), unit, type, now, queue, chainMoves, pendingNinjutsu, runtimeCallbacks(target));
  const requestConsumableUseRuntime = (unit, type, slotIndex = -1) => {
    if (unit?.ninju && target.isStatusNinjuType?.(unit.ninju.type)) {
      if ((unit.items?.[type] || 0) <= 0) return false;
      target.playSound?.("clickItem");
      restoreConsumableSkillRuntime(unit);
      if (type === "sake4") applySake4MoveSkillFreeRuntime(unit, runtimeNow(target));
      removeInventoryItem(unit, type, 1, slotIndex);
      syncRoomInventoryFromPlayerUnitRuntime(unit);
      unit.ninju.pendingConsumables = [...(unit.ninju.pendingConsumables || []), type];
      target.setMessage?.(`${unit.name} 已排入${itemLabel(type)}。`);
      return true;
    }
    return requestConsumableUseModule(stateLike(), unit, type, slotIndex, runtimeCallbacks(target));
  };
  const updateConsumablesRuntime = (now) => {
    const currentState = stateLike();
    for (const unit of currentState.units || []) {
      const current = unit.consumableUse;
      if (!current) continue;
      if (current.phase !== "active" && current.phase !== "gap") continue;
      if (current.phase === "active" && now - current.startedAt >= current.duration && !current.queue?.length && current.pendingNinjutsu?.length) {
        const [nextAction, ...remainingNinjutsu] = current.pendingNinjutsu;
        unit.consumableUse = null;
        target.startStatusNinjuActive?.(unit, nextAction, now, remainingNinjutsu);
        if (target.canControlUnit?.(unit)) target.playSound?.("useNinju");
        continue;
      }
      if (current.phase === "gap" && (!current.queue?.length) && current.pendingNinjutsu?.length) {
        const movedInGap = (current.gapMoves || 0) > 0;
        if (!movedInGap && now - current.startedAt < current.duration) continue;
        const [nextAction, ...remainingNinjutsu] = current.pendingNinjutsu;
        unit.consumableUse = null;
        target.startStatusNinjuActive?.(unit, nextAction, now, remainingNinjutsu);
        if (target.canControlUnit?.(unit)) target.playSound?.("useNinju");
      }
    }
    for (const unit of currentState.units || []) {
      if (unit.consumableUse?.pendingNinjutsu && !Array.isArray(unit.consumableUse.pendingNinjutsu)) {
        unit.consumableUse.pendingNinjutsu = [];
      }
    }
    const callbacks = runtimeCallbacks(target);
    callbacks.startStatusNinjuActive = target.startStatusNinjuActive;
    callbacks.canControlUnit = target.canControlUnit;
    updateConsumablesModule(currentState, now, callbacks);
  };
  const useBackupItemRuntime = (slotIndex = -1) => requestConsumableUseRuntime(target.selectedUnit?.(), "backup3", slotIndex);
  const useSakeItemRuntime = (slotIndex = -1) => requestConsumableUseRuntime(target.selectedUnit?.(), "sake4", slotIndex);
  const useItemSlotRuntime = (index) => {
    const unit = target.selectedUnit?.();
    const itemType = unit?.itemSlots?.[index] || "";
    if (itemType === "backup3") return useBackupItemRuntime(index);
    if (itemType === "sake4") return useSakeItemRuntime(index);
    target.setMessage?.("該欄位沒有可用道具。");
    return false;
  };

  Object.assign(target, {
    itemLabel,
    isImplementedConsumable,
    itemCountsFromSlots,
    firstEmptyItemSlot,
    setUnitInventorySlots,
    roomInventoryUnit: roomInventoryUnitRuntime,
    applyRoomInventoryToPlayerUnit: applyRoomInventoryToPlayerUnitRuntime,
    notifyRoomInventoryChanged: notifyRoomInventoryChangedRuntime,
    syncRoomInventoryFromPlayerUnit: syncRoomInventoryFromPlayerUnitRuntime,
    addInventoryItem,
    removeInventoryItem,
    addGold,
    maybeGrantMapItem: maybeGrantMapItemRuntime,
    applyConsumableUseDefault: applyConsumableUseDefaultRuntime,
    startConsumableUseEffect: startConsumableUseEffectRuntime,
    restoreConsumableSkill: restoreConsumableSkillRuntime,
    applySake4MoveSkillFree: applySake4MoveSkillFreeRuntime,
    executeConsumableItem: executeConsumableItemRuntime,
    requestConsumableUse: requestConsumableUseRuntime,
    updateConsumables: updateConsumablesRuntime,
    useBackupItem: useBackupItemRuntime,
    useSakeItem: useSakeItemRuntime,
    useItemSlot: useItemSlotRuntime,
  });

  target.NindouConsumables = {
    itemLabel,
    isImplementedConsumable,
    itemCountsFromSlots,
    firstEmptyItemSlot,
    setUnitInventorySlots,
    addInventoryItem,
    removeInventoryItem,
    addGold,
    applyConsumableUseDefault: applyConsumableUseDefaultRuntime,
    restoreConsumableSkill: restoreConsumableSkillRuntime,
    applySake4MoveSkillFree: applySake4MoveSkillFreeRuntime,
    runConsumableHelperProbe() {
      return summarizeConsumableHelpers({ runConsumableHelperProbe: () => null }).moduleResult;
    },
  };
}
