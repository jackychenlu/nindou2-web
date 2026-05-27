// ===== Grid / Coordinate Helpers =====
function displayCellCoord(cell) {
  const bottomY = currentRoomMapDefinition().coordinateBottomInternalY ?? grid.rows - 2;
  return {
    x: cell.x - 1,
    y: bottomY + 1 - cell.y,
  };
}

function internalCellCoord(cell) {
  const bottomY = currentRoomMapDefinition().coordinateBottomInternalY ?? grid.rows - 2;
  return {
    x: cell.x + 1,
    y: bottomY + 1 - cell.y,
  };
}

// 把指定玩家座標矩形範圍內的格子打散，用於隨機出生。
function shuffledCellsInArea(area) {
  const cells = [];
  const xMin = Math.min(area.xMin, area.xMax);
  const xMax = Math.max(area.xMin, area.xMax);
  const yMin = Math.min(area.yMin, area.yMax);
  const yMax = Math.max(area.yMin, area.yMax);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      cells.push(internalCellCoord({ x, y }));
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

function unitAt(x, y) {
  return state.units.find((u) => u.alive && u.x === x && u.y === y);
}

function occupied(x, y) {
  return Boolean(unitAt(x, y));
}

function objectAt(x, y) {
  if (!state.objects) return null;
  return state.objects.find((object) => object.alive && object.x === x && object.y === y) || null;
}

function neighbors(x, y) {
  return [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isStraightMove(a, b) {
  return a.x === b.x || a.y === b.y;
}

// 當目標在上下左右一格時取得方向。
function directionFromAdjacent(unit, target) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx > 0) return { name: "right", dx: 1, dy: 0 };
  if (dx < 0) return { name: "left", dx: -1, dy: 0 };
  if (dy > 0) return { name: "down", dx: 0, dy: 1 };
  return { name: "up", dx: 0, dy: -1 };
}

// 依遠方目標推算主要方向。
function directionFromTarget(unit, target) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  if (dx === 0 && dy === 0) return null;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { name: "right", dx: 1, dy: 0 } : { name: "left", dx: -1, dy: 0 };
  }
  return dy > 0 ? { name: "down", dx: 0, dy: 1 } : { name: "up", dx: 0, dy: -1 };
}

// 把方向字串轉成 x/y 向量。
function directionVector(facing) {
  if (facing === "left") return { dx: -1, dy: 0 };
  if (facing === "right") return { dx: 1, dy: 0 };
  if (facing === "up") return { dx: 0, dy: -1 };
  return { dx: 0, dy: 1 };
}

// 依目標位置更新角色面向。
function updateFacing(unit, target) {
  const dir = directionFromTarget(unit, target);
  if (dir) unit.facing = dir.name;
}

function inside(x, y) {
  return x >= 0 && x < grid.cols && y >= 0 && y < grid.rows;
}

function currentRoomMapDefinition() {
  const key = state?.roomMapKey || defaultRoomMapKey;
  return roomMapDefinitions[key] || roomMapDefinitions[defaultRoomMapKey];
}

function isBlockedCell(x, y) {
  return isPermanentObstacle(x, y) || Boolean(objectAt(x, y));
}

function isPermanentObstacle(x, y) {
  const mapDefinition = currentRoomMapDefinition();
  const playableYMin = mapDefinition.playableInternalYMin ?? 1;
  const playableYMax = mapDefinition.playableInternalYMax ?? grid.rows - 2;
  if (!inside(x, y)) return true;
  if (x === 0 || x === grid.cols - 1) return true;
  if (x === 1 || x === grid.cols - 2) return true;
  if (y < playableYMin || y > playableYMax) return true;
  const display = displayCellCoord({ x, y });
  if (mapDefinition.blockedDisplayCells?.includes(`${display.x},${display.y}`)) return true;
  return false;
}

function pointerIsOnUnit(unit) {
  if (!state.pointer.cell) return false;
  return state.pointer.cell.x === unit.x && state.pointer.cell.y === unit.y;
}

function cellRect(x, y) {
  return { x: grid.left + x * grid.cell, y: grid.top + y * grid.cell, w: grid.cell, h: grid.cell };
}

function cellCenter(x, y) {
  return { x: grid.left + x * grid.cell + grid.cell / 2, y: grid.top + y * grid.cell + grid.cell / 2 };
}

