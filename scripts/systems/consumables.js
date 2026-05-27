function itemLabel(type) {
  if (type === "backup3") return "神水";
  if (type === "sake4") return "神酒";
  return "道具";
}

function isImplementedConsumable(type) {
  return type === "backup3" || type === "sake4";
}

function itemCountsFromSlots(slots) {
  return (slots || []).reduce((items, type) => {
    if (!type) return items;
    items[type] = (items[type] || 0) + 1;
    return items;
  }, {});
}

function firstEmptyItemSlot(slots) {
  for (let index = 0; index < 10; index++) {
    if (!slots?.[index]) return index;
  }
  return -1;
}

function setUnitInventorySlots(unit, slots) {
  if (!unit) return;
  unit.itemSlots = [...(slots || [])].slice(0, 10);
  unit.items = itemCountsFromSlots(unit.itemSlots);
}

function roomInventoryUnit() {
  return state.units.find((unit) => canControlUnit(unit)) || state.units[0] || null;
}

function applyRoomInventoryToPlayerUnit() {
  setUnitInventorySlots(roomInventoryUnit(), state.roomItemSlots);
}

function notifyRoomInventoryChanged() {
  if (typeof state.onRoomInventoryChanged === "function") {
    state.onRoomInventoryChanged(state.roomItemSlots);
  }
}

function syncRoomInventoryFromPlayerUnit(unit = roomInventoryUnit()) {
  state.roomItemSlots = [...(unit?.itemSlots || [])].slice(0, 10);
  notifyRoomInventoryChanged();
}

function addInventoryItem(unit, type, amount = 1) {
  if (!unit) return false;
  if (!unit.items) unit.items = {};
  if (!unit.itemSlots) unit.itemSlots = [];
  const itemCount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!itemCount) return false;
  for (let i = 0; i < itemCount; i++) {
    const slotIndex = firstEmptyItemSlot(unit.itemSlots);
    if (slotIndex < 0) return false;
    unit.itemSlots[slotIndex] = type;
  }
  unit.items = itemCountsFromSlots(unit.itemSlots);
  return true;
}

function removeInventoryItem(unit, type, amount = 1, slotIndex = -1) {
  if (!unit?.items?.[type]) return false;
  const itemCount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!itemCount) return false;
  let remainingToRemove = itemCount;
  if (slotIndex >= 0) {
    if (unit.itemSlots?.[slotIndex] !== type) return false;
    unit.itemSlots[slotIndex] = "";
    remainingToRemove -= 1;
  }
  for (let index = 0; remainingToRemove > 0 && index < (unit.itemSlots || []).length; index++) {
    if (unit.itemSlots[index] !== type) continue;
    unit.itemSlots[index] = "";
    remainingToRemove -= 1;
  }
  if (remainingToRemove > 0) return false;
  unit.items = itemCountsFromSlots(unit.itemSlots);
  return true;
}

function addGold(unit, amount = 1) {
  if (!unit) return false;
  unit.gold = Math.max(0, Math.floor(Number(unit.gold) || 0) + amount);
  return true;
}

function maybeGrantMapItem(object, unit) {
  if (!object || !unit || !unit.alive) return false;
  if (Math.random() > mapItemDropChance) return false;
  if (mapGoldDropTypes.includes(object.type)) {
    addGold(unit, 1);
    setMessage(`${unit.name} 撿到 1 金。`);
    return true;
  }
  if (!mapItemDropTypes.includes(object.type)) return false;
  const consumableTypes = Array.isArray(mapConsumableDropTypes) && mapConsumableDropTypes.length > 0
    ? mapConsumableDropTypes
    : ["backup3"];
  const itemType = consumableTypes[Math.floor(Math.random() * consumableTypes.length)] || "backup3";
  if (!addInventoryItem(unit, itemType, 1)) return false;
  playSound("takeDart");
  setMessage(`${unit.name} 撿到${itemLabel(itemType)}。`);
  return true;
}

