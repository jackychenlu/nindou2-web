// ===== Movement / Collision =====
function skillMove(unit, cell) {
  if (!cell) return;
  const freeMoveActive = performance.now() < (unit.moveSkillFreeUntil || 0);
  const consumableFollowupMove = canUseConsumableFollowupMove(unit);
  const ninjuCastMove = isUnitCastingNinju(unit) && unit.ninju.chainMoves > 0;
  if (unit.moneyDart) {
    setMessage(`${unit.name}：拿著錢鏢時不能移動。`);
    return;
  }
  if (!weaponIsReady(unit)) {
    setMessage(`${unit.name}：武器冷卻中不能移動。`);
    return;
  }
  if (isUnitDisabled(unit) && !consumableFollowupMove && !ninjuCastMove) {
    setMessage(`${unit.name}：目前無法行動。`);
    return;
  }
  if (!canUnitMoveNow(unit) && !consumableFollowupMove) {
    setMessage(`${unit.name}：施放忍術時不能移動。`);
    return;
  }
  if (unit.moveTrail && (performance.now() - unit.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${unit.name}：移動中不能再次移動。`);
    return;
  }
  const wanted = cell;
  if (!isStraightMove(unit, wanted)) {
    setMessage("移動只能走橫向或直向。");
    return;
  }
  const maxDistance = freeMoveActive ? Infinity : Math.floor(unit.skill);
  if (!freeMoveActive && maxDistance < 1) {
    setMessage(`技量不足，至少需要 1，目前只有 ${unit.skill.toFixed(1)}。`);
    return;
  }
  const path = movePath(unit, wanted, maxDistance);
  cell = path ? path.cell : null;
  if (!cell) {
    setMessage("路徑被擋住了。");
    return;
  }
  if (cell.x === unit.x && cell.y === unit.y) {
    setMessage("已取消移動。");
    return;
  }
  const cost = Math.max(1, manhattan(unit, cell));
  if (!freeMoveActive) {
    unit.skill -= cost;
    gainSoul(unit, cost);
  }
  moveUnit(unit, cell.x, cell.y);
  if (path.hitEnemies.length > 0) {
    for (const enemy of path.hitEnemies) {
      collideWithEnemy(unit, enemy);
    }
  } else if (freeMoveActive) {
    setMessage(`${unit.name} 在神酒效果期間移動，不消耗技。`);
  } else {
    setMessage(`${unit.name} 消耗 ${cost} 技進行移動。`);
  }
}

function moveUnit(unit, x, y) {
  updateFacing(unit, { x, y });
  // 記錄殘影起點、終點與移動當下面向，用於 drawMoveTrails 播放動畫。
  unit.moveTrail = { fromX: unit.x, fromY: unit.y, toX: x, toY: y, startedAt: performance.now(), facing: unit.facing, team: unit.team };
  unit.fromX = unit.x;
  unit.fromY = unit.y;
  unit.x = x;
  unit.y = y;
  unit.moveT = 1; // 格子位置瞬間切換，動畫由 moveTrail 時間軸負責。
  if (isUnitInNinjuGap(unit)) {
    unit.ninju.gapMoves = (unit.ninju.gapMoves || 0) + 1;
  } else if (isUnitCastingNinju(unit) && unit.ninju.chainMoves > 0) {
    unit.ninju.chainMoves -= 1;
  } else if (canUseConsumableFollowupMove(unit)) {
    unit.consumableUse.chainMoves -= 1;
  }
  if (unit.consumableUse?.phase === "gap") {
    unit.consumableUse.gapMoves = (unit.consumableUse.gapMoves || 0) + 1;
  }
  playSound("move");
}

function canUseConsumableFollowupMove(unit) {
  return Boolean(unit?.consumableUse?.phase === "active" && unit.consumableUse.chainMoves > 0);
}

function collideWithEnemy(mover, enemy) {
  if (isUnitInvincible(enemy)) {
    setMessage(`${enemy.name} 目前無敵。`);
    return;
  }
  const damage = defendedDamage(enemy, collisionDamage);
  enemy.hp = Math.max(0, enemy.hp - damage);
  recordDamage(mover, enemy, damage, { skipSoulGain: true });
  gainSoul(mover, soulCombatGainSteps);
  enemy.facing = "down";
  enemy.hitFlash = 0.65;
  enemy.alive = false;
  enemy.moneyDart = null;
  if (typeof clearCloneDecoysForCaster === "function") clearCloneDecoysForCaster(enemy.id);
  cancelDragIfPressed(enemy);
  playSound("runOver");
  setMessage(`${mover.name} 撞上 ${enemy.name}，${enemy.name} 受到 ${formatDamage(damage)} 傷害。`);

  if (enemy.hp <= 0) {
    enemy.respawning = false;
    gainSoul(enemy, soulDeathGainSteps);
    mover.kills += 1;
    playSound("death");
    setMessage(`${enemy.name} 被擊倒。`);
    checkVictory();
  } else {
    enemy.respawning = true;
    window.setTimeout(() => {
      respawnUnit(enemy);
    }, respawnMs);
  }
}

function respawnUnit(unit) {
  if (!state.units.includes(unit)) return;
  const cell = randomOpenCell();
  unit.x = cell.x;
  unit.y = cell.y;
  unit.fromX = cell.x;
  unit.fromY = cell.y;
  unit.moveT = 1;
  unit.alive = true;
  unit.respawning = false;
  unit.hitFlash = 0.65;
  if (canControlUnit(unit)) unit.respawnTipUntil = performance.now() + respawnPointerDuration;
  unit.moneyDart = null;
  if (canControlUnit(unit)) playSound("respawn");
  setMessage(`${unit.name} 已復活。`);
}

function randomOpenCell() {
  const candidates = [];
  for (let y = 1; y < grid.rows - 1; y++) {
    for (let x = 1; x < grid.cols - 1; x++) {
      if (!isBlockedCell(x, y) && !unitAt(x, y)) candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) return { x: 1, y: 1 };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function reachableMoveCell(unit, wanted, maxDistance = Infinity) {
  const path = movePath(unit, wanted, maxDistance);
  return path ? path.cell : null;
}

function movePath(unit, wanted, maxDistance = Infinity) {
  if (!wanted || !isStraightMove(unit, wanted)) return null;
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

function dragMoveTargetCell(unit) {
  if (!unit) return null;
  const origin = cellCenter(unit.x, unit.y);
  const dx = state.pointer.x - origin.x;
  const dy = state.pointer.y - origin.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: unit.x, y: unit.y };

  if (Math.abs(dx) >= Math.abs(dy)) {
    const x = clamp(Math.floor((state.pointer.x - grid.left) / grid.cell), 0, grid.cols - 1);
    return inside(x, unit.y) ? { x, y: unit.y } : null;
  }

  const y = clamp(Math.floor((state.pointer.y - grid.top) / grid.cell), 0, grid.rows - 1);
  return inside(unit.x, y) ? { x: unit.x, y } : null;
}

function clearStraightPath(from, to, allowedFinalUnit) {
  if (!isStraightMove(from, to)) return false;
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

function runMovementHelperProbe() {
  const localStraightMove = (from, to) => from && to && (from.x === to.x || from.y === to.y);
  const localCanUseConsumableFollowupMove = (target) => Boolean(target?.consumableUse?.phase === "active" && target.consumableUse.chainMoves > 0);
  const enemy = { id: "enemy", team: "grey", x: 7, y: 5, alive: true };
  const ally = { id: "ally", team: "blue", x: 9, y: 5, alive: true };
  const unit = { id: "unit", team: "blue", x: 5, y: 5, consumableUse: { phase: "active", chainMoves: 2 } };
  const units = [unit, enemy, ally];
  const objects = [{ x: 8, y: 7, alive: true }];
  const localInside = (x, y) => x >= 0 && x < 12 && y >= 0 && y < 12;
  const localUnitAt = (x, y) => units.find((candidate) => candidate.alive && candidate.x === x && candidate.y === y) || null;
  const localObjectAt = (x, y) => objects.find((object) => object.alive && object.x === x && object.y === y) || null;
  const localPermanentObstacle = (x, y) => x === 0 || y === 0 || x === 11 || y === 11;
  const localBlockedCell = (x, y) => localPermanentObstacle(x, y) || Boolean(localObjectAt(x, y));
  const localUnitInvincible = (target) => Boolean(target.invincible);

  const localMovePath = (actor, wanted, maxDistance = Infinity) => {
    if (!wanted || !localStraightMove(actor, wanted)) return null;
    const dx = Math.sign(wanted.x - actor.x);
    const dy = Math.sign(wanted.y - actor.y);
    if (dx === 0 && dy === 0) return { cell: { x: actor.x, y: actor.y }, hitEnemies: [] };
    if (maxDistance < 1) return null;

    let lastOpen = { x: actor.x, y: actor.y };
    const hitEnemies = [];
    let x = actor.x + dx;
    let y = actor.y + dy;
    let distance = 1;

    while (localInside(x, y)) {
      const other = localUnitAt(x, y);
      if (localPermanentObstacle(x, y) || localObjectAt(x, y)) break;
      if (other) {
        if (other.team === actor.team || localUnitInvincible(other)) break;
        hitEnemies.push(other);
      }

      lastOpen = { x, y };
      if ((x === wanted.x && y === wanted.y) || distance >= maxDistance) return { cell: lastOpen, hitEnemies };
      x += dx;
      y += dy;
      distance += 1;
    }

    return lastOpen.x === actor.x && lastOpen.y === actor.y ? null : { cell: lastOpen, hitEnemies };
  };
  const localReachableMoveCell = (actor, wanted, maxDistance = Infinity) => {
    const path = localMovePath(actor, wanted, maxDistance);
    return path ? path.cell : null;
  };
  const localClearStraightPath = (from, to, allowedFinalUnit) => {
    if (!localStraightMove(from, to)) return false;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let x = from.x + dx;
    let y = from.y + dy;

    while (x !== to.x || y !== to.y) {
      if (localBlockedCell(x, y) || localUnitAt(x, y)) return false;
      x += dx;
      y += dy;
    }

    const finalUnit = localUnitAt(to.x, to.y);
    if (finalUnit && finalUnit !== allowedFinalUnit) return false;
    return !localPermanentObstacle(to.x, to.y) && !localObjectAt(to.x, to.y);
  };

  return {
    followup: localCanUseConsumableFollowupMove(unit),
    noFollowup: localCanUseConsumableFollowupMove({ consumableUse: { phase: "gap", chainMoves: 2 } }),
    hitEnemyPath: localMovePath(unit, { x: 8, y: 5 }),
    allyBlockedPath: localMovePath(unit, { x: 10, y: 5 }),
    obstaclePath: localMovePath({ ...unit, x: 8, y: 5 }, { x: 8, y: 9 }),
    maxDistancePath: localMovePath(unit, { x: 10, y: 5 }, 1),
    sameCellPath: localMovePath(unit, { x: 5, y: 5 }),
    diagonalPath: localMovePath(unit, { x: 6, y: 6 }),
    reachable: localReachableMoveCell(unit, { x: 8, y: 5 }),
    clearA: localClearStraightPath({ x: 5, y: 5 }, { x: 7, y: 5 }, enemy),
    clearB: localClearStraightPath({ x: 5, y: 5 }, { x: 8, y: 7 }, null),
  };
}

globalThis.NindouMovement = {
  canUseConsumableFollowupMove,
  reachableMoveCell,
  movePath,
  clearStraightPath,
  runMovementHelperProbe,
};
