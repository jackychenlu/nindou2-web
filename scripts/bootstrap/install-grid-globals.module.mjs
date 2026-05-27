import {
  displayCellCoord,
  internalCellCoord,
  shuffledCellsInArea,
  unitAt,
  occupied,
  objectAt,
  neighbors,
  manhattan,
  clamp,
  isStraightMove,
  directionFromAdjacent,
  directionFromTarget,
  directionVector,
  updateFacing,
  inside,
  isPermanentObstacle,
  isBlockedCell,
  pointerIsOnUnit,
  cellRect,
  cellCenter,
  pointToCell,
} from "../systems/grid.module.mjs";
import {
  resolveRuntimeGrid,
  resolveRuntimeRoomMapKey,
  resolveRuntimeState,
} from "./runtime-state-access.module.mjs";

function runtimeGrid(target) {
  return resolveRuntimeGrid(target);
}

function runtimeMapDefinition(target) {
  const key = resolveRuntimeRoomMapKey(target);
  return target.roomMapDefinitions?.[key] || target.roomMapDefinitions?.[target.defaultRoomMapKey] || {};
}

export function installGridGlobals(target = globalThis) {
  const displayCellCoordRuntime = (cell) => displayCellCoord(cell, { mapDefinition: runtimeMapDefinition(target), gridLike: runtimeGrid(target) });
  const internalCellCoordRuntime = (cell) => internalCellCoord(cell, { mapDefinition: runtimeMapDefinition(target), gridLike: runtimeGrid(target) });
  const shuffledCellsInAreaRuntime = (area) => shuffledCellsInArea(area, { mapDefinition: runtimeMapDefinition(target), gridLike: runtimeGrid(target) });
  const unitAtRuntime = (x, y) => unitAt(resolveRuntimeState(target), x, y);
  const occupiedRuntime = (x, y) => occupied(resolveRuntimeState(target), x, y);
  const objectAtRuntime = (x, y) => objectAt(resolveRuntimeState(target), x, y);
  const insideRuntime = (x, y) => inside(x, y, runtimeGrid(target));
  const isPermanentObstacleRuntime = (x, y) => isPermanentObstacle(x, y, { mapDefinition: runtimeMapDefinition(target), gridLike: runtimeGrid(target) });
  const isBlockedCellRuntime = (x, y) => isBlockedCell(x, y, {
    mapDefinition: runtimeMapDefinition(target),
    gridLike: runtimeGrid(target),
    stateLike: resolveRuntimeState(target),
  });
  const pointerIsOnUnitRuntime = (unit) => pointerIsOnUnit(resolveRuntimeState(target), unit);
  const cellRectRuntime = (x, y) => cellRect(x, y, runtimeGrid(target));
  const cellCenterRuntime = (x, y) => cellCenter(x, y, runtimeGrid(target));
  const pointToCellRuntime = (x, y) => pointToCell(x, y, runtimeGrid(target));
  const currentRoomMapDefinitionRuntime = () => runtimeMapDefinition(target);
  const runGridHelperProbeRuntime = () => {
    const country = target.roomMapDefinitions?.["country-10"] || runtimeMapDefinition(target);
    const evil1 = target.roomMapDefinitions?.["evil-castle-1"] || country;
    const probeState = {
      units: [{ id: "u1", alive: true, x: 4, y: 5 }],
      objects: [{ type: "rock", alive: true, x: 4, y: 5 }],
      pointer: { cell: { x: 4, y: 5 } },
    };
    return {
      countryInternal: internalCellCoord({ x: 1, y: 1 }, { mapDefinition: country, gridLike: runtimeGrid(target) }),
      countryDisplay: displayCellCoord({ x: 2, y: 10 }, { mapDefinition: country, gridLike: runtimeGrid(target) }),
      evilDisplay: displayCellCoord({ x: 11, y: 10 }, { mapDefinition: evil1, gridLike: runtimeGrid(target) }),
      evilInternal: internalCellCoord({ x: 10, y: 1 }, { mapDefinition: evil1, gridLike: runtimeGrid(target) }),
      neighbors: neighbors(4, 5),
      manhattan: manhattan({ x: 1, y: 2 }, { x: 4, y: 6 }),
      clampLow: clamp(-1, 0, 5),
      clampHigh: clamp(9, 0, 5),
      straightA: isStraightMove({ x: 1, y: 1 }, { x: 1, y: 3 }),
      straightB: isStraightMove({ x: 1, y: 1 }, { x: 2, y: 3 }),
      adjacent: directionFromAdjacent({ x: 4, y: 5 }, { x: 5, y: 5 }),
      target: directionFromTarget({ x: 4, y: 5 }, { x: 2, y: 7 }),
      vector: directionVector("up"),
      insideA: inside(2, 5, runtimeGrid(target)),
      insideB: inside(-1, 5, runtimeGrid(target)),
      permanentA: isPermanentObstacle(2, 5, { mapDefinition: country, gridLike: runtimeGrid(target) }),
      permanentB: isPermanentObstacle(1, 5, { mapDefinition: country, gridLike: runtimeGrid(target) }),
      blocked: isBlockedCell(4, 5, { mapDefinition: country, gridLike: runtimeGrid(target), stateLike: probeState }),
      unitAtId: unitAt(probeState, 4, 5)?.id,
      occupied: occupied(probeState, 4, 5),
      objectAtType: objectAt(probeState, 4, 5)?.type,
      pointerIsOnUnit: pointerIsOnUnit(probeState, probeState.units[0]),
      rect: cellRect(2, 3, runtimeGrid(target)),
      center: cellCenter(2, 3, runtimeGrid(target)),
      point: pointToCell(runtimeGrid(target).left + runtimeGrid(target).cell * 2 + 1, runtimeGrid(target).top + runtimeGrid(target).cell * 3 + 1, runtimeGrid(target)),
    };
  };

  Object.assign(target, {
    displayCellCoord: displayCellCoordRuntime,
    internalCellCoord: internalCellCoordRuntime,
    shuffledCellsInArea: shuffledCellsInAreaRuntime,
    unitAt: unitAtRuntime,
    occupied: occupiedRuntime,
    objectAt: objectAtRuntime,
    neighbors,
    manhattan,
    clamp,
    isStraightMove,
    directionFromAdjacent,
    directionFromTarget,
    directionVector,
    updateFacing,
    inside: insideRuntime,
    isPermanentObstacle: isPermanentObstacleRuntime,
    isBlockedCell: isBlockedCellRuntime,
    pointerIsOnUnit: pointerIsOnUnitRuntime,
    cellRect: cellRectRuntime,
    cellCenter: cellCenterRuntime,
    pointToCell: pointToCellRuntime,
    currentRoomMapDefinition: currentRoomMapDefinitionRuntime,
  });

  target.NindouGrid = {
    grid: runtimeGrid(target),
    roomMapDefinitions: target.roomMapDefinitions || {},
    displayCellCoord: displayCellCoordRuntime,
    internalCellCoord: internalCellCoordRuntime,
    shuffledCellsInArea: shuffledCellsInAreaRuntime,
    unitAt: unitAtRuntime,
    occupied: occupiedRuntime,
    objectAt: objectAtRuntime,
    neighbors,
    manhattan,
    clamp,
    isStraightMove,
    directionFromAdjacent,
    directionFromTarget,
    directionVector,
    updateFacing,
    inside: insideRuntime,
    currentRoomMapDefinition: currentRoomMapDefinitionRuntime,
    isBlockedCell: isBlockedCellRuntime,
    isPermanentObstacle: isPermanentObstacleRuntime,
    pointerIsOnUnit: pointerIsOnUnitRuntime,
    cellRect: cellRectRuntime,
    cellCenter: cellCenterRuntime,
    pointToCell: pointToCellRuntime,
    runGridHelperProbe: runGridHelperProbeRuntime,
  };
}
