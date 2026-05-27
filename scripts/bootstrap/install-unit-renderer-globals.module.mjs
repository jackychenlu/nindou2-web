import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

function currentNow(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installUnitRendererGlobals(target = globalThis) {
  const steelOutlineCache = new WeakMap();
  const hotBloodOutlineCache = new WeakMap();
  const sake4OutlineCache = new WeakMap();

  const unitSprite = (unit) => {
    const prefix = target.unitLookDefinition(unit).spriteSet || (unit.team === "blue" ? "blue" : "grey");
    const suffix = unit.facing.charAt(0).toUpperCase() + unit.facing.slice(1);
    return target.images[prefix + suffix];
  };

  const spriteColorMask = (sprite, cache, fill) => {
    if (cache.has(sprite)) return cache.get(sprite);
    const canvas = target.document?.createElement?.("canvas");
    if (!canvas) return null;
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const maskCtx = canvas.getContext("2d");
    maskCtx.drawImage(sprite, 0, 0);
    maskCtx.globalCompositeOperation = "source-in";
    maskCtx.fillStyle = fill;
    maskCtx.fillRect(0, 0, canvas.width, canvas.height);
    cache.set(sprite, canvas);
    return canvas;
  };

  const applyOffset = (anchor, offset) => ({ x: anchor.x + offset.x, y: anchor.y - offset.y });

  const drawBuffSpriteOutline = (sprite, p, bob, cache, fill, shadow, outlineWidth, shadowBlur, drawAt = null) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const mask = spriteColorMask(sprite, cache, fill);
    if (!mask) return;
    let x;
    let y;
    let w;
    let h;
    if (drawAt) {
      ({ x, y, w, h } = drawAt);
    } else {
      const at = applyOffset({ x: p.x, y: p.y + bob }, { x: -31, y: 47 });
      x = at.x;
      y = at.y;
      w = 62;
      h = 62;
    }
    const pulse = 0.66 + Math.sin(currentNow(target) / 170) * 0.1;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = shadow;
    ctx.shadowBlur = shadowBlur;
    for (let dx = -outlineWidth; dx <= outlineWidth; dx++) {
      for (let dy = -outlineWidth; dy <= outlineWidth; dy++) {
        const distance = Math.hypot(dx, dy);
        if (distance <= 0 || distance > outlineWidth) continue;
        ctx.drawImage(mask, x + dx, y + dy, w, h);
      }
    }
    ctx.restore();
  };

  const drawSteelSpriteOutline = (sprite, p, bob = 0, drawAt = null) => {
    drawBuffSpriteOutline(sprite, p, bob, steelOutlineCache, "#5feeff", "#39e8ff", 2, 7, drawAt);
  };

  const drawHotBloodSpriteOutline = (sprite, p, bob = 0, drawAt = null) => {
    drawBuffSpriteOutline(sprite, p, bob, hotBloodOutlineCache, "#ff2d24", "#ff1f1a", 2, 7, drawAt);
  };

  const drawSake4SpriteOutline = (sprite, p, bob = 0, drawAt = null) => {
    drawBuffSpriteOutline(sprite, p, bob, sake4OutlineCache, "#ffd94d", "#ffbf1f", 2, 9, drawAt);
  };

  const drawBuffAuraSpriteOutline = (auraType, sprite, p, bob = 0, drawAt = null) => {
    if (auraType === "steel") drawSteelSpriteOutline(sprite, p, bob, drawAt);
    if (auraType === "hotBlood") drawHotBloodSpriteOutline(sprite, p, bob, drawAt);
    if (auraType === "sake4") drawSake4SpriteOutline(sprite, p, bob, drawAt);
  };

  const isSake4MoveSkillFreeActive = (unit) => Boolean(unit && unit.moveSkillFreeUntil && currentNow(target) < unit.moveSkillFreeUntil);

  const activeBuffAuraType = (unit) => {
    if (unit.buffAuraType === "steel" && target.isSteelDefenseActive(unit)) return "steel";
    if (unit.buffAuraType === "hotBlood" && target.isHotBloodActive(unit)) return "hotBlood";
    if (unit.buffAuraType === "sake4" && isSake4MoveSkillFreeActive(unit)) return "sake4";
    if (target.isSteelDefenseActive(unit)) return "steel";
    if (target.isHotBloodActive(unit)) return "hotBlood";
    if (isSake4MoveSkillFreeActive(unit)) return "sake4";
    return "";
  };

  const moneyDartReadyFrame = (facing, unit) => {
    const dirIndex = { right: 0, left: 1, up: 2, down: 3 }[facing] ?? 0;
    const key = target.unitLookDefinition(unit).moneyDartReadySet || (unit.team === "grey" ? "g" : "b");
    return (target.moneyDartReadyFrames[key] || [])[dirIndex] || null;
  };

  const moneyDartPickupOrReadyFrame = (unit, elapsed) => {
    const pickupMs = 300;
    if (elapsed < pickupMs && target.moneyDartPickupFrames.length > 0) {
      const frameMs = pickupMs / target.moneyDartPickupFrames.length;
      const idx = Math.min(target.moneyDartPickupFrames.length - 1, Math.floor(elapsed / frameMs));
      return target.moneyDartPickupFrames[idx] || null;
    }
    return moneyDartReadyFrame(unit.facing, unit);
  };

  const drawChargeEffect = (p, layer = "all", unit = null) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const time = currentNow(target);
    const redFrame = target.chargeRedFrames[Math.floor(time / 120) % target.chargeRedFrames.length];
    const yellowFrame = target.chargeYellowFrames[Math.floor(time / 120) % target.chargeYellowFrames.length];
    const facing = unit ? (unit.facing || "down") : "down";
    const fireOff = {
      up: { x: 0, y: -35, rot: 0 },
      down: { x: 0, y: -35, rot: 0 },
      right: { x: -5, y: -35, rot: -0.3 },
      left: { x: 5, y: -35, rot: 0.3 },
      "up-right": { x: -3, y: -35, rot: 0.15 },
      "up-left": { x: 3, y: -35, rot: -0.15 },
      "down-right": { x: -3, y: -35, rot: 0.2 },
      "down-left": { x: 3, y: -35, rot: -0.2 },
    };
    const off = fireOff[facing] || fireOff.down;
    const fx = p.x + off.x;
    const fy = p.y + off.y;
    const rot = off.rot;

    ctx.save();
    ctx.globalAlpha = 0.82;
    if ((layer === "all" || layer === "back") && target.images.chargeOuter) {
      ctx.drawImage(target.images.chargeOuter, p.x - 39, p.y - 55, 78, 78);
    }
    if ((layer === "all" || layer === "front") && redFrame) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(rot);
      ctx.drawImage(redFrame, -25, -30, 50, 60);
      ctx.restore();
    }
    if ((layer === "all" || layer === "front") && yellowFrame) {
      ctx.globalAlpha = 0.72;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(rot);
      ctx.drawImage(yellowFrame, -16, -19, 32, 38);
      ctx.restore();
    }
    ctx.restore();
  };

  const drawHp = (unit, x, y) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const W = 50;
    const H = 8;
    const hpMax = unit.maxHp || target.maxHp;
    const ratio = Math.max(0, unit.hp / hpMax);
    const hpText = `${Math.max(0, Math.round(unit.hp))}/${Math.round(hpMax)}`;
    if (target.images.barBackground) {
      ctx.drawImage(target.images.barBackground, x - W / 2, y, W, H);
    } else {
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(x - W / 2, y, W, H);
    }
    ctx.fillStyle = "#e02020";
    ctx.fillRect(x - W / 2, y, W * ratio, H);
    ctx.save();
    ctx.strokeStyle = "#e8c000";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - W / 2, y, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x - W / 2 + 1, y + 1, W - 2, H - 2);
    ctx.font = "700 7px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(hpText, x, y + H / 2);
    ctx.fillStyle = "#fff7d6";
    ctx.fillText(hpText, x, y + H / 2);
    ctx.restore();
  };

  const localizedLookLabel = (look) => {
    if (!look) return "";
    if (look.labelKey && target.roomLocaleText[look.labelKey]) return target.roomLocaleText[look.labelKey];
    return look.label || "";
  };

  const battleUnitName = (unit) => {
    if (!unit) return "";
    const lookLabel = localizedLookLabel(target.unitLookDefinition(unit));
    if (lookLabel && lookLabel !== target.roomLocaleText.defaultLookOption) return lookLabel;
    if (unit.id === target.playerUnitId || unit.casterId === target.playerUnitId) return target.roomLocaleText.topHudName;
    if (unit.controlMode) return target.localizedControlModeLabel(unit.controlMode);
    return unit.name || target.roomTeamLabel(unit.team);
  };

  const drawUnitName = (unit, x, y) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.font = "700 11px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = battleUnitName(unit);
    const textW = ctx.measureText(label).width;
    const NW = Math.max(66, textW + 22);
    const NH = 16;
    if (target.images.nameBar) {
      ctx.drawImage(target.images.nameBar, x - NW / 2, y - NH / 2, NW, NH);
    } else {
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(x - NW / 2, y - NH / 2, NW, NH);
    }
    ctx.fillStyle = unit.team === "blue" ? "#123f9d" : "#d2d2d2";
    ctx.fillText(label, x, y);
    ctx.restore();
  };

  const drawPlayerArrow = (p) => {
    const { ctx } = canvasContext(target);
    const img = target.images.playerPointer;
    if (!ctx || !img) return;
    const bob = Math.sin(currentNow(target) / 350) * 3;
    ctx.drawImage(img, p.x - img.width / 2, p.y - 47 - img.height - 4 + bob, img.width, img.height);
  };

  const drawRespawnPointer = (unit, p) => {
    const { ctx } = canvasContext(target);
    const time = currentNow(target);
    if (!ctx || !unit.respawnTipUntil || time >= unit.respawnTipUntil) return;
    const remaining = unit.respawnTipUntil - time;
    const elapsed = target.respawnPointerDuration - remaining;
    const progress = Math.min(0.999, Math.max(0, elapsed / target.respawnPointerDuration));
    const frame = target.respawnPointerFrames[Math.floor(progress * target.respawnPointerFrames.length)];
    if (!frame) return;
    const fade = Math.min(1, remaining / 180);
    const bounce = Math.sin(time / 70) * 3;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.drawImage(frame, p.x - 24, p.y - 126 + bounce, 142, 125);
    ctx.restore();
  };

  const drawMoneyDartShootEye = (unit, facing, anchor, cfg) => {
    const { ctx } = canvasContext(target);
    if (!ctx || !cfg) return;
    if (target.unitLookDefinition(unit).drawEyes === false) return;
    if (facing === "left" || facing === "right") {
      const img = target.unitEyeSideSprite(unit);
      if (!img) return;
      ctx.save();
      if (facing === "left") {
        ctx.translate(anchor.x + cfg.w, anchor.y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, cfg.w, cfg.h);
      } else {
        ctx.drawImage(img, anchor.x, anchor.y, cfg.w, cfg.h);
      }
      ctx.restore();
    } else if (facing === "down") {
      const img = target.unitEyeFrontSprite(unit);
      if (!img) return;
      ctx.drawImage(img, anchor.x, anchor.y, cfg.w, cfg.h);
    }
  };

  const drawUnitEyes = (unit, p, bob = 0, offsetTable = target.eyeOffsets) => {
    const { ctx } = canvasContext(target);
    if (!ctx || target.unitLookDefinition(unit).drawEyes === false) return;
    const facing = unit.facing || "down";
    const offset = Object.prototype.hasOwnProperty.call(offsetTable, facing) ? offsetTable[facing] : offsetTable.down;
    if (!offset) return;
    if (facing === "left" || facing === "right") {
      const sideEye = target.unitEyeSideSprite(unit);
      if (!sideEye) return;
      ctx.save();
      if (facing === "left") {
        ctx.translate(p.x + offset.x + offset.w, p.y - offset.y + bob);
        ctx.scale(-1, 1);
        ctx.drawImage(sideEye, 0, 0, offset.w, offset.h);
      } else {
        ctx.drawImage(sideEye, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
      }
      ctx.restore();
      return;
    }
    const frontEyes = target.unitEyeFrontSprite(unit);
    if (!frontEyes) return;
    ctx.drawImage(frontEyes, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
  };

  const drawHeldMoneyDart = (unit, p) => {
    const { ctx } = canvasContext(target);
    if (!ctx || !unit.moneyDart) return;
    const elapsed = currentNow(target) - unit.moneyDart.startedAt;
    const pickupMs = 300;
    ctx.save();
    if (elapsed < pickupMs) {
      const idleSprite = unitSprite(unit);
      if (idleSprite) ctx.drawImage(idleSprite, p.x - 31, p.y - 47, 62, 62);
      if (target.moneyDartPickupFrames.length > 0) {
        const idx = Math.min(target.moneyDartPickupFrames.length - 1, Math.floor(elapsed / pickupMs * target.moneyDartPickupFrames.length));
        const dartFrame = target.moneyDartPickupFrames[idx];
        if (dartFrame) ctx.drawImage(dartFrame, p.x - 18, p.y - 25, 36, 36);
      }
      drawUnitEyes(unit, p, 0);
    } else {
      const frame = moneyDartReadyFrame(unit.facing, unit);
      const readyOff = target.moneyDartReadyOffsets[unit.facing] || { dx: 0, dy: 0 };
      if (frame) ctx.drawImage(frame, p.x - 31 + readyOff.dx, p.y - 47 + readyOff.dy, 62, 62);
      drawUnitEyes(unit, p, 0, target.moneyDartEyeOffsets);
    }
    ctx.restore();
  };

  const drawHeldKunai = (unit, p) => {
    const { ctx } = canvasContext(target);
    if (!ctx || target.activeMoneyDartCast(unit)) return;
    const frame = target.weaponFrames[unit.weaponKey || target.defaultWeaponKey]?.hand?.[unit.facing]?.[0];
    if (!frame) return;
    const scale = 1.25;
    const w = frame.width * scale;
    const h = frame.height * scale;
    const offsets = {
      right: { x: 8, y: 39 },
      left: { x: -8 - w, y: 39 },
      up: { x: -w / 2, y: 58 },
      down: { x: -w / 2, y: 22 },
    };
    const offset = offsets[unit.facing] || offsets.down;
    const at = applyOffset(p, offset);
    ctx.drawImage(frame, at.x, at.y, w, h);
  };

  const cloneDecoyVisualState = (decoy) => {
    const state = resolveRuntimeState(target);
    const caster = state.units.find((unit) => unit.id === decoy.casterId);
    if (!caster) return decoy;
    return {
      ...decoy,
      name: caster.name,
      hp: caster.hp,
      maxHp: caster.maxHp,
      controlMode: caster.controlMode,
      appearanceKey: caster.appearanceKey,
      steelUntil: caster.steelUntil,
      hotBloodUntil: caster.hotBloodUntil,
      moveSkillFreeUntil: caster.moveSkillFreeUntil,
      buffAuraType: caster.buffAuraType,
    };
  };

  const drawCloneDecoys = () => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!ctx || !state.cloneDecoys?.length) return;
    for (const decoy of state.cloneDecoys) {
      const visualDecoy = cloneDecoyVisualState(decoy);
      const p = target.unitPosition(decoy);
      const sprite = unitSprite(visualDecoy);
      if (!sprite) continue;
      ctx.save();
      ctx.globalAlpha = 0.92;
      const auraType = activeBuffAuraType(visualDecoy);
      drawBuffAuraSpriteOutline(auraType, sprite, p, 0);
      target.drawUnitImage(sprite, p);
      drawUnitEyes(visualDecoy, p, 0);
      drawHp(visualDecoy, p.x, p.y - 70);
      drawUnitName(visualDecoy, p.x, p.y - 50);
      ctx.restore();
    }
  };

  const drawUnits = () => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!ctx || !state.units) return;
    drawCloneDecoys();
    for (const unit of state.units) {
      if (!unit.alive) continue;
      const p = target.unitPosition(unit);
      const selected = unit.id === state.selectedId;
      const bob = 0;
      const isPlayer = unit.id === target.playerUnitId;

      if (selected && !isPlayer) {
        ctx.strokeStyle = "#ffe06d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4, 31, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (state.charging && state.pressedUnit === unit) {
        drawChargeEffect(p, "back", unit);
      }

      if (unit.hitFlash > 0) {
        unit.hitFlash = Math.max(0, unit.hitFlash - 0.06);
        ctx.save();
        ctx.globalAlpha = unit.hitFlash;
        ctx.fillStyle = "#ff5148";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const useNinjuSprite = target.unitUseNinjuSprite(unit);
      const sprite = useNinjuSprite || unitSprite(unit);
      const isMoving = unit.moveTrail && (currentNow(target) - unit.moveTrail.startedAt) < target.ARRIVE_TOTAL;
      if (!target.activeMoneyDartCast(unit) && !isMoving && !unit.moneyDart && sprite) {
        const auraType = activeBuffAuraType(unit);
        drawBuffAuraSpriteOutline(auraType, sprite, p, bob);
        const spritePoint = useNinjuSprite
          ? { x: p.x + target.useNinjuSpriteOffset.x, y: p.y + target.useNinjuSpriteOffset.y }
          : p;
        target.drawUnitImage(sprite, spritePoint, bob);
        if (useNinjuSprite) drawUnitEyes({ ...unit, facing: "down" }, p, bob);
        else drawUnitEyes(unit, p, bob);
      } else if (!target.activeMoneyDartCast(unit) && !isMoving && !unit.moneyDart && !isPlayer) {
        ctx.fillStyle = unit.team === "blue" ? "#5bb8ff" : "#b5b9b3";
        ctx.beginPath();
        ctx.arc(p.x, p.y - 12 + bob, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      if (state.charging && state.pressedUnit === unit) {
        drawChargeEffect(p, "front", unit);
      }

      if (unit.moneyDart && !target.activeMoneyDartCast(unit) && !isMoving) {
        const auraType = activeBuffAuraType(unit);
        if (auraType) {
          const elapsed = currentNow(target) - unit.moneyDart.startedAt;
          const pickupMs = 300;
          let auraSprite;
          if (elapsed < pickupMs) {
            auraSprite = unitSprite(unit);
            if (auraSprite) drawBuffAuraSpriteOutline(auraType, auraSprite, p, bob);
          } else {
            auraSprite = moneyDartReadyFrame(unit.facing, unit) || unitSprite(unit);
            const auraOff = target.moneyDartReadyOffsets[unit.facing] || { dx: 0, dy: 0 };
            const drawAt = { x: p.x - 31 + auraOff.dx, y: p.y - 47 + auraOff.dy + bob, w: 62, h: 62 };
            if (auraSprite) drawBuffAuraSpriteOutline(auraType, auraSprite, p, bob, drawAt);
          }
        }
      }

      drawHeldMoneyDart(unit, p);
      drawRespawnPointer(unit, p);

      if (isPlayer) {
        drawPlayerArrow(p);
      } else {
        drawHp(unit, p.x, p.y - 70);
        drawUnitName(unit, p.x, p.y - 50);
      }
    }
  };

  Object.assign(target, {
    unitSprite,
    drawUnits,
    drawCloneDecoys,
    cloneDecoyVisualState,
    drawChargeEffect,
    drawSteelSpriteOutline,
    drawHotBloodSpriteOutline,
    drawSake4SpriteOutline,
    drawBuffAuraSpriteOutline,
    drawBuffSpriteOutline,
    spriteColorMask,
    activeBuffAuraType,
    isSake4MoveSkillFreeActive,
    applyOffset,
    drawHeldKunai,
    drawRespawnPointer,
    drawHeldMoneyDart,
    moneyDartReadyFrame,
    moneyDartPickupOrReadyFrame,
    drawHp,
    localizedLookLabel,
    battleUnitName,
    drawUnitName,
    drawPlayerArrow,
    drawMoneyDartShootEye,
    drawUnitEyes,
  });

  target.NindouUnitRenderer = {
    unitSprite,
    drawUnits,
    drawCloneDecoys,
    cloneDecoyVisualState,
    drawChargeEffect,
    drawSteelSpriteOutline,
    drawHotBloodSpriteOutline,
    drawSake4SpriteOutline,
    drawBuffAuraSpriteOutline,
    drawBuffSpriteOutline,
    spriteColorMask,
    activeBuffAuraType,
    isSake4MoveSkillFreeActive,
    applyOffset,
    drawHeldKunai,
    drawRespawnPointer,
    drawHeldMoneyDart,
    moneyDartReadyFrame,
    moneyDartPickupOrReadyFrame,
    drawHp,
    localizedLookLabel,
    battleUnitName,
    drawUnitName,
    drawPlayerArrow,
    drawMoneyDartShootEye,
    drawUnitEyes,
  };
}
