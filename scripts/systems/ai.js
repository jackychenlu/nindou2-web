// ===== AI =====
const aiProfiles = {
  ai_beginner: {
    reactionMultiplier: 1,
    skillRegenMultiplier: 1,
    meleeAttackChance: 0.55,
    chaseChance: 0.84,
    thinkMinMs: 320,
    thinkRandMs: 360,
    steelUseChance: 0,
    moneyDartReadyChance: 0,
    moneyDartThrowChance: 0,
  },
  ai_red: {
    reactionMultiplier: 0.35,
    skillRegenMultiplier: 0,
    meleeAttackChance: 0,
    chaseChance: 0.12,
    thinkMinMs: 260,
    thinkRandMs: 180,
    steelUseChance: 0,
    moneyDartReadyChance: 0,
    moneyDartThrowChance: 0,
  },
  ai_tachi_master: {
    reactionMultiplier: 0.75,
    skillRegenMultiplier: 2,
    skillMax: tachiMasterSkillMax,
    meleeAttackChance: 0.72,
    chaseChance: 0.42,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 1,
    kakkiHpThreshold: 200,
    kakkiUseChance: 1,
    flashHpThreshold: 150,
    flashUseChance: 0.35,
    moneyDartReadyChance: 0.49,
    moneyDartThrowChance: 0.49,
    moneyDartLineDelayMs: 900,
  },
  ai_god: {
    reactionMultiplier: 0.1,
    skillRegenMultiplier: 4,
    meleeAttackChance: 0.65,
    chaseChance: 0.50,
    thinkMinMs: 50,
    thinkRandMs: 50,
    steelUseChance: 0.1,
    hotBloodUseChance: 0.1,
    wildfireUseChance: 1,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
  ai_money_dart_master: {
    reactionMultiplier: 0.5,
    skillRegenMultiplier: 2,
    meleeAttackChance: 0.86,
    chaseChance: 0.96,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 0.01,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
  ai_dart_only_master: {
    reactionMultiplier: 0.5,
    skillRegenMultiplier: 2,
    meleeAttackChance: 0,
    chaseChance: 0.98,
    thinkMinMs: 300,
    thinkRandMs: 300,
    steelUseChance: 0.01,
    moneyDartReadyChance: 1,
    moneyDartThrowChance: 1,
  },
};
const tachiMasterMoveAggroMs = 500;
const tachiMasterSoulSecondsPerLevel = 30;
const tachiMasterSoulChargePerSecond = soulStepsPerLevel / tachiMasterSoulSecondsPerLevel;

function aiProfile(unit) {
  return aiProfiles[unit?.controlMode] || aiProfiles.ai_beginner;
}

function isMoneyDartFocusedAi(unit) {
  return unit?.controlMode === "ai_money_dart_master" || unit?.controlMode === "ai_dart_only_master" || unit?.controlMode === "ai_tachi_master";
}

function isRedGroupAi(unit) {
  return unit?.controlMode === "ai_red";
}

function isTachiMasterAi(unit) {
  return unit?.controlMode === "ai_tachi_master";
}

function trackAiRecentDamage(unit, now) {
  if (!unit) return;
  const damageTaken = unit.damageTaken || 0;
  if (!Number.isFinite(unit.aiLastDamageTaken)) {
    unit.aiLastDamageTaken = damageTaken;
    return;
  }
  if (damageTaken > unit.aiLastDamageTaken) {
    unit.aiRecentlyDamagedUntil = now + tachiMasterMoveAggroMs;
  }
  unit.aiLastDamageTaken = damageTaken;
}

function isTachiMasterMoveReady(unit, profile, now) {
  if (!isTachiMasterAi(unit)) return true;
  const skillLimit = unit?.skillMax || profile?.skillMax || maxSkill;
  const skillReady = (unit?.skill || 0) >= skillLimit * 0.9;
  const recentlyDamaged = now < (unit?.aiRecentlyDamagedUntil || 0);
  return skillReady || recentlyDamaged;
}

function updateTachiMasterSoulCharge(unit, dt) {
  if (!isTachiMasterAi(unit) || !Number.isFinite(dt) || dt <= 0) return;
  const maxSteps = soulStepsPerLevel * soulMaxLevel;
  unit.soulSteps = Math.min(maxSteps, Math.max(0, unit.soulSteps || 0) + tachiMasterSoulChargePerSecond * dt);
}

function aiIgnoresSkillCosts(unit) {
  return isRedGroupAi(unit);
}

function aiRedRandomDelay(minMs, maxMs) {
  return minMs + Math.random() * Math.max(0, maxMs - minMs);
}

const aiRedRetaliationLineDelayMs = 500;

function aiRedChargeDelay(distance) {
  return 500 + Math.max(0, distance - 1) * 100;
}

function isDiagonalAdjacent(a, b) {
  return Boolean(a && b && Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1);
}

function isOrthogonalLine(unit, target) {
  return Boolean(unit && target && (unit.x === target.x || unit.y === target.y));
}

function isInNineGrid(unit, target) {
  return Boolean(unit && target && Math.max(Math.abs(unit.x - target.x), Math.abs(unit.y - target.y)) <= 1);
}

function ensureAiRedTimers(unit, now = performance.now()) {
  if (!isRedGroupAi(unit)) return;
  if (!Number.isFinite(unit.aiRedCloneAt)) unit.aiRedCloneAt = now + aiRedRandomDelay(0, 90000);
  if (!Number.isFinite(unit.aiRedSteelAt)) unit.aiRedSteelAt = now + aiRedRandomDelay(12000, 30000);
  if (!Number.isFinite(unit.aiRedAttackAt)) unit.aiRedAttackAt = now + aiRedRandomDelay(30000, 60000);
}

function rescheduleAiRedTimer(unit, timerKey, minMs, maxMs, now = performance.now()) {
  unit[timerKey] = now + aiRedRandomDelay(minMs, maxMs);
}

function queueAiRedRetaliation(unit, attacker, now = performance.now()) {
  if (!isRedGroupAi(unit) || !attacker || !attacker.alive || !unit.alive) return false;
  if (isOrthogonalLine(unit, attacker) && manhattan(unit, attacker) >= 1) {
    unit.aiRedPendingAction = {
      type: "ram",
      targetId: attacker.id,
      executeAt: now + aiRedRetaliationLineDelayMs,
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
    executeAt: now + 120,
  };
  unit.aiNextThink = Math.min(unit.aiNextThink || Infinity, unit.aiRedPendingAction.executeAt);
  return true;
}

function aiRedWeaponAttack(unit, target) {
  if (!target || !target.alive) return false;
  if (isUnitDisabled(unit) || unit.moneyDart) return false;
  if (isUnitCastingNinju(unit) || isUnitInNinjuGap(unit)) return false;
  if (!weaponIsReady(unit)) return false;
  const dir = weaponDirectionFromTarget(unit, target);
  if (!dir || !isCellInWeaponRange(unit, target, dir)) return false;
  attack(unit, target);
  return true;
}

function aiTachiWeaponAttack(unit, target) {
  if (!isTachiMasterAi(unit) || !target || !target.alive) return false;
  if (isUnitInvincible(target)) return false;
  if (isUnitDisabled(unit) || unit.moneyDart) return false;
  if (isUnitCastingNinju(unit) || isUnitInNinjuGap(unit)) return false;
  if (!weaponIsReady(unit)) return false;
  const dir = weaponDirectionFromTarget(unit, target);
  if (!dir || !isCellInWeaponRange(unit, target, dir)) return false;
  attack(unit, target);
  return true;
}

function aiRedRamTowardTarget(unit, target) {
  if (!target || !target.alive) return false;
  if (isStraightMove(unit, target) && clearStraightPath(unit, target, target)) {
    return aiMoveUnit(unit, { x: target.x, y: target.y });
  }
  return aiPathMoveToward(unit, target) || aiStepToward(unit, target);
}

function tryAiRedPendingAction(unit, now) {
  const pending = unit.aiRedPendingAction;
  if (!pending || now < pending.executeAt) return false;
  unit.aiRedPendingAction = null;
  if (pending.type === "clone") return tryAiStartNinju(unit, "clone", 1, now);
  const target = state.units.find((other) => other.id === pending.targetId && other.alive && other.team !== unit.team);
  if (!target) return false;
  if (pending.type === "weapon") return aiRedWeaponAttack(unit, target);
  return aiRedRamTowardTarget(unit, target);
}

function tryAiRedScheduledNinjutsu(unit, now) {
  ensureAiRedTimers(unit, now);

  if (now >= unit.aiRedCloneAt) {
    if (tryAiStartNinju(unit, "clone", 1, now)) {
      rescheduleAiRedTimer(unit, "aiRedCloneAt", 0, 90000, now);
      return true;
    }
    unit.aiRedCloneAt = now + 250;
  }

  if (now >= unit.aiRedSteelAt) {
    if (!isSteelDefenseActive(unit) && tryAiStartNinju(unit, "steel", 1, now)) {
      rescheduleAiRedTimer(unit, "aiRedSteelAt", 12000, 30000, now);
      return true;
    }
    unit.aiRedSteelAt = now + 250;
  }

  if (now >= unit.aiRedAttackAt) {
    const type = Math.random() < 0.5 ? "wildfire" : "freeze";
    if (tryAiStartNinju(unit, type, 1, now)) {
      rescheduleAiRedTimer(unit, "aiRedAttackAt", 30000, 60000, now);
      return true;
    }
    unit.aiRedAttackAt = now + 250;
  }

  return false;
}

function tryAiRedCombatAction(unit, target, now) {
  const dist = manhattan(unit, target);
  if (isInNineGrid(unit, target)) {
    if (aiRedWeaponAttack(unit, target)) {
      unit.aiNextThink = now + 260 + Math.random() * 180;
    } else {
      unit.aiNextThink = now + 120;
    }
    return true;
  }

  if (isOrthogonalLine(unit, target) && dist >= 1) {
    if (Math.random() < 0.15 && tryAiStartNinju(unit, "clone", 1, now)) {
      unit.aiNextThink = now + 120;
      return true;
    }
    unit.aiRedPendingAction = {
      type: "ram",
      targetId: target.id,
      executeAt: now + aiRedChargeDelay(dist),
    };
    unit.aiNextThink = unit.aiRedPendingAction.executeAt;
    return true;
  }

  const chaseChance = target.hp <= target.maxHp * 0.3 ? 0.5 : aiProfile(unit).chaseChance;
  if (Math.random() < chaseChance) {
    const acted = aiPathMoveToward(unit, target) || aiStepToward(unit, target);
    if (acted) unit.aiNextThink = Math.max(unit.aiNextThink, now + 450 + Math.random() * 250);
    return acted;
  }

  unit.aiNextThink = Math.max(unit.aiNextThink, now + 700 + Math.random() * 700);
  return true;
}

// 更新電腦角色的判斷、攻擊、移動與脫困行為。
function updateAi(dt, now) {
  if (state.gameOver) return;

  for (const unit of state.units) {
    if (!unit.alive || unit.respawning) continue;
    updateTachiMasterSoulCharge(unit, dt);
    if (canControlUnit(unit) || isUnitCastingNinju(unit) || isUnitDisabled(unit)) continue;

    const profile = aiProfile(unit);
    trackAiRecentDamage(unit, now);
    if (aiIgnoresSkillCosts(unit)) {
      unit.skill = maxSkill;
      ensureAiRedTimers(unit, now);
    }
    const skillLimit = unit.skillMax || profile.skillMax || maxSkill;
    unit.skill = Math.min(skillLimit, unit.skill + aiSkillRegenPerSecond * profile.skillRegenMultiplier * dt);

    if (isRedGroupAi(unit) && tryAiRedPendingAction(unit, now)) {
      unit.aiNextThink = now + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
      continue;
    }

    if (tryAiNinjutsu(unit, profile, now)) {
      unit.aiNextThink = now + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
      continue;
    }

    if (tryAiThrowMoneyDart(unit, profile, now)) {
      unit.aiNextThink = now + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
      continue;
    }

    const target = nearestEnemy(unit, unit.team === "blue" ? "grey" : "blue");
    if (!target) {
      unit.aiNextThink = now + 1000;
      checkVictory();
      continue;
    }

    if (unit.moveT >= 1 && aiIsTrappedByBreakable(unit) && aiBreakOut(unit, target)) {
      continue;
    }

    if (unit.moveT < 1 || now < unit.aiNextThink) continue;

    const dist = manhattan(unit, target);
    const planKey = `${target.id}:${target.x},${target.y}:${unit.x},${unit.y}`;
    if (unit.aiPlanKey !== planKey) {
      unit.aiPlanKey = planKey;
      unit.aiActionAt = now + aiReactionDelay(dist, profile.reactionMultiplier);
      continue;
    }
    if (now < unit.aiActionAt) continue;

    unit.aiPlanKey = "";
    unit.aiActionAt = 0;

    if (isRedGroupAi(unit)) {
      if (tryAiRedCombatAction(unit, target, now)) continue;
      unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
      continue;
    }

    if (unit.controlMode === "ai_dart_only_master") {
      // 尬鏢神人：不近戰、不撞人、不用武器，只追線丟錢鏢。
      const acted = aiStepToMoneyDartLine(unit, target) || aiPathMoveToward(unit, target) || aiStepToward(unit, target) || aiRandomMove(unit);
      if (!acted) aiBreakOut(unit, target);
      unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
      continue;
    }

    if (isTachiMasterAi(unit) && !isSteelDefenseActive(unit)) {
      // 太刀達人偏保守：沒有鋼鐵時不主動攻擊，多數時間原地集技。
      if (isTachiMasterMoveReady(unit, profile, now)) {
        const acted = aiStepToMoneyDartLine(unit, target) || aiRandomMove(unit);
        if (!acted) aiBreakOut(unit, target);
      }
      unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
      continue;
    }

    // 錢鏢神人：先優先走到可直線命中的位置，再進入一般近戰行為。
    if (unit.controlMode === "ai_money_dart_master" && !unit.moneyDart && !aiMoneyDartAimCell(unit)) {
      if (aiStepToMoneyDartLine(unit, target)) {
        unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
        continue;
      }
    }

    if (isTachiMasterAi(unit) && aiTachiWeaponAttack(unit, target)) {
      unit.aiNextThink = now + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
      continue;
    }

    if (dist === 1) {
      if (isUnitInvincible(target)) {
        unit.aiNextThink = now + 500 + Math.random() * 500;
        continue;
      }
      if (Math.random() < profile.meleeAttackChance || unit.skill < 1) {
        attack(unit, target);
        unit.aiNextThink = now + profile.thinkMinMs + Math.random() * profile.thinkRandMs;
      } else {
        aiMoveUnit(unit, { x: target.x, y: target.y });
      }
      continue;
    }

    if (isTachiMasterAi(unit) && !isTachiMasterMoveReady(unit, profile, now)) {
      unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
      continue;
    }

    if (isStraightMove(unit, target) && unit.skill >= dist && clearStraightPath(unit, target, target)) {
      aiMoveUnit(unit, { x: target.x, y: target.y });
      continue;
    }

    const acted = Math.random() < profile.chaseChance
      ? (aiPathMoveToward(unit, target) || aiStepToward(unit, target))
      : aiRandomMove(unit);
    if (!acted) aiBreakOut(unit, target);
    unit.aiNextThink = Math.max(unit.aiNextThink, now + profile.thinkMinMs + Math.random() * profile.thinkRandMs);
  }
}

// 依照距離計算 AI 反應時間，越遠反應越慢。
function aiReactionDelay(distance, multiplier = 1) {
  return (400 + Math.max(1, distance) * 100 + Math.random() * 180) * multiplier;
}

// 找出離自己最近的敵方角色。
function nearestEnemy(unit, enemyTeam) {
  let best = null;
  let bestDist = Infinity;
  for (const other of state.units) {
    if (!other.alive || other.team !== enemyTeam) continue;
    const dist = manhattan(unit, other);
    if (dist < bestDist) {
      best = other;
      bestDist = dist;
    }
  }
  return best;
}

// 讓 AI 消耗技移動到指定格子。
function aiMoveUnit(unit, cell) {
  if (isUnitDisabled(unit)) return false;
  if (isUnitCastingNinju(unit)) return false;
  if (unit.moneyDart) return false;
  if (!weaponIsReady(unit)) return false;
  if (!cell || (!aiIgnoresSkillCosts(unit) && unit.skill < 1)) return false;
  if (!isStraightMove(unit, cell)) return false;
  const cost = Math.max(1, manhattan(unit, cell));
  if (!aiIgnoresSkillCosts(unit) && unit.skill < cost) return false;
  if (isPermanentObstacle(cell.x, cell.y) || objectAt(cell.x, cell.y)) return false;

  const targetUnit = unitAt(cell.x, cell.y);
  if (targetUnit && isUnitInvincible(targetUnit)) return false;
  if (targetUnit && targetUnit.team === unit.team) return false;
  if (!clearStraightPath(unit, cell, targetUnit)) return false;

  if (!aiIgnoresSkillCosts(unit)) unit.skill -= cost;
  moveUnit(unit, cell.x, cell.y);
  unit.aiNextThink = performance.now() + 650 + Math.random() * 420;
  unit.aiPlanKey = "";
  unit.aiActionAt = 0;

  if (targetUnit) {
    collideWithEnemy(unit, targetUnit);
  } else {
    setMessage(`${unit.name} 已移動。`);
  }
  return true;
}

// 計算 AI 往目標靠近時下一步可走格。
function aiStepToward(unit, target) {
  const options = [];
  const maxSteps = Math.max(1, Math.min(3, Math.floor(unit.skill)));
  const directions = [
    { dx: Math.sign(target.x - unit.x), dy: 0 },
    { dx: 0, dy: Math.sign(target.y - unit.y) },
    { dx: -Math.sign(target.x - unit.x), dy: 0 },
    { dx: 0, dy: -Math.sign(target.y - unit.y) },
  ];

  for (const direction of directions) {
    if (direction.dx === 0 && direction.dy === 0) continue;
    for (let step = maxSteps; step >= 1; step--) {
      const cell = { x: unit.x + direction.dx * step, y: unit.y + direction.dy * step };
      if (!inside(cell.x, cell.y)) continue;
      if (!clearStraightPath(unit, cell, null)) continue;
      if (isBlockedCell(cell.x, cell.y) || unitAt(cell.x, cell.y)) continue;
      options.push({ cell, score: manhattan(cell, target) + Math.random() * 0.6 });
      break;
    }
  }

  options.sort((a, b) => a.score - b.score);
  if (options[0]) return aiMoveUnit(unit, options[0].cell);
  return false;
}

// 以 BFS 找繞路下一步，避免在障礙旁左右抖動。
function aiPathMoveToward(unit, target) {
  const nextCell = aiPathNextCell(unit, target);
  if (!nextCell) return false;
  return aiMoveUnit(unit, nextCell);
}

function aiPathNextCell(unit, target) {
  const maxSteps = Math.max(1, Math.min(3, Math.floor(unit.skill)));
  if (maxSteps < 1) return null;
  const startKey = `${unit.x},${unit.y}`;
  const queue = [{ x: unit.x, y: unit.y }];
  const cameFrom = new Map();
  cameFrom.set(startKey, "");
  let bestKey = startKey;
  let bestScore = manhattan(unit, target);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.x},${current.y}`;
    const score = manhattan(current, target);
    if (score < bestScore) {
      bestScore = score;
      bestKey = currentKey;
      if (score <= 1) break;
    }

    for (const n of neighbors(current.x, current.y)) {
      const key = `${n.x},${n.y}`;
      if (cameFrom.has(key)) continue;
      if (!inside(n.x, n.y)) continue;
      if (isBlockedCell(n.x, n.y)) continue;
      if (isPermanentObstacle(n.x, n.y) || objectAt(n.x, n.y)) continue;
      const other = unitAt(n.x, n.y);
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

// 讓 AI 在可走方向中隨機移動。
function aiRandomMove(unit) {
  const options = [];
  const maxSteps = Math.max(1, Math.min(2, Math.floor(unit.skill)));
  for (const direction of [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]) {
    for (let step = 1; step <= maxSteps; step++) {
      const cell = { x: unit.x + direction.dx * step, y: unit.y + direction.dy * step };
      if (!inside(cell.x, cell.y) || isBlockedCell(cell.x, cell.y) || unitAt(cell.x, cell.y)) break;
      options.push(cell);
    }
  }
  if (options.length > 0) return aiMoveUnit(unit, options[Math.floor(Math.random() * options.length)]);
  return false;
}

// AI 被草或障礙困住時，嘗試揮砍旁邊物件脫困。
function aiBreakOut(unit, target) {
  if (!weaponIsReady(unit)) {
    unit.aiNextThink = performance.now() + 80;
    return true;
  }

  const options = neighbors(unit.x, unit.y)
    .map((cell) => ({ cell, object: objectAt(cell.x, cell.y) }))
    .filter((entry) => entry.object && entry.object.breakable);

  if (options.length === 0) return false;

  options.sort((a, b) => {
    const aScore = manhattan(a.cell, target) + a.object.hp / Math.max(1, a.object.maxHp);
    const bScore = manhattan(b.cell, target) + b.object.hp / Math.max(1, b.object.maxHp);
    return aScore - bScore;
  });

  attackCell(unit, options[0].cell);
  unit.aiNextThink = performance.now() + 80 + Math.random() * 80;
  unit.aiPlanKey = "";
  unit.aiActionAt = 0;
  return true;
}

function aiIsTrappedByBreakable(unit) {
  let hasBreakableNeighbor = false;
  let hasOpenNeighbor = false;

  for (const cell of neighbors(unit.x, unit.y)) {
    if (!inside(cell.x, cell.y)) continue;
    const object = objectAt(cell.x, cell.y);
    if (object?.breakable) hasBreakableNeighbor = true;
    if (!isBlockedCell(cell.x, cell.y) && !object && !unitAt(cell.x, cell.y)) {
      hasOpenNeighbor = true;
    }
  }

  return hasBreakableNeighbor && !hasOpenNeighbor;
}

function tryAiNinjutsu(unit, profile, now) {
  if (isUnitDisabled(unit)) return false;
  if ((unit.ninjuLockedUntil || 0) > now) return false;
  if (unit.ninju || unit.moneyDart) return false;

  if (isRedGroupAi(unit)) {
    return tryAiRedScheduledNinjutsu(unit, now);
  }

  if (isTachiMasterAi(unit)) {
    if (isSteelDefenseActive(unit) && unit.hp <= (profile.flashHpThreshold ?? 150)) {
      if (tryAiStartNinju(unit, "flash", profile.flashUseChance ?? 0, now)) return true;
    }
    if (unit.hp < (profile.kakkiHpThreshold || 200) && unit.hp < unit.maxHp) {
      if (tryAiStartNinju(unit, "kakki", profile.kakkiUseChance ?? 1, now)) return true;
    }
    if (!isSteelDefenseActive(unit)) {
      return tryAiStartNinju(unit, "steel", profile.steelUseChance ?? 1, now);
    }
    if (Math.random() < profile.moneyDartReadyChance && aiCanStartMoneyDartAfterLineDelay(unit, now)) {
      const dart = moneyDartRule();
      if (unit.skill < dart.cost) return false;
      unit.skill -= dart.cost;
      unit.moneyDartLineSince = 0;
      startMoneyDart(unit, now, true);
      return true;
    }
    return false;
  }

  if (unit.controlMode === "ai_dart_only_master") {
    const steel = steelRule();
    if (!isSteelDefenseActive(unit) && (aiIgnoresSkillCosts(unit) || unit.skill >= steel.cost) && Math.random() < profile.steelUseChance) {
      if (!aiIgnoresSkillCosts(unit)) unit.skill -= steel.cost;
      unit.ninju = { type: "steel", phase: "active", startedAt: now, duration: steel.castDurationMs, queue: 0 };
      playStatusEnergyUpSequence();
      return true;
    }
    if (Math.random() < profile.moneyDartReadyChance && aiCanStartMoneyDartAfterLineDelay(unit, now)) {
      const dart = moneyDartRule();
      if (unit.skill < dart.cost) return false;
      unit.skill -= dart.cost;
      unit.moneyDartLineSince = 0;
      startMoneyDart(unit, now, true);
      return true;
    }
    return false;
  }

  const steel = steelRule();
  if (!isSteelDefenseActive(unit) && (aiIgnoresSkillCosts(unit) || unit.skill >= steel.cost) && Math.random() < profile.steelUseChance) {
    if (!aiIgnoresSkillCosts(unit)) unit.skill -= steel.cost;
    unit.ninju = { type: "steel", phase: "active", startedAt: now, duration: steel.castDurationMs, queue: 0 };
    playStatusEnergyUpSequence();
    return true;
  }

  if (tryAiStartNinju(unit, "hotBlood", profile.hotBloodUseChance, now)) return true;
  if (tryAiStartNinju(unit, "wildfire", profile.wildfireUseChance, now)) return true;

  // 只有有直線可命中的敵人時才準備錢鏢，避免拿了就亂丟。
  if (Math.random() < profile.moneyDartReadyChance && (!isMoneyDartFocusedAi(unit) ? aiMoneyDartAimCell(unit) : aiCanStartMoneyDartAfterLineDelay(unit, now))) {
    const dart = moneyDartRule();
    if (unit.skill < dart.cost) return false;
    unit.skill -= dart.cost;
    if (isMoneyDartFocusedAi(unit)) unit.moneyDartLineSince = 0;
    startMoneyDart(unit, now, true);
    return true;
  }
  return false;
}

function tryAiStartNinju(unit, type, chance = 0, now = performance.now()) {
  if (!chance || Math.random() >= chance) return false;
  if (type === "hotBlood" && isHotBloodActive(unit)) return false;
  const rule = statusNinjuRule(type);
  if (rule.available === false) return false;
  const isAttackNinju = isAttackNinjuType(type);
  const ignoreSkillCost = aiIgnoresSkillCosts(unit);
  const skillCost = isAttackNinju || ignoreSkillCost ? 0 : rule.cost;
  if (unit.skill < skillCost) return false;
  const attackNinjuLevel = isAttackNinju ? (ignoreSkillCost ? 1 : consumeAttackNinjuSoulLevel(unit)) : 0;
  if (isAttackNinju && attackNinjuLevel < 1) return false;
  unit.skill -= skillCost;
  unit.ninju = { type, phase: "active", startedAt: now, duration: rule.castDurationMs, queue: 0, attackNinjuLevel };
  playStatusNinjuSound(type);
  startHealNinjuCastEffects(unit, type, now);
  return true;
}

function aiCanStartMoneyDartAfterLineDelay(unit, now) {
  if (!aiMoneyDartAimCell(unit)) {
    unit.moneyDartLineSince = 0;
    return false;
  }
  if (!unit.moneyDartLineSince) unit.moneyDartLineSince = now;
  return now - unit.moneyDartLineSince >= (aiProfile(unit).moneyDartLineDelayMs || 300);
}

function tryAiThrowMoneyDart(unit, profile, now) {
  if (!unit.moneyDart || now < unit.moneyDart.invincibleUntil || isUnitCastingNinju(unit)) return false;

  if (Math.random() >= (profile.moneyDartThrowChance ?? 1)) return false;

  const aimCell = aiMoneyDartAimCell(unit);
  if (!aimCell) {
    // 目標不在直線時取消手持，回到移動找線。
    unit.moneyDart = null;
    return false;
  }
  throwMoneyDart(unit, aimCell);
  return true;
}

// AI 錢鏢瞄準：只對同列/同行且中間無阻擋的敵人出手，優先最近目標。
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
    while (inside(x, y)) {
      if (isPermanentObstacle(x, y) || objectAt(x, y)) break;
      dist += 1;
      const other = unitAt(x, y);
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

// 錢鏢神人走位：往「能和目標同列/同行且可直線命中」的格子靠。
function aiStepToMoneyDartLine(unit, target) {
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
      if (!inside(cell.x, cell.y)) continue;
      if (!clearStraightPath(unit, cell, null)) continue;
      if (isBlockedCell(cell.x, cell.y) || unitAt(cell.x, cell.y)) continue;
      if (cell.x !== target.x && cell.y !== target.y) continue;
      if (!clearStraightPath(cell, target, target)) continue;
      options.push({
        cell,
        score: manhattan(cell, target) + Math.random() * 0.4,
      });
      break;
    }
  }

  options.sort((a, b) => a.score - b.score);
  if (options[0]) return aiMoveUnit(unit, options[0].cell);
  return false;
}

function runAiProfileProbe() {
  const tachi = { controlMode: "ai_tachi_master", skill: 16, skillMax: 18, soulSteps: 0, damageTaken: 4 };
  const lowSkillTachi = { controlMode: "ai_tachi_master", skill: 10, skillMax: 18, aiRecentlyDamagedUntil: 1200 };
  const red = { controlMode: "ai_red", x: 4, y: 4 };
  const target = { x: 6, y: 4 };
  const diagonal = { x: 5, y: 5 };
  const far = { x: 7, y: 7 };

  trackAiRecentDamage(tachi, 1000);
  tachi.damageTaken = 8;
  trackAiRecentDamage(tachi, 1100);
  updateTachiMasterSoulCharge(tachi, 30);
  updateTachiMasterSoulCharge(tachi, 999);

  return {
    profileKeys: Object.keys(aiProfiles),
    tachiProfile: aiProfile(tachi),
    fallbackProfile: aiProfile({ controlMode: "unknown" }),
    focusFlags: ["ai_money_dart_master", "ai_dart_only_master", "ai_tachi_master", "ai_beginner"].map((controlMode) => isMoneyDartFocusedAi({ controlMode })),
    redFlags: ["ai_red", "ai_god"].map((controlMode) => isRedGroupAi({ controlMode })),
    tachiFlags: ["ai_tachi_master", "ai_red"].map((controlMode) => isTachiMasterAi({ controlMode })),
    recentDamage: {
      aiLastDamageTaken: tachi.aiLastDamageTaken,
      aiRecentlyDamagedUntil: tachi.aiRecentlyDamagedUntil,
    },
    moveReady: [
      isTachiMasterMoveReady(tachi, aiProfile(tachi), 1100),
      isTachiMasterMoveReady(lowSkillTachi, aiProfile(lowSkillTachi), 1100),
      isTachiMasterMoveReady(lowSkillTachi, aiProfile(lowSkillTachi), 1300),
      isTachiMasterMoveReady({ controlMode: "ai_beginner", skill: 0 }, aiProfile({ controlMode: "ai_beginner" }), 1300),
    ],
    soulSteps: tachi.soulSteps,
    ignoresSkillCosts: [aiIgnoresSkillCosts(red), aiIgnoresSkillCosts(tachi)],
    redChargeDelays: [aiRedChargeDelay(0), aiRedChargeDelay(1), aiRedChargeDelay(4)],
    geometry: {
      diagonal: isDiagonalAdjacent(red, diagonal),
      orthogonal: isOrthogonalLine(red, target),
      nineGridA: isInNineGrid(red, diagonal),
      nineGridB: isInNineGrid(red, far),
    },
  };
}

globalThis.NindouAi = {
  aiProfiles,
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
};
