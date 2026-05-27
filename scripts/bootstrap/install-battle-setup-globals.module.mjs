import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

const ROOM_SKILL_INPUT_MAX_FALLBACK = 9999;

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

function random(target) {
  return target.Math?.random?.() ?? Math.random();
}

function roomCardElements(target) {
  return Array.from(target.document?.querySelectorAll?.(".room-player-card") || []);
}

export function installBattleSetupGlobals(target = globalThis) {
  const roomSkillInputMax = Number.isFinite(target.roomSkillInputMax)
    ? target.roomSkillInputMax
    : ROOM_SKILL_INPUT_MAX_FALLBACK;

  const makeUnit = (
    id,
    name,
    team,
    x,
    y,
    weaponKey = target.defaultWeaponKey,
    controlMode = "ai_beginner",
    hpMax = target.maxHp,
    initialSkill = null,
    appearanceKey = "default",
  ) => {
    const aiNextThink = controlMode === "player" ? 0 : now(target) + 520 + random(target) * 500;
    const facing = controlMode === "ai_red" ? "down" : (team === "blue" ? "right" : "left");
    const defaultSkillMax = controlMode === "ai_tachi_master" ? target.tachiMasterSkillMax : target.maxSkill;
    const requestedSkill = Math.round(Number.isFinite(initialSkill) ? initialSkill : defaultSkillMax);
    const skillMax = Math.max(defaultSkillMax, target.clamp(requestedSkill, 0, roomSkillInputMax));
    const skill = target.clamp(requestedSkill, 0, skillMax);
    return {
      id,
      name,
      team,
      x,
      y,
      hp: hpMax,
      maxHp: hpMax,
      skill,
      skillMax,
      soulSteps: 0,
      gold: 0,
      items: {},
      itemSlots: [],
      facing,
      alive: true,
      moveT: 1,
      fromX: x,
      fromY: y,
      moveTrail: null,
      hitFlash: 0,
      respawning: false,
      respawnTipUntil: 0,
      aiNextThink,
      aiActionAt: 0,
      aiPlanKey: "",
      ninju: null,
      consumableUse: null,
      steelUntil: 0,
      hotBloodUntil: 0,
      buffAuraType: "",
      disabledUntil: 0,
      invincibleUntil: 0,
      moveSkillFreeUntil: 0,
      moneyDart: null,
      ninjuLockedUntil: 0,
      weaponKey,
      controlMode,
      weaponReadyAt: 0,
      kills: 0,
      damageDone: 0,
      damageTaken: 0,
      appearanceKey,
    };
  };

  const buildStartingUnits = () => {
    const units = [];
    let id = 1;
    const mapStartingDisplayCellsBySlot = target.currentRoomMapDefinition().startingDisplayCellsBySlot || null;
    const addTeam = (team, label) => {
      const activeSlots = roomCardElements(target)
        .filter((card) => card.classList.contains("active-slot") && card.dataset.team === team)
        .map((card) => Number(card.dataset.slot))
        .sort((a, b) => a - b);
      const fallbackCells = target.shuffledCellsInArea(target.startingAreas[team])
        .filter((cell) => !target.isBlockedCell(cell.x, cell.y) && !units.some((unit) => unit.x === cell.x && unit.y === cell.y));
      for (const slot of activeSlots) {
        const displayCell = mapStartingDisplayCellsBySlot?.[team]?.[slot];
        const fixedCell = displayCell ? target.internalCellCoord(displayCell) : null;
        const cell = fixedCell && !target.isBlockedCell(fixedCell.x, fixedCell.y) && !units.some((unit) => unit.x === fixedCell.x && unit.y === fixedCell.y)
          ? fixedCell
          : fallbackCells.find((candidate) => !units.some((unit) => unit.x === candidate.x && unit.y === candidate.y));
        if (!cell) continue;
        const controlMode = target.selectedControlMode(team, slot);
        const weaponKey = target.selectedWeaponKey(team, slot);
        const appearanceKey = target.selectedLookKey(team, slot);
        units.push(makeUnit(
          id,
          `${label}${slot}`,
          team,
          cell.x,
          cell.y,
          weaponKey,
          controlMode,
          target.selectedHpValue(team, slot),
          target.selectedSkillValue(team, slot),
          appearanceKey,
        ));
        id += 1;
      }
    };

    addTeam("blue", "青");
    addTeam("grey", "灰");
    return units;
  };

  const resetGame = () => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    const currentNow = now(target);
    const keepRoomState = state.inRoom;
    state.objects = target.buildMapObjects();
    state.units = buildStartingUnits();
    target.applyRoomInventoryToPlayerUnit();
    state.attacks = [];
    state.projectiles = [];
    state.ninjuDamageEffects = [];
    state.consumableEffects = [];
    state.moneyDartCasts = [];
    state.cloneDecoys = [];
    state.selectedId = 1;
    state.pressedUnit = null;
    state.dragMoved = false;
    state.charging = false;
    state.gameOver = false;
    state.countdownStart = 0;
    state.matchStart = currentNow;
    state.matchEnd = 0;
    state.result = null;
    state.resultClickableAt = 0;
    state.startSoundPlayed = true;
    state.endSoundPlayed = false;
    state.endSoundInstance = null;
    state.inRoom = keepRoomState;
    target.setMessage("開始。");
    target.updatePanel();
  };

  Object.assign(target, {
    resetGame,
    makeUnit,
    buildStartingUnits,
  });

  target.NindouBattleSetup = {
    resetGame,
    makeUnit,
    buildStartingUnits,
  };
}
