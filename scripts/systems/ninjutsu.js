// ===== Ninjutsu System =====
function updateNinju(now) {
  for (const unit of state.units) {
    if (!unit.ninju) continue;

    if (unit.ninju.phase === "active") {
      if (now - unit.ninju.startedAt < unit.ninju.duration) continue;
      refreshStatusNinju(unit, unit.ninju.type, now);
      const queuedNinjutsu = queuedNinjuActions(unit.ninju);

      if (queuedNinjutsu.length > 0) {
        // 先依點擊順序打完 queue 裡的忍術，錢鏢與道具延後帶著
        const [nextAction, ...remainingNinjutsu] = queuedNinjutsu;
        unit.ninju = { type: unit.ninju.type, phase: "gap", nextAction, nextType: nextAction.type, nextAttackNinjuLevel: nextAction.attackNinjuLevel || 0, startedAt: now, duration: ninjuChainMaxGap, queue: queuedNinjutsu.length, pendingNinjutsu: remainingNinjutsu, gapMoves: 0, pendingMoneyDart: unit.ninju.pendingMoneyDart, pendingConsumables: unit.ninju.pendingConsumables };
        if (unit.id === playerUnitId) setMessage(`${unit.name}：忍術連段空檔中。`);
      } else if (unit.ninju.pendingMoneyDart) {
        // queue 清空後才輪到錢鏢
        unit.ninju = { type: unit.ninju.type, phase: "gap", nextType: "moneyDart", startedAt: now, duration: ninjuChainGap, queue: 0, gapMoves: 0, pendingConsumables: unit.ninju.pendingConsumables };
        if (unit.id === playerUnitId) setMessage(`${unit.name}：錢鏢接段空檔中。`);
      } else if (unit.ninju.pendingConsumables?.length) {
        const [nextType, ...remainingQueue] = unit.ninju.pendingConsumables;
        unit.ninju = null;
        executeConsumableItem(unit, nextType, now, remainingQueue);
      } else {
        unit.ninju = null;
        if (unit.id === playerUnitId) setMessage(`${unit.name}：忍術施放完成。`);
      }
      continue;
    }

    if (unit.ninju.phase === "gap") {
      const elapsed = now - unit.ninju.startedAt;
      const firstMoveSucceeded = (unit.ninju.gapMoves || 0) > 0;
      if (!firstMoveSucceeded && elapsed < unit.ninju.duration) continue;
      if (unit.ninju.nextType === "moneyDart") {
        unit.ninju = null;
        startMoneyDart(unit, now, true);
      } else {
        const action = unit.ninju.nextAction || ninjuActionEntry(unit.ninju.nextType || unit.ninju.type, unit.ninju.nextAttackNinjuLevel || 0);
        startStatusNinjuActive(unit, action, now, unit.ninju.pendingNinjutsu || [], unit.ninju.pendingMoneyDart, unit.ninju.pendingConsumables || []);
        if (canControlUnit(unit)) playSound("useNinju");
        if (unit.id === playerUnitId) setMessage(`${unit.name}：忍術續接完成。`);
      }
    }
  }
}

function ninjuActionEntry(type, attackNinjuLevel = 0) {
  return { type, attackNinjuLevel };
}

function queuedNinjuActions(ninju) {
  if (!ninju) return [];
  if (Array.isArray(ninju.pendingNinjutsu)) return ninju.pendingNinjutsu;
  if (!ninju.queue) return [];
  return Array.from({ length: ninju.queue }, () => ninjuActionEntry(ninju.pendingType || ninju.type, ninju.pendingAttackNinjuLevel || 0));
}

function setQueuedNinjuActions(ninju, actions) {
  ninju.pendingNinjutsu = actions;
  ninju.queue = actions.length;
  const next = actions[actions.length - 1];
  ninju.pendingType = next?.type;
  ninju.pendingAttackNinjuLevel = next?.attackNinjuLevel || 0;
}

function queueNinjuAction(unit, action) {
  const actions = [...queuedNinjuActions(unit.ninju), action];
  setQueuedNinjuActions(unit.ninju, actions);
}

