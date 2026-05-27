export const defaultSoulStepsPerLevel = 27;
export const defaultSoulMaxLevel = 4;

export function clearDragState(stateLike) {
  stateLike.pressedUnit = null;
  stateLike.dragMoved = false;
  stateLike.charging = false;
}

export function cancelDragIfPressed(stateLike, unit) {
  if (stateLike.pressedUnit !== unit) return;
  clearDragState(stateLike);
}

export function formatDamage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatMatchTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function selectedUnit(stateLike) {
  return stateLike.units.find((unit) => unit.id === stateLike.selectedId && unit.alive);
}

export function canControlUnit(unit) {
  return unit?.controlMode === "player";
}

export function selectedHudUnit(stateLike) {
  return stateLike.units.find((unit) => unit.id === stateLike.selectedId) || selectedUnit(stateLike);
}

export function teamAliveCount(stateLike, team) {
  return stateLike.units.filter((unit) => unit.team === team && (unit.alive || unit.respawning)).length;
}

export function gainSoul(unit, steps, options = {}) {
  if (!unit || !canControlUnit(unit)) return;
  const soulStepsPerLevel = options.soulStepsPerLevel ?? defaultSoulStepsPerLevel;
  const soulMaxLevel = options.soulMaxLevel ?? defaultSoulMaxLevel;
  const playSound = options.playSound || (() => null);
  const maxSteps = soulStepsPerLevel * soulMaxLevel;
  const before = unit.soulSteps || 0;
  const beforeLevel = Math.min(soulMaxLevel, Math.floor(before / soulStepsPerLevel));
  unit.soulSteps = Math.min(maxSteps, before + Math.max(0, steps));
  const afterLevel = Math.min(soulMaxLevel, Math.floor(unit.soulSteps / soulStepsPerLevel));
  if (afterLevel > beforeLevel) playSound(afterLevel >= soulMaxLevel ? "soulMax" : "soulLevelUp");
}

function cloneState(stateLike) {
  return {
    ...stateLike,
    units: (stateLike.units || []).map((unit) => ({ ...unit })),
  };
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeStateHelpers(legacy = {}) {
  const sampleState = {
    selectedId: "blue1",
    pressedUnit: null,
    dragMoved: true,
    charging: true,
    units: [
      { id: "blue1", team: "blue", alive: true, respawning: false, controlMode: "player", soulSteps: 26 },
      { id: "blue2", team: "blue", alive: false, respawning: true, controlMode: "ai_red", soulSteps: 0 },
      { id: "grey1", team: "grey", alive: false, respawning: false, controlMode: "player", soulSteps: 0 },
    ],
  };
  const moduleState = cloneState(sampleState);
  const legacyState = cloneState(sampleState);
  const soundKeys = [];
  const legacySoundKeys = [];
  moduleState.pressedUnit = moduleState.units[0];
  cancelDragIfPressed(moduleState, moduleState.units[0]);
  gainSoul(moduleState.units[0], 2, { playSound: (key) => soundKeys.push(key) });

  const legacyResult = legacy.runStateHelperProbe?.(legacyState, (key) => legacySoundKeys.push(key));
  const moduleResult = {
    pressedUnit: moduleState.pressedUnit,
    dragMoved: moduleState.dragMoved,
    charging: moduleState.charging,
    selectedId: selectedUnit(sampleState)?.id,
    selectedHudId: selectedHudUnit(sampleState)?.id,
    blueAlive: teamAliveCount(sampleState, "blue"),
    greyAlive: teamAliveCount(sampleState, "grey"),
    canControlPlayer: canControlUnit(sampleState.units[0]),
    canControlAi: canControlUnit(sampleState.units[1]),
    damageInt: formatDamage(10),
    damageFloat: formatDamage(10.25),
    matchTime: formatMatchTime(65000),
    pointInside: pointInRect(5, 5, { x: 4, y: 4, w: 2, h: 2 }),
    pointOutside: pointInRect(7, 7, { x: 4, y: 4, w: 2, h: 2 }),
    soulSteps: moduleState.units[0].soulSteps,
    soundKeys,
  };
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
