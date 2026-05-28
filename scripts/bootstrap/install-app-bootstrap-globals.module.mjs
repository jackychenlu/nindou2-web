import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function query(target, selector) {
  return target.document?.querySelector?.(selector) || null;
}

function queryAll(target, selector) {
  return Array.from(target.document?.querySelectorAll?.(selector) || []);
}

function runtimeWindow(target) {
  return target.window || target;
}

export function installAppBootstrapGlobals(target = globalThis) {
  let assetsReady = false;
  let assetLoadPromise = null;

  const areGameAssetsReady = () => assetsReady;

  const whenGameAssetsReady = () => {
    if (!assetLoadPromise) {
      assetLoadPromise = target.loadImages().then(() => {
        assetsReady = true;
        return true;
      });
    }
    return assetLoadPromise;
  };

  const bindGameEvents = () => {
    const canvas = query(target, "#game");
    const resetBtn = query(target, "#resetBtn");
    const battleStartBtn = query(target, "#battleStartBtn");
    const teamEditBtn = query(target, "#teamEditBtn");
    const teamShopBtn = query(target, "#teamShopBtn");
    const roomShopCloseBtn = query(target, "#roomShopClose");
    const ninjuEditorResetBtn = query(target, "#ninjuEditorReset");
    const ninjuEditorCancelBtn = query(target, "#ninjuEditorCancel");
    const ninjuEditorSaveBtn = query(target, "#ninjuEditorSave");
    const musicVolumeInput = query(target, "#musicVolume");
    const sfxVolumeInput = query(target, "#sfxVolume");
    const ruleModeSelect = query(target, "#ruleModeSelect");
    const deathModeSelect = query(target, "#deathModeSelect");
    const roomMapSelect = query(target, "#roomMapSelect");
    const win = runtimeWindow(target);

    canvas?.addEventListener("pointerdown", target.pointerDown);
    canvas?.addEventListener("pointermove", target.pointerMove);
    win.addEventListener?.("pointerup", target.pointerUp);
    win.addEventListener?.("keydown", target.startRestartHold);
    win.addEventListener?.("keyup", target.stopRestartHold);
    resetBtn?.addEventListener("click", target.resetGame);
    resetBtn?.addEventListener("click", target.startBgm);
    battleStartBtn?.addEventListener("click", target.startBattleFromRoom);
    teamEditBtn?.addEventListener("click", target.openNinjuEditor);
    teamShopBtn?.addEventListener("click", target.openRoomShop);
    roomShopCloseBtn?.addEventListener("click", target.closeRoomShop);
    queryAll(target, ".room-shop-item").forEach((itemEl) => {
      itemEl.addEventListener("click", () => target.purchaseShopItem(itemEl));
    });
    queryAll(target, ".room-shop-bag > div").forEach((slotEl, index) => {
      slotEl.addEventListener("click", () => target.removeRoomShopBagItem(index));
    });
    ninjuEditorResetBtn?.addEventListener("click", target.resetNinjuEditorLoadout);
    ninjuEditorCancelBtn?.addEventListener("click", target.closeNinjuEditor);
    ninjuEditorSaveBtn?.addEventListener("click", target.saveNinjuEditor);
    musicVolumeInput?.addEventListener("input", target.applyVolumeControls);
    sfxVolumeInput?.addEventListener("input", target.applyVolumeControls);
    ruleModeSelect?.addEventListener("change", (event) => target.setRuleMode(event.target.value));
    deathModeSelect?.addEventListener("change", (event) => {
      const state = resolveRuntimeState(target);
      if (state) state.deathModeKey = event.target.value || "death_heal";
      target.updateDeathModeUi?.();
    });
    roomMapSelect?.addEventListener("change", (event) => target.setRoomMap(event.target.value));
    win.addEventListener?.("keydown", target.startBgm, { once: true });
  };

  const setupRoomUi = () => {
    const state = resolveRuntimeState(target);
    target.setupRuleModeSelect?.();
    target.setupDeathModeSelect?.();
    target.setupWeaponSelects?.();
    target.setupControlSelects?.();
    target.setupHpInputs?.();
    target.setupSkillInputs?.();
    target.setupRoomSlots?.();
    if (state) state.onRoomInventoryChanged = target.renderRoomShopBag;
    target.applyRoomLanguage?.();
  };

  const startGameApp = () => {
    bindGameEvents();
    setupRoomUi();
    return whenGameAssetsReady().then(() => {
      const state = resolveRuntimeState(target);
      target.updateRuleModeUi?.();
      target.updateDeathModeUi?.();
      target.updateRoomMapUi?.();
      target.applyVolumeControls?.();
      if (state?.inRoom !== false) target.resetGame?.();
      target.startBgm?.();
      if (typeof target.startDrawLoop === "function") target.startDrawLoop();
      else target.draw?.();
    });
  };

  Object.assign(target, {
    bindGameEvents,
    setupRoomUi,
    startGameApp,
    areGameAssetsReady,
    whenGameAssetsReady,
  });

  target.NindouAppBootstrap = {
    bindGameEvents,
    setupRoomUi,
    startGameApp,
    areGameAssetsReady,
    whenGameAssetsReady,
  };
}
