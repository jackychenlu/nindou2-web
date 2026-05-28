import {
  canUseConsumableFollowupMove,
  movePath,
  reachableMoveCell,
  clearStraightPath,
  summarizeMovementHelpers,
} from "../systems/movement.module.mjs";
import { resolveRuntimeGrid, resolveRuntimeState } from "./runtime-state-access.module.mjs";

function runtimeOptions(target) {
  return {
    inside: target.inside,
    unitAt: target.unitAt,
    objectAt: target.objectAt,
    isPermanentObstacle: target.isPermanentObstacle,
    isBlockedCell: target.isBlockedCell,
    isUnitInvincible: target.isUnitInvincible,
  };
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

function random(target) {
  return target.Math?.random?.() ?? Math.random();
}

function runtimeWindow(target) {
  return target.window || target;
}

export function installMovementGlobals(target = globalThis) {
  const runtimeMovePath = (unit, wanted, maxDistance = Infinity) => (
    movePath(unit, wanted, maxDistance, runtimeOptions(target))
  );
  const movePathRuntime = (unit, wanted, maxDistance = Infinity) => (
    runtimeMovePath(unit, wanted, maxDistance)
  );
  const reachableMoveCellRuntime = (unit, wanted, maxDistance = Infinity) => (
    reachableMoveCell(unit, wanted, maxDistance, runtimeOptions(target))
  );
  const clearStraightPathRuntime = (from, to, allowedFinalUnit) => (
    clearStraightPath(from, to, allowedFinalUnit, runtimeOptions(target))
  );

  const moveUnit = (unit, x, y) => {
    target.updateFacing(unit, { x, y });
    unit.moveTrail = {
      fromX: unit.x,
      fromY: unit.y,
      toX: x,
      toY: y,
      startedAt: now(target),
      facing: unit.facing,
      team: unit.team,
    };
    unit.fromX = unit.x;
    unit.fromY = unit.y;
    unit.x = x;
    unit.y = y;
    unit.moveT = 1;
    if (target.isUnitInNinjuGap(unit)) {
      unit.ninju.gapMoves = (unit.ninju.gapMoves || 0) + 1;
    } else if (target.isUnitCastingNinju(unit) && unit.ninju.chainMoves > 0) {
      unit.ninju.chainMoves -= 1;
    } else if (canUseConsumableFollowupMove(unit)) {
      unit.consumableUse.chainMoves -= 1;
    }
    if (unit.consumableUse?.phase === "gap") {
      unit.consumableUse.gapMoves = (unit.consumableUse.gapMoves || 0) + 1;
    }
    target.playSound("move");
  };

  const randomOpenCell = () => {
    const grid = resolveRuntimeGrid(target);
    const candidates = [];
    for (let y = 1; y < grid.rows - 1; y += 1) {
      for (let x = 1; x < grid.cols - 1; x += 1) {
        if (!target.isBlockedCell(x, y) && !target.unitAt(x, y)) candidates.push({ x, y });
      }
    }
    if (candidates.length === 0) return { x: 1, y: 1 };
    return candidates[Math.floor(random(target) * candidates.length)];
  };

  const respawnUnit = (unit) => {
    const state = resolveRuntimeState(target);
    if (!state?.units?.includes(unit)) return;
    const cell = randomOpenCell();
    unit.x = cell.x;
    unit.y = cell.y;
    unit.fromX = cell.x;
    unit.fromY = cell.y;
    unit.moveT = 1;
    unit.alive = true;
    unit.respawning = false;
    unit.hitFlash = 0.65;
    if (target.canControlUnit(unit)) unit.respawnTipUntil = now(target) + target.respawnPointerDuration;
    unit.moneyDart = null;
    if (target.canControlUnit(unit)) target.playSound("respawn");
    target.setMessage(`${unit.name} 已復活。`);
  };

  const collideWithEnemy = (mover, enemy) => {
    if (target.isUnitInvincible(enemy)) {
      target.setMessage(`${enemy.name} 目前無敵。`);
      return;
    }
    const damage = target.defendedDamage(enemy, target.collisionDamage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    target.recordDamage(mover, enemy, damage, { skipSoulGain: true });
    target.gainSoul(mover, target.soulCombatGainSteps);
    enemy.facing = "down";
    enemy.hitFlash = 0.65;
    enemy.alive = false;
    enemy.moneyDart = null;
    target.clearCloneDecoysForCaster?.(enemy.id);
    target.cancelDragIfPressed(enemy);
    target.playSound("runOver");
    target.setMessage(`${mover.name} 撞上 ${enemy.name}，${enemy.name} 受到 ${target.formatDamage(damage)} 傷害。`);

    if (enemy.hp <= 0) {
      enemy.respawning = false;
      target.gainSoul(enemy, target.soulDeathGainSteps);
      mover.kills += 1;
      target.playSound("death");
      target.setMessage(`${enemy.name} 被擊倒。`);
      target.checkVictory();
    } else {
      enemy.respawning = true;
      runtimeWindow(target).setTimeout?.(() => {
        respawnUnit(enemy);
      }, target.respawnMs);
    }
  };

  const skillMove = (unit, cell) => {
    if (!cell) return;
    const freeMoveActive = now(target) < (unit.moveSkillFreeUntil || 0);
    const consumableFollowupMove = canUseConsumableFollowupMove(unit);
    const ninjuCastMove = target.isUnitCastingNinju(unit) && unit.ninju.chainMoves > 0;
    if (unit.moneyDart) {
      target.setMessage(`${unit.name}：拿著錢鏢時不能移動。`);
      return;
    }
    if (!target.weaponIsReady(unit)) {
      target.setMessage(`${unit.name}：武器冷卻中不能移動。`);
      return;
    }
    if (target.isUnitDisabled(unit) && !consumableFollowupMove && !ninjuCastMove) {
      target.setMessage(`${unit.name}：目前無法行動。`);
      return;
    }
    if (!target.canUnitMoveNow(unit) && !consumableFollowupMove) {
      target.setMessage(`${unit.name}：施放忍術時不能移動。`);
      return;
    }
    if (unit.moveTrail && (now(target) - unit.moveTrail.startedAt) < target.ARRIVE_TOTAL) {
      target.setMessage(`${unit.name}：移動中不能再次移動。`);
      return;
    }
    const wanted = cell;
    if (!target.isStraightMove(unit, wanted)) {
      target.setMessage("移動只能走橫向或直向。");
      return;
    }
    const maxDistance = freeMoveActive ? Infinity : Math.floor(unit.skill);
    if (!freeMoveActive && maxDistance < 1) {
      target.setMessage(`技量不足，至少需要 1，目前只有 ${unit.skill.toFixed(1)}。`);
      return;
    }
    const path = runtimeMovePath(unit, wanted, maxDistance);
    cell = path ? path.cell : null;
    if (!cell) {
      target.setMessage("路徑被擋住了。");
      return;
    }
    if (cell.x === unit.x && cell.y === unit.y) {
      target.setMessage("已取消移動。");
      return;
    }
    const cost = Math.max(1, target.manhattan(unit, cell));
    if (!freeMoveActive) {
      unit.skill -= cost;
      target.gainSoul(unit, cost);
    } else {
      target.gainSoul(unit, (cost * 2) / 5);
    }
    moveUnit(unit, cell.x, cell.y);
    if (path.hitEnemies.length > 0) {
      for (const enemy of path.hitEnemies) {
        collideWithEnemy(unit, enemy);
      }
    } else if (freeMoveActive) {
      target.setMessage(`${unit.name} 在神酒效果期間移動，不消耗技。`);
    } else {
      target.setMessage(`${unit.name} 消耗 ${cost} 技進行移動。`);
    }
  };

  const dragMoveTargetCell = (unit) => {
    if (!unit) return null;
    const state = resolveRuntimeState(target);
    const grid = resolveRuntimeGrid(target);
    const origin = target.cellCenter(unit.x, unit.y);
    const dx = state.pointer.x - origin.x;
    const dy = state.pointer.y - origin.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: unit.x, y: unit.y };

    if (Math.abs(dx) >= Math.abs(dy)) {
      const x = target.clamp(Math.floor((state.pointer.x - grid.left) / grid.cell), 0, grid.cols - 1);
      return target.inside(x, unit.y) ? { x, y: unit.y } : null;
    }

    const y = target.clamp(Math.floor((state.pointer.y - grid.top) / grid.cell), 0, grid.rows - 1);
    return target.inside(unit.x, y) ? { x: unit.x, y } : null;
  };

  Object.assign(target, {
    skillMove,
    moveUnit,
    canUseConsumableFollowupMove,
    collideWithEnemy,
    respawnUnit,
    randomOpenCell,
    movePath: movePathRuntime,
    reachableMoveCell: reachableMoveCellRuntime,
    dragMoveTargetCell,
    clearStraightPath: clearStraightPathRuntime,
  });

  target.NindouMovement = {
    skillMove,
    moveUnit,
    canUseConsumableFollowupMove,
    collideWithEnemy,
    respawnUnit,
    randomOpenCell,
    movePath: movePathRuntime,
    reachableMoveCell: reachableMoveCellRuntime,
    dragMoveTargetCell,
    clearStraightPath: clearStraightPathRuntime,
    runMovementHelperProbe: () => summarizeMovementHelpers({ runMovementHelperProbe: () => null }).moduleResult,
  };
}