function startStatusNinjuActive(unit, action, now, pendingNinjutsu = [], pendingMoneyDart = false, pendingConsumables = []) {
  const type = action.type;
  unit.ninju = { type, phase: "active", startedAt: now, duration: statusNinjuRule(type).castDurationMs, queue: 0, pendingNinjutsu: [], chainMoves: ninjuFollowupMoveAllowance, attackNinjuLevel: action.attackNinjuLevel || 0, pendingMoneyDart, pendingConsumables };
  setQueuedNinjuActions(unit.ninju, pendingNinjutsu);
  playStatusNinjuSound(type);
  startHealNinjuCastEffects(unit, type, now);
}

function updateProjectiles(now) {
  if (!state.projectiles) return;
  state.projectiles.length = 0;
}

// 取得角色目前仍在播放的錢鏢出手動畫。
function activeMoneyDartCast(unit) {
  if (!state.moneyDartCasts) return null;
  const now = performance.now();
  return state.moneyDartCasts.find((cast) => cast.unitId === unit.id && now - cast.startedAt < cast.duration) || null;
}

function useSteelNinju() {
  useStatusNinju("steel", "Steel");
}

function useHotBloodNinju() {
  useStatusNinju("hotBlood", "Hot blood");
}

function useFlashNinju() {
  useAttackNinju("flash");
}

function useAttackNinju(type) {
  const config = attackNinjuConfigs[type];
  useStatusNinju(type, config?.label || type);
}

function useSpecialNinju(type) {
  const config = specialNinjuConfigs[type];
  useStatusNinju(type, config?.label || type);
}

function useGenkiNinju() {
  useStatusNinju("genki", localizedNinjuTypeLabel("genki"));
}

function useKakkiNinju() {
  useStatusNinju("kakki", localizedNinjuTypeLabel("kakki"));
}

function useShinkiNinju() {
  useStatusNinju("shinki", localizedNinjuTypeLabel("shinki"));
}

function useStatusNinju(type, label) {
  const unit = selectedUnit();
  if (!unit || !canControlUnit(unit)) return;
  const rule = statusNinjuRule(type);
  if (rule.available === false) return;
  const canQueueCurrentNinju = Boolean(unit.ninju && isStatusNinjuType(unit.ninju.type));
  if (isUnitDisabled(unit) && !canQueueCurrentNinju && !canUseNinjuDuringConsumable(unit)) {
    setMessage(`${unit.name}：目前無法行動。`);
    return;
  }
  if (unit.moneyDart) {
    setMessage(`${unit.name}：拿著錢鏢時不能使用忍術。`);
    return;
  }
  if ((unit.ninjuLockedUntil || 0) > performance.now()) {
    setMessage(`${unit.name}：現在還不能使用忍術。`);
    return;
  }
  const isAttackNinju = isAttackNinjuType(type);
  const skillCost = isAttackNinju ? 0 : rule.cost;
  if (unit.skill < skillCost) {
    setMessage(`${label}需要 ${rule.cost} 技。`);
    return;
  }

  const attackNinjuLevel = isAttackNinju ? consumeAttackNinjuSoulLevel(unit) : 0;
  if (isAttackNinju && attackNinjuLevel < 1) {
    setMessage(`${label}需要 1 級魂。`);
    return;
  }

  unit.skill -= skillCost;
  const now = performance.now();
  const action = ninjuActionEntry(type, attackNinjuLevel);

  if (unit.consumableUse && !unit.ninju) {
    unit.consumableUse.pendingNinjutsu = [...(unit.consumableUse.pendingNinjutsu || []), action];
    setMessage(`${unit.name} 已排入${label}。`);
    playSound("useNinju");
    clearDragState();
    return;
  }

  if (unit.ninju && isStatusNinjuType(unit.ninju.type)) {
    queueNinjuAction(unit, action);
    setMessage(`${unit.name} 已排入${label}。`);
  } else {
    startStatusNinjuActive(unit, action, now);
    setMessage(`${unit.name} 使用了${label}。`);
  }
  playSound("useNinju");
  clearDragState();
}

