import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

const NINJU_LOADOUT_STORAGE_KEY = "nindou2.ninjuLoadout";
const ROOM_SKILL_INPUT_MAX = 9999;
const TEAM_DEFAULT_LOOK_KEY = "__team_default__";

function query(target, selector) {
  return target.document?.querySelector?.(selector) || null;
}

function queryAll(target, selector) {
  return Array.from(target.document?.querySelectorAll?.(selector) || []);
}

function runtimeWindow(target) {
  return target.window || target;
}

function roomState(target) {
  return resolveRuntimeState(target) || {};
}

function bridge(target) {
  const value = target.NindouRuntimeState;
  return value && typeof value === "object" ? value : {};
}

function selectedLoadout(target) {
  const runtimeBridge = bridge(target);
  const value = runtimeBridge.getSelectedNinjuLoadout?.();
  return Array.isArray(value) ? value : [...(target.defaultNinjuLoadout || [])];
}

function setSelectedLoadout(target, loadout) {
  const runtimeBridge = bridge(target);
  runtimeBridge.setSelectedNinjuLoadout?.(loadout);
}

function editDraft(target) {
  const runtimeBridge = bridge(target);
  const value = runtimeBridge.getEditNinjuDraft?.();
  return Array.isArray(value) ? value : [...selectedLoadout(target)];
}

function setEditDraft(target, draft) {
  const runtimeBridge = bridge(target);
  runtimeBridge.setEditNinjuDraft?.(draft);
}

function editSlotIndex(target) {
  const runtimeBridge = bridge(target);
  const value = runtimeBridge.getEditNinjuSlotIndex?.();
  return Number.isInteger(value) ? value : 0;
}

function setEditSlotIndex(target, index) {
  const runtimeBridge = bridge(target);
  runtimeBridge.setEditNinjuSlotIndex?.(index);
}

function roomCards(target) {
  return queryAll(target, ".room-player-card");
}

function weaponSelects(target) {
  return queryAll(target, ".room-weapon-select");
}

function controlSelects(target) {
  return queryAll(target, ".room-control-select");
}

function lookSelects(target) {
  return queryAll(target, ".room-look-select");
}

function hpInputs(target) {
  return queryAll(target, ".room-hp-input");
}

function skillInputs(target) {
  return queryAll(target, ".room-skill-input");
}

