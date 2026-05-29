import {
  ninjuCatalog,
  ninjuByType,
  ninjuEditorRowOrder,
  ninjuEditorCatalog,
  defaultNinjuLoadout,
} from "../data/ninjutsu-definitions.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function now(target) {
  return target.performance?.now?.() ?? Date.now();
}

function runtimeState(target) {
  return resolveRuntimeState(target);
}

export function installNinjutsuGlobals(target = globalThis) {
  const state = () => runtimeState(target);

  function updateNinju(currentNow) {
    for (const unit of state().units) {
      if (!unit.ninju) continue;

      if (unit.ninju.phase === "active") {
        if (currentNow - unit.ninju.startedAt < unit.ninju.duration) continue;
        refreshStatusNinju(unit, unit.ninju.type, currentNow);
        applyNinjuPendingConsumableEffects(unit, currentNow);
        const queuedNinjutsu = queuedNinjuActions(unit.ninju);

        if (queuedNinjutsu.length > 0) {
          const [nextAction, ...remainingNinjutsu] = queuedNinjutsu;
          unit.ninju = {
            type: unit.ninju.type,
            phase: "gap",
            nextAction,
            nextType: nextAction.type,
            nextAttackNinjuLevel: nextAction.attackNinjuLevel || 0,
            startedAt: currentNow,
            duration: target.ninjuChainMaxGap,
            queue: queuedNinjutsu.length,
            pendingNinjutsu: remainingNinjutsu,
            gapMoves: 0,
            pendingMoneyDart: unit.ninju.pendingMoneyDart,
            pendingConsumables: unit.ninju.pendingConsumables,
            pendingConsumableEffects: [],
          };
          if (unit.id === target.playerUnitId) target.setMessage?.(`${unit.name}：忍術連段空檔中。`);
        } else if (unit.ninju.pendingMoneyDart) {
          unit.ninju = {
            type: unit.ninju.type,
            phase: "gap",
            nextType: "moneyDart",
            startedAt: currentNow,
            duration: target.ninjuChainGap,
            queue: 0,
            gapMoves: 0,
            pendingConsumables: unit.ninju.pendingConsumables,
            pendingConsumableEffects: [],
          };
          if (unit.id === target.playerUnitId) target.setMessage?.(`${unit.name}：錢鏢接段空檔中。`);
        } else if (unit.ninju.pendingConsumables?.length) {
          const [nextType, ...remainingQueue] = unit.ninju.pendingConsumables;
          unit.ninju = null;
          target.executeConsumableItem?.(unit, nextType, currentNow, remainingQueue);
        } else {
          unit.ninju = null;
          if (unit.id === target.playerUnitId) target.setMessage?.(`${unit.name}：忍術施放完成。`);
        }
        continue;
      }

      if (unit.ninju.phase === "gap") {
        const elapsed = currentNow - unit.ninju.startedAt;
        const firstMoveSucceeded = (unit.ninju.gapMoves || 0) > 0;
        if (!firstMoveSucceeded && elapsed < unit.ninju.duration) continue;
        if (unit.ninju.nextType === "moneyDart") {
          unit.ninju = null;
          startMoneyDart(unit, currentNow, true);
        } else {
          const action = unit.ninju.nextAction || ninjuActionEntry(unit.ninju.nextType || unit.ninju.type, unit.ninju.nextAttackNinjuLevel || 0);
          startStatusNinjuActive(unit, action, currentNow, unit.ninju.pendingNinjutsu || [], unit.ninju.pendingMoneyDart, unit.ninju.pendingConsumables || []);
          if (target.canControlUnit?.(unit)) target.playSound?.("useNinju");
          if (unit.id === target.playerUnitId) target.setMessage?.(`${unit.name}：忍術續接完成。`);
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

  function startStatusNinjuActive(unit, action, currentNow, pendingNinjutsu = [], pendingMoneyDart = false, pendingConsumables = [], pendingConsumableEffects = []) {
    const type = action.type;
    unit.ninju = {
      type,
      phase: "active",
      startedAt: currentNow,
      duration: statusNinjuRule(type).castDurationMs,
      queue: 0,
      pendingNinjutsu: [],
      chainMoves: target.ninjuFollowupMoveAllowance,
      attackNinjuLevel: action.attackNinjuLevel || 0,
      pendingMoneyDart,
      pendingConsumables,
      pendingConsumableEffects,
    };
    setQueuedNinjuActions(unit.ninju, pendingNinjutsu);
    playStatusNinjuSound(type);
    startHealNinjuCastEffects(unit, type, currentNow);
  }

  function updateProjectiles() {
    if (!state().projectiles) return;
    state().projectiles.length = 0;
  }

  function activeMoneyDartCast(unit) {
    const currentState = state();
    if (!currentState.moneyDartCasts) return null;
    const currentNow = now(target);
    return currentState.moneyDartCasts.find((cast) => cast.unitId === unit.id && currentNow - cast.startedAt < cast.duration) || null;
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
    const config = target.attackNinjuConfigs?.[type];
    useStatusNinju(type, config?.label || type);
  }

  function useSpecialNinju(type) {
    const config = target.specialNinjuConfigs?.[type];
    useStatusNinju(type, config?.label || type);
  }

  function useGenkiNinju() {
    useStatusNinju("genki", target.localizedNinjuTypeLabel?.("genki") || "神氣");
  }

  function useKakkiNinju() {
    useStatusNinju("kakki", target.localizedNinjuTypeLabel?.("kakki") || "活氣");
  }

  function useShinkiNinju() {
    useStatusNinju("shinki", target.localizedNinjuTypeLabel?.("shinki") || "神氣");
  }

  function useStatusNinju(type, label) {
    const unit = target.selectedUnit?.();
    if (!unit || !target.canControlUnit?.(unit)) return;
    const rule = statusNinjuRule(type);
    if (rule.available === false) return;
    const canQueueCurrentNinju = Boolean(unit.ninju && isStatusNinjuType(unit.ninju.type));
    if (isUnitDisabled(unit) && !canQueueCurrentNinju && !canUseNinjuDuringConsumable(unit)) {
      target.setMessage?.(`${unit.name}：目前無法行動。`);
      return;
    }
    if (unit.moneyDart) {
      target.setMessage?.(`${unit.name}：拿著錢鏢時不能使用忍術。`);
      return;
    }
    if ((unit.ninjuLockedUntil || 0) > now(target)) {
      target.setMessage?.(`${unit.name}：現在還不能使用忍術。`);
      return;
    }
    const isAttackNinju = isAttackNinjuType(type);
    const skillCost = isAttackNinju ? 0 : rule.cost;
    if (unit.skill < skillCost) {
      target.setMessage?.(`${label}需要 ${rule.cost} 技。`);
      return;
    }

    const attackNinjuLevel = isAttackNinju ? consumeAttackNinjuSoulLevel(unit) : 0;
    if (isAttackNinju && attackNinjuLevel < 1) {
      target.setMessage?.(`${label}需要 1 級魂。`);
      return;
    }

    unit.skill = Math.max(0, unit.skill - skillCost);
    const currentNow = now(target);
    const action = ninjuActionEntry(type, attackNinjuLevel);

    if (unit.consumableUse && !unit.ninju) {
      unit.consumableUse.pendingNinjutsu = [...(unit.consumableUse.pendingNinjutsu || []), action];
      target.setMessage?.(`${unit.name} 已排入${label}。`);
      target.playSound?.("useNinju");
      target.clearDragState?.();
      return;
    }

    if (unit.ninju && isStatusNinjuType(unit.ninju.type)) {
      queueNinjuAction(unit, action);
      target.setMessage?.(`${unit.name} 已排入${label}。`);
    } else {
      startStatusNinjuActive(unit, action, currentNow);
      target.setMessage?.(`${unit.name} 使用了${label}。`);
    }
    target.playSound?.("useNinju");
    target.clearDragState?.();
  }

  function useMoneyDart() {
    const unit = target.selectedUnit?.();
    if (!unit || !target.canControlUnit?.(unit)) return;
    const rule = moneyDartRule();
    const canUseDuringConsumable = canUseNinjuDuringConsumable(unit);
    if (isUnitDisabled(unit) && !canUseDuringConsumable) {
      target.setMessage?.(`${unit.name}：目前無法行動。`);
      return;
    }
    if (unit.skill < rule.cost) {
      target.setMessage?.(`${target.localizedNinjuTypeLabel?.("moneyDart") || "錢鏢"}需要 ${rule.cost} 技。`);
      return;
    }
    if (unit.moneyDart) {
      target.setMessage?.(`${unit.name}：錢鏢已經備好。`);
      return;
    }
    if (unit.moveTrail && (now(target) - unit.moveTrail.startedAt) < target.ARRIVE_TOTAL) {
      target.setMessage?.(`${unit.name}：移動中不能使用忍術。`);
      return;
    }
    if ((unit.ninjuLockedUntil || 0) > now(target)) {
      target.setMessage?.(`${unit.name}：現在還不能使用忍術。`);
      return;
    }
    if (isUnitCastingNinju(unit)) {
      if (unit.ninju.pendingMoneyDart) {
        target.setMessage?.(`${unit.name}：錢鏢已經排程。`);
        return;
      }
      unit.skill -= rule.cost;
      unit.ninju.pendingMoneyDart = true;
      target.playSound?.("useNinju");
      target.clearDragState?.();
      target.setMessage?.(`${unit.name}：錢鏢已排到忍術之後。`);
      return;
    }
    if (isUnitInNinjuGap(unit)) {
      if (unit.ninju.nextType === "moneyDart") {
        target.setMessage?.(`${unit.name}：錢鏢已經排程。`);
        return;
      }
      unit.skill -= rule.cost;
      unit.ninju.nextType = "moneyDart";
      target.playSound?.("useNinju");
      target.clearDragState?.();
      target.setMessage?.(`${unit.name}：錢鏢已排到連段空檔。`);
      return;
    }
    if (unit.consumableUse && !unit.ninju) {
      if (unit.consumableUse.pendingMoneyDart || unit.consumableUse.nextType === "moneyDart") {
        target.setMessage?.(`${unit.name} 已排入錢鏢。`);
        return;
      }
      unit.skill -= rule.cost;
      if (unit.consumableUse.phase === "gap") {
        unit.consumableUse.nextType = "moneyDart";
      } else {
        unit.consumableUse.pendingMoneyDart = true;
      }
      target.playSound?.("useNinju");
      target.clearDragState?.();
      target.setMessage?.(`${unit.name} 已排入錢鏢，等待道具動作結束。`);
      return;
    }
    unit.skill -= rule.cost;
    target.playSound?.("useNinju");
    startMoneyDart(unit, now(target), true, canUseDuringConsumable);
  }

  function startMoneyDart(unit, currentNow = now(target), playActivationSound = true, allowDisabled = false) {
    const rule = moneyDartRule();
    if (isUnitDisabled(unit) && !allowDisabled) return;
    if (unit.moneyDart) return;
    unit.moneyDart = { startedAt: currentNow, invincibleUntil: currentNow + rule.readyMs };
    if (playActivationSound) target.playSound?.("takeDart");
    if (target.canControlUnit?.(unit)) target.clearDragState?.();
    target.setMessage?.(`${unit.name}：錢鏢已備好，請選擇上、下、左、右方向。`);
  }

  function throwMoneyDart(unit, targetCell) {
    if (!unit.moneyDart) return;
    const currentNow = now(target);
    if (isUnitDisabled(unit)) {
      target.setMessage?.(`${unit.name}：目前無法行動。`);
      return;
    }
    if (currentNow < unit.moneyDart.invincibleUntil) {
      target.setMessage?.(`${unit.name}：無敵時間結束後才能丟出錢鏢。`);
      return;
    }
    if (isUnitCastingNinju(unit)) {
      target.setMessage?.(`${unit.name}：施放忍術時不能丟錢鏢。`);
      return;
    }
    if (!target.weaponIsReady?.(unit)) {
      target.setMessage?.(`${unit.name}：武器冷卻中不能丟錢鏢。`);
      return;
    }

    const dir = target.directionFromTarget?.(unit, targetCell);
    if (!dir) {
      target.setMessage?.(`${unit.name}：請選擇錢鏢的直線方向。`);
      return;
    }

    const currentState = state();
    const shot = traceMoneyDart(unit, dir);
    target.updateFacing?.(unit, targetCell);
    target.playSound?.("shootDart");
    unit.moneyDart = null;
    currentState.moneyDartCasts = (currentState.moneyDartCasts || []).filter((cast) => cast.unitId !== unit.id);
    if (shot.hitUnit && shot.hitUnit.alive && !isUnitInvincible(shot.hitUnit)) {
      target.damageUnit?.(shot.hitUnit, moneyDartRule().damage, `${unit.name} hit ${shot.hitUnit.name} with money dart`, true, unit);
    }
    currentState.moneyDartCasts.push({
      unitId: unit.id,
      dir: dir.name,
      team: unit.team,
      startedAt: currentNow,
      duration: 300,
    });
    unit.ninjuLockedUntil = currentNow + moneyDartRule().postThrowNinjuLockMs;
    target.setMessage?.(`${unit.name} 丟出了錢鏢。`);
  }

  function traceMoneyDart(unit, dir) {
    let x = unit.x + dir.dx;
    let y = unit.y + dir.dy;
    let last = { x: unit.x, y: unit.y };
    let distance = 0;

    while (target.inside?.(x, y)) {
      if (target.isPermanentObstacle?.(x, y) || target.objectAt?.(x, y)) break;
      distance += 1;
      last = { x, y };
      const other = target.unitAt?.(x, y);
      if (other && other.id !== unit.id) {
        if (other.team !== unit.team) return { to: { x, y }, hitUnit: other, distance };
      }
      x += dir.dx;
      y += dir.dy;
    }

    if (distance === 0) return { to: { x: unit.x + dir.dx, y: unit.y + dir.dy }, hitUnit: null, distance: 1 };
    return { to: last, hitUnit: null, distance };
  }

  function isUnitCastingNinju(unit) {
    return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "active" && now(target) - unit.ninju.startedAt < unit.ninju.duration);
  }

  function canUseNinjuDuringConsumable(unit) {
    return Boolean(unit?.consumableUse?.phase === "active");
  }

  function applyNinjuPendingConsumableEffects(unit, currentNow) {
    const effects = unit?.ninju?.pendingConsumableEffects || [];
    for (const effect of effects) {
      target.applyPendingConsumableEffect?.(unit, effect, currentNow);
    }
  }

  function canUnitMoveNow(unit) {
    if (unit.moneyDart) return false;
    if (isUnitCastingNinju(unit)) return Boolean(unit.ninju && unit.ninju.chainMoves > 0);
    if (isUnitDisabled(unit)) return false;
    return true;
  }

  function isUnitInvincible(unit) {
    return isUnitCastingNinju(unit) || isUnitInNinjuGap(unit) || isMoneyDartInvincible(unit) || isFlashInvincible(unit);
  }

  function isUnitDisabled(unit) {
    return Boolean(unit && unit.disabledUntil && now(target) < unit.disabledUntil);
  }

  function isFlashInvincible(unit) {
    return Boolean(unit && unit.invincibleUntil && now(target) < unit.invincibleUntil);
  }

  function isMoneyDartInvincible(unit) {
    return Boolean(unit && unit.moneyDart && now(target) < unit.moneyDart.invincibleUntil);
  }

  function isUnitInNinjuGap(unit) {
    return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "gap" && now(target) - unit.ninju.startedAt < unit.ninju.duration);
  }

  function isSteelDefenseActive(unit) {
    return Boolean(unit && unit.steelUntil && now(target) < unit.steelUntil);
  }

  function isHotBloodActive(unit) {
    return Boolean(unit && unit.hotBloodUntil && now(target) < unit.hotBloodUntil);
  }

  function isMagicWaterActive(unit) {
    return Boolean(unit && unit.magicWaterUntil && now(target) < unit.magicWaterUntil);
  }

  function refreshStatusNinju(unit, type, currentNow = now(target)) {
    if (isAttackNinjuType(type)) {
      triggerAttackNinju(unit, type, unit.ninju?.attackNinjuLevel || 0, currentNow);
      return;
    }
    if (isSpecialNinjuType(type)) {
      triggerSpecialNinju(unit, type, currentNow, unit.ninju?.startedAt || currentNow);
      return;
    }
    if (isHealNinjuType(type)) {
      const rule = healNinjuRule(type);
      if (rule.effect === "steelNoDefense") return;
      if (rule.effect === "teamHeal") {
        for (const teammate of state().units) {
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
      unit.steelUntil = currentNow + steelRule().durationMs;
      unit.buffAuraType = "steel";
    }
    if (type === "hotBlood") {
      unit.hotBloodUntil = currentNow + hotBloodRule().durationMs;
      unit.buffAuraType = "hotBlood";
    }
  }

  function triggerAttackNinju(caster, type, attackNinjuLevel, now = performance.now()) {
    const config = attackNinjuConfigs[type];
    const rule = attackNinjuRule(type);
    const targets = attackNinjuTargets(caster, attackNinjuLevel);
    
    // === 關鍵修改：自訂雙音效延遲播放邏輯 ===
    if (targets.length > 0 && config?.hitSound) {
      if (typeof config.hitSound === "object") {
        // 延遲播放第一個音效
        setTimeout(() => {
          if (config.hitSound.sound1) playSound(config.hitSound.sound1);
        }, (config.hitSound.delay1 || 0) * 1000);

        // 延遲播放第二個音效
        setTimeout(() => {
          if (config.hitSound.sound2) playSound(config.hitSound.sound2);
        }, (config.hitSound.delay2 || 0) * 1000);
      } else {
        // 如果是一般字串，維持原本的立刻播放
        playSound(config.hitSound);
      }
    }

    // === 以下為您原本的所有後續遊戲邏輯，完整保留 ===
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
          addNinjuDamageEffect(outcome.headEffect || "flashHitHead", target, now + 1500, 2000, { frameDuration: 2000 });

          if (config?.breakEffect) addNinjuDamageEffect(config.breakEffect, target, now + disableMs, 350);
        } else {
          addNinjuDamageEffect("flashMiss", target, now + 1500, 1000);
  		
        }
      }
  	if (hit) {
  	      const delay = config?.damageDelayMs || 0; // 如果沒設定，預設就是 0 毫秒 (立刻扣血)
  	      
  	      if (delay > 0) {
  	        // 使用 setTimeout 讓系統在 X 毫秒後才執行 damageUnit 扣血
  	        setTimeout(() => {
  	          // ⚠️ 安全檢查：扣血前先確認目標是不是還在場上/活著（選填，依你遊戲邏輯而定）
  	          if (target && target.alive) {
  	            damageUnit(target, outcome.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
  	          }
  	        }, delay);
  	      } else {
  	        // 如果 delay 是 0，就維持原本的立刻扣血
  	        damageUnit(target, outcome.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
  	      }
  	    }
  	  }
  	}

  function attackNinjuOutcome(type, rule) {
    const outcomes = target.attackNinjuConfigs?.[type]?.outcomes;
    if (!outcomes) return Math.random() < rule.hitChance ? { damage: rule.damage, headEffect: "flashHitHead" } : null;
    let roll = Math.random();
    for (const outcome of outcomes) {
      if (roll < outcome.chance) return outcome;
      roll -= outcome.chance;
    }
    return null;
  }

  function attackNinjuTargets(caster, attackNinjuLevel) {
    const count = Math.max(0, Math.min(target.soulMaxLevel, attackNinjuLevel));
    return state().units
      .filter((enemy) => enemy.alive && enemy.team !== caster.team && !isUnitInvincible(enemy))
      .sort((a, b) => target.manhattan(caster, a) - target.manhattan(caster, b) || a.id - b.id)
      .slice(0, count);
  }

  function triggerSpecialNinju(caster, type, currentNow = now(target), castStartedAt = currentNow) {
    const config = target.specialNinjuConfigs?.[type];
    const rule = specialNinjuRule(type);
    if (type === "clone") {
      triggerCloneNinju(caster, rule, currentNow, config, castStartedAt);
      return;
    }
    const enemy = attackNinjuTargets(caster, 1)[0];
    if (!enemy) return;
    if (config?.hitSound) target.playSound?.(config.hitSound);
    if (typeof target.addNinjuDamageEffect === "function") target.addNinjuDamageEffect(type, enemy, currentNow, 1500);
    if (rule.damage) target.damageUnit?.(enemy, rule.damage, `${caster.name} hit ${enemy.name} with ${config?.label || type}`, true, caster);
  }

  function triggerCloneNinju(caster, rule, currentNow = now(target), config = null, castStartedAt = currentNow) {
    const origin = { x: caster.x, y: caster.y };
    const candidates = cloneOpenCells(caster);
    if (candidates.length < 3) {
      if (target.canControlUnit?.(caster)) target.setMessage?.(`${caster.name}：沒有足夠空位使用${config?.label || target.localizedNinjuTypeLabel?.("clone") || "分身"}。`);
      return;
    }
    const teleportCell = pickRandomCloneCell(candidates, (cell) => cell.x !== origin.x || cell.y !== origin.y);
    const decoyA = pickRandomCloneCell(candidates);
    const decoyB = pickRandomCloneCell(candidates);
    if (!teleportCell || !decoyA || !decoyB) {
      if (target.canControlUnit?.(caster)) target.setMessage?.(`${caster.name}：沒有足夠空位使用${config?.label || target.localizedNinjuTypeLabel?.("clone") || "分身"}。`);
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
    const currentState = state();
    currentState.cloneDecoys = currentState.cloneDecoys || [];
    currentState.cloneDecoys.push(makeCloneDecoy(caster, decoyA, currentNow), makeCloneDecoy(caster, decoyB, currentNow));
    if (typeof target.addNinjuDamageEffect === "function") target.addNinjuDamageEffect("clone", caster, currentNow, rule.castDurationMs || 1600);
    const playCloneSoundLater = typeof target.window !== "undefined" && typeof target.window.setTimeout === "function"
      ? target.window.setTimeout.bind(target.window)
      : (typeof setTimeout === "function" ? setTimeout : null);
    if (playCloneSoundLater) {
      const remainingDelayMs = Math.max(0, 1500 - Math.max(0, currentNow - castStartedAt));
      playCloneSoundLater(() => {
        target.playSound?.("cloneNinju");
      }, remainingDelayMs);
    }
    if (target.canControlUnit?.(caster)) target.setMessage?.(`${caster.name} 使用了${config?.label || target.localizedNinjuTypeLabel?.("clone") || "分身"}。`);
  }

  function cloneOpenCells(caster) {
    const cells = [];
    for (let y = 0; y < target.grid.rows; y++) {
      for (let x = 0; x < target.grid.cols; x++) {
        if (x === caster.x && y === caster.y) continue;
        if (target.isBlockedCell?.(x, y) || target.unitAt?.(x, y)) continue;
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

  function makeCloneDecoy(caster, cell, currentNow = now(target)) {
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
      createdAt: currentNow,
    };
  }

  function clearCloneDecoysForCaster(casterId) {
    const currentState = state();
    if (!currentState.cloneDecoys) return;
    currentState.cloneDecoys = currentState.cloneDecoys.filter((decoy) => decoy.casterId !== casterId);
  }

  function consumeAttackNinjuSoulLevel(unit) {
    const level = Math.min(target.soulMaxLevel, Math.floor((unit.soulSteps || 0) / target.soulStepsPerLevel));
    if (level > 0) unit.soulSteps = 0;
    return level;
  }

  function statusNinjuRule(type) {
    if (isAttackNinjuType(type)) return attackNinjuRule(type);
    if (isSpecialNinjuType(type)) return specialNinjuRule(type);
    if (isHealNinjuType(type)) return healNinjuRule(type);
    return type === "hotBlood" ? hotBloodRule() : steelRule();
  }

  function startHealNinjuCastEffects(unit, type, currentNow = now(target)) {
    if (!isHealNinjuType(type)) return;
    const rule = healNinjuRule(type);
    if (rule.effect !== "teamHeal") return;
    const duration = rule.castDurationMs || 1500;
    for (const teammate of state().units) {
      if (teammate.team !== unit.team || !teammate.alive) continue;
      teammate.disabledUntil = Math.max(teammate.disabledUntil || 0, currentNow + duration);
      target.cancelDragIfPressed?.(teammate);
      if (typeof target.addNinjuDamageEffect === "function") target.addNinjuDamageEffect(type, teammate, currentNow, duration);
    }
  }

  function isStatusNinjuType(type) {
    return type === "steel" || type === "hotBlood" || isAttackNinjuType(type) || isSpecialNinjuType(type) || isHealNinjuType(type);
  }

  function isAttackNinjuType(type) {
    return Boolean(target.attackNinjuConfigs?.[type]);
  }

  function isSpecialNinjuType(type) {
    return Boolean(target.specialNinjuConfigs?.[type]);
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
      const first = target.playSound?.("statusEnergyUp1");
      if (!first) return;
      const onFirstEnded = () => {
        first.removeEventListener("ended", onFirstEnded);
        target.playSound?.("statusEnergyUp2");
      };
      first.addEventListener("ended", onFirstEnded);
    }

	// >>> 【支援無限多組音效、延遲與音量的升級版輔助函數】 <<<
	  function playMultipleSounds(soundConfig) {
	    if (soundConfig && typeof soundConfig === "object") {
	      // 1. 物件格式：自動遞增檢查 sound1, sound2, sound3, sound4, sound5...
	      if (!Array.isArray(soundConfig)) {
	        let i = 1;
	        // 只要 sound1、sound2... 還存在，迴圈就會一直跑下去
	        while (soundConfig[`sound${i}`]) {
	          const soundName = soundConfig[`sound${i}`];
	          const delaySec = soundConfig[`delay${i}`] || 0;
	          const volumeVal = soundConfig[`volume${i}`]; // 抓取音量 volume1, volume2...

	          setTimeout(() => {
	            const audioInstance = target.playSound?.(soundName);
	            
	            // 處理音量：如果底層返回了音效物件，且有設定音量，就調整它
	            if (audioInstance && typeof volumeVal === "1") {
	              audioInstance.volume = volumeVal;
	            }
	          }, delaySec * 1000);

	          i++; // 變成檢查下一組 (例如 i 從 1 變成 2，再變成 3...)
	        }
	      } 
	      // 2. 陣列格式：如果是用 [ {sound:...} ] 的寫法
	      else {
	        soundConfig.forEach(item => {
	          if (item.sound) {
	            setTimeout(() => {
	              const audioInstance = target.playSound?.(item.sound);
	              if (audioInstance && typeof item.volume === "number") {
	                audioInstance.volume = item.volume;
	              }
	            }, (item.delay || 0) * 1000);
	          }
	        });
	      }
	    } else if (soundConfig) {
	      // 如果原本設定檔只是普通字串 (單一音效)，維持立刻播放
	      target.playSound?.(soundConfig);
	    }
	  }

    // >>> 【修改原本的 playStatusNinjuSound】 <<<
    function playStatusNinjuSound(type) {
      if (isAttackNinjuType(type)) {
        const sound = target.attackNinjuConfigs?.[type]?.castSound;
        if (sound) playMultipleSounds(sound); // 這裡修改成呼叫多音效函數
        return;
      }
      if (isSpecialNinjuType(type)) {
        const sound = target.specialNinjuConfigs?.[type]?.castSound;
        if (sound) playMultipleSounds(sound); // 這裡修改成呼叫多音效函數
        return;
      }
      if (type === "genki") {
        target.playSound?.("regenHpSmall");
        return;
      }
      if (type === "kakki" || type === "shinki") {
        target.playSound?.("regenHpLarge");
        return;
      }
      playStatusEnergyUpSequence();
    }

  const steelRule = () => target.steelRule();
  const hotBloodRule = () => target.hotBloodRule();
  const moneyDartRule = () => target.moneyDartRule();
  const attackNinjuRule = (type) => target.attackNinjuRule(type);
  const specialNinjuRule = (type) => target.specialNinjuRule(type);
  const healNinjuRule = (type) => target.healNinjuRule(type);

  Object.assign(target, {
    ninjuCatalog,
    ninjuByType,
    ninjuEditorRowOrder,
    ninjuEditorCatalog,
    defaultNinjuLoadout,
    updateNinju,
    ninjuActionEntry,
    queuedNinjuActions,
    setQueuedNinjuActions,
    queueNinjuAction,
    startStatusNinjuActive,
    updateProjectiles,
    activeMoneyDartCast,
    useSteelNinju,
    useHotBloodNinju,
    useFlashNinju,
    useAttackNinju,
    useSpecialNinju,
    useGenkiNinju,
    useKakkiNinju,
    useShinkiNinju,
    useStatusNinju,
    useMoneyDart,
    startMoneyDart,
    throwMoneyDart,
    traceMoneyDart,
    isUnitCastingNinju,
    canUseNinjuDuringConsumable,
    canUnitMoveNow,
    isUnitInvincible,
    isUnitDisabled,
    isFlashInvincible,
    isMoneyDartInvincible,
    isUnitInNinjuGap,
    isSteelDefenseActive,
    isHotBloodActive,
    isMagicWaterActive,
    refreshStatusNinju,
    triggerAttackNinju,
    attackNinjuOutcome,
    attackNinjuTargets,
    triggerSpecialNinju,
    triggerCloneNinju,
    cloneOpenCells,
    pickRandomCloneCell,
    makeCloneDecoy,
    clearCloneDecoysForCaster,
    consumeAttackNinjuSoulLevel,
    statusNinjuRule,
    startHealNinjuCastEffects,
    isStatusNinjuType,
    isAttackNinjuType,
    isSpecialNinjuType,
    isHealNinjuType,
    defendedDamage,
    playStatusEnergyUpSequence,
    playStatusNinjuSound,
  });

  target.NindouNinjutsu = {
    catalog: ninjuCatalog,
    byType: ninjuByType,
    editorRowOrder: ninjuEditorRowOrder,
    editorCatalog: ninjuEditorCatalog,
    defaultLoadout: defaultNinjuLoadout,
    updateNinju,
    useStatusNinju,
    useMoneyDart,
    startMoneyDart,
    throwMoneyDart,
    isUnitCastingNinju,
    isUnitInvincible,
    isSteelDefenseActive,
    isHotBloodActive,
    isMagicWaterActive,
    consumeAttackNinjuSoulLevel,
    statusNinjuRule,
  };
}