function useMoneyDart() {
  const unit = selectedUnit();
  if (!unit || !canControlUnit(unit)) return;
  const rule = moneyDartRule();
  const canUseDuringConsumable = canUseNinjuDuringConsumable(unit);
  if (isUnitDisabled(unit) && !canUseDuringConsumable) {
    setMessage(`${unit.name}：目前無法行動。`);
    return;
  }
  if (unit.skill < rule.cost) {
    setMessage(`${localizedNinjuTypeLabel("moneyDart")}需要 ${rule.cost} 技。`);
    return;
  }
  if (unit.moneyDart) {
    setMessage(`${unit.name}：錢鏢已經備好。`);
    return;
  }
  if (unit.moveTrail && (performance.now() - unit.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${unit.name}：移動中不能使用忍術。`);
    return;
  }
  if ((unit.ninjuLockedUntil || 0) > performance.now()) {
    setMessage(`${unit.name}：現在還不能使用忍術。`);
    return;
  }
  if (isUnitCastingNinju(unit)) {
    if (unit.ninju.pendingMoneyDart) {
      setMessage(`${unit.name}：錢鏢已經排程。`);
      return;
    }
    unit.skill -= rule.cost;
    unit.ninju.pendingMoneyDart = true;
    playSound("useNinju");
    // takeDart 音效延後到實際拿起錢標時（startMoneyDart）才播放
    clearDragState();
    setMessage(`${unit.name}：錢鏢已排到忍術之後。`);
    return;
  }
  if (isUnitInNinjuGap(unit)) {
    if (unit.ninju.nextType === "moneyDart") {
      setMessage(`${unit.name}：錢鏢已經排程。`);
      return;
    }
    unit.skill -= rule.cost;
    unit.ninju.nextType = "moneyDart";
    playSound("useNinju");
    // takeDart 音效延後到實際拿起錢標時（startMoneyDart）才播放
    clearDragState();
    setMessage(`${unit.name}：錢鏢已排到連段空檔。`);
    return;
  }
  unit.skill -= rule.cost;
  playSound("useNinju");
  startMoneyDart(unit, performance.now(), true, canUseDuringConsumable);
}

function startMoneyDart(unit, now = performance.now(), playActivationSound = true, allowDisabled = false) {
  const rule = moneyDartRule();
  if (isUnitDisabled(unit) && !allowDisabled) return;
  if (unit.moneyDart) return;
  unit.moneyDart = { startedAt: now, invincibleUntil: now + rule.readyMs };
  if (playActivationSound) playSound("takeDart");
  if (canControlUnit(unit)) clearDragState();
  setMessage(`${unit.name}：錢鏢已備好，請選擇上、下、左、右方向。`);
}

function throwMoneyDart(unit, targetCell) {
  if (!unit.moneyDart) return;
  const now = performance.now();
  if (isUnitDisabled(unit)) {
    setMessage(`${unit.name}：目前無法行動。`);
    return;
  }
  if (now < unit.moneyDart.invincibleUntil) {
    setMessage(`${unit.name}：無敵時間結束後才能丟出錢鏢。`);
    return;
  }
  if (isUnitCastingNinju(unit)) {
    setMessage(`${unit.name}：施放忍術時不能丟錢鏢。`);
    return;
  }
  if (!weaponIsReady(unit)) {
    setMessage(`${unit.name}：武器冷卻中不能丟錢鏢。`);
    return;
  }

  const dir = directionFromTarget(unit, targetCell);
  if (!dir) {
    setMessage(`${unit.name}：請選擇錢鏢的直線方向。`);
    return;
  }

  const shot = traceMoneyDart(unit, dir);
  updateFacing(unit, targetCell);
  playSound("shootDart");
  unit.moneyDart = null;
  state.moneyDartCasts = state.moneyDartCasts.filter((cast) => cast.unitId !== unit.id);
  if (shot.hitUnit && shot.hitUnit.alive && !isUnitInvincible(shot.hitUnit)) {
    damageUnit(shot.hitUnit, moneyDartRule().damage, `${unit.name} hit ${shot.hitUnit.name} with money dart`, true, unit);
  }
  state.moneyDartCasts.push({
    unitId: unit.id,
    dir: dir.name,
    team: unit.team,
    startedAt: now,
    duration: 300,
  });
  unit.ninjuLockedUntil = now + moneyDartRule().postThrowNinjuLockMs;
  setMessage(`${unit.name} 丟出了錢鏢。`);
}

function traceMoneyDart(unit, dir) {
  let x = unit.x + dir.dx;
  let y = unit.y + dir.dy;
  let last = { x: unit.x, y: unit.y };
  let distance = 0;

  while (inside(x, y)) {
    if (isPermanentObstacle(x, y) || objectAt(x, y)) break;
    distance += 1;
    last = { x, y };
    const other = unitAt(x, y);
    if (other && other.id !== unit.id) {
      if (other.team !== unit.team) return { to: { x, y }, hitUnit: other, distance };
    }
    x += dir.dx;
    y += dir.dy;
  }

  if (distance === 0) {
    return { to: { x: unit.x + dir.dx, y: unit.y + dir.dy }, hitUnit: null, distance: 1 };
  }
  return { to: last, hitUnit: null, distance };
}

function isUnitCastingNinju(unit) {
  return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "active" && performance.now() - unit.ninju.startedAt < unit.ninju.duration);
}

function canUseNinjuDuringConsumable(unit) {
  return Boolean(unit?.consumableUse?.phase === "active");
}

function canUnitMoveNow(unit) {
  if (unit.moneyDart) return false; // 拿標中不能回技或拖曳
  if (isUnitCastingNinju(unit)) return Boolean(unit.ninju && unit.ninju.chainMoves > 0);
  if (isUnitDisabled(unit)) return false;
  return true;
}

function isUnitInvincible(unit) {
  return isUnitCastingNinju(unit) || isUnitInNinjuGap(unit) || isMoneyDartInvincible(unit) || isFlashInvincible(unit);
}

function isUnitDisabled(unit) {
  return Boolean(unit && unit.disabledUntil && performance.now() < unit.disabledUntil);
}

function isFlashInvincible(unit) {
  return Boolean(unit && unit.invincibleUntil && performance.now() < unit.invincibleUntil);
}

function isMoneyDartInvincible(unit) {
  return Boolean(unit && unit.moneyDart && performance.now() < unit.moneyDart.invincibleUntil);
}

function isUnitInNinjuGap(unit) {
  return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "gap" && performance.now() - unit.ninju.startedAt < unit.ninju.duration);
}

function isSteelDefenseActive(unit) {
  return Boolean(unit && unit.steelUntil && performance.now() < unit.steelUntil);
}

function isHotBloodActive(unit) {
  return Boolean(unit && unit.hotBloodUntil && performance.now() < unit.hotBloodUntil);
}

function isMagicWaterActive(unit) {
  return Boolean(unit && unit.magicWaterUntil && performance.now() < unit.magicWaterUntil);
}

function refreshStatusNinju(unit, type, now = performance.now()) {
  if (isAttackNinjuType(type)) {
    triggerAttackNinju(unit, type, unit.ninju?.attackNinjuLevel || 0, now);
    return;
  }
  if (isSpecialNinjuType(type)) {
    triggerSpecialNinju(unit, type, now, unit.ninju?.startedAt || now);
    return;
  }
  if (isHealNinjuType(type)) {
    const rule = healNinjuRule(type);
    if (rule.effect === "steelNoDefense") return;
    if (rule.effect === "teamHeal") {
      for (const teammate of state.units) {
        if (teammate.team === unit.team && teammate.alive) {
          teammate.hp = Math.min(teammate.maxHp, teammate.hp + rule.healAmount);
        }
      }
      return;
    }
    unit.hp = Math.min(unit.maxHp, unit.hp + rule.healAmount);
    return;
  }
  if (type === "steel") {
    unit.steelUntil = now + steelRule().durationMs;
    unit.buffAuraType = "steel";
  }
  if (type === "hotBlood") {
    unit.hotBloodUntil = now + hotBloodRule().durationMs;
    unit.buffAuraType = "hotBlood";
  }
}

function triggerAttackNinju(caster, type, attackNinjuLevel, now = performance.now()) {
  const config = attackNinjuConfigs[type];
  const rule = attackNinjuRule(type);
  const targets = attackNinjuTargets(caster, attackNinjuLevel);
  if (targets.length > 0 && config?.hitSound) playSound(config.hitSound);
  for (const target of targets) {
    const outcome = attackNinjuOutcome(type, rule);
    const hit = Boolean(outcome);
    const disableMs = hit ? (outcome.hitDisableMs || rule.hitDisableMs) : rule.missDisableMs;
    target.disabledUntil = now + disableMs;
    target.invincibleUntil = target.disabledUntil;
    target.moneyDart = null;
    target.hitFlash = hit ? 0.65 : 0.25;
    cancelDragIfPressed(target);
    if (typeof addNinjuDamageEffect === "function") {
      addNinjuDamageEffect(type, target, now, hit && config?.holdHitLastFrame ? disableMs : (hit ? 1500 : 0), config?.holdHitLastFrame ? { frameDuration: 1500 } : {});
      if (hit) {
        if (config?.hitBodyEffect !== null) addNinjuDamageEffect(config?.hitBodyEffect || "flashHit", target, now + 1500, 2000);
        addNinjuDamageEffect(outcome.headEffect || "flashHitHead", target, now + 1500, 2000);
        if (config?.breakEffect) addNinjuDamageEffect(config.breakEffect, target, now + disableMs, 350);
      } else {
        addNinjuDamageEffect("flashMiss", target, now + 1500, 1000);
      }
    }
    if (hit) damageUnit(target, outcome.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
  }
}

function attackNinjuOutcome(type, rule) {
  const outcomes = attackNinjuConfigs[type]?.outcomes;
  if (!outcomes) {
    return Math.random() < rule.hitChance ? { damage: rule.damage, headEffect: "flashHitHead" } : null;
  }
  let roll = Math.random();
  for (const outcome of outcomes) {
    if (roll < outcome.chance) return outcome;
    roll -= outcome.chance;
  }
  return null;
}

function attackNinjuTargets(caster, attackNinjuLevel) {
  const count = Math.max(0, Math.min(soulMaxLevel, attackNinjuLevel));
  return state.units
    .filter((target) => target.alive && target.team !== caster.team && !isUnitInvincible(target))
    .sort((a, b) => manhattan(caster, a) - manhattan(caster, b) || a.id - b.id)
    .slice(0, count);
}

function triggerSpecialNinju(caster, type, now = performance.now(), castStartedAt = now) {
  const config = specialNinjuConfigs[type];
  const rule = specialNinjuRule(type);
  if (type === "clone") {
    triggerCloneNinju(caster, rule, now, config, castStartedAt);
    return;
  }
  const target = attackNinjuTargets(caster, 1)[0];
  if (!target) return;
  if (config?.hitSound) playSound(config.hitSound);
  if (typeof addNinjuDamageEffect === "function") addNinjuDamageEffect(type, target, now, 1500);
  if (rule.damage) damageUnit(target, rule.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
}

function triggerCloneNinju(caster, rule, now = performance.now(), config = null, castStartedAt = now) {
  const origin = { x: caster.x, y: caster.y };
  const candidates = cloneOpenCells(caster);
  if (candidates.length < 3) {
    if (canControlUnit(caster)) setMessage(`${caster.name}：沒有足夠空格施放${config?.label || localizedNinjuTypeLabel("clone")}。`);
    return;
  }
  const teleportCell = pickRandomCloneCell(candidates, (cell) => cell.x !== origin.x || cell.y !== origin.y);
  if (!teleportCell) {
    if (canControlUnit(caster)) setMessage(`${caster.name}：沒有足夠空格施放${config?.label || localizedNinjuTypeLabel("clone")}。`);
    return;
  }
  const decoyA = pickRandomCloneCell(candidates);
  const decoyB = pickRandomCloneCell(candidates);
  if (!decoyA || !decoyB) {
    if (canControlUnit(caster)) setMessage(`${caster.name}：沒有足夠空格施放${config?.label || localizedNinjuTypeLabel("clone")}。`);
    return;
  }
  clearCloneDecoysForCaster(caster.id);
  caster.x = teleportCell.x;
  caster.y = teleportCell.y;
  caster.fromX = teleportCell.x;
  caster.fromY = teleportCell.y;
  caster.moveT = 1;
  caster.moveTrail = null;
  caster.moneyDart = null;
  state.cloneDecoys = state.cloneDecoys || [];
  state.cloneDecoys.push(makeCloneDecoy(caster, decoyA, now), makeCloneDecoy(caster, decoyB, now));
  if (typeof addNinjuDamageEffect === "function") addNinjuDamageEffect("clone", caster, now, rule.castDurationMs || 1600);
  const playCloneSoundLater = typeof window !== "undefined" && typeof window.setTimeout === "function"
    ? window.setTimeout.bind(window)
    : (typeof setTimeout === "function" ? setTimeout : null);
  if (playCloneSoundLater) {
    const remainingDelayMs = Math.max(0, 1500 - Math.max(0, now - castStartedAt));
    playCloneSoundLater(() => {
      playSound("cloneNinju");
    }, remainingDelayMs);
  }
  if (canControlUnit(caster)) setMessage(`${caster.name} 使用了${config?.label || localizedNinjuTypeLabel("clone")}。`);
}

function cloneOpenCells(caster) {
  const cells = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (x === caster.x && y === caster.y) continue;
      if (isBlockedCell(x, y) || unitAt(x, y)) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function pickRandomCloneCell(pool, predicate = null) {
  const candidates = predicate ? pool.filter(predicate) : pool;
  if (!candidates.length) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const poolIndex = pool.findIndex((cell) => cell.x === chosen.x && cell.y === chosen.y);
  if (poolIndex >= 0) pool.splice(poolIndex, 1);
  return chosen;
}

function makeCloneDecoy(caster, cell, now = performance.now()) {
  return {
    casterId: caster.id,
    name: caster.name,
    team: caster.team,
    x: cell.x,
    y: cell.y,
    fromX: cell.x,
    fromY: cell.y,
    moveT: 1,
    hp: caster.hp,
    maxHp: caster.maxHp,
    controlMode: caster.controlMode,
    appearanceKey: caster.appearanceKey || "default",
    steelUntil: caster.steelUntil || 0,
    hotBloodUntil: caster.hotBloodUntil || 0,
    magicWaterUntil: caster.magicWaterUntil || 0,
    buffAuraType: caster.buffAuraType || "",
    facing: "down",
    createdAt: now,
  };
}

function clearCloneDecoysForCaster(casterId) {
  if (!state.cloneDecoys) return;
  state.cloneDecoys = state.cloneDecoys.filter((decoy) => decoy.casterId !== casterId);
}

function consumeAttackNinjuSoulLevel(unit) {
  const level = Math.min(soulMaxLevel, Math.floor((unit.soulSteps || 0) / soulStepsPerLevel));
  if (level > 0) unit.soulSteps = 0;
  return level;
}

function statusNinjuRule(type) {
  if (isAttackNinjuType(type)) return attackNinjuRule(type);
  if (isSpecialNinjuType(type)) return specialNinjuRule(type);
  if (isHealNinjuType(type)) return healNinjuRule(type);
  return type === "hotBlood" ? hotBloodRule() : steelRule();
}

function startHealNinjuCastEffects(unit, type, now = performance.now()) {
  if (!isHealNinjuType(type)) return;
  const rule = healNinjuRule(type);
  if (rule.effect !== "teamHeal") return;
  const duration = rule.castDurationMs || 1500;
  for (const teammate of state.units) {
    if (teammate.team !== unit.team || !teammate.alive) continue;
    teammate.disabledUntil = Math.max(teammate.disabledUntil || 0, now + duration);
    cancelDragIfPressed(teammate);
    if (typeof addNinjuDamageEffect === "function") addNinjuDamageEffect(type, teammate, now, duration);
  }
}

function isStatusNinjuType(type) {
  return type === "steel" || type === "hotBlood" || isAttackNinjuType(type) || isSpecialNinjuType(type) || isHealNinjuType(type);
}

function isAttackNinjuType(type) {
  return Boolean(attackNinjuConfigs[type]);
}

function isSpecialNinjuType(type) {
  return Boolean(specialNinjuConfigs[type]);
}

function isHealNinjuType(type) {
  return type === "genki" || type === "kakki" || type === "shinki";
}

function defendedDamage(unit, baseDamage) {
  const steelMultiplier = isSteelDefenseActive(unit) ? steelRule().defenseMultiplier : 1;
  const magicWaterMultiplier = isMagicWaterActive(unit) ? 2 : 1;
  return baseDamage / Math.min(2, Math.max(steelMultiplier, magicWaterMultiplier));
}

function playStatusEnergyUpSequence() {
  const first = playSound("statusEnergyUp1");
  if (!first) return;
  const onFirstEnded = () => {
    first.removeEventListener("ended", onFirstEnded);
    playSound("statusEnergyUp2");
  };
  first.addEventListener("ended", onFirstEnded);
}

function playStatusNinjuSound(type) {
  if (isAttackNinjuType(type)) {
    const sound = attackNinjuConfigs[type]?.castSound;
    if (sound) playSound(sound);
    return;
  }
  if (isSpecialNinjuType(type)) {
    const sound = specialNinjuConfigs[type]?.castSound;
    if (sound) playSound(sound);
    return;
  }
  if (type === "genki") {
    playSound("regenHpSmall");
    return;
  }
  if (type === "kakki" || type === "shinki") {
    playSound("regenHpLarge");
    return;
  }
  playStatusEnergyUpSequence();
}
