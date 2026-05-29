import {
  weaponIsReady,
  markWeaponUsed,
  isSteelDefenseActive,
  isHotBloodActive,
  isMagicWaterActive,
  unitWeaponDamage,
  defendedDamage,
  weaponAreaCells,
  isCellInWeaponRange,
  weaponDirectionFromTarget,
  weaponSlashAnchorCell,
  weaponHitInDirection,
  slashSoundKeyForWeapon,
  buildSlashAttackRecord,
  runCombatHelperProbe,
} from "../systems/combat.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function runtimeOptions(target, overrides = {}) {
  return {
    stateLike: resolveRuntimeState(target),
    now: target.performance?.now?.(),
    inside: target.inside,
    unitAt: target.unitAt,
    objectAt: target.objectAt,
    isUnitInvincible: target.isUnitInvincible,
    ...overrides,
  };
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installCombatGlobals(target = globalThis) {
  const weaponIsReadyRuntime = (unit) => weaponIsReady(unit, runtimeOptions(target));
  const markWeaponUsedRuntime = (unit) => markWeaponUsed(unit, runtimeOptions(target));
  const isSteelDefenseActiveRuntime = (unit) => isSteelDefenseActive(unit, runtimeOptions(target));
  const isHotBloodActiveRuntime = (unit) => isHotBloodActive(unit, runtimeOptions(target));
  const isMagicWaterActiveRuntime = (unit) => isMagicWaterActive(unit, runtimeOptions(target));
  const unitWeaponDamageRuntime = (unit) => unitWeaponDamage(unit, runtimeOptions(target));
  const defendedDamageRuntime = (unit, baseDamage) => defendedDamage(unit, baseDamage, runtimeOptions(target));
  const weaponAreaCellsRuntime = (attacker, dir) => weaponAreaCells(attacker, dir, runtimeOptions(target));
  const isCellInWeaponRangeRuntime = (attacker, cell, dir) => isCellInWeaponRange(attacker, cell, dir, runtimeOptions(target));
  const weaponDirectionFromTargetRuntime = (attacker, targetCell) => weaponDirectionFromTarget(attacker, targetCell, runtimeOptions(target));
  const weaponSlashAnchorCellRuntime = (attacker, dir) => weaponSlashAnchorCell(attacker, dir);
  const weaponHitInDirectionRuntime = (attacker, dir) => weaponHitInDirection(attacker, dir, runtimeOptions(target));
  const slashSoundKeyForWeaponRuntime = (weaponKey) => slashSoundKeyForWeapon(weaponKey);
  const buildSlashAttackRecordRuntime = (attacker, targetCell) => buildSlashAttackRecord(attacker, targetCell, runtimeOptions(target));

  const canAttack = (attacker, includeGap = true) => {
    if (target.isUnitDisabled(attacker)) {
      target.setMessage(`${attacker.name}：目前無法行動。`);
      return false;
    }
    if (attacker.moneyDart) {
      target.setMessage(`${attacker.name}：拿著錢鏢時不能攻擊。`);
      return false;
    }
    if (target.isUnitCastingNinju(attacker) || (includeGap && target.isUnitInNinjuGap(attacker))) {
      target.setMessage(`${attacker.name}：施放忍術時不能攻擊。`);
      return false;
    }
    if (attacker.moveTrail && (now(target) - attacker.moveTrail.startedAt) < target.ARRIVE_TOTAL) {
      target.setMessage(`${attacker.name}：移動中不能攻擊。`);
      return false;
    }
    if (target.activeMoneyDartCast(attacker)) {
      target.setMessage(`${attacker.name}：丟錢鏢時不能攻擊。`);
      return false;
    }
    if (!weaponIsReadyRuntime(attacker)) {
      target.setMessage(`${attacker.name}：武器冷卻中。`);
      return false;
    }
    return true;
  };

  const recordDamage = (attacker, targetUnit, damage, options = {}) => {
    const amount = Math.max(0, damage);
    if (targetUnit) targetUnit.damageTaken += amount;
    if (options.skipSoulGain) return;
    if (attacker && attacker !== targetUnit) {
      attacker.damageDone += amount;
      target.gainSoul(attacker, target.soulCombatGainSteps);
    }
    if (targetUnit) target.gainSoul(targetUnit, target.soulCombatGainSteps);
  };

  function damageUnit(victim, baseDamage, label, announce = true, attacker = null) {
    const damage = defendedDamage(victim, baseDamage);
    const state = resolveRuntimeState(target);
    victim.hp -= damage;
    recordDamage(attacker, victim, damage);
    if (typeof queueAiRedRetaliation === "function" && attacker && victim.alive) {
      queueAiRedRetaliation(victim, attacker, performance.now());
    }
    victim.hitFlash = 0.65;
    target.playSound?.("weaponDamaged");
    if (announce) target.setMessage?.(`${label}，造成 ${target.formatDamage?.(damage) || damage} 傷害。`);
    
    if (victim.hp <= 0) {
        victim.alive = false;
        victim.moneyDart = null;
        if (typeof clearCloneDecoysForCaster === "function") clearCloneDecoysForCaster(victim.id);
        target.gainSoul?.(victim, target.soulDeathGainSteps);
        if (attacker && attacker !== victim) attacker.kills += 1;
        target.cancelDragIfPressed?.(victim);

        // === 關鍵修改：動態判定 AI 專屬死亡音效 ===
        let playedCustomSound = false;
        if (victim.controlMode && target.aiProfiles?.[victim.controlMode]) {
          const profile = target.aiProfiles[victim.controlMode];
          if (profile.deathSound) {
            const vol = profile.deathVolume !== undefined ? profile.deathVolume : 1;
            target.playSound?.(profile.deathSound, vol);
            playedCustomSound = true;
          }
        }
        // 如果不是 AI，或者該 AI 沒有設定自訂音效，就維持播放原本的 "death"
        if (!playedCustomSound) {
          target.playSound?.("death");
        }
        // =======================================

        // ===== 新增：觸發死亡動畫 =====
        if (state) {
          if (!state.deathAnimations) state.deathAnimations = [];
          state.deathAnimations.push({
          x: victim.x,
          y: victim.y,
          startedAt: performance.now(),
          // 29 幀 * 每幀 40 毫秒 = 1160 毫秒
          duration: 29 * 100 
          });
        }
        // ============================

        target.setMessage?.(`${victim.name} 被擊倒。`);
        target.checkVictory?.();
      }
      return damage;
    }

  const damageObject = (object, attacker) => {
    const damage = unitWeaponDamageRuntime(attacker);
    object.hp = Math.max(0, object.hp - damage);
    target.setMessage(`${attacker.name} 攻擊 ${object.type}，造成 ${damage} 傷害。`);
    if (object.hp <= 0) {
      object.alive = false;
      target.playBreakSound(object);
      const grantedItem = target.maybeGrantMapItem(object, attacker);
      if (!grantedItem) target.setMessage(`${object.type} 被破壞。`);
    }
  };

  const playSlash = (attacker, targetCell) => {
    target.playSound(slashSoundKeyForWeaponRuntime(attacker.weaponKey || target.defaultWeaponKey));
    const state = resolveRuntimeState(target);
    if (!state) return;
    if (!state.attacks) state.attacks = [];
    state.attacks.push(buildSlashAttackRecordRuntime(attacker, targetCell));
  };

  const attackCell = (attacker, cell) => {
    if (!canAttack(attacker, true)) return;
    const dir = target.directionFromTarget(attacker, cell);
    if (!dir) {
      target.setMessage(`${attacker.name}：請選擇揮砍方向。`);
      return;
    }

    const hits = weaponHitInDirectionRuntime(attacker, dir);
    target.updateFacing(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
    playSlash(attacker, weaponSlashAnchorCellRuntime(attacker, dir));
    markWeaponUsedRuntime(attacker);
    const targetCount = hits.units.length + hits.objects.length;
    if (targetCount === 0) {
      target.setMessage(`${attacker.name} 揮空了。`);
      return;
    }

    for (const unit of hits.units) {
      damageUnit(unit, unitWeaponDamageRuntime(attacker), `${attacker.name} 攻擊 ${unit.name}`, false, attacker);
    }
    for (const object of hits.objects) {
      damageObject(object, attacker);
    }
    target.setMessage(`${attacker.name} 命中 ${targetCount} 個目標。`);
  };

  const attack = (attacker, targetUnit) => {
    if (!canAttack(attacker, false)) return;
    const dir = weaponDirectionFromTargetRuntime(attacker, targetUnit);
    if (!dir || !isCellInWeaponRangeRuntime(attacker, targetUnit, dir)) {
      target.setMessage("目標不在忍太刀攻擊範圍內。");
      return;
    }
    attackCell(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
  };

  const attackAimedWeapon = (attacker, targetCell) => {
    if (!canAttack(attacker, true)) return;
    const dir = weaponDirectionFromTargetRuntime(attacker, targetCell);
    if (!dir) {
      target.setMessage(`${attacker.name}：請選擇揮砍方向。`);
      return;
    }
    attackCell(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
  };

  Object.assign(target, {
    attack,
    damageUnit,
    recordDamage,
    damageObject,
    attackCell,
    attackAimedWeapon,
    weaponIsReady: weaponIsReadyRuntime,
    markWeaponUsed: markWeaponUsedRuntime,
    isSteelDefenseActive: isSteelDefenseActiveRuntime,
    isHotBloodActive: isHotBloodActiveRuntime,
    isMagicWaterActive: isMagicWaterActiveRuntime,
    unitWeaponDamage: unitWeaponDamageRuntime,
    defendedDamage: defendedDamageRuntime,
    weaponAreaCells: weaponAreaCellsRuntime,
    isCellInWeaponRange: isCellInWeaponRangeRuntime,
    weaponDirectionFromTarget: weaponDirectionFromTargetRuntime,
    weaponSlashAnchorCell: weaponSlashAnchorCellRuntime,
    weaponHitInDirection: weaponHitInDirectionRuntime,
    slashSoundKeyForWeapon: slashSoundKeyForWeaponRuntime,
    playSlash,
    buildSlashAttackRecord: buildSlashAttackRecordRuntime,
  });

  target.NindouCombat = {
    attack,
    damageUnit,
    recordDamage,
    damageObject,
    attackCell,
    attackAimedWeapon,
    weaponIsReady: weaponIsReadyRuntime,
    markWeaponUsed: markWeaponUsedRuntime,
    isSteelDefenseActive: isSteelDefenseActiveRuntime,
    isHotBloodActive: isHotBloodActiveRuntime,
    isMagicWaterActive: isMagicWaterActiveRuntime,
    unitWeaponDamage: unitWeaponDamageRuntime,
    defendedDamage: defendedDamageRuntime,
    weaponAreaCells: weaponAreaCellsRuntime,
    isCellInWeaponRange: isCellInWeaponRangeRuntime,
    weaponDirectionFromTarget: weaponDirectionFromTargetRuntime,
    weaponSlashAnchorCell: weaponSlashAnchorCellRuntime,
    weaponHitInDirection: weaponHitInDirectionRuntime,
    slashSoundKeyForWeapon: slashSoundKeyForWeaponRuntime,
    playSlash,
    buildSlashAttackRecord: buildSlashAttackRecordRuntime,
    runCombatHelperProbe,
  };
}
