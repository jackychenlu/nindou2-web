import { weaponCooldownMs, weaponDamage } from "../data/config.module.mjs";
import {
  defaultWeaponKey,
  weaponAttackAnimationDurationMs,
  weaponDefinitionByKey,
  weaponSoundKey,
} from "../data/weapons.module.mjs";
import { hotBloodRule, steelRule, weaponDamageForMode } from "../data/rule-modes.module.mjs";
import { directionFromTarget } from "./grid.module.mjs";

const cardinalDirections = [
  { name: "up", dx: 0, dy: -1 },
  { name: "down", dx: 0, dy: 1 },
  { name: "left", dx: -1, dy: 0 },
  { name: "right", dx: 1, dy: 0 },
];

function fallbackInside() {
  return true;
}

function currentTime(options = {}) {
  return options.now ?? performance.now();
}

export function weaponIsReady(unit, options = {}) {
  return currentTime(options) >= (unit.weaponReadyAt || 0);
}

export function markWeaponUsed(unit, options = {}) {
  const weapon = weaponDefinitionByKey[unit.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  unit.weaponReadyAt = currentTime(options) + (weapon.cooldownMs || weaponCooldownMs);
}

export function isSteelDefenseActive(unit, options = {}) {
  return Boolean(unit && unit.steelUntil && currentTime(options) < unit.steelUntil);
}

export function isHotBloodActive(unit, options = {}) {
  return Boolean(unit && unit.hotBloodUntil && currentTime(options) < unit.hotBloodUntil);
}

export function isMagicWaterActive(unit, options = {}) {
  return Boolean(unit && unit.magicWaterUntil && currentTime(options) < unit.magicWaterUntil);
}

export function unitWeaponDamage(unit, options = {}) {
  const weapon = weaponDefinitionByKey[unit.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  if (!weapon) return weaponDamage;
  const baseDamage = weaponDamageForMode(weapon.key, weapon.damage ?? weaponDamage, options.stateLike || {});
  const hotBloodMultiplier = isHotBloodActive(unit, options)
    ? hotBloodRule(options.stateLike || {}).weaponDamageMultiplier
    : 1;
  const magicWaterMultiplier = isMagicWaterActive(unit, options) ? 2 : 1;
  return baseDamage * Math.min(2, Math.max(hotBloodMultiplier, magicWaterMultiplier));
}

export function defendedDamage(unit, baseDamage, options = {}) {
  const steelMultiplier = isSteelDefenseActive(unit, options)
    ? steelRule(options.stateLike || {}).defenseMultiplier
    : 1;
  const magicWaterMultiplier = isMagicWaterActive(unit, options) ? 2 : 1;
  return baseDamage / Math.min(2, Math.max(steelMultiplier, magicWaterMultiplier));
}

export function weaponAreaCells(attacker, dir, options = {}) {
  const inside = options.inside || fallbackInside;
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

export function isCellInWeaponRange(attacker, cell, dir, options = {}) {
  return weaponAreaCells(attacker, dir, options).some((hitCell) => hitCell.x === cell.x && hitCell.y === cell.y);
}

export function weaponDirectionFromTarget(attacker, target, options = {}) {
  const preferred = directionFromTarget(attacker, target);
  if (preferred && isCellInWeaponRange(attacker, target, preferred, options)) return preferred;
  return cardinalDirections.find((dir) => isCellInWeaponRange(attacker, target, dir, options)) || preferred;
}

export function weaponSlashAnchorCell(attacker, dir) {
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  if (weapon.area === "surround") return { x: attacker.x, y: attacker.y };
  return { x: attacker.x + dir.dx, y: attacker.y + dir.dy };
}

export function weaponHitInDirection(attacker, dir, options = {}) {
  const hits = { units: [], objects: [] };
  const unitAt = options.unitAt || (() => null);
  const objectAt = options.objectAt || (() => null);
  const isUnitInvincible = options.isUnitInvincible || (() => false);
  for (const cell of weaponAreaCells(attacker, dir, options)) {
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

export function slashSoundKeyForWeapon(weaponKey) {
  return weaponSoundKey(weaponKey || defaultWeaponKey);
}

export function buildSlashAttackRecord(attacker, target, options = {}) {
  const direction = directionFromTarget(attacker, target)?.name || attacker.facing;
  const weapon = weaponDefinitionByKey[attacker.weaponKey] || weaponDefinitionByKey[defaultWeaponKey];
  return {
    from: { x: attacker.x, y: attacker.y },
    to: { x: target.x, y: target.y },
    direction,
    weaponKey: attacker.weaponKey || defaultWeaponKey,
    startedAt: currentTime(options),
    duration: weaponAttackAnimationDurationMs(weapon?.key || attacker.weaponKey || defaultWeaponKey),
    side: attacker.id % 2 === 0 ? -1 : 1,
  };
}

function stable(value) {
  return JSON.stringify(value);
}

export function runCombatHelperProbe() {
  const stateLike = {};
  const inside = (x, y) => x >= 0 && x < 22 && y >= 0 && y < 12;
  const attacker = { id: 1, team: "blue", x: 5, y: 5, weaponKey: "weapon20", facing: "right", hotBloodUntil: 999999999 };
  const enemy = { id: 2, team: "grey", x: 6, y: 5, alive: true };
  const ally = { id: 3, team: "blue", x: 7, y: 5, alive: true };
  const invincibleEnemy = { id: 4, team: "grey", x: 6, y: 4, alive: true, invincible: true };
  const object = { id: "crate", x: 7, y: 4, breakable: true };
  const units = [attacker, enemy, ally, invincibleEnemy];
  const objects = [object];
  const options = {
    stateLike,
    inside,
    now: 1000,
    unitAt: (x, y) => units.find((unit) => unit.alive && unit.x === x && unit.y === y) || null,
    objectAt: (x, y) => objects.find((candidate) => candidate.x === x && candidate.y === y) || null,
    isUnitInvincible: () => false,
  };
  return {
    readyA: weaponIsReady({ weaponReadyAt: 0 }, options),
    readyB: weaponIsReady({ weaponReadyAt: 999999999 }, options),
    damageNormal: unitWeaponDamage({ weaponKey: "weapon4" }, options),
    damageHotBlood: unitWeaponDamage(attacker, options),
    damageMagicWater: unitWeaponDamage({ weaponKey: "weapon4", magicWaterUntil: 999999999 }, options),
    defendedSteel: defendedDamage({ steelUntil: 999999999 }, 170, options),
    defendedMagicWater: defendedDamage({ magicWaterUntil: 999999999 }, 170, options),
    defendedNormal: defendedDamage({ steelUntil: 0 }, 170, options),
    areaWide: weaponAreaCells(attacker, { name: "right", dx: 1, dy: 0 }, options),
    areaRing: weaponAreaCells({ ...attacker, weaponKey: "weapon8" }, { name: "up", dx: 0, dy: -1 }, options),
    inRange: isCellInWeaponRange(attacker, { x: 8, y: 5 }, { name: "right", dx: 1, dy: 0 }, options),
    direction: weaponDirectionFromTarget(attacker, { x: 8, y: 5 }, options),
    anchorA: weaponSlashAnchorCell(attacker, { name: "right", dx: 1, dy: 0 }),
    anchorB: weaponSlashAnchorCell({ ...attacker, weaponKey: "weapon19" }, { name: "right", dx: 1, dy: 0 }),
    hits: weaponHitInDirection(attacker, { name: "right", dx: 1, dy: 0 }, options),
    sound: slashSoundKeyForWeapon("weapon20"),
    attackRecord: buildSlashAttackRecord(attacker, { x: 6, y: 5 }, options),
  };
}

export function summarizeCombatHelpers(legacy = {}) {
  const moduleResult = runCombatHelperProbe();
  const legacyResult = legacy.runCombatHelperProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
