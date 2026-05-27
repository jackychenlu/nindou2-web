import { isStraightMove } from "./grid.module.mjs";

export function canUseConsumableFollowupMove(unit) {
  return Boolean(unit?.consumableUse?.phase === "active" && unit.consumableUse.chainMoves > 0);
}

export function movePath(unit, wanted, maxDistance = Infinity, options = {}) {
  if (!wanted || !isStraightMove(unit, wanted)) return null;
  const inside = options.inside || (() => true);
  const unitAt = options.unitAt || (() => null);
  const objectAt = options.objectAt || (() => null);
  const isPermanentObstacle = options.isPermanentObstacle || (() => false);
  const isUnitInvincible = options.isUnitInvincible || (() => false);
  const dx = Math.sign(wanted.x - unit.x);
  const dy = Math.sign(wanted.y - unit.y);
  if (dx === 0 && dy === 0) return { cell: { x: unit.x, y: unit.y }, hitEnemies: [] };
  if (maxDistance < 1) return null;

  let lastOpen = { x: unit.x, y: unit.y };
  const hitEnemies = [];
  let x = unit.x + dx;
  let y = unit.y + dy;
  let distance = 1;

  while (inside(x, y)) {
    const other = unitAt(x, y);
    if (isPermanentObstacle(x, y) || objectAt(x, y)) break;
    if (other) {
      if (other.team === unit.team || isUnitInvincible(other)) break;
      hitEnemies.push(other);
    }

    lastOpen = { x, y };
    if ((x === wanted.x && y === wanted.y) || distance >= maxDistance) return { cell: lastOpen, hitEnemies };
    x += dx;
    y += dy;
    distance += 1;
  }

  return lastOpen.x === unit.x && lastOpen.y === unit.y ? null : { cell: lastOpen, hitEnemies };
}

export function reachableMoveCell(unit, wanted, maxDistance = Infinity, options = {}) {
  const path = movePath(unit, wanted, maxDistance, options);
  return path ? path.cell : null;
}

export function clearStraightPath(from, to, allowedFinalUnit, options = {}) {
  if (!isStraightMove(from, to)) return false;
  const unitAt = options.unitAt || (() => null);
  const objectAt = options.objectAt || (() => null);
  const isBlockedCell = options.isBlockedCell || (() => false);
  const isPermanentObstacle = options.isPermanentObstacle || (() => false);
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;

  while (x !== to.x || y !== to.y) {
    if (isBlockedCell(x, y) || unitAt(x, y)) return false;
    x += dx;
    y += dy;
  }

  const finalUnit = unitAt(to.x, to.y);
  if (finalUnit && finalUnit !== allowedFinalUnit) return false;
  return !isPermanentObstacle(to.x, to.y) && !objectAt(to.x, to.y);
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeMovementHelpers(legacy = {}) {
  const enemy = { id: "enemy", team: "grey", x: 7, y: 5, alive: true };
  const ally = { id: "ally", team: "blue", x: 9, y: 5, alive: true };
  const unit = { id: "unit", team: "blue", x: 5, y: 5, consumableUse: { phase: "active", chainMoves: 2 } };
  const units = [unit, enemy, ally];
  const objects = [{ x: 8, y: 7, alive: true }];
  const options = {
    inside: (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12,
    unitAt: (x, y) => units.find((candidate) => candidate.alive && candidate.x === x && candidate.y === y) || null,
    objectAt: (x, y) => objects.find((object) => object.alive && object.x === x && object.y === y) || null,
    isPermanentObstacle: (x, y) => x === 0 || y === 0 || x === 11 || y === 11,
    isBlockedCell: (x, y) => x === 0 || y === 0 || x === 11 || y === 11 || Boolean(objects.find((object) => object.alive && object.x === x && object.y === y)),
    isUnitInvincible: (target) => Boolean(target.invincible),
  };
  const moduleResult = {
    followup: canUseConsumableFollowupMove(unit),
    noFollowup: canUseConsumableFollowupMove({ consumableUse: { phase: "gap", chainMoves: 2 } }),
    hitEnemyPath: movePath(unit, { x: 8, y: 5 }, Infinity, options),
    allyBlockedPath: movePath(unit, { x: 10, y: 5 }, Infinity, options),
    obstaclePath: movePath({ ...unit, x: 8, y: 5 }, { x: 8, y: 9 }, Infinity, options),
    maxDistancePath: movePath(unit, { x: 10, y: 5 }, 1, options),
    sameCellPath: movePath(unit, { x: 5, y: 5 }, Infinity, options),
    diagonalPath: movePath(unit, { x: 6, y: 6 }, Infinity, options),
    reachable: reachableMoveCell(unit, { x: 8, y: 5 }, Infinity, options),
    clearA: clearStraightPath({ x: 5, y: 5 }, { x: 7, y: 5 }, enemy, options),
    clearB: clearStraightPath({ x: 5, y: 5 }, { x: 8, y: 7 }, null, options),
  };
  const legacyResult = legacy.runMovementHelperProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