function pointToCell(px, py) {
  const x = Math.floor((px - grid.left) / grid.cell);
  const y = Math.floor((py - grid.top) / grid.cell);
  return inside(x, y) ? { x, y } : null;
}

globalThis.NindouGrid = {
  grid,
  roomMapDefinitions,
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
  currentRoomMapDefinition,
  isBlockedCell,
  isPermanentObstacle,
  pointerIsOnUnit,
  cellRect,
  cellCenter,
  pointToCell,
  runGridHelperProbe() {
    const country = roomMapDefinitions["country-10"];
    const evil1 = roomMapDefinitions["evil-castle-1"];
    const stateLike = {
      units: [
        { id: "u1", alive: true, x: 4, y: 5 },
        { id: "u2", alive: false, x: 4, y: 6 },
      ],
      objects: [{ type: "rock", alive: true, x: 4, y: 5 }],
      pointer: { cell: { x: 4, y: 5 } },
    };
    const localDisplayCellCoord = (cell, mapDefinition) => {
      const bottomY = mapDefinition.coordinateBottomInternalY ?? grid.rows - 2;
      return { x: cell.x - 1, y: bottomY + 1 - cell.y };
    };
    const localInternalCellCoord = (cell, mapDefinition) => {
      const bottomY = mapDefinition.coordinateBottomInternalY ?? grid.rows - 2;
      return { x: cell.x + 1, y: bottomY + 1 - cell.y };
    };
    const localInside = (x, y) => x >= 0 && x < grid.cols && y >= 0 && y < grid.rows;
    const localObjectAt = (x, y) => stateLike.objects.find((object) => object.alive && object.x === x && object.y === y) || null;
    const localIsPermanentObstacle = (x, y, mapDefinition) => {
      const playableYMin = mapDefinition.playableInternalYMin ?? 1;
      const playableYMax = mapDefinition.playableInternalYMax ?? grid.rows - 2;
      if (!localInside(x, y)) return true;
      if (x === 0 || x === grid.cols - 1) return true;
      if (x === 1 || x === grid.cols - 2) return true;
      if (y < playableYMin || y > playableYMax) return true;
      const display = localDisplayCellCoord({ x, y }, mapDefinition);
      if (mapDefinition.blockedDisplayCells?.includes(`${display.x},${display.y}`)) return true;
      return false;
    };
    return {
      countryInternal: localInternalCellCoord({ x: 1, y: 1 }, country),
      countryDisplay: localDisplayCellCoord({ x: 2, y: 10 }, country),
      evilDisplay: localDisplayCellCoord({ x: 11, y: 10 }, evil1),
      evilInternal: localInternalCellCoord({ x: 10, y: 1 }, evil1),
      neighbors: neighbors(4, 5),
      manhattan: manhattan({ x: 1, y: 2 }, { x: 4, y: 6 }),
      clampLow: clamp(-1, 0, 5),
      clampHigh: clamp(9, 0, 5),
      straightA: isStraightMove({ x: 1, y: 1 }, { x: 1, y: 3 }),
      straightB: isStraightMove({ x: 1, y: 1 }, { x: 2, y: 3 }),
      adjacent: directionFromAdjacent({ x: 4, y: 5 }, { x: 5, y: 5 }),
      target: directionFromTarget({ x: 4, y: 5 }, { x: 2, y: 7 }),
      vector: directionVector("up"),
      insideA: localInside(2, 5),
      insideB: localInside(-1, 5),
      permanentA: localIsPermanentObstacle(2, 5, country),
      permanentB: localIsPermanentObstacle(1, 5, country),
      blocked: localIsPermanentObstacle(4, 5, country) || Boolean(localObjectAt(4, 5)),
      unitAtId: stateLike.units.find((unit) => unit.alive && unit.x === 4 && unit.y === 5)?.id,
      occupied: Boolean(stateLike.units.find((unit) => unit.alive && unit.x === 4 && unit.y === 5)),
      objectAtType: localObjectAt(4, 5)?.type,
      pointerIsOnUnit: stateLike.pointer.cell.x === stateLike.units[0].x && stateLike.pointer.cell.y === stateLike.units[0].y,
      rect: cellRect(2, 3),
      center: cellCenter(2, 3),
      point: pointToCell(grid.left + grid.cell * 2 + 1, grid.top + grid.cell * 3 + 1),
    };
  },
};