function applyConsumableUseDefault(unit, now) {
  unit.disabledUntil = Math.max(unit.disabledUntil || 0, now + defaultConsumableDisableMs);
  unit.invincibleUntil = Math.max(unit.invincibleUntil || 0, now + defaultConsumableInvincibleMs);
}

function startConsumableUseEffect(unit, now, type = "regen_sp") {
  if (!unit) return;
  if (!state.consumableEffects) state.consumableEffects = [];
  state.consumableEffects = state.consumableEffects.filter((effect) => effect.unitId !== unit.id || effect.type !== type);
  state.consumableEffects.push({
    unitId: unit.id,
    type,
    startedAt: now,
    duration: defaultConsumableDisableMs,
  });
}

function restoreConsumableSkill(unit) {
  const skillLimit = unit.skillMax || maxSkill;
  unit.skill = skillLimit;
}

function applySake4MoveSkillFree(unit, now) {
  unit.moveSkillFreeUntil = Math.max(unit.moveSkillFreeUntil || 0, now + sake4MoveSkillFreeMs);
  unit.buffAuraType = "sake4";
}

function updateConsumables(now) {
  for (const unit of state.units) {
    const current = unit.consumableUse;
    if (!current) continue;
    if (current.phase === "active") {
      if (now - current.startedAt < current.duration) continue;
      if (current.queue?.length) {
        unit.consumableUse = { phase: "gap", startedAt: now, duration: ninjuChainMaxGap, queue: current.queue, gapMoves: 0, pendingNinjutsu: current.pendingNinjutsu || [] };
        if (unit.id === playerUnitId) setMessage(`${unit.name}：道具連用空檔中。`);
      } else if (current.pendingNinjutsu?.length) {
        const [nextAction, ...remainingNinjutsu] = current.pendingNinjutsu;
        unit.consumableUse = null;
        startStatusNinjuActive(unit, nextAction, now, remainingNinjutsu);
        if (canControlUnit(unit)) playSound("useNinju");
        if (unit.id === playerUnitId) setMessage(`${unit.name}：忍術續接完成。`);
      } else {
        unit.consumableUse = null;
      }
      continue;
    }
    if (current.phase === "gap") {
      const movedInGap = (current.gapMoves || 0) > 0;
      if (!movedInGap && now - current.startedAt < current.duration) continue;
      const [nextType, ...remainingQueue] = current.queue || [];
      if (!nextType) {
        if (current.pendingNinjutsu?.length) {
          const [nextAction, ...remainingNinjutsu] = current.pendingNinjutsu;
          unit.consumableUse = null;
          startStatusNinjuActive(unit, nextAction, now, remainingNinjutsu);
          if (canControlUnit(unit)) playSound("useNinju");
          if (unit.id === playerUnitId) setMessage(`${unit.name}：忍術續接完成。`);
        } else {
          unit.consumableUse = null;
        }
        continue;
      }
      executeConsumableItem(unit, nextType, now, remainingQueue, ninjuFollowupMoveAllowance, current.pendingNinjutsu || []);
      if (unit.id === playerUnitId) setMessage(`${unit.name}：道具續接完成。`);
    }
  }
}

function requestConsumableUse(unit, type, slotIndex = -1) {
  if (!unit || !canControlUnit(unit) || !unit.alive) {
    setMessage(`請選擇一名存活角色使用${itemLabel(type)}。`);
    return;
  }
  if ((unit.items?.[type] || 0) <= 0) {
    setMessage(`${unit.name}：沒有${itemLabel(type)}。`);
    return;
  }
  playSound("clickItem");
  const now = performance.now();
  restoreConsumableSkill(unit);
  if (type === "sake4") applySake4MoveSkillFree(unit, now);
  if (unit.ninju && isStatusNinjuType(unit.ninju.type)) {
    removeInventoryItem(unit, type, 1, slotIndex);
    syncRoomInventoryFromPlayerUnit(unit);
    unit.ninju.pendingConsumables = [...(unit.ninju.pendingConsumables || []), type];
    setMessage(`${unit.name} 已排入${itemLabel(type)}。`);
    return;
  }
  if (unit.consumableUse) {
    removeInventoryItem(unit, type, 1, slotIndex);
    syncRoomInventoryFromPlayerUnit(unit);
    unit.consumableUse.queue = [...(unit.consumableUse.queue || []), type];
    setMessage(`${unit.name} 已排入${itemLabel(type)}。`);
    return;
  }
  removeInventoryItem(unit, type, 1, slotIndex);
  syncRoomInventoryFromPlayerUnit(unit);
  executeConsumableItem(unit, type, now, []);
}

