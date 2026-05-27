import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installCombatRendererGlobals(target = globalThis) {
  const drawMapObjects = () => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.objects || !ctx) return;
    const sorted = state.objects.filter((object) => object.alive && !object.hidden).slice().sort((a, b) => a.y - b.y || a.x - b.x);
    for (const object of sorted) {
      const img = target.images[object.type];
      const center = target.cellCenter(object.x, object.y);
      const scale = object.scale || 1;
      const width = target.grid.cell * (object.drawWidthCells || scale);
      const height = target.grid.cell * (object.drawHeightCells || scale);
      const anchorY = object.drawAnchorY ?? 0.72;
      const drawX = center.x + (object.drawOffsetX || 0);
      const drawY = center.y + (object.drawOffsetY || 0);

      if (img) {
        ctx.drawImage(img, drawX - width / 2, drawY - height * anchorY, width, height);
      } else {
        ctx.fillStyle = object.breakable ? "#d9d260" : "#245038";
        ctx.fillRect(center.x - width / 2, center.y - height / 2, width, height);
      }

      if (object.breakable && object.hp < target.objectHp) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(center.x - 16, center.y - height * 0.78, 32, 4);
        ctx.fillStyle = "#ffd766";
        ctx.fillRect(center.x - 16, center.y - height * 0.78, 32 * Math.max(0, object.hp / object.maxHp), 4);
      }
    }
  };

  const drawKunaiAttackFrame = (frame, from, to, direction, weaponKey = target.defaultWeaponKey) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const scale = 1.55 * target.weaponAttackScale(weaponKey);
    const w = frame.width * scale;
    const h = frame.height * scale;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const anchor = { x: from.x + dx * 34, y: from.y + dy * 31 };
    const at = target.applyOffset(anchor, target.weaponAttackOffset(weaponKey, direction, w, h));
    ctx.drawImage(frame, at.x, at.y, w, h);
  };

  const drawKunaiHandAttackFrame = (frame, from, to, direction, weaponKey = target.defaultWeaponKey) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const scale = 1.55 * target.weaponHandScale(weaponKey);
    const w = frame.width * scale;
    const h = frame.height * scale;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const anchor = { x: from.x + dx * 34, y: from.y + dy * 31 };
    const at = target.applyOffset(anchor, target.weaponHandOffset(weaponKey, direction, w, h));
    ctx.drawImage(frame, at.x, at.y, w, h);
  };

  const drawSlashArc = (from, to, age, side) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const centerX = from.x + (to.x - from.x) * 0.62;
    const centerY = from.y + (to.y - from.y) * 0.62 - 16;
    const baseAngle = Math.atan2(to.y - from.y, to.x - from.x);
    const start = baseAngle - side * (1.1 - age * 0.35);
    const end = baseAngle + side * (0.75 + age * 0.35);
    const alpha = age < 0.65 ? 1 : (1 - age) / 0.35;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 244, 166, .95)";
    ctx.lineWidth = 9 * (1 - age * 0.35);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 39 + age * 14, start, end, side < 0);
    ctx.stroke();
    ctx.strokeStyle = "rgba(115, 228, 255, .75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 51 + age * 10, start + side * 0.1, end, side < 0);
    ctx.stroke();
    ctx.restore();
  };

  const drawAttacks = () => {
    const state = resolveRuntimeState(target);
    if (!state?.attacks) return;
    for (let i = state.attacks.length - 1; i >= 0; i--) {
      const attack = state.attacks[i];
      const age = (now(target) - attack.startedAt) / attack.duration;
      if (age >= 1) {
        state.attacks.splice(i, 1);
        continue;
      }
      const from = target.cellCenter(attack.from.x, attack.from.y);
      const to = target.cellCenter(attack.to.x, attack.to.y);
      const weaponFrameSet = target.weaponFrames[attack.weaponKey || target.defaultWeaponKey] || target.weaponFrames[target.defaultWeaponKey];
      const frames = weaponFrameSet.attack[attack.direction] || [];
      const handFrames = weaponFrameSet.hand[attack.direction] || [];
      const frame = frames[Math.min(frames.length - 1, Math.floor(age * frames.length))];
      const handFrame = handFrames[Math.min(handFrames.length - 1, Math.floor(age * handFrames.length))];
      if (handFrame) drawKunaiHandAttackFrame(handFrame, from, to, attack.direction, attack.weaponKey || target.defaultWeaponKey);
      if (frame) drawKunaiAttackFrame(frame, from, to, attack.direction, attack.weaponKey || target.defaultWeaponKey);
      else drawSlashArc(from, to, age, attack.side);
    }
  };

  const drawProjectiles = () => {
    const state = resolveRuntimeState(target);
    if (state?.projectiles) state.projectiles.length = 0;
  };

  const moneyDartShootPlacement = (direction, frame, p, frameIdx = 0) => {
    const offsets = target.moneyDartVisualOffsets.shoot;
    const offset = offsets[direction] || offsets.down;
    const scale = offsets.scale;
    const w = frame.width * scale;
    const h = frame.height * scale;
    if (direction === "right") {
      const yCorr = (target.moneyDartShootYCorrection[frameIdx] || 0) * scale;
      return { x: p.x + offset.x, y: p.y - offset.y + 10 + yCorr, w, h };
    }
    if (direction === "left") {
      const yCorr = (target.moneyDartShootYCorrection[frameIdx] || 0) * scale;
      return { x: p.x + offset.x - w, y: p.y - offset.y + 10 + yCorr, w, h };
    }
    if (direction === "up") return { x: p.x + offset.x - w / 2, y: p.y - offset.y - h + 20, w, h };
    return { x: p.x + offset.x - w / 2, y: p.y - offset.y, w, h };
  };

  const drawMoneyDartShootAnimations = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.moneyDartCasts || !ctx) return;
    for (let i = state.moneyDartCasts.length - 1; i >= 0; i--) {
      const cast = state.moneyDartCasts[i];
      const progress = (currentNow - cast.startedAt) / cast.duration;
      if (!Number.isFinite(progress) || progress >= 1 || currentNow - cast.startedAt > 1000) {
        state.moneyDartCasts.splice(i, 1);
        continue;
      }
      const unit = state.units.find((candidate) => candidate.id === cast.unitId && candidate.alive);
      if (!unit) {
        state.moneyDartCasts.splice(i, 1);
        continue;
      }
      const teamKey = target.unitLookDefinition(unit).moneyDartShootSet || (unit.team === "blue" ? "b" : "g");
      const frames = ((target.moneyDartShootFrames[teamKey] || {})[cast.dir] || []).filter((frame) => frame && frame.naturalWidth > 0);
      if (frames.length === 0) continue;
      const frameIdx = Math.max(0, Math.min(frames.length - 1, Math.floor(progress * frames.length)));
      const frame = frames[frameIdx];
      const p = target.unitPosition(unit);
      const placement = moneyDartShootPlacement(cast.dir, frame, p, frameIdx);
      const shootAuraType = target.activeBuffAuraType(unit);
      if (shootAuraType) target.drawBuffAuraSpriteOutline(shootAuraType, frame, p, 0, placement);
      ctx.save();
      ctx.globalAlpha = 0.98;
      ctx.drawImage(frame, placement.x, placement.y, placement.w, placement.h);
      ctx.restore();
      const headCfg = target.moneyDartShootFrameHeads[cast.dir] || target.moneyDartShootFrameHeads.down;
      const headFrameIdx = Math.max(0, Math.min(headCfg.frames.length - 1, frameIdx));
      const headPx = headCfg.frames[headFrameIdx];
      const scale = target.moneyDartVisualOffsets.shoot.scale;
      target.drawMoneyDartShootEye(unit, unit.facing, {
        x: placement.x + headPx.x * scale - headCfg.w / 2,
        y: placement.y + headPx.y * scale - headCfg.h / 2,
      }, headCfg);
    }
  };

  Object.assign(target, {
    drawMapObjects,
    drawAttacks,
    drawKunaiAttackFrame,
    drawKunaiHandAttackFrame,
    drawProjectiles,
    drawMoneyDartShootAnimations,
    moneyDartShootPlacement,
    drawSlashArc,
  });

  target.NindouCombatRenderer = {
    drawMapObjects,
    drawAttacks,
    drawKunaiAttackFrame,
    drawKunaiHandAttackFrame,
    drawProjectiles,
    drawMoneyDartShootAnimations,
    moneyDartShootPlacement,
    drawSlashArc,
  };
}
