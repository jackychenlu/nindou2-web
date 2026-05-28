export const itemSlotCount = 10;
export const defaultConsumableDisableMs = 1500;
export const defaultConsumableInvincibleMs = 1500;
export const magicWaterConsumableEffectFrameCount = 40;
export const magicWaterConsumableEffectMs = defaultConsumableDisableMs;
export const magicWaterConsumableEffectFrameMs = magicWaterConsumableEffectMs / magicWaterConsumableEffectFrameCount;
export const sake4MoveSkillFreeMs = 15000;
export const consumableEffectDelayMs = defaultConsumableDisableMs;
export const ninjuChainMaxGap = 500;
export const ninjuFollowupMoveAllowance = 2;
export const defaultMaxSkill = 18;

export function itemLabel(type) {
  if (type === "backup3") return "神水";
  if (type === "sake4") return "神酒";
  if (type === "magicWater") return "魔水";
  return "道具";
}

export function isImplementedConsumable(type) {
  return type === "backup3" || type === "sake4" || type === "magicWater";
}

export function itemCountsFromSlots(slots) {
  return (slots || []).reduce((items, type) => {
    if (!type) return items;
    items[type] = (items[type] || 0) + 1;
    return items;
  }, {});
}

export function firstEmptyItemSlot(slots) {
  for (let index = 0; index < itemSlotCount; index++) {
    if (!slots?.[index]) return index;
  }
  return -1;
}

export function setUnitInventorySlots(unit, slots) {
  if (!unit) return;
  unit.itemSlots = [...(slots || [])].slice(0, itemSlotCount);
  unit.items = itemCountsFromSlots(unit.itemSlots);
}

export function roomInventoryUnit(stateLike, canControlUnit = (unit) => unit?.controlMode === "player") {
  return stateLike.units.find((unit) => canControlUnit(unit)) || stateLike.units[0] || null;
}

export function applyRoomInventoryToPlayerUnit(stateLike, canControlUnit) {
  setUnitInventorySlots(roomInventoryUnit(stateLike, canControlUnit), stateLike.roomItemSlots);
}

export function notifyRoomInventoryChanged(stateLike) {
  if (typeof stateLike.onRoomInventoryChanged === "function") {
    stateLike.onRoomInventoryChanged(stateLike.roomItemSlots);
  }
}

export function syncRoomInventoryFromPlayerUnit(stateLike, unit = roomInventoryUnit(stateLike)) {
  stateLike.roomItemSlots = [...(unit?.itemSlots || [])].slice(0, itemSlotCount);
  notifyRoomInventoryChanged(stateLike);
}

