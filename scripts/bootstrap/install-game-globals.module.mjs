const NINJU_LOADOUT_STORAGE_KEY = "nindou2.ninjuLoadout";
const ROOM_SKILL_INPUT_MAX = 9999;
const DEFAULT_ROOM_ITEM_SLOTS = [
  "backup3",
  "backup3",
  "backup3",
  "backup3",
  "backup3",
  "magicWater",
  "magicWater",
  "magicWater",
  "magicWater",
  "magicWater",
];

function query(target, selector) {
  return target.document?.querySelector?.(selector) || null;
}

function queryAll(target, selector) {
  return Array.from(target.document?.querySelectorAll?.(selector) || []);
}

function runtimeWindow(target) {
  return target.window || target;
}

function runtimeNow(target) {
  return target.performance?.now?.() ?? Date.now();
}

function savedNinjuLoadout(target) {
  const fallback = [...(target.defaultNinjuLoadout || [])];
  try {
    const raw = runtimeWindow(target).localStorage?.getItem?.(NINJU_LOADOUT_STORAGE_KEY);
    const parsed = JSON.parse(raw || "null");
    if (Array.isArray(parsed) && parsed.length === fallback.length) return parsed;
  } catch {
    // Keep defaults when browser storage is unavailable or corrupt.
  }
  return fallback;
}

export function installGameGlobals(target = globalThis) {
  const canvas = query(target, "#game");
  const ctx = canvas?.getContext?.("2d") || null;
  let selectedNinjuLoadout = savedNinjuLoadout(target);
  let editNinjuDraft = [...selectedNinjuLoadout];
  let editNinjuSlotIndex = 0;
  let drawLoopStarted = false;

  const state = {
    inRoom: true,
    roomMapKey: target.defaultRoomMapKey,
    units: [],
    selectedId: 1,
    pointer: { x: 0, y: 0, cell: null },
    pressedUnit: null,
    pressTime: 0,
    dragMoved: false,
    charging: false,
    message: "準備完成",
    gameOver: false,
    countdownStart: 0,
    matchStart: 0,
    matchEnd: 0,
    result: null,
    resultClickableAt: 0,
    startSoundPlayed: false,
    endSoundPlayed: false,
    endSoundInstance: null,
    pulse: 0,
    lastFrame: runtimeNow(target),
    projectiles: [],
    ninjuDamageEffects: [],
    consumableEffects: [],
    moneyDartCasts: [],
    cloneDecoys: [],
    ruleModeKey: "original",
    deathModeKey: "death_heal",
    roomItemSlots: [...DEFAULT_ROOM_ITEM_SLOTS],
    onRoomInventoryChanged: null,
  };

  function draw(frameNow = runtimeNow(target)) {
    try {
      const dt = Math.min(0.05, (frameNow - state.lastFrame) / 1000);
      state.lastFrame = frameNow;
      state.pulse += dt;
      target.updateMatchState?.(frameNow);
      if (target.isMatchActive?.()) {
        target.updateCharging?.(dt);
        target.updateConsumables?.(frameNow);
        target.updateNinju?.(frameNow);
        target.updateAi?.(dt, frameNow);
        target.updateProjectiles?.(frameNow);
      }
      target.updateRestartHold?.(frameNow);
      ctx?.clearRect?.(0, 0, canvas?.width || 0, canvas?.height || 0);
      target.drawBackdrop?.();
      target.drawBoard?.();
      target.drawMapMaskOverlay?.();
      target.drawDrag?.();
      target.drawMapObjects?.();
      target.drawMoveTrails?.(frameNow);
      target.drawUnits?.();
      target.drawNinjuEffects?.(frameNow);
      target.drawMoneyDartShootAnimations?.(frameNow);
      target.drawProjectiles?.(frameNow);
      target.drawAttacks?.();
      target.drawGameHud?.();
      target.drawNinjuBar?.();
      target.drawFrame?.();
      target.drawResultOverlay?.();
      target.updatePanel?.();
    } catch (error) {
      target.console?.error?.("Render loop recovered", error);
      state.moneyDartCasts = [];
      state.projectiles = [];
      state.ninjuDamageEffects = [];
      state.consumableEffects = [];
    } finally {
      if (drawLoopStarted) runtimeWindow(target).requestAnimationFrame?.(draw);
    }
  }

  function startDrawLoop() {
    if (drawLoopStarted) return false;
    drawLoopStarted = true;
    draw();
    return true;
  }

  target.NindouRuntimeState = {
    getState: () => state,
    getGrid: () => target.grid,
    getSelectedNinjuLoadout: () => selectedNinjuLoadout,
    setSelectedNinjuLoadout: (loadout) => {
      selectedNinjuLoadout = Array.isArray(loadout) ? [...loadout] : selectedNinjuLoadout;
    },
    getEditNinjuDraft: () => editNinjuDraft,
    setEditNinjuDraft: (draft) => {
      editNinjuDraft = Array.isArray(draft) ? [...draft] : editNinjuDraft;
    },
    getEditNinjuSlotIndex: () => editNinjuSlotIndex,
    setEditNinjuSlotIndex: (index) => {
      if (Number.isInteger(index)) editNinjuSlotIndex = index;
    },
  };

  Object.assign(target, {
    canvas,
    ctx,
    statusEl: query(target, "#status"),
    unitInfoEl: query(target, "#unitInfo"),
    skillFillEl: query(target, "#skillFill"),
    resetBtn: query(target, "#resetBtn"),
    battleStartBtn: query(target, "#battleStartBtn"),
    roomMapSelect: query(target, "#roomMapSelect"),
    musicVolumeInput: query(target, "#musicVolume"),
    sfxVolumeInput: query(target, "#sfxVolume"),
    ruleModeSelect: query(target, "#ruleModeSelect"),
    deathModeSelect: query(target, "#deathModeSelect"),
    teamEditBtn: query(target, "#teamEditBtn"),
    teamShopBtn: query(target, "#teamShopBtn"),
    roomShopEl: query(target, "#roomShop"),
    roomShopCloseBtn: query(target, "#roomShopClose"),
    roomShopItemEls: queryAll(target, ".room-shop-item"),
    roomShopBagSlotEls: queryAll(target, ".room-shop-bag > div"),
    ninjuEditorEl: query(target, "#ninjuEditor"),
    ninjuEditorSlotsEl: query(target, "#ninjuEditorSlots"),
    ninjuEditorListEl: query(target, "#ninjuEditorList"),
    ninjuEditorResetBtn: query(target, "#ninjuEditorReset"),
    ninjuEditorCancelBtn: query(target, "#ninjuEditorCancel"),
    ninjuEditorSaveBtn: query(target, "#ninjuEditorSave"),
    roomCardEls: queryAll(target, ".room-player-card"),
    weaponSelectEls: queryAll(target, ".room-weapon-select"),
    controlSelectEls: queryAll(target, ".room-control-select"),
    lookSelectEls: queryAll(target, ".room-look-select"),
    hpInputEls: queryAll(target, ".room-hp-input"),
    skillInputEls: queryAll(target, ".room-skill-input"),
    roomSkillInputMax: ROOM_SKILL_INPUT_MAX,
    state,
    draw,
    startDrawLoop,
  });

  target.NindouGame = {
    draw,
    startDrawLoop,
    state,
    roomSkillInputMax: ROOM_SKILL_INPUT_MAX,
  };
}
