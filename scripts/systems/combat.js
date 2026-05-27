// ===== Combat =====
function attack(attacker, target) {
  if (isUnitDisabled(attacker)) {
    setMessage(`${attacker.name}：目前無法行動。`);
    return;
  }
  if (attacker.moneyDart) {
    setMessage(`${attacker.name}：拿著錢鏢時不能攻擊。`);
    return;
  }
  if (isUnitCastingNinju(attacker)) {
    setMessage(`${attacker.name}：施放忍術時不能攻擊。`);
    return;
  }
  if (attacker.moveTrail && (performance.now() - attacker.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${attacker.name}：移動中不能攻擊。`);
    return;
  }
  if (activeMoneyDartCast(attacker)) {
    setMessage(`${attacker.name}：丟錢鏢時不能攻擊。`);
    return;
  }
  if (!weaponIsReady(attacker)) {
    setMessage(`${attacker.name}：武器冷卻中。`);
    return;
  }
  const dir = weaponDirectionFromTarget(attacker, target);
  if (!dir || !isCellInWeaponRange(attacker, target, dir)) {
    setMessage("目標不在忍太刀攻擊範圍內。");
    return;
  }
  attackCell(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
}

function damageUnit(target, baseDamage, label, announce = true, attacker = null) {
  const damage = defendedDamage(target, baseDamage);
  target.hp -= damage;
  recordDamage(attacker, target, damage);
  if (typeof queueAiRedRetaliation === "function" && attacker && target.alive) {
    queueAiRedRetaliation(target, attacker, performance.now());
  }
  target.hitFlash = 0.65;
  playSound("weaponDamaged");
  if (announce) setMessage(`${label}，造成 ${formatDamage(damage)} 傷害。`);
  if (target.hp <= 0) {
    target.alive = false;
    target.moneyDart = null;
    if (typeof clearCloneDecoysForCaster === "function") clearCloneDecoysForCaster(target.id);
    gainSoul(target, soulDeathGainSteps);
    if (attacker && attacker !== target) attacker.kills += 1;
    cancelDragIfPressed(target);
    playSound("death");
    setMessage(`${target.name} 被擊倒。`);
    checkVictory();
  }
  return damage;
}

function recordDamage(attacker, target, damage, options = {}) {
  const amount = Math.max(0, damage);
  if (target) target.damageTaken += amount;
  if (options.skipSoulGain) return;
  if (attacker && attacker !== target) {
    attacker.damageDone += amount;
    gainSoul(attacker, soulCombatGainSteps);
  }
  if (target) gainSoul(target, soulCombatGainSteps);
}

function damageObject(object, attacker) {
  const damage = unitWeaponDamage(attacker);
  object.hp = Math.max(0, object.hp - damage);
  setMessage(`${attacker.name} 攻擊 ${object.type}，造成 ${damage} 傷害。`);
  if (object.hp <= 0) {
    object.alive = false;
    playBreakSound(object);
    const grantedItem = maybeGrantMapItem(object, attacker);
    if (!grantedItem) setMessage(`${object.type} 被破壞。`);
  }
}

function attackCell(attacker, cell) {
  if (isUnitDisabled(attacker)) {
    setMessage(`${attacker.name}：目前無法行動。`);
    return;
  }
  if (attacker.moneyDart) {
    setMessage(`${attacker.name}：拿著錢鏢時不能攻擊。`);
    return;
  }
  if (isUnitCastingNinju(attacker) || isUnitInNinjuGap(attacker)) {
    setMessage(`${attacker.name}：施放忍術時不能攻擊。`);
    return;
  }
  if (attacker.moveTrail && (performance.now() - attacker.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${attacker.name}：移動中不能攻擊。`);
    return;
  }
  if (activeMoneyDartCast(attacker)) {
    setMessage(`${attacker.name}：丟錢鏢時不能攻擊。`);
    return;
  }
  if (!weaponIsReady(attacker)) {
    setMessage(`${attacker.name}：武器冷卻中。`);
    return;
  }
  const dir = directionFromTarget(attacker, cell);
  if (!dir) {
    setMessage(`${attacker.name}：請選擇揮砍方向。`);
    return;
  }

  const hits = weaponHitInDirection(attacker, dir);
  updateFacing(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
  playSlash(attacker, weaponSlashAnchorCell(attacker, dir));
  markWeaponUsed(attacker);
  const targetCount = hits.units.length + hits.objects.length;
  if (targetCount === 0) {
    setMessage(`${attacker.name} 揮空了。`);
    return;
  }

  for (const unit of hits.units) {
    damageUnit(unit, unitWeaponDamage(attacker), `${attacker.name} 攻擊 ${unit.name}`, false, attacker);
  }
  for (const object of hits.objects) {
    damageObject(object, attacker);
  }
  setMessage(`${attacker.name} 命中 ${targetCount} 個目標。`);
}

function attackAimedWeapon(attacker, targetCell) {
  if (isUnitDisabled(attacker)) {
    setMessage(`${attacker.name}：目前無法行動。`);
    return;
  }
  if (attacker.moneyDart) {
    setMessage(`${attacker.name}：拿著錢鏢時不能攻擊。`);
    return;
  }
  if (isUnitCastingNinju(attacker) || isUnitInNinjuGap(attacker)) {
    setMessage(`${attacker.name}：施放忍術時不能攻擊。`);
    return;
  }
  if (attacker.moveTrail && (performance.now() - attacker.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${attacker.name}：移動中不能攻擊。`);
    return;
  }
  if (activeMoneyDartCast(attacker)) {
    setMessage(`${attacker.name}：丟錢鏢時不能攻擊。`);
    return;
  }
  if (!weaponIsReady(attacker)) {
    setMessage(`${attacker.name}：武器冷卻中。`);
    return;
  }
  const dir = weaponDirectionFromTarget(attacker, targetCell);
  if (!dir) {
    setMessage(`${attacker.name}：請選擇揮砍方向。`);
    return;
  }
  attackCell(attacker, { x: attacker.x + dir.dx, y: attacker.y + dir.dy });
}

function weaponIsReady(unit) {
  return performance.now() >= (unit.weaponReadyAt || 0);
}

function markWeaponUsed(unit) {
  const weapon = weaponDefinitionByKey[unit.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  unit.weaponReadyAt = performance.now() + (weapon.cooldownMs || weaponCooldownMs);
}

function unitWeaponDamage(unit) {
  const weapon = weaponDefinitionByKey[unit.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  if (!weapon) return weaponDamage;
  const baseDamage = weaponDamageForMode(weapon.key, weapon.damage ?? weaponDamage);
  return isHotBloodActive(unit) ? baseDamage * hotBloodRule().weaponDamageMultiplier : baseDamage;
}

function weaponAreaCells(attacker, dir) {
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  const x = attacker.x;
  const y = attacker.y;
  if (weapon.area === "single") {
    return [{ x: x + dir.dx, y: y + dir.dy }].filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "line2") {
    return [
      { x: x + dir.dx, y: y + dir.dy },
      { x: x + dir.dx * 2, y: y + dir.dy * 2 },
    ].filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "line6") {
    return [
      { x: x + dir.dx, y: y + dir.dy },
      { x: x + dir.dx * 2, y: y + dir.dy * 2 },
      { x: x + dir.dx * 3, y: y + dir.dy * 3 },
      { x: x + dir.dx * 4, y: y + dir.dy * 4 },
      { x: x + dir.dx * 5, y: y + dir.dy * 5 },
      { x: x + dir.dx * 6, y: y + dir.dy * 6 },
    ].filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "surround") {
    return [
      { x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 },
      { x: x - 1, y },                         { x: x + 1, y },
      { x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 },
    ].filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "wide331") {
    const perpendicular = dir.dx !== 0 ? { x: 0, y: 1 } : { x: 1, y: 0 };
    const cells = [];
    for (const distance of [1, 2]) {
      for (const side of [-1, 0, 1]) {
        cells.push({
          x: x + dir.dx * distance + perpendicular.x * side,
          y: y + dir.dy * distance + perpendicular.y * side,
        });
      }
    }
    cells.push({ x: x + dir.dx * 3, y: y + dir.dy * 3 });
    return cells.filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "fan") {
    const shapes = {
      up: [{ x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y }, { x: x + 1, y }],
      down: [{ x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y }],
      left: [{ x: x - 1, y: y - 1 }, { x: x - 1, y }, { x: x - 1, y: y + 1 }, { x, y: y - 1 }, { x, y: y + 1 }],
      right: [{ x: x + 1, y: y - 1 }, { x: x + 1, y }, { x: x + 1, y: y + 1 }, { x, y: y - 1 }, { x, y: y + 1 }],
    };
    return (shapes[dir.name] || []).filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "ring8") {
    return [
      { x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 },
      { x: x - 1, y },                         { x: x + 1, y },
      { x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 },
    ].filter((cell) => inside(cell.x, cell.y));
  }
  if (weapon.area === "NinjaS") {
    const shapes = {
      up: [{ x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 }],
      down: [{ x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }],
      left: [{ x: x - 1, y: y - 1 }, { x: x - 1, y }, { x: x - 1, y: y + 1 }],
      right: [{ x: x + 1, y: y - 1 }, { x: x + 1, y }, { x: x + 1, y: y + 1 }],
    };
    return (shapes[dir.name] || []).filter((cell) => inside(cell.x, cell.y));
  }
  const shapes = {
    up: [{ x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 }],
    down: [{ x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }],
    left: [{ x: x - 1, y }, { x: x - 1, y: y + 1 }],
    right: [{ x: x + 1, y }, { x: x + 1, y: y + 1 }],
  };
  return (shapes[dir.name] || []).filter((cell) => inside(cell.x, cell.y));
}

function isCellInWeaponRange(attacker, cell, dir) {
  return weaponAreaCells(attacker, dir).some((hitCell) => hitCell.x === cell.x && hitCell.y === cell.y);
}

function weaponDirectionFromTarget(attacker, target) {
  const preferred = directionFromTarget(attacker, target);
  if (preferred && isCellInWeaponRange(attacker, target, preferred)) return preferred;
  const directions = [
    { name: "up", dx: 0, dy: -1 },
    { name: "down", dx: 0, dy: 1 },
    { name: "left", dx: -1, dy: 0 },
    { name: "right", dx: 1, dy: 0 },
  ];
  return directions.find((dir) => isCellInWeaponRange(attacker, target, dir)) || preferred;
}

function weaponSlashAnchorCell(attacker, dir) {
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  if (weapon.area === "surround") return { x: attacker.x, y: attacker.y };
  return { x: attacker.x + dir.dx, y: attacker.y + dir.dy };
}

function weaponHitInDirection(attacker, dir) {
  const hits = { units: [], objects: [] };
  for (const cell of weaponAreaCells(attacker, dir)) {
    const unit = unitAt(cell.x, cell.y);
    if (unit && unit.team !== attacker.team && !isUnitInvincible(unit)) {
      hits.units.push(unit);
    }

    const object = objectAt(cell.x, cell.y);
    if (object?.breakable) {
      hits.objects.push(object);
    }
  }
  return hits;
}

function slashSoundKeyForWeapon(weaponKey) {
  return weaponSoundKey(weaponKey || defaultWeaponKey);
}

function playSlash(attacker, target) {
  playSound(slashSoundKeyForWeapon(attacker.weaponKey || defaultWeaponKey));
  if (!state.attacks) state.attacks = [];
  const direction = directionFromTarget(attacker, target)?.name || attacker.facing;
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  state.attacks.push({
    from: { x: attacker.x, y: attacker.y },
    to: { x: target.x, y: target.y },
    direction,
    weaponKey: attacker.weaponKey || defaultWeaponKey,
    startedAt: performance.now(),
    duration: weaponAttackAnimationDurationMs(weapon?.key || attacker.weaponKey || defaultWeaponKey),
    side: attacker.id % 2 === 0 ? -1 : 1,
  });
}

function buildSlashAttackRecord(attacker, target, now = performance.now()) {
  const direction = directionFromTarget(attacker, target)?.name || attacker.facing;
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  return {
    from: { x: attacker.x, y: attacker.y },
    to: { x: target.x, y: target.y },
    direction,
    weaponKey: attacker.weaponKey || defaultWeaponKey,
    startedAt: now,
    duration: weaponAttackAnimationDurationMs(weapon?.key || attacker.weaponKey || defaultWeaponKey),
    side: attacker.id % 2 === 0 ? -1 : 1,
  };
}

function runCombatHelperProbe() {
  const previousRuleModeKey = state.ruleModeKey;
  const previousUseOriginalMode = state.useOriginalMode;
  state.ruleModeKey = "modified";
  state.useOriginalMode = false;
  const attacker = { id: 1, team: "blue", x: 5, y: 5, weaponKey: "weapon20", facing: "right", hotBloodUntil: 999999999 };
  const enemy = { id: 2, team: "grey", x: 6, y: 5, alive: true };
  const ally = { id: 3, team: "blue", x: 7, y: 5, alive: true };
  const invincibleEnemy = { id: 4, team: "grey", x: 6, y: 4, alive: true, invincible: true };
  const object = { id: "crate", x: 7, y: 4, breakable: true };
  const units = [attacker, enemy, ally, invincibleEnemy];
  const objects = [object];
  const localUnitAt = (x, y) => units.find((unit) => unit.alive && unit.x === x && unit.y === y) || null;
  const localObjectAt = (x, y) => objects.find((candidate) => candidate.x === x && candidate.y === y) || null;
  const localWeaponHitInDirection = (actor, dir) => {
    const hits = { units: [], objects: [] };
    for (const cell of weaponAreaCells(actor, dir)) {
      const unit = localUnitAt(cell.x, cell.y);
      if (unit && unit.team !== actor.team && !isUnitInvincible(unit)) {
        hits.units.push(unit);
      }

      const hitObject = localObjectAt(cell.x, cell.y);
      if (hitObject?.breakable) {
        hits.objects.push(hitObject);
      }
    }
    return hits;
  };

  try {
    return {
      readyA: weaponIsReady({ weaponReadyAt: 0 }),
      readyB: weaponIsReady({ weaponReadyAt: 999999999 }),
      damageNormal: unitWeaponDamage({ weaponKey: "weapon4" }),
      damageHotBlood: unitWeaponDamage(attacker),
      defendedSteel: defendedDamage({ steelUntil: 999999999 }, 170),
      defendedNormal: defendedDamage({ steelUntil: 0 }, 170),
      areaWide: weaponAreaCells(attacker, { name: "right", dx: 1, dy: 0 }),
      areaRing: weaponAreaCells({ ...attacker, weaponKey: "weapon8" }, { name: "up", dx: 0, dy: -1 }),
      inRange: isCellInWeaponRange(attacker, { x: 8, y: 5 }, { name: "right", dx: 1, dy: 0 }),
      direction: weaponDirectionFromTarget(attacker, { x: 8, y: 5 }),
      anchorA: weaponSlashAnchorCell(attacker, { name: "right", dx: 1, dy: 0 }),
      anchorB: weaponSlashAnchorCell({ ...attacker, weaponKey: "weapon19" }, { name: "right", dx: 1, dy: 0 }),
      hits: localWeaponHitInDirection(attacker, { name: "right", dx: 1, dy: 0 }),
      sound: slashSoundKeyForWeapon("weapon20"),
      attackRecord: buildSlashAttackRecord(attacker, { x: 6, y: 5 }, 1000),
    };
  } finally {
    state.ruleModeKey = previousRuleModeKey;
    state.useOriginalMode = previousUseOriginalMode;
  }
}

globalThis.NindouCombat = {
  weaponIsReady,
  markWeaponUsed,
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
};