function executeConsumableItem(unit, type, now, queue = [], chainMoves = ninjuFollowupMoveAllowance, pendingNinjutsu = []) {
  restoreConsumableSkill(unit);
  if (type === "sake4") {
    applySake4MoveSkillFree(unit, now);
  }
  applyConsumableUseDefault(unit, now);
  startConsumableUseEffect(unit, now);
  unit.consumableUse = { phase: "active", type, startedAt: now, duration: defaultConsumableDisableMs, queue, chainMoves, pendingNinjutsu };
  playSound("spUp");
  if (type === "sake4") {
    setMessage(`${unit.name} 使用神酒，技量已回滿，15 秒內移動不消耗技。`);
  } else {
    setMessage(`${unit.name} 使用神水，技量已回滿。`);
  }
}

function useBackupItem(slotIndex = -1) {
  const unit = selectedUnit();
  requestConsumableUse(unit, "backup3", slotIndex);
}

function useSakeItem(slotIndex = -1) {
  const unit = selectedUnit();
  requestConsumableUse(unit, "sake4", slotIndex);
}

function useItemSlot(index) {
  const unit = selectedUnit();
  const itemType = unit?.itemSlots?.[index] || "";
  if (itemType === "backup3") {
    useBackupItem(index);
    return;
  }
  if (itemType === "sake4") {
    useSakeItem(index);
    return;
  }
  setMessage("該道具欄沒有道具。");
}

globalThis.NindouConsumables = {
  itemLabel,
  isImplementedConsumable,
  itemCountsFromSlots,
  firstEmptyItemSlot,
  setUnitInventorySlots,
  addInventoryItem,
  removeInventoryItem,
  addGold,
  applyConsumableUseDefault,
  restoreConsumableSkill,
  applySake4MoveSkillFree,
  runConsumableHelperProbe() {
    const unit = {
      id: "blue1",
      name: "青1",
      controlMode: "player",
      alive: true,
      skill: 0,
      skillMax: 18,
      gold: 0,
      itemSlots: ["backup3", "sake4"],
      items: { backup3: 1, sake4: 1 },
    };
    const effects = [];
    const localStartConsumableUseEffect = (target, now, type = "regen_sp") => {
      for (let index = effects.length - 1; index >= 0; index--) {
        const effect = effects[index];
        if (effect.unitId === target.id && effect.type === type) effects.splice(index, 1);
      }
      effects.push({
        unitId: target.id,
        type,
        startedAt: now,
        duration: defaultConsumableDisableMs,
      });
    };
    addInventoryItem(unit, "backup3", 1);
    removeInventoryItem(unit, "backup3", 1, 0);
    addGold(unit, 2);
    setUnitInventorySlots(unit, ["sake4", "backup3", "backup3"]);
    applyConsumableUseDefault(unit, 1000);
    localStartConsumableUseEffect(unit, 1000);
    return {
      labels: ["backup3", "sake4", "x"].map(itemLabel),
      implemented: ["backup3", "sake4", "x"].map(isImplementedConsumable),
      counts: itemCountsFromSlots(["backup3", "", "backup3", "sake4"]),
      firstEmpty: firstEmptyItemSlot(["backup3", "", "sake4"]),
      unit: {
        gold: unit.gold,
        skill: unit.skill,
        moveSkillFreeUntil: unit.moveSkillFreeUntil,
        buffAuraType: unit.buffAuraType,
        disabledUntil: unit.disabledUntil,
        invincibleUntil: unit.invincibleUntil,
        itemSlots: unit.itemSlots,
        items: unit.items,
        consumableUse: unit.consumableUse,
      },
      effects,
    };
  },
};
