import {
  aiProfiles,
  tachiMasterMoveAggroMs,
  tachiMasterSoulSecondsPerLevel,
  tachiMasterSoulChargePerSecond,
  aiRedRetaliationLineDelayMs,
  aiProfile,
  isMoneyDartFocusedAi,
  isRedGroupAi,
  isTachiMasterAi,
  trackAiRecentDamage,
  isTachiMasterMoveReady,
  updateTachiMasterSoulCharge,
  aiIgnoresSkillCosts,
  aiRedChargeDelay,
  isDiagonalAdjacent,
  isOrthogonalLine,
  isInNineGrid,
  runAiProfileProbe,
} from "../systems/ai.module.mjs";

function now(target) {
  return target.performance?.now?.() ?? Date.now();
}

function stateOf(target) {
  return target.NindouRuntimeState?.getState?.() || target.state;
}

function skillMax(target) {
  return target.maxSkill ?? 18;
}

export function installAiGlobals(target = globalThis) {
  function aiRedRandomDelay(minMs, maxMs) {
    return minMs + Math.random() * Math.max(0, maxMs - minMs);
  }

  function ensureAiRedTimers(unit, currentNow = now(target)) {
    if (!isRedGroupAi(unit)) return;
    if (!Number.isFinite(unit.aiRedCloneAt)) unit.aiRedCloneAt = currentNow + aiRedRandomDelay(0, 90000);
    if (!Number.isFinite(unit.aiRedSteelAt)) unit.aiRedSteelAt = currentNow + aiRedRandomDelay(12000, 30000);
    if (!Number.isFinite(unit.aiRedAttackAt)) unit.aiRedAttackAt = currentNow + aiRedRandomDelay(30000, 60000);
  }

  function rescheduleAiRedTimer(unit, timerKey, minMs, maxMs, currentNow = now(target)) {
    unit[timerKey] = currentNow + aiRedRandomDelay(minMs, maxMs);
  }

  function queueAiRedRetaliation(unit, attacker, currentNow = now(target)) {
    if (!isRedGroupAi(unit) || !attacker || !attacker.alive || !unit.alive) return false;
    if (isOrthogonalLine(unit, attacker) && target.manhattan(unit, attacker) >= 1) {
      unit.aiRedPendingAction = {
        type: "ram",
        targetId: attacker.id,
        executeAt: currentNow + aiRedRetaliationLineDelayMs,
      };
      unit.aiNextThink = Math.min(unit.aiNextThink || Infinity, unit.aiRedPendingAction.executeAt);
      return true;
    }
    if (!isDiagonalAdjacent(unit, attacker)) return false;
    const roll = Math.random();
    const type = roll < 0.15 ? "clone" : roll < 0.5 ? "ram" : "weapon";
    unit.aiRedPendingAction = {
      type,
      targetId: attacker.id,
      executeAt: currentNow + 120,
    };
    unit.aiNextThink = Math.min(unit.aiNextThink || Infinity, unit.aiRedPendingAction.executeAt);
    return true;
  }

  function aiRedWeaponAttack(unit, enemy) {
    if (!enemy || !enemy.alive) return false;
    if (target.isUnitDisabled(unit) || unit.moneyDart) return false;
    if (target.isUnitCastingNinju(unit) || target.isUnitInNinjuGap(unit)) return false;
    if (!target.weaponIsReady(unit)) return false;
    const dir = target.weaponDirectionFromTarget(unit, enemy);
    if (!dir || !target.isCellInWeaponRange(unit, enemy, dir)) return false;
    target.attack(unit, enemy);
    return true;
  }

  function aiTachiWeaponAttack(unit, enemy) {
    if (!isTachiMasterAi(unit) || !enemy || !enemy.alive) return false;
    if (target.isUnitInvincible(enemy)) return false;
    if (target.isUnitDisabled(unit) || unit.moneyDart) return false;
    if (target.isUnitCastingNinju(unit) || target.isUnitInNinjuGap(unit)) return false;
    if (!target.weaponIsReady(unit)) return false;
    const dir = target.weaponDirectionFromTarget(unit, enemy);
    if (!dir || !target.isCellInWeaponRange(unit, enemy, dir)) return false;
    target.attack(unit, enemy);
    return true;
  }

  function aiRedRamTowardTarget(unit, enemy) {
    if (!enemy || !enemy.alive) return false;
    if (target.isStraightMove(unit, enemy) && target.clearStraightPath(unit, enemy, enemy)) {
      return aiMoveUnit(unit, { x: enemy.x, y: enemy.y });
    }
    return aiPathMoveToward(unit, enemy) || aiStepToward(unit, enemy);
  }

  function tryAiRedPendingAction(unit, currentNow) {
    const pending = unit.aiRedPendingAction;
    if (!pending || currentNow < pending.executeAt) return false;
    unit.aiRedPendingAction = null;
    if (pending.type === "clone") return tryAiStartNinju(unit, "clone", 1, currentNow);
    const state = stateOf(target);
    const enemy = state.units.find((other) => other.id === pending.targetId && other.alive && other.team !== unit.team);
    if (!enemy) return false;
    if (pending.type === "weapon") return aiRedWeaponAttack(unit, enemy);
    return aiRedRamTowardTarget(unit, enemy);
  }

  function tryAiRedScheduledNinjutsu(unit, currentNow) {
    ensureAiRedTimers(unit, currentNow);

    if (currentNow >= unit.aiRedCloneAt) {
      if (tryAiStartNinju(unit, "clone", 1, currentNow)) {
        rescheduleAiRedTimer(unit, "aiRedCloneAt", 0, 90000, currentNow);
        return true;
      }
      unit.aiRedCloneAt = currentNow + 250;
    }

    if (currentNow >= unit.aiRedSteelAt) {
      if (!target.isSteelDefenseActive(unit) && tryAiStartNinju(unit, "steel", 1, currentNow)) {
        rescheduleAiRedTimer(unit, "aiRedSteelAt", 12000, 30000, currentNow);
        return true;
      }
      unit.aiRedSteelAt = currentNow + 250;
    }

    if (currentNow >= unit.aiRedAttackAt) {
      const type = Math.random() < 0.5 ? "wildfire" : "freeze";
      if (tryAiStartNinju(unit, type, 1, currentNow)) {
        rescheduleAiRedTimer(unit, "aiRedAttackAt", 30000, 60000, currentNow);
        return true;
      }
      unit.aiRedAttackAt = currentNow + 250;
    }

    return false;
  }

  function tryAiRedCombatAction(unit, enemy, currentNow) {
    const dist = target.manhattan(unit, enemy);
    if (isInNineGrid(unit, enemy)) {
      if (aiRedWeaponAttack(unit, enemy)) {
        unit.aiNextThink = currentNow + 260 + Math.random() * 180;
      } else {
        unit.aiNextThink = currentNow + 120;
      }
      return true;
    }

    if (isOrthogonalLine(unit, enemy) && dist >= 1) {
      if (Math.random() < 0.15 && tryAiStartNinju(unit, "clone", 1, currentNow)) {
        unit.aiNextThink = currentNow + 120;
        return true;
      }
      unit.aiRedPendingAction = {
        type: "ram",
        targetId: enemy.id,
        executeAt: currentNow + aiRedChargeDelay(dist),
      };
      unit.aiNextThink = unit.aiRedPendingAction.executeAt;
      return true;
    }

    const chaseChance = enemy.hp <= enemy.maxHp * 0.3 ? 0.5 : aiProfile(unit).chaseChance;
    if (Math.random() < chaseChance) {
      const acted = aiPathMoveToward(unit, enemy) || aiStepToward(unit, enemy);
      if (acted) unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + 450 + Math.random() * 250);
      return acted;
    }

    unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + 700 + Math.random() * 700);
    return true;
  }

  function updateAi(dt, currentNow) {
    const state = stateOf(target);
    if (state.gameOver) return;

    for (const unit of state.units) {
      if (!unit.alive || unit.respawning) continue;
      updateTachiMasterSoulCharge(unit, dt);
      if (target.canControlUnit(unit) || target.isUnitCastingNinju(unit) || target.isUnitDisabled(unit)) continue;

      const profile = aiProfile(unit);
      trackAiRecentDamage(unit, currentNow);
      if (aiIgnoresSkillCosts(unit)) {
        unit.skill = skillMax(target);
        ensureAiRedTimers(unit, currentNow);
      }
      const skillLimit = unit.skillMax || profile.skillMax || skillMax(target);
      unit.skill = Math.min(skillLimit, unit.skill + target.aiSkillRegenPerSecond * profile.skillRegenMultiplier * dt);

      if (isRedGroupAi(unit) && tryAiRedPendingAction(unit, currentNow)) {
        unit.aiNextThink = currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
        continue;
      }

      if (tryAiNinjutsu(unit, profile, currentNow)) {
        unit.aiNextThink = currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
        continue;
      }

      if (tryAiThrowMoneyDart(unit, profile, currentNow)) {
        unit.aiNextThink = currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
        continue;
      }

      const enemy = nearestEnemy(unit, unit.team === "blue" ? "grey" : "blue");
      if (!enemy) {
        unit.aiNextThink = currentNow + 1000;
        target.checkVictory();
        continue;
      }

	  if (unit.moveT >= 1 && aiIsTrappedByBreakable(unit) && aiBreakOut(unit, target)) {
	    continue;
	  }

	  if (unit.moveT < 1 || currentNow < unit.aiNextThink) continue;


      const dist = target.manhattan(unit, enemy);
      const planKey = `${enemy.id}:${enemy.x},${enemy.y}:${unit.x},${unit.y}`;
      if (unit.aiPlanKey !== planKey) {
        unit.aiPlanKey = planKey;
        unit.aiActionAt = currentNow + aiReactionDelay(dist, profile.reactionMultiplier);
        continue;
      }
      if (currentNow < unit.aiActionAt) continue;

      unit.aiPlanKey = "";
      unit.aiActionAt = 0;

      if (isRedGroupAi(unit)) {
        if (tryAiRedCombatAction(unit, enemy, currentNow)) continue;
        unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
        continue;
      }

      if (unit.controlMode === "ai_dart_only_master") {
        const acted = aiStepToMoneyDartLine(unit, enemy) || aiPathMoveToward(unit, enemy) || aiStepToward(unit, enemy) || aiRandomMove(unit);
        if (!acted) aiBreakOut(unit, enemy);
        unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
        continue;
      }

      if (isTachiMasterAi(unit) && !target.isSteelDefenseActive(unit)) {
        if (isTachiMasterMoveReady(unit, profile, currentNow)) {
          const acted = aiStepToMoneyDartLine(unit, enemy) || aiRandomMove(unit);
          if (!acted) aiBreakOut(unit, enemy);
        }
        unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
        continue;
      }

      if (unit.controlMode === "ai_money_dart_master" && !unit.moneyDart && !aiMoneyDartAimCell(unit)) {
        if (aiStepToMoneyDartLine(unit, enemy)) {
          unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
          continue;
        }
      }

      if (isTachiMasterAi(unit) && aiTachiWeaponAttack(unit, enemy)) {
        unit.aiNextThink = currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
        continue;
      }

      if (dist === 1) {
        if (target.isUnitInvincible(enemy)) {
          unit.aiNextThink = currentNow + 500 + Math.random() * 500;
          continue;
        }
        if (Math.random() < profile.meleeAttackChance || unit.skill < 1) {
          target.attack(unit, enemy);
          unit.aiNextThink = currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
        } else {
          aiMoveUnit(unit, { x: enemy.x, y: enemy.y });
        }
        continue;
      }

      if (isTachiMasterAi(unit) && !isTachiMasterMoveReady(unit, profile, currentNow)) {
        unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
        continue;
      }

      if (target.isStraightMove(unit, enemy) && unit.skill >= dist && target.clearStraightPath(unit, enemy, enemy)) {
        aiMoveUnit(unit, { x: enemy.x, y: enemy.y });
        continue;
      }

      const acted = Math.random() < profile.chaseChance
        ? (aiPathMoveToward(unit, enemy) || aiStepToward(unit, enemy))
        : aiRandomMove(unit);
      if (!acted) aiBreakOut(unit, enemy);
      unit.aiNextThink = Math.max(unit.aiNextThink, currentNow + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
    }
  }

  function aiReactionDelay(distance, multiplier = 1) {
    return (400 + Math.max(1, distance) * 100 + Math.random() * 180) * multiplier;
  }

  function nearestEnemy(unit, enemyTeam) {
    const state = stateOf(target);
    let best = null;
    let bestDist = Infinity;
    for (const other of state.units) {
      if (!other.alive || other.team !== enemyTeam) continue;
      const dist = target.manhattan(unit, other);
      if (dist < bestDist) {
        best = other;
        bestDist = dist;
      }
    }
    return best;
  }

  function aiMoveUnit(unit, cell) {
    if (target.isUnitDisabled(unit)) return false;
    if (target.isUnitCastingNinju(unit)) return false;
    if (unit.moneyDart) return false;
    if (!target.weaponIsReady(unit)) return false;
    if (!cell || (!aiIgnoresSkillCosts(unit) && unit.skill < 1)) return false;
    if (!target.isStraightMove(unit, cell)) return false;
    const cost = Math.max(1, target.manhattan(unit, cell));
    if (!aiIgnoresSkillCosts(unit) && unit.skill < cost) return false;
    if (target.isPermanentObstacle(cell.x, cell.y) || target.objectAt(cell.x, cell.y)) return false;

    const targetUnit = target.unitAt(cell.x, cell.y);
    if (targetUnit && target.isUnitInvincible(targetUnit)) return false;
    if (targetUnit && targetUnit.team === unit.team) return false;
    if (!target.clearStraightPath(unit, cell, targetUnit)) return false;

    if (!aiIgnoresSkillCosts(unit)) unit.skill -= cost;
    target.moveUnit(unit, cell.x, cell.y);
    unit.aiNextThink = now(target) + 650 + Math.random() * 420;
    unit.aiPlanKey = "";
    unit.aiActionAt = 0;

    if (targetUnit) {
      target.collideWithEnemy(unit, targetUnit);
    } else {
      target.setMessage(`${unit.name} 已移動。`);
    }
    return true;
  }

  function aiStepToward(unit, enemy) {
    const options = [];
    const maxSteps = Math.max(1, Math.min(3, Math.floor(unit.skill)));
    const directions = [
      { dx: Math.sign(enemy.x - unit.x), dy: 0 },
      { dx: 0, dy: Math.sign(enemy.y - unit.y) },
      { dx: -Math.sign(enemy.x - unit.x), dy: 0 },
      { dx: 0, dy: -Math.sign(enemy.y - unit.y) },
    ];

    for (const direction of directions) {
      if (direction.dx === 0 && direction.dy === 0) continue;
      for (let step = maxSteps; step >= 1; step--) {
        const cell = { x: unit.x + direction.dx * step, y: unit.y + direction.dy * step };
        if (!target.inside(cell.x, cell.y)) continue;
        if (!target.clearStraightPath(unit, cell, null)) continue;
        if (target.isBlockedCell(cell.x, cell.y) || target.unitAt(cell.x, cell.y)) continue;
        options.push({ cell, score: target.manhattan(cell, enemy) + Math.random() * 0.6 });
        break;
      }
    }

    options.sort((a, b) => a.score - b.score);
    if (options[0]) return aiMoveUnit(unit, options[0].cell);
    return false;
  }

  function aiPathMoveToward(unit, enemy) {
    const nextCell = aiPathNextCell(unit, enemy);
    if (!nextCell) return false;
    return aiMoveUnit(unit, nextCell);
  }

  function aiPathNextCell(unit, enemy) {
    const maxSteps = Math.max(1, Math.min(3, Math.floor(unit.skill)));
    if (maxSteps < 1) return null;
    const startKey = `${unit.x},${unit.y}`;
    const queue = [{ x: unit.x, y: unit.y }];
    const cameFrom = new Map();
    cameFrom.set(startKey, "");
    let bestKey = startKey;
    let bestScore = target.manhattan(unit, enemy);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = `${current.x},${current.y}`;
      const score = target.manhattan(current, enemy);
      if (score < bestScore) {
        bestScore = score;
        bestKey = currentKey;
        if (score <= 1) break;
      }

      for (const n of target.neighbors(current.x, current.y)) {
        const key = `${n.x},${n.y}`;
        if (cameFrom.has(key)) continue;
        if (!target.inside(n.x, n.y)) continue;
        if (target.isBlockedCell(n.x, n.y)) continue;
        if (target.isPermanentObstacle(n.x, n.y) || target.objectAt(n.x, n.y)) continue;
        const other = target.unitAt(n.x, n.y);
        if (other && other.id !== unit.id) continue;
        cameFrom.set(key, currentKey);
        queue.push(n);
      }
    }

    if (bestKey === startKey) return null;

    const path = [];
    let cursor = bestKey;
    while (cursor && cursor !== startKey) {
      const [x, y] = cursor.split(",").map(Number);
      path.push({ x, y });
      cursor = cameFrom.get(cursor);
    }
    path.reverse();
    if (path.length === 0) return null;

    const first = path[0];
    const dirX = Math.sign(first.x - unit.x);
    const dirY = Math.sign(first.y - unit.y);
    let chosen = first;
    let steps = 1;
    while (steps < path.length && steps < maxSteps) {
      const cell = path[steps];
      if (Math.sign(cell.x - chosen.x) !== dirX || Math.sign(cell.y - chosen.y) !== dirY) break;
      chosen = cell;
      steps += 1;
    }
    return chosen;
  }

  function aiRandomMove(unit) {
    const options = [];
    const maxSteps = Math.max(1, Math.min(2, Math.floor(unit.skill)));
    for (const direction of [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]) {
      for (let step = 1; step <= maxSteps; step++) {
        const cell = { x: unit.x + direction.dx * step, y: unit.y + direction.dy * step };
        if (!target.inside(cell.x, cell.y) || target.isBlockedCell(cell.x, cell.y) || target.unitAt(cell.x, cell.y)) break;
        options.push(cell);
      }
    }
    if (options.length > 0) return aiMoveUnit(unit, options[Math.floor(Math.random() * options.length)]);
    return false;
  }

  function aiBreakOut(unit, enemy) {
    if (!target.weaponIsReady(unit)) {
      unit.aiNextThink = now(target) + 80;
      return true;
    }

    const options = target.neighbors(unit.x, unit.y)
      .map((cell) => ({ cell, object: target.objectAt(cell.x, cell.y) }))
      .filter((entry) => entry.object && entry.object.breakable);

    if (options.length === 0) return false;

    options.sort((a, b) => {
      const aScore = target.manhattan(a.cell, enemy) + a.object.hp / Math.max(1, a.object.maxHp);
      const bScore = target.manhattan(b.cell, enemy) + b.object.hp / Math.max(1, b.object.maxHp);
      return aScore - bScore;
    });

    target.attackCell(unit, options[0].cell);
    unit.aiNextThink = now(target) + 80 + Math.random() * 80;
    unit.aiPlanKey = "";
    unit.aiActionAt = 0;
    return true;
  }

  function aiIsTrappedByBreakable(unit) {
    let hasBreakableNeighbor = false;
    let hasOpenNeighbor = false;

    for (const cell of target.neighbors(unit.x, unit.y)) {
      if (!target.inside(cell.x, cell.y)) continue;
      const object = target.objectAt(cell.x, cell.y);
      if (object?.breakable) hasBreakableNeighbor = true;
      if (!target.isBlockedCell(cell.x, cell.y) && !object && !target.unitAt(cell.x, cell.y)) {
        hasOpenNeighbor = true;
      }
    }

    return hasBreakableNeighbor && !hasOpenNeighbor;
  }

  function tryAiNinjutsu(unit, profile, currentNow) {
    if (target.isUnitDisabled(unit)) return false;
    if ((unit.ninjuLockedUntil || 0) > currentNow) return false;
    if (unit.ninju || unit.moneyDart) return false;

    if (isRedGroupAi(unit)) return tryAiRedScheduledNinjutsu(unit, currentNow);

    if (isTachiMasterAi(unit)) {
      if (target.isSteelDefenseActive(unit) && unit.hp <= (profile.flashHpThreshold ?? 150)) {
        if (tryAiStartNinju(unit, "flash", profile.flashUseChance ?? 0, currentNow)) return true;
      }
      if (unit.hp < (profile.kakkiHpThreshold || 200) && unit.hp < unit.maxHp) {
        if (tryAiStartNinju(unit, "kakki", profile.kakkiUseChance ?? 1, currentNow)) return true;
      }
      if (!target.isSteelDefenseActive(unit)) return tryAiStartNinju(unit, "steel", profile.steelUseChance ?? 1, currentNow);
      if (Math.random() < profile.moneyDartReadyChance && aiCanStartMoneyDartAfterLineDelay(unit, currentNow)) {
        const dart = target.moneyDartRule();
        if (unit.skill < dart.cost) return false;
        unit.skill -= dart.cost;
        unit.moneyDartLineSince = 0;
        target.startMoneyDart(unit, currentNow, true);
        return true;
      }
      return false;
    }

    if (unit.controlMode === "ai_dart_only_master") {
      const steel = target.steelRule();
      if (!target.isSteelDefenseActive(unit) && (aiIgnoresSkillCosts(unit) || unit.skill >= steel.cost) && Math.random() < profile.steelUseChance) {
        if (!aiIgnoresSkillCosts(unit)) unit.skill -= steel.cost;
        unit.ninju = { type: "steel", phase: "active", startedAt: currentNow, duration: steel.castDurationMs, queue: 0 };
        target.playStatusEnergyUpSequence();
        return true;
      }
      if (Math.random() < profile.moneyDartReadyChance && aiCanStartMoneyDartAfterLineDelay(unit, currentNow)) {
        const dart = target.moneyDartRule();
        if (unit.skill < dart.cost) return false;
        unit.skill -= dart.cost;
        unit.moneyDartLineSince = 0;
        target.startMoneyDart(unit, currentNow, true);
        return true;
      }
      return false;
    }

    const steel = target.steelRule();
    if (!target.isSteelDefenseActive(unit) && (aiIgnoresSkillCosts(unit) || unit.skill >= steel.cost) && Math.random() < profile.steelUseChance) {
      if (!aiIgnoresSkillCosts(unit)) unit.skill -= steel.cost;
      unit.ninju = { type: "steel", phase: "active", startedAt: currentNow, duration: steel.castDurationMs, queue: 0 };
      target.playStatusEnergyUpSequence();
      return true;
    }

    if (tryAiStartNinju(unit, "hotBlood", profile.hotBloodUseChance, currentNow)) return true;
    if (tryAiStartNinju(unit, "wildfire", profile.wildfireUseChance, currentNow)) return true;

    if (Math.random() < profile.moneyDartReadyChance && (!isMoneyDartFocusedAi(unit) ? aiMoneyDartAimCell(unit) : aiCanStartMoneyDartAfterLineDelay(unit, currentNow))) {
      const dart = target.moneyDartRule();
      if (unit.skill < dart.cost) return false;
      unit.skill -= dart.cost;
      if (isMoneyDartFocusedAi(unit)) unit.moneyDartLineSince = 0;
      target.startMoneyDart(unit, currentNow, true);
      return true;
    }
    return false;
  }

  function tryAiStartNinju(unit, type, chance = 0, currentNow = now(target)) {
    if (!chance || Math.random() >= chance) return false;
    if (type === "hotBlood" && target.isHotBloodActive(unit)) return false;
    const rule = target.statusNinjuRule(type);
    if (rule.available === false) return false;
    const isAttackNinju = target.isAttackNinjuType(type);
    const ignoreSkillCost = aiIgnoresSkillCosts(unit);
    const skillCost = isAttackNinju || ignoreSkillCost ? 0 : rule.cost;
    if (unit.skill < skillCost) return false;
    const attackNinjuLevel = isAttackNinju ? (ignoreSkillCost ? 1 : target.consumeAttackNinjuSoulLevel(unit)) : 0;
    if (isAttackNinju && attackNinjuLevel < 1) return false;
    unit.skill -= skillCost;
    unit.ninju = { type, phase: "active", startedAt: currentNow, duration: rule.castDurationMs, queue: 0, attackNinjuLevel };
    target.playStatusNinjuSound(type);
    target.startHealNinjuCastEffects(unit, type, currentNow);
    return true;
  }

  function aiCanStartMoneyDartAfterLineDelay(unit, currentNow) {
    if (!aiMoneyDartAimCell(unit)) {
      unit.moneyDartLineSince = 0;
      return false;
    }
    if (!unit.moneyDartLineSince) unit.moneyDartLineSince = currentNow;
    return currentNow - unit.moneyDartLineSince >= (aiProfile(unit).moneyDartLineDelayMs || 300);
  }

  function tryAiThrowMoneyDart(unit, profile, currentNow) {
    if (!unit.moneyDart || currentNow < unit.moneyDart.invincibleUntil || target.isUnitCastingNinju(unit)) return false;
    if (Math.random() >= (profile.moneyDartThrowChance ?? 1)) return false;

    const aimCell = aiMoneyDartAimCell(unit);
    if (!aimCell) {
      unit.moneyDart = null;
      return false;
    }
    target.throwMoneyDart(unit, aimCell);
    return true;
  }

  function aiMoneyDartAimCell(unit) {
    const enemyTeam = unit.team === "blue" ? "grey" : "blue";
    const dirs = [
      { dx: 1, dy: 0, cell: { x: unit.x + 1, y: unit.y } },
      { dx: -1, dy: 0, cell: { x: unit.x - 1, y: unit.y } },
      { dx: 0, dy: 1, cell: { x: unit.x, y: unit.y + 1 } },
      { dx: 0, dy: -1, cell: { x: unit.x, y: unit.y - 1 } },
    ];
    let best = null;

    for (const dir of dirs) {
      let x = unit.x + dir.dx;
      let y = unit.y + dir.dy;
      let dist = 0;
      while (target.inside(x, y)) {
        if (target.isPermanentObstacle(x, y) || target.objectAt(x, y)) break;
        dist += 1;
        const other = target.unitAt(x, y);
        if (other) {
          if (other.team === enemyTeam && other.alive) {
            if (!best || dist < best.dist) best = { cell: dir.cell, dist };
          }
          break;
        }
        x += dir.dx;
        y += dir.dy;
      }
    }

    return best ? best.cell : null;
  }

  function aiStepToMoneyDartLine(unit, enemy) {
    const options = [];
    const maxSteps = Math.max(1, Math.min(3, Math.floor(unit.skill)));
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const direction of directions) {
      for (let step = maxSteps; step >= 1; step--) {
        const cell = { x: unit.x + direction.dx * step, y: unit.y + direction.dy * step };
        if (!target.inside(cell.x, cell.y)) continue;
        if (!target.clearStraightPath(unit, cell, null)) continue;
        if (target.isBlockedCell(cell.x, cell.y) || target.unitAt(cell.x, cell.y)) continue;
        if (cell.x !== enemy.x && cell.y !== enemy.y) continue;
        if (!target.clearStraightPath(cell, enemy, enemy)) continue;
        options.push({
          cell,
          score: target.manhattan(cell, enemy) + Math.random() * 0.4,
        });
        break;
      }
    }

    options.sort((a, b) => a.score - b.score);
    if (options[0]) return aiMoveUnit(unit, options[0].cell);
    return false;
  }

  Object.assign(target, {
    aiProfiles,
    tachiMasterMoveAggroMs,
    tachiMasterSoulSecondsPerLevel,
    tachiMasterSoulChargePerSecond,
    aiRedRetaliationLineDelayMs,
    aiProfile,
    isMoneyDartFocusedAi,
    isRedGroupAi,
    isTachiMasterAi,
    trackAiRecentDamage,
    isTachiMasterMoveReady,
    updateTachiMasterSoulCharge,
    aiIgnoresSkillCosts,
    aiRedChargeDelay,
    isDiagonalAdjacent,
    isOrthogonalLine,
    isInNineGrid,
    ensureAiRedTimers,
    queueAiRedRetaliation,
    aiRedWeaponAttack,
    aiTachiWeaponAttack,
    tryAiRedPendingAction,
    tryAiRedScheduledNinjutsu,
    tryAiRedCombatAction,
    updateAi,
    aiReactionDelay,
    nearestEnemy,
    aiMoveUnit,
    aiStepToward,
    aiPathMoveToward,
    aiPathNextCell,
    aiRandomMove,
    aiBreakOut,
    aiIsTrappedByBreakable,
    tryAiNinjutsu,
    tryAiStartNinju,
    aiCanStartMoneyDartAfterLineDelay,
    tryAiThrowMoneyDart,
    aiMoneyDartAimCell,
    aiStepToMoneyDartLine,
  });

  target.NindouAi = {
    aiProfiles,
    tachiMasterMoveAggroMs,
    tachiMasterSoulSecondsPerLevel,
    tachiMasterSoulChargePerSecond,
    aiRedRetaliationLineDelayMs,
    aiProfile,
    isMoneyDartFocusedAi,
    isRedGroupAi,
    isTachiMasterAi,
    trackAiRecentDamage,
    isTachiMasterMoveReady,
    updateTachiMasterSoulCharge,
    aiIgnoresSkillCosts,
    aiRedChargeDelay,
    isDiagonalAdjacent,
    isOrthogonalLine,
    isInNineGrid,
    ensureAiRedTimers,
    queueAiRedRetaliation,
    aiRedWeaponAttack,
    aiTachiWeaponAttack,
    tryAiRedPendingAction,
    tryAiRedScheduledNinjutsu,
    tryAiRedCombatAction,
    updateAi,
    aiReactionDelay,
    nearestEnemy,
    aiMoveUnit,
    aiStepToward,
    aiPathMoveToward,
    aiPathNextCell,
    aiRandomMove,
    aiBreakOut,
    aiIsTrappedByBreakable,
    tryAiNinjutsu,
    tryAiStartNinju,
    aiCanStartMoneyDartAfterLineDelay,
    tryAiThrowMoneyDart,
    aiMoneyDartAimCell,
    aiStepToMoneyDartLine,
    runAiProfileProbe,
  };
}
