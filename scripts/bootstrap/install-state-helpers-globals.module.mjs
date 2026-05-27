import {
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
} from "../systems/state-helpers.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function clearDragStateForRuntime(target) {
  return clearDragState(resolveRuntimeState(target));
}

function cancelDragIfPressedForRuntime(target, unit) {
  return cancelDragIfPressed(resolveRuntimeState(target), unit);
}

function selectedUnitForRuntime(target) {
  return selectedUnit(resolveRuntimeState(target));
}

function selectedHudUnitForRuntime(target) {
  return selectedHudUnit(resolveRuntimeState(target));
}

function teamAliveCountForRuntime(target, team) {
  return teamAliveCount(resolveRuntimeState(target), team);
}

function gainSoulForRuntime(target, unit, steps) {
  return gainSoul(unit, steps, {
    soulStepsPerLevel: target.soulStepsPerLevel,
    soulMaxLevel: target.soulMaxLevel,
    playSound: target.playSound,
  });
}

function runStateHelperProbe(probeState, probePlaySound, target) {
  const soundKeys = [];
  const localPlaySound = (key) => {
    soundKeys.push(key);
    probePlaySound?.(key);
  };
  probeState.pressedUnit = probeState.units[0];
  cancelDragIfPressed(probeState, probeState.units[0]);
  gainSoul(probeState.units[0], 2, {
    soulStepsPerLevel: target.soulStepsPerLevel,
    soulMaxLevel: target.soulMaxLevel,
    playSound: localPlaySound,
  });
  return {
    pressedUnit: probeState.pressedUnit,
    dragMoved: probeState.dragMoved,
    charging: probeState.charging,
    selectedId: selectedUnit(probeState)?.id,
    selectedHudId: selectedHudUnit(probeState)?.id,
    blueAlive: teamAliveCount(probeState, "blue"),
    greyAlive: teamAliveCount(probeState, "grey"),
    canControlPlayer: canControlUnit(probeState.units[0]),
    canControlAi: canControlUnit(probeState.units[1]),
    damageInt: formatDamage(10),
    damageFloat: formatDamage(10.25),
    matchTime: formatMatchTime(65000),
    pointInside: pointInRect(5, 5, { x: 4, y: 4, w: 2, h: 2 }),
    pointOutside: pointInRect(7, 7, { x: 4, y: 4, w: 2, h: 2 }),
    soulSteps: probeState.units[0].soulSteps,
    soundKeys,
  };
}

export function installStateHelpersGlobals(target = globalThis) {
  const clearDragStateRuntime = () => clearDragStateForRuntime(target);
  const cancelDragIfPressedRuntime = (unit) => cancelDragIfPressedForRuntime(target, unit);
  const selectedUnitRuntime = () => selectedUnitForRuntime(target);
  const selectedHudUnitRuntime = () => selectedHudUnitForRuntime(target);
  const teamAliveCountRuntime = (team) => teamAliveCountForRuntime(target, team);
  const gainSoulRuntime = (unit, steps) => gainSoulForRuntime(target, unit, steps);
  const runStateHelperProbeRuntime = (probeState, probePlaySound) =>
    runStateHelperProbe(probeState, probePlaySound, target);

  Object.assign(target, {
    clearDragState: clearDragStateRuntime,
    cancelDragIfPressed: cancelDragIfPressedRuntime,
    formatDamage,
    formatMatchTime,
    pointInRect,
    selectedUnit: selectedUnitRuntime,
    canControlUnit,
    selectedHudUnit: selectedHudUnitRuntime,
    teamAliveCount: teamAliveCountRuntime,
    gainSoul: gainSoulRuntime,
  });

  target.NindouStateHelpers = {
    clearDragState: clearDragStateRuntime,
    cancelDragIfPressed: cancelDragIfPressedRuntime,
    formatDamage,
    formatMatchTime,
    pointInRect,
    selectedUnit: selectedUnitRuntime,
    canControlUnit,
    selectedHudUnit: selectedHudUnitRuntime,
    teamAliveCount: teamAliveCountRuntime,
    gainSoul: gainSoulRuntime,
    runStateHelperProbe: runStateHelperProbeRuntime,
  };
}
