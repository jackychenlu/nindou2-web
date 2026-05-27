export const defaultGrid = {
  cols: 22,
  rows: 12,
  cell: 44.5,
  left: -9,
  top: 5,
};

export function displayCellCoord(cell, { mapDefinition = {}, gridLike = defaultGrid } = {}) {
  const bottomY = mapDefinition.coordinateBottomInternalY ?? gridLike.rows - 2;
  return {
    x: cell.x - 1,
    y: bottomY + 1 - cell.y,
  };
}

export function internalCellCoord(cell, { mapDefinition = {}, gridLike = defaultGrid } = {}) {
  const bottomY = mapDefinition.coordinateBottomInternalY ?? gridLike.rows - 2;
  return {
    x: cell.x + 1,
    y: bottomY + 1 - cell.y,
  };
}

export function shuffledCellsInArea(area, options = {}) {
  const random = options.random || Math.random;
  const cells = [];
  const xMin = Math.min(area.xMin, area.xMax);
  const xMax = Math.max(area.xMin, area.xMax);
  const yMin = Math.min(area.yMin, area.yMax);
  const yMax = Math.max(area.yMin, area.yMax);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      cells.push(internalCellCoord({ x, y }, options));
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

export function unitAt(stateLike, x, y) {
  return stateLike.units.find((unit) => unit.alive && unit.x === x && unit.y === y);
}

export function occupied(stateLike, x, y) {
  return Boolean(unitAt(stateLike, x, y));
}

export function objectAt(stateLike, x, y) {
  if (!stateLike.objects) return null;
  return stateLike.objects.find((object) => object.alive && object.x === x && object.y === y) || null;
}

export function neighbors(x, y) {
  return [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
}

export function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isStraightMove(a, b) {
  return a.x === b.x || a.y === b.y;
}

export function directionFromAdjacent(unit, target) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx > 0) return { name: "right", dx: 1, dy: 0 };
  if (dx < 0) return { name: "left", dx: -1, dy: 0 };
  if (dy > 0) return { name: "down", dx: 0, dy: 1 };
  return { name: "up", dx: 0, dy: -1 };
}

export function directionFromTarget(unit, target) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  if (dx === 0 && dy === 0) return null;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { name: "right", dx: 1, dy: 0 } : { name: "left", dx: -1, dy: 0 };
  }
  return dy > 0 ? { name: "down", dx: 0, dy: 1 } : { name: "up", dx: 0, dy: -1 };
}

export function directionVector(facing) {
  if (facing === "left") return { dx: -1, dy: 0 };
  if (facing === "right") return { dx: 1, dy: 0 };
  if (facing === "up") return { dx: 0, dy: -1 };
  return { dx: 0, dy: 1 };
}

export function updateFacing(unit, target) {
  const dir = directionFromTarget(unit, target);
  if (dir) unit.facing = dir.name;
}

export function inside(x, y, gridLike = defaultGrid) {
  return x >= 0 && x < gridLike.cols && y >= 0 && y < gridLike.rows;
}

export function isPermanentObstacle(x, y, options = {}) {
  const gridLike = options.gridLike || defaultGrid;
  const mapDefinition = options.mapDefinition || {};
  const playableYMin = mapDefinition.playableInternalYMin ?? 1;
  const playableYMax = mapDefinition.playableInternalYMax ?? gridLike.rows - 2;
  if (!inside(x, y, gridLike)) return true;
  if (x === 0 || x === gridLike.cols - 1) return true;
  if (x === 1 || x === gridLike.cols - 2) return true;
  if (y < playableYMin || y > playableYMax) return true;
  const display = displayCellCoord({ x, y }, { mapDefinition, gridLike });
  if (mapDefinition.blockedDisplayCells?.includes(`${display.x},${display.y}`)) return true;
  return false;
}

export function isBlockedCell(x, y, options = {}) {
  return isPermanentObstacle(x, y, options) || Boolean(objectAt(options.stateLike || {}, x, y));
}

export function pointerIsOnUnit(stateLike, unit) {
  if (!stateLike.pointer?.cell) return false;
  return stateLike.pointer.cell.x === unit.x && stateLike.pointer.cell.y === unit.y;
}

export function cellRect(x, y, gridLike = defaultGrid) {
  return { x: gridLike.left + x * gridLike.cell, y: gridLike.top + y * gridLike.cell, w: gridLike.cell, h: gridLike.cell };
}

export function cellCenter(x, y, gridLike = defaultGrid) {
  return { x: gridLike.left + x * gridLike.cell + gridLike.cell / 2, y: gridLike.top + y * gridLike.cell + gridLike.cell / 2 };
}

export function pointToCell(px, py, gridLike = defaultGrid) {
  const x = Math.floor((px - gridLike.left) / gridLike.cell);
  const y = Math.floor((py - gridLike.top) / gridLike.cell);
  return inside(x, y, gridLike) ? { x, y } : null;
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeGridHelpers(legacy = {}) {
  const gridLike = legacy.grid || defaultGrid;
  const maps = legacy.roomMapDefinitions || {};
  const country = maps["country-10"] || {};
  const evil1 = maps["evil-castle-1"] || country;
  const stateLike = {
    units: [
      { id: "u1", alive: true, x: 4, y: 5 },
      { id: "u2", alive: false, x: 4, y: 6 },
    ],
    objects: [{ type: "rock", alive: true, x: 4, y: 5 }],
    pointer: { cell: { x: 4, y: 5 } },
  };
  const moduleResult = {
    countryInternal: internalCellCoord({ x: 1, y: 1 }, { mapDefinition: country, gridLike }),
    countryDisplay: displayCellCoord({ x: 2, y: 10 }, { mapDefinition: country, gridLike }),
    evilDisplay: displayCellCoord({ x: 11, y: 10 }, { mapDefinition: evil1, gridLike }),
    evilInternal: internalCellCoord({ x: 10, y: 1 }, { mapDefinition: evil1, gridLike }),
    neighbors: neighbors(4, 5),
    manhattan: manhattan({ x: 1, y: 2 }, { x: 4, y: 6 }),
    clampLow: clamp(-1, 0, 5),
    clampHigh: clamp(9, 0, 5),
    straightA: isStraightMove({ x: 1, y: 1 }, { x: 1, y: 3 }),
    straightB: isStraightMove({ x: 1, y: 1 }, { x: 2, y: 3 }),
    adjacent: directionFromAdjacent({ x: 4, y: 5 }, { x: 5, y: 5 }),
    target: directionFromTarget({ x: 4, y: 5 }, { x: 2, y: 7 }),
    vector: directionVector("up"),
    insideA: inside(2, 5, gridLike),
    insideB: inside(-1, 5, gridLike),
    permanentA: isPermanentObstacle(2, 5, { mapDefinition: country, gridLike }),
    permanentB: isPermanentObstacle(1, 5, { mapDefinition: country, gridLike }),
    blocked: isBlockedCell(4, 5, { mapDefinition: country, gridLike, stateLike }),
    unitAtId: unitAt(stateLike, 4, 5)?.id,
    occupied: occupied(stateLike, 4, 5),
    objectAtType: objectAt(stateLike, 4, 5)?.type,
    pointerIsOnUnit: pointerIsOnUnit(stateLike, stateLike.units[0]),
    rect: cellRect(2, 3, gridLike),
    center: cellCenter(2, 3, gridLike),
    point: pointToCell(gridLike.left + gridLike.cell * 2 + 1, gridLike.top + gridLike.cell * 3 + 1, gridLike),
  };
  const legacyResult = legacy.runGridHelperProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