function scopedControl(target, team, slot) {
  return controlSelects(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
}

function scopedWeapon(target, team, slot) {
  return weaponSelects(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
}

function scopedLook(target, team, slot) {
  return lookSelects(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
}

function localStorageFor(target) {
  return runtimeWindow(target).localStorage;
}

export function installRoomUiGlobals(target = globalThis) {
  const selectedLookKey = (team, slot) => {
    if (selectedControlMode(team, slot) === "ai_red") return "red";
    const value = scopedLook(target, team, slot)?.value;
    if (target.lookDefinitions?.[value]) return value;
    return team === "blue" ? "default" : TEAM_DEFAULT_LOOK_KEY;
  };

  const setupWeaponSelects = () => {
    const selects = weaponSelects(target);
    if (selects.length === 0) return;
    const optionsHtml = (target.weaponDefinitions || []).map((weapon) => (
      `<option value="${weapon.key}"${weapon.key === target.defaultWeaponKey ? " selected" : ""}>${target.localizedWeaponLabel(weapon)}</option>`
    )).join("");
    selects.forEach((select) => {
      const previousValue = select.value || target.defaultWeaponKey;
      select.innerHTML = optionsHtml;
      if (target.weaponDefinitionByKey?.[previousValue]) select.value = previousValue;
      if (!target.weaponDefinitionByKey?.[select.value]) select.value = target.defaultWeaponKey;
    });
  };

  const updateRoomLookCard = (team, slot) => {
    const card = roomCards(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
    if (!card) return;
    const lookKey = selectedLookKey(team, slot);
    const look = lookKey === TEAM_DEFAULT_LOOK_KEY
      ? target.baseLookDefinitionForTeam(team)
      : target.lookDefinitionByKey(lookKey);
    const avatarEl = card.querySelector(".room-avatar");
    const eyeEl = card.querySelector(".room-avatar-eye");
    if (avatarEl) avatarEl.src = look.roomAvatarSrc;
    if (eyeEl) {
      if (look.roomAvatarEyeSrc) {
        eyeEl.src = look.roomAvatarEyeSrc;
        eyeEl.style.display = "";
      } else {
        eyeEl.style.display = "none";
      }
    }
  };

  const updateAllRoomLookCards = () => {
    roomCards(target).forEach((card) => updateRoomLookCard(card.dataset.team, Number(card.dataset.slot)));
  };

  const setupLookSelects = () => {
    const selects = lookSelects(target);
    if (selects.length === 0) return;
    const defaultLabel = target.roomLocaleText?.defaultLookOption || target.roomLocale?.()?.defaultLookOption || "預設外觀";
    selects.forEach((select) => {
      const team = select.dataset.team;
      const optionsHtml = [
        ...(team === "blue" ? [] : [`<option value="${TEAM_DEFAULT_LOOK_KEY}">${defaultLabel}</option>`]),
        ...Object.entries(target.lookDefinitions || {}).filter(([key]) => !(team !== "blue" && key === "default")).map(([key, look]) => {
          const label = target.roomLocaleText?.[look.labelKey] || look.label || key;
          return `<option value="${key}">${label}</option>`;
        }),
      ].join("");
      const previousValue = select.value || (team === "blue" ? "default" : TEAM_DEFAULT_LOOK_KEY);
      select.innerHTML = optionsHtml;
      const fallbackValue = team === "blue" ? "default" : TEAM_DEFAULT_LOOK_KEY;
      select.value = previousValue === TEAM_DEFAULT_LOOK_KEY || target.lookDefinitions?.[previousValue]
        ? previousValue
        : fallbackValue;
      select.onchange = () => updateRoomLookCard(select.dataset.team, Number(select.dataset.slot));
    });
  };

  const setupControlSelects = () => {
    const selects = controlSelects(target);
    if (selects.length === 0) return;
    const modes = [
      "player",
      "ai_beginner",
      "ai_red",
      "ai_tachi_master",
      "ai_money_dart_master",
      "ai_dart_only_master",
      "ai_god",
    ];
    const optionsHtml = modes.map((mode) => `<option value="${mode}">${target.localizedControlModeLabel(mode)}</option>`).join("");
    selects.forEach((select) => {
      const current = select.value;
      select.innerHTML = optionsHtml;
      if (current) select.value = current;
      if (!current) select.value = select.dataset.team === "grey" ? "player" : "ai_red";
      if (select.value === "ai") select.value = "ai_beginner";
      if (!modes.includes(select.value)) select.value = "player";
      select.onchange = () => updateRoomLookCard(select.dataset.team, Number(select.dataset.slot));
    });
  };

  const setupHpInputs = () => {
    hpInputs(target).forEach((input) => {
      if (!input.value) input.value = String(target.maxHp);
      const fixValue = () => {
        input.value = String(target.clamp(Math.round(Number(input.value) || target.maxHp), 1, ROOM_SKILL_INPUT_MAX));
      };
      fixValue();
      input.addEventListener("change", fixValue);
    });
  };

  const setupSkillInputs = () => {
    skillInputs(target).forEach((input) => {
      if (!input.value) input.value = String(target.maxSkill);
      const fixValue = () => {
        input.value = String(target.clamp(Math.round(Number(input.value) || 0), 0, ROOM_SKILL_INPUT_MAX));
      };
      fixValue();
      input.addEventListener("change", fixValue);
    });
  };

  const setupRoomSlots = () => {
    roomCards(target).forEach((card) => {
      const team = card.dataset.team;
      const slot = Number(card.dataset.slot);
      const addBtn = card.querySelector(".room-slot-add");
      const removeBtn = card.querySelector(".room-slot-remove");
      const nameEl = card.querySelector(".room-name");
      const controlEl = card.querySelector(".room-control-select");
      addBtn?.addEventListener("click", () => {
        card.classList.add("active-slot");
        if (nameEl) nameEl.textContent = `${team === "blue" ? "青" : "灰"}${slot}`;
        if (controlEl) controlEl.value = team === "grey" ? "player" : "ai_red";
      });
      removeBtn?.addEventListener("click", () => {
        if (slot !== 1) card.classList.remove("active-slot");
      });
    });
  };

  const selectedControlMode = (team, slot) => {
    const value = scopedControl(target, team, slot)?.value;
    if (value === "player") return "player";
    if (value === "ai_red") return "ai_red";
    if (value === "ai_tachi_master") return "ai_tachi_master";
    if (value === "ai_money_dart_master") return "ai_money_dart_master";
    if (value === "ai_dart_only_master") return "ai_dart_only_master";
    if (value === "ai_god") return "ai_god";
    return "ai_beginner";
  };

  const selectedWeaponKey = (team, slot) => {
    const controlMode = selectedControlMode(team, slot);
    if (controlMode === "ai_red") return "weapon8";
    if (controlMode === "ai_tachi_master") return "weapon3";
    const value = scopedWeapon(target, team, slot)?.value;
    return target.weaponDefinitionByKey?.[value] ? value : target.defaultWeaponKey;
  };

  const selectedHpValue = (team, slot) => {
    const value = Number(hpInputs(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot)?.value);
    if (!Number.isFinite(value)) return target.maxHp;
    return target.clamp(Math.round(value), 1, ROOM_SKILL_INPUT_MAX);
  };

  const selectedSkillValue = (team, slot) => {
    const value = Number(skillInputs(target).find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot)?.value);
    if (!Number.isFinite(value)) return target.maxSkill;
    return target.clamp(Math.round(value), 0, ROOM_SKILL_INPUT_MAX);
  };

  const setupRuleModeSelect = () => {
    const select = query(target, "#ruleModeSelect");
    if (!select) return;
    const state = roomState(target);
    const current = state.ruleModeKey || "original";
    select.innerHTML = `
      <option value="original">${target.localizedRuleModeLabel("original")}</option>
      <option value="modified">${target.localizedRuleModeLabel("modified")}</option>
    `;
    select.value = current;
    if (select.value !== current) select.value = "original";
    select.setAttribute("aria-label", target.localizedRuleModeLabel(select.value));
  };

  const setupDeathModeSelect = () => {
    const select = query(target, "#deathModeSelect");
    if (!select) return;
    const state = roomState(target);
    const current = state.deathModeKey || "death_heal";
    select.innerHTML = `
      <option value="death_command">${target.localizedDeathModeLabel("death_command")}</option>
      <option value="death_heal">${target.localizedDeathModeLabel("death_heal")}</option>
    `;
    select.value = current;
    if (select.value !== current) select.value = "death_heal";
    select.setAttribute("aria-label", target.localizedDeathModeLabel(select.value));
  };

  const updateRuleModeUi = () => {
    const select = query(target, "#ruleModeSelect");
    if (!select) return;
    const state = roomState(target);
    select.value = state.ruleModeKey || "original";
    if (select.value !== (state.ruleModeKey || "original")) select.value = "original";
    select.setAttribute("aria-label", target.localizedRuleModeLabel(select.value));
  };

  const updateDeathModeUi = () => {
    const select = query(target, "#deathModeSelect");
    if (!select) return;
    const state = roomState(target);
    select.value = state.deathModeKey || "death_heal";
    if (select.value !== (state.deathModeKey || "death_heal")) select.value = "death_heal";
    select.setAttribute("aria-label", target.localizedDeathModeLabel(select.value));
  };

  const roomMapOptionLabel = (mapDefinition, key) => mapDefinition.label || key;

  const updateRoomMapUi = () => {
    const select = query(target, "#roomMapSelect");
    if (!select) return;
    const state = roomState(target);
    select.value = state.roomMapKey || target.defaultRoomMapKey;
    if (select.value !== (state.roomMapKey || target.defaultRoomMapKey)) select.value = target.defaultRoomMapKey;
    state.roomMapKey = select.value;
    select.setAttribute("aria-label", target.roomLocale().mapSelect);
  };

  const setupRoomMapSelect = () => {
    const select = query(target, "#roomMapSelect");
    if (!select) return;
    const state = roomState(target);
    const previousValue = select.value || state.roomMapKey || target.defaultRoomMapKey;
    select.innerHTML = target.roomMapDefinitionEntries().map(([key, mapDefinition]) => {
      const selected = key === previousValue ? " selected" : "";
      return `<option value="${key}"${selected}>${roomMapOptionLabel(mapDefinition, key)}</option>`;
    }).join("");
    select.value = target.roomMapDefinitions?.[previousValue] ? previousValue : target.defaultRoomMapKey;
    updateRoomMapUi();
  };

  const renderRoomShopBag = () => {
    const state = roomState(target);
    queryAll(target, ".room-shop-bag > div").forEach((slotEl, index) => {
      const itemType = state.roomItemSlots?.[index] || "";
      delete slotEl.dataset.shopItem;
      slotEl.replaceChildren?.();
      if (!itemType) return;
      const src = target.itemIconSourceByType(itemType);
      if (!src) return;
      slotEl.dataset.shopItem = itemType;
      const img = target.document.createElement("img");
      img.src = src;
      img.alt = "";
      slotEl.appendChild(img);
    });
  };

  const closeNinjuEditor = () => {
    const editor = query(target, "#ninjuEditor");
    if (editor) editor.hidden = true;
  };

  const closeRoomShop = () => {
    const shop = query(target, "#roomShop");
    if (shop) shop.hidden = true;
  };

  const openRoomShop = () => {
    const shop = query(target, "#roomShop");
    if (!shop) return;
    closeNinjuEditor();
    renderRoomShopBag();
    shop.hidden = false;
  };

  const normalizedNinjuLoadout = (loadout) => Array.from(
    { length: 6 },
    (_, index) => (target.ninjuByType?.[loadout?.[index]] ? loadout[index] : null),
  );

  const loadSavedNinjuLoadout = () => {
    try {
      const saved = JSON.parse(localStorageFor(target)?.getItem(NINJU_LOADOUT_STORAGE_KEY) || "null");
      if (Array.isArray(saved) && saved.length === 6 && saved.every((type) => !type || target.ninjuByType?.[type])) {
        return normalizedNinjuLoadout(saved);
      }
    } catch (_) {
      // Broken localStorage data falls back to default slots.
    }
    return [...(target.defaultNinjuLoadout || [])];
  };

  const renderNinjuEditor = () => {
    const slotsEl = query(target, "#ninjuEditorSlots");
    const listEl = query(target, "#ninjuEditorList");
    if (!slotsEl || !listEl) return;
    const draft = editDraft(target);
    const activeIndex = editSlotIndex(target);
    slotsEl.innerHTML = "";
    for (let i = 0; i < 6; i += 1) {
      const type = draft[i];
      const ninju = target.ninjuByType?.[type] || { label: target.roomLocale().emptySlot, editorRow: "" };
      const button = target.document.createElement("button");
      button.type = "button";
      button.className = `ninju-slot-choice${i === activeIndex ? " selected" : ""}${type ? "" : " empty"}`;
      if (type) button.dataset.ninjuType = type;
      if (ninju.editorRow) button.dataset.editorRow = ninju.editorRow;
      button.textContent = target.localizedNinjuLabel(ninju);
      button.style.fontSize = `${target.localizedNinjuFontSize(18)}px`;
      button.addEventListener("click", () => {
        const nextDraft = editDraft(target);
        nextDraft[i] = null;
        setEditDraft(target, nextDraft);
        setEditSlotIndex(target, i);
        renderNinjuEditor();
      });
      slotsEl.appendChild(button);
    }

    listEl.innerHTML = "";
    for (const ninju of target.ninjuEditorCatalog || []) {
      const currentDraft = editDraft(target);
      const button = target.document.createElement("button");
      button.type = "button";
      button.className = `ninju-option ${ninju.group}${currentDraft.includes(ninju.type) ? " selected" : ""}`;
      button.dataset.ninjuType = ninju.type;
      button.dataset.editorRow = ninju.editorRow;
      button.style.setProperty("--editor-order", ninju.editorOrder);
      button.textContent = target.localizedNinjuLabel(ninju);
      button.style.fontSize = `${target.localizedNinjuFontSize(18)}px`;
      button.addEventListener("click", () => {
        const nextDraft = editDraft(target);
        const existingIndex = nextDraft.indexOf(ninju.type);
        if (existingIndex >= 0) nextDraft[existingIndex] = null;
        const emptyIndex = nextDraft.findIndex((type) => !type);
        if (emptyIndex < 0) return;
        nextDraft[emptyIndex] = ninju.type;
        const nextEmptyIndex = nextDraft.findIndex((type) => !type);
        setEditDraft(target, nextDraft);
        setEditSlotIndex(target, nextEmptyIndex >= 0 ? nextEmptyIndex : emptyIndex);
        renderNinjuEditor();
      });
      listEl.appendChild(button);
    }
  };

  const openNinjuEditor = () => {
    const editor = query(target, "#ninjuEditor");
    if (!editor) return;
    closeRoomShop();
    setEditDraft(target, [...selectedLoadout(target)]);
    setEditSlotIndex(target, 0);
    renderNinjuEditor();
    editor.hidden = false;
  };

  const resetNinjuEditorLoadout = () => {
    setEditDraft(target, Array(6).fill(null));
    setEditSlotIndex(target, 0);
    renderNinjuEditor();
  };

  const saveNinjuEditor = () => {
    const nextLoadout = normalizedNinjuLoadout(editDraft(target));
    setSelectedLoadout(target, nextLoadout);
    localStorageFor(target)?.setItem(NINJU_LOADOUT_STORAGE_KEY, JSON.stringify(nextLoadout));
    closeNinjuEditor();
  };

  const purchaseShopItem = (itemEl) => {
    if (!itemEl) return;
    const state = roomState(target);
    const itemType = itemEl.dataset.shopItem || "";
    if (!target.isImplementedConsumable(itemType)) return;
    const slotIndex = target.firstEmptyItemSlot(state.roomItemSlots);
    if (slotIndex < 0) {
      target.setMessage("道具欄已滿。");
      return;
    }
    state.roomItemSlots[slotIndex] = itemType;
    target.applyRoomInventoryToPlayerUnit();
    target.notifyRoomInventoryChanged();
    target.playSound("shopMoveItem");
    target.setMessage(`購買${target.itemLabel(itemType)}。`);
  };

  const removeRoomShopBagItem = (index) => {
    const state = roomState(target);
    const itemType = state.roomItemSlots?.[index] || "";
    if (!itemType) return;
    state.roomItemSlots[index] = "";
    target.applyRoomInventoryToPlayerUnit();
    target.notifyRoomInventoryChanged();
    target.playSound("shopMoveItem");
    target.setMessage(`移除${target.itemLabel(itemType)}。`);
  };

  const applyRoomLanguage = () => {
    const text = target.roomLocale();
    target.document.documentElement.lang = text.htmlLang;
    query(target, "#roomScreen")?.setAttribute("aria-label", text.roomScreen);
    query(target, ".room-leave-btn")?.setAttribute("aria-label", text.leave);
    query(target, ".team-tabs")?.setAttribute("aria-label", text.teams);
    const editBtn = query(target, "#teamEditBtn");
    const shopBtn = query(target, "#teamShopBtn");
    if (editBtn) {
      editBtn.textContent = text.edit;
      editBtn.setAttribute("aria-label", text.editNinjutsu);
    }
    if (shopBtn) {
      shopBtn.textContent = text.shop;
      shopBtn.setAttribute("aria-label", text.shopAria);
    }
    const battleStartImgEl = query(target, "#battleStartBtn img");
    query(target, "#battleStartBtn")?.setAttribute("aria-label", text.startBattle);
    if (battleStartImgEl) battleStartImgEl.alt = text.startBattle;
    setupRuleModeSelect();
    setupDeathModeSelect();
    setupRoomMapSelect();
    setupWeaponSelects();
    setupLookSelects();
    setupControlSelects();
    roomCards(target).forEach((card) => {
      const team = card.dataset.team;
      const slot = Number(card.dataset.slot);
      card.querySelector(".room-slot-add")?.setAttribute("aria-label", text.add);
      card.querySelector(".room-slot-remove")?.setAttribute("aria-label", text.remove);
      card.querySelector(".room-hp-input")?.setAttribute("aria-label", `${target.roomTeamLabel(team)} ${slot} ${text.hp}`);
      card.querySelector(".room-skill-input")?.setAttribute("aria-label", `${target.roomTeamLabel(team)} ${slot} ${text.skillBadge}`);
      card.querySelector(".room-look-select")?.setAttribute("aria-label", `${target.roomTeamLabel(team)} ${slot} ${text.lookTab || "外觀"}`);
      card.querySelector(".room-control-select")?.setAttribute("aria-label", `${target.roomTeamLabel(team)} ${slot} ${text.control}`);
      card.querySelector(".room-weapon-select")?.setAttribute("aria-label", `${target.roomTeamLabel(team)} ${slot} ${text.weapon}`);
    });
    updateAllRoomLookCards();
    if (!query(target, "#ninjuEditor")?.hidden) renderNinjuEditor();
  };

  Object.assign(target, {
    applyRoomLanguage,
    setupWeaponSelects,
    setupLookSelects,
    setupControlSelects,
    setupHpInputs,
    setupSkillInputs,
    setupRoomSlots,
    selectedWeaponKey,
    selectedControlMode,
    selectedHpValue,
    selectedSkillValue,
    setupRuleModeSelect,
    setupDeathModeSelect,
    selectedLookKey,
    updateRoomLookCard,
    updateAllRoomLookCards,
    updateRuleModeUi,
    updateDeathModeUi,
    updateRoomMapUi,
    roomMapOptionLabel,
    setupRoomMapSelect,
    openNinjuEditor,
    closeNinjuEditor,
    openRoomShop,
    closeRoomShop,
    renderRoomShopBag,
    purchaseShopItem,
    removeRoomShopBagItem,
    saveNinjuEditor,
    loadSavedNinjuLoadout,
    normalizedNinjuLoadout,
    resetNinjuEditorLoadout,
    renderNinjuEditor,
  });

  target.NindouRoomUi = {
    selectedWeaponKey,
    selectedControlMode,
    selectedHpValue,
    selectedSkillValue,
    loadSavedNinjuLoadout,
    normalizedNinjuLoadout,
    renderNinjuEditor,
    renderRoomShopBag,
  };
}
