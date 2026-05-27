// ===== Unit State Helpers =====
function clearDragState() {
  state.pressedUnit = null;
  state.dragMoved = false;
  state.charging = false;
}

function cancelDragIfPressed(unit) {
  if (state.pressedUnit !== unit) return;
  clearDragState();
}

function formatDamage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatMatchTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function selectedUnit() {
  return state.units.find((u) => u.id === state.selectedId && u.alive);
}

function canControlUnit(unit) {
  return unit?.controlMode === "player";
}

function selectedHudUnit() {
  return state.units.find((u) => u.id === state.selectedId) || selectedUnit();
}

// 計算指定隊伍目前還存活或等待重生的人數。
function teamAliveCount(team) {
  return state.units.filter((unit) => unit.team === team && (unit.alive || unit.respawning)).length;
}

function gainSoul(unit, steps) {
  if (!unit || !canControlUnit(unit)) return;
  const maxSteps = soulStepsPerLevel * soulMaxLevel;
  const before = unit.soulSteps || 0;
  const beforeLevel = Math.min(soulMaxLevel, Math.floor(before / soulStepsPerLevel));
  unit.soulSteps = Math.min(maxSteps, before + Math.max(0, steps));
  const afterLevel = Math.min(soulMaxLevel, Math.floor(unit.soulSteps / soulStepsPerLevel));
  if (afterLevel > beforeLevel) playSound(afterLevel >= soulMaxLevel ? "soulMax" : "soulLevelUp");
}

globalThis.NindouStateHelpers = {
  clearDragState,
  cancelDragIfPressed,
  formatDamage,
  formatMatchTime,
  pointInRect,
  selectedUnit,
  canControlUnit,
  selectedHudUnit,
  teamAliveCount,
  gainSoul,
  runStateHelperProbe(probeState, probePlaySound) {
    const soundKeys = [];
    const localClearDragState = () => {
      probeState.pressedUnit = null;
      probeState.dragMoved = false;
      probeState.charging = false;
    };
    const localCancelDragIfPressed = (unit) => {
      if (probeState.pressedUnit !== unit) return;
      localClearDragState();
    };
    const localSelectedUnit = () => probeState.units.find((unit) => unit.id === probeState.selectedId && unit.alive);
    const localSelectedHudUnit = () => probeState.units.find((unit) => unit.id === probeState.selectedId) || localSelectedUnit();
    const localTeamAliveCount = (team) => probeState.units.filter((unit) => unit.team === team && (unit.alive || unit.respawning)).length;
    const localGainSoul = (unit, steps) => {
      if (!unit || !canControlUnit(unit)) return;
      const maxSteps = soulStepsPerLevel * soulMaxLevel;
      const before = unit.soulSteps || 0;
      const beforeLevel = Math.min(soulMaxLevel, Math.floor(before / soulStepsPerLevel));
      unit.soulSteps = Math.min(maxSteps, before + Math.max(0, steps));
      const afterLevel = Math.min(soulMaxLevel, Math.floor(unit.soulSteps / soulStepsPerLevel));
      if (afterLevel > beforeLevel) {
        const key = afterLevel >= soulMaxLevel ? "soulMax" : "soulLevelUp";
        soundKeys.push(key);
        probePlaySound?.(key);
      }
    };

    probeState.pressedUnit = probeState.units[0];
    localCancelDragIfPressed(probeState.units[0]);
    localGainSoul(probeState.units[0], 2);
    return {
      pressedUnit: probeState.pressedUnit,
      dragMoved: probeState.dragMoved,
      charging: probeState.charging,
      selectedId: localSelectedUnit()?.id,
      selectedHudId: localSelectedHudUnit()?.id,
      blueAlive: localTeamAliveCount("blue"),
      greyAlive: localTeamAliveCount("grey"),
      canControlPlayer: canControlUnit(probeState.units[0]),
      canControlAi: canControlUnit(probeState.units[1]),
      damageInt: formatDamage(10),
      damageFloat: formatDamage(10.25),
      matchTime: formatMatchTime(65000),
      pointInside: pointInRect(5, 5, { x: 4, y: 4, w: 2, h: 2 }),
      pointOutside: pointInRect(7, 7, { x: 4, y: 4, w: 2, h: 2 }),
      soulSteps: probeState.units[0].soulSteps,
      soundKeys,
    }
  },
};