export function addInventoryItem(unit, type, amount = 1) {
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

export function removeInventoryItem(unit, type, amount = 1, slotIndex = -1) {
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

export function addGold(unit, amount = 1) {
  if (!unit) return false;
  unit.gold = Math.max(0, Math.floor(Number(unit.gold) || 0) + amount);
  return true;
}

export function maybeGrantMapItem(object, unit) {
	if (!object || !unit || !unit.alive) return false;
	if (Math.random() > mapItemDropChance) return false;
	if (mapGoldDropTypes.includes(object.type)) {
    addGold(unit, 1);
	playSound("getItem1");
    setMessage(`${unit.name} 撿到 1 金。`);
    return true;
  }
  if (!mapItemDropTypes.includes(object.type)) return false;
  const consumableTypes = Array.isArray(mapConsumableDropTypes) && mapConsumableDropTypes.length > 0
    ? mapConsumableDropTypes
    : ["backup3"];
  const itemType = consumableTypes[Math.floor(Math.random() * consumableTypes.length)] || "backup3";
  if (!addInventoryItem(unit, itemType, 1)) return false;
    // 1. 定義可選的音效清單
    const itemSounds = ["getItem2", "getItem2"];
    // 2. 隨機抽取其中一個
    const randomSound = itemSounds[Math.floor(Math.random() * itemSounds.length)];
    // 3. 播放隨機音效
    playSound(randomSound);
    setMessage(`${unit.name} 撿到備用術。`);
    return true;
  }

export function applyConsumableUseDefault(unit, now, options = {}) {
  const disableMs = options.defaultConsumableDisableMs ?? defaultConsumableDisableMs;
  const invincibleMs = options.defaultConsumableInvincibleMs ?? defaultConsumableInvincibleMs;
  unit.disabledUntil = Math.max(unit.disabledUntil || 0, now + disableMs);
  unit.invincibleUntil = Math.max(unit.invincibleUntil || 0, now + invincibleMs);
}

export function startConsumableUseEffect(stateLike, unit, now, type = "regen_sp", options = {}) {
  if (!unit) return;
  const disableMs = options.defaultConsumableDisableMs ?? defaultConsumableDisableMs;
  const frameDurationMs = type === "magic_water"
    ? (options.magicWaterConsumableEffectFrameMs ?? magicWaterConsumableEffectFrameMs)
    : undefined;
  const duration = type === "magic_water"
    ? (options.magicWaterConsumableEffectMs ?? (frameDurationMs * magicWaterConsumableEffectFrameCount))
    : disableMs;
  if (!stateLike.consumableEffects) stateLike.consumableEffects = [];
  stateLike.consumableEffects = stateLike.consumableEffects.filter((effect) => effect.unitId !== unit.id || effect.type !== type);
  stateLike.consumableEffects.push({
    unitId: unit.id,
    type,
    startedAt: now,
    duration,
    frameDurationMs,
  });
}

export function restoreConsumableSkill(unit, options = {}) {
  const maxSkill = options.maxSkill ?? defaultMaxSkill;
  const skillLimit = unit.skillMax || maxSkill;
  unit.skill = skillLimit;
}

export function applySake4MoveSkillFree(unit, now, options = {}) {
  const durationMs = options.sake4MoveSkillFreeMs ?? sake4MoveSkillFreeMs;
  unit.moveSkillFreeUntil = Math.max(unit.moveSkillFreeUntil || 0, now + durationMs);
  unit.buffAuraType = options.buffAuraType ?? "sake4";
  if (!unit.buffAuraVisibleAt || unit.buffAuraVisibleAt > now) {
    unit.buffAuraVisibleAt = now;
  }
}

export function applyMagicWaterBuff(unit, now, options = {}) {
  const durationMs = options.sake4MoveSkillFreeMs ?? sake4MoveSkillFreeMs;
  applySake4MoveSkillFree(unit, now, { ...options, buffAuraType: "magicWater" });
  unit.magicWaterUntil = Math.max(unit.magicWaterUntil || 0, now + durationMs);
}

function consumableEffectType(type) {
  return type === "magicWater" ? "magic_water" : "regen_sp";
}

export function makePendingConsumableEffect(type, now, options = {}) {
  return {
    type,
    applyAt: now + (options.consumableEffectDelayMs ?? consumableEffectDelayMs),
    applied: false,
    applyAfterNinjutsu: false,
  };
}

export function isPendingConsumableEffectReady(effect, now) {
  return Boolean(effect && !effect.applied && now >= effect.applyAt);
}

export function applyConsumableItemEffect(unit, type, now, callbacks = {}) {
  restoreConsumableSkill(unit, callbacks);
  if (type === "sake4") {
    applySake4MoveSkillFree(unit, now, callbacks);
  } else if (type === "magicWater") {
    applyMagicWaterBuff(unit, now, callbacks);
  }
  callbacks.setMessage?.(
    type === "sake4"
      ? `${unit.name} 使用神酒，技量已回滿，15 秒內移動不消耗技。`
      : type === "magicWater"
        ? `${unit.name} 使用魔水，技量已回滿，15 秒內移動不消耗技，攻擊與防禦變為 2 倍。`
        : `${unit.name} 使用神水，技量已回滿。`,
  );
}

export function applyPendingConsumableEffect(unit, effect, now, callbacks = {}) {
  if (!unit || !effect || effect.applied) return false;
  applyConsumableItemEffect(unit, effect.type, now, callbacks);
  effect.applied = true;
  return true;
}

function applyConsumableUsePendingEffect(unit, current, now, callbacks = {}) {
  if (!current?.pendingEffect || current.pendingEffect.applyAfterNinjutsu) return false;
  if (!isPendingConsumableEffectReady(current.pendingEffect, now)) return false;
  return applyPendingConsumableEffect(unit, current.pendingEffect, now, callbacks);
}

export function executeConsumableItem(stateLike, unit, type, now, queue = [], chainMoves = 0, pendingNinjutsu = [], callbacks = {}) {
  if (!Array.isArray(pendingNinjutsu)) {
    callbacks = pendingNinjutsu || {};
    pendingNinjutsu = [];
  }
  applyConsumableUseDefault(unit, now, callbacks);
  startConsumableUseEffect(stateLike, unit, now, consumableEffectType(type), callbacks);
  unit.consumableUse = {
    phase: "active",
    type,
    startedAt: now,
    duration: callbacks.defaultConsumableDisableMs ?? defaultConsumableDisableMs,
    queue,
    chainMoves,
    pendingNinjutsu,
    pendingEffect: makePendingConsumableEffect(type, now, callbacks),
  };
  callbacks.playSound?.("spUp");
  callbacks.setMessage?.(`${unit.name} 使用${itemLabel(type)}。`);
}

export function requestConsumableUse(stateLike, unit, type, slotIndex = -1, callbacks = {}) {
  const canControlUnit = callbacks.canControlUnit || ((target) => target?.controlMode === "player");
  const setMessage = callbacks.setMessage || (() => {});
  if (!unit || !canControlUnit(unit) || !unit.alive) {
    setMessage(`請選擇一名存活角色使用${itemLabel(type)}。`);
    return false;
  }
  if ((unit.items?.[type] || 0) <= 0) {
    setMessage(`${unit.name}：沒有${itemLabel(type)}。`);
    return false;
  }
  callbacks.playSound?.("clickItem");
  const now = callbacks.now ?? 0;
  if (unit.consumableUse) {
    removeInventoryItem(unit, type, 1, slotIndex);
    syncRoomInventoryFromPlayerUnit(stateLike, unit);
    unit.consumableUse.queue = [...(unit.consumableUse.queue || []), type];
    setMessage(`${unit.name} 已排入${itemLabel(type)}。`);
    return true;
  }
  removeInventoryItem(unit, type, 1, slotIndex);
  syncRoomInventoryFromPlayerUnit(stateLike, unit);
  executeConsumableItem(stateLike, unit, type, now, [], 0, [], callbacks);
  return true;
}

export function updateConsumables(stateLike, now, callbacks = {}) {
  const setMessage = callbacks.setMessage || (() => {});
  for (const unit of stateLike.units) {
    const current = unit.consumableUse;
    if (!current) continue;
    if (current.phase === "active") {
      applyConsumableUsePendingEffect(unit, current, now, callbacks);
      if (now - current.startedAt < current.duration) continue;
      if (current.pendingEffect && !current.pendingEffect.applied && !current.pendingEffect.applyAfterNinjutsu) {
        applyPendingConsumableEffect(unit, current.pendingEffect, now, callbacks);
      }
      if (current.queue?.length || current.pendingMoneyDart) {
        unit.consumableUse = {
          phase: "gap",
          startedAt: now,
          duration: callbacks.ninjuChainGap ?? callbacks.ninjuChainMaxGap ?? ninjuChainMaxGap,
          queue: current.queue || [],
          gapMoves: 0,
          pendingMoneyDart: current.pendingMoneyDart,
          pendingEffect: current.pendingEffect,
        };
        if (unit.id === callbacks.playerUnitId) setMessage(`${unit.name}：道具連用空檔中。`);
      } else {
        unit.consumableUse = null;
      }
      continue;
    }
    if (current.phase === "gap") {
      applyConsumableUsePendingEffect(unit, current, now, callbacks);
      const movedInGap = (current.gapMoves || 0) > 0;
      if (!movedInGap && now - current.startedAt < current.duration) continue;
      const [nextType, ...remainingQueue] = current.queue || [];
      if (!nextType) {
        if (current.pendingMoneyDart || current.nextType === "moneyDart") {
          unit.consumableUse = null;
          callbacks.startMoneyDart?.(unit, now, true);
          continue;
        }
        unit.consumableUse = null;
        continue;
      }
      executeConsumableItem(
        stateLike,
        unit,
        nextType,
        now,
        remainingQueue,
        movedInGap ? (callbacks.ninjuFollowupMoveAllowance ?? ninjuFollowupMoveAllowance) : 0,
        [],
        callbacks,
      );
      if (unit.id === callbacks.playerUnitId) setMessage(`${unit.name}：道具續接完成。`);
    }
  }
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeConsumableHelpers(legacy = {}) {
  const unit = {
    id: "blue1",
    name: "青1",
    controlMode: "player",
    alive: true,
    skill: 0,
    skillMax: 18,
    gold: 0,
    itemSlots: ["backup3", "sake4", "magicWater"],
    items: { backup3: 1, sake4: 1, magicWater: 1 },
  };
  const stateLike = { consumableEffects: [] };
  addInventoryItem(unit, "backup3", 1);
  removeInventoryItem(unit, "backup3", 1, 0);
  addGold(unit, 2);
  setUnitInventorySlots(unit, ["sake4", "backup3", "backup3", "magicWater"]);
  applyConsumableUseDefault(unit, 1000);
  applyMagicWaterBuff(unit, 1000);
  startConsumableUseEffect(stateLike, unit, 1000, consumableEffectType("magicWater"));
  const moduleResult = {
    labels: ["backup3", "sake4", "magicWater", "x"].map(itemLabel),
    implemented: ["backup3", "sake4", "magicWater", "x"].map(isImplementedConsumable),
    counts: itemCountsFromSlots(["backup3", "", "backup3", "sake4", "magicWater"]),
    firstEmpty: firstEmptyItemSlot(["backup3", "", "sake4", "magicWater"]),
    unit: {
      gold: unit.gold,
      skill: unit.skill,
      moveSkillFreeUntil: unit.moveSkillFreeUntil,
      magicWaterUntil: unit.magicWaterUntil,
      buffAuraType: unit.buffAuraType,
      buffAuraVisibleAt: unit.buffAuraVisibleAt,
      disabledUntil: unit.disabledUntil,
      invincibleUntil: unit.invincibleUntil,
      itemSlots: unit.itemSlots,
      items: unit.items,
      consumableUse: unit.consumableUse,
    },
    effects: stateLike.consumableEffects,
  };
  const legacyResult = legacy.runConsumableHelperProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: legacyResult ? stable(moduleResult) === stable(legacyResult) : true,
  };
}
