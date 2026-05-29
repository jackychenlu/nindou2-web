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

function selectedNinjuLoadout(target) {
  const loadout = target.NindouRuntimeState?.getSelectedNinjuLoadout?.() || target.selectedNinjuLoadout;
  return Array.isArray(loadout) ? loadout : [];
}

export function installHudRendererGlobals(target = globalThis) {
  const drawOutlinedText = (text, x, y, size, color, align = "left") => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.font = `700 ${size}px Microsoft JhengHei, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,.72)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawNinjuButtonText = (text, x, y, size, color, align = "center") => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.font = `700 ${size}px DFKai-SB, KaiTi, Microsoft JhengHei, serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawIconImage = (img, x, y, w, h) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    if (img) {
      ctx.drawImage(img, x, y, w, h);
      return;
    }
    ctx.fillStyle = "#cbd5ce";
    ctx.fillRect(x, y, w, h);
  };

  const drawHudBar = (x, y, w, h, ratio, color, label, valueText = "") => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "#26302c";
    ctx.strokeStyle = "#d4a85e";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#080808";
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    ctx.fillStyle = color;
    ctx.fillRect(x + 6, y + 6, (w - 12) * ratio, h - 12);
    ctx.fillStyle = "#4a4a3d";
    ctx.beginPath();
    ctx.arc(x - 10, y + h / 2, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawOutlinedText(label, x - 10, y + h / 2 + 1, 19, "#e9f3dc", "center");
    if (valueText) {
      ctx.font = "700 15px Microsoft JhengHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(valueText, x + w / 2, y + h / 2 + 1);
      ctx.fillStyle = "#fff7d6";
      ctx.fillText(valueText, x + w / 2, y + h / 2 + 1);
    }
    ctx.restore();
  };

  const drawMoneyBox = (x, y, text, w = 180) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    if (target.images.moneyPanel) {
      ctx.drawImage(target.images.moneyPanel, x, y - 4, w, 30);
    } else {
      ctx.fillStyle = "#2a9cca";
      ctx.fillRect(x, y - 4, w, 30);
    }
    ctx.strokeStyle = "#041316";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y - 4, w, 30);
    ctx.fillStyle = "#38c2f2";
    ctx.font = "700 18px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + 11);
    ctx.restore();
  };

  const itemSlotRect = (index) => ({
    x: target.itemSlotStartX + index * (target.itemSlotW + target.itemSlotGap),
    y: target.itemSlotY,
    w: target.itemSlotW,
    h: target.itemSlotH,
  });

  const drawItemSlot = (x, y, w, h, filled) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = filled ? "#12626d" : "#163f49";
    ctx.strokeStyle = "#5eb5b3";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x + 4, y + 3, w - 8, 4);
    ctx.restore();
  };

  const itemIconByType = (type) => {
    if (type === "backup3") return target.images.backup3Item;
    if (type === "sake4") return target.images.sake4Item;
    if (type === "magicWater") return target.images.magicWaterItem;
    return null;
  };

  const itemIconSourceByType = (type) => {
    if (type === "backup3") return target.imageSources.backup3Item;
    if (type === "sake4") return target.imageSources.sake4Item;
    if (type === "magicWater") return target.imageSources.magicWaterItem;
    return "";
  };

  const drawInventoryItemHud = (type, x, y) => {
    if (!type) return;
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const img = itemIconByType(type);
    ctx.save();
    if (img) {
      const size = 23;
      const scale = Math.min(size / Math.max(1, img.width), size / Math.max(1, img.height));
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, x + 19 - w / 2, y + 17 - h / 2, w, h);
    }
    ctx.restore();
  };

  const currentNinjuButtonRects = () => ({
    moneyDart: typeof target.moneyDartButtonRect !== "undefined" ? target.moneyDartButtonRect : { x: 508, y: 600, w: 65, h: 30 },
    steel: typeof target.steelButtonRect !== "undefined" ? target.steelButtonRect : { x: 582, y: 600, w: 65, h: 30 },
    hotBlood: typeof target.hotBloodButtonRect !== "undefined" ? target.hotBloodButtonRect : { x: 656, y: 600, w: 65, h: 30 },
    genki: typeof target.genkiButtonRect !== "undefined" ? target.genkiButtonRect : { x: 730, y: 600, w: 65, h: 30 },
    kakki: typeof target.kakkiButtonRect !== "undefined" ? target.kakkiButtonRect : { x: 804, y: 600, w: 65, h: 30 },
    shinki: typeof target.shinkiButtonRect !== "undefined" ? target.shinkiButtonRect : { x: 878, y: 600, w: 65, h: 30 },
  });

  const currentNinjuSlotRects = () => {
    const rects = currentNinjuButtonRects();
    return [rects.moneyDart, rects.steel, rects.hotBlood, rects.genki, rects.kakki, rects.shinki];
  };

  const currentNinjuButtonList = () => {
    const slots = currentNinjuSlotRects();
    return selectedNinjuLoadout(target).map((type, index) => {
      if (!type || !target.ninjuByType[type]) return null;
      const source = slots[index] || slots[0];
      const ninju = target.ninjuByType[type] || { label: type };
      return {
        ...source,
        x: source.x + index,
        type,
        label: target.localizedNinjuLabel(ninju),
      };
    }).filter(Boolean);
  };

  const statusButtonRule = (type) => {
    if (target.attackNinjuConfigs[type]) return target.attackNinjuRule(type);
    if (target.specialNinjuConfigs[type]) return target.specialNinjuRule(type);
    if (type === "hotBlood" && typeof target.hotBloodRule === "function") return target.hotBloodRule();
    if ((type === "genki" || type === "kakki" || type === "shinki") && typeof target.healNinjuRule === "function") return target.healNinjuRule(type);
    if (typeof target.steelRule === "function") return target.steelRule();
    return { cost: 7 };
  };

  const attackNinjuSoulLevel = (unit) => Math.min(target.soulMaxLevel, Math.floor((unit?.soulSteps || 0) / target.soulStepsPerLevel));

  const hasReadyAttackNinjuInLoadout = (unit) => {
    if (!unit || attackNinjuSoulLevel(unit) < 1) return false;
    return selectedNinjuLoadout(target).some((type) => Boolean(target.attackNinjuConfigs[type]));
  };

  const drawNinjuSlot = (x, y, w, h, text, type) => {
    const state = resolveRuntimeState(target);
    const unit = target.selectedHudUnit();
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const isSteel = type === true || type === "steel";
    const isHotBlood = type === "hotBlood";
    const isAttackNinju = Boolean(target.attackNinjuConfigs[type]);
    const isSpecialNinju = Boolean(target.specialNinjuConfigs[type]);
    const isHeal = type === "genki" || type === "kakki" || type === "shinki";
    const isMoneyDart = type === "moneyDart";
    const isStatusButton = isSteel || isHotBlood || isHeal || isAttackNinju || isSpecialNinju;
    const statusRule = isStatusButton ? statusButtonRule(type) : null;
    const moneyDartCost = isMoneyDart ? target.moneyDartRule().cost : 0;
    const active = unit && (isStatusButton ? ((unit.ninju?.type === type && (target.isUnitCastingNinju(unit) || target.isUnitInNinjuGap(unit))) || (isSteel ? target.isSteelDefenseActive(unit) : isHotBlood ? target.isHotBloodActive(unit) : false)) : false);
    const hasAttackSoul = !isAttackNinju || attackNinjuSoulLevel(unit) >= 1;
    const hasRequiredSkill = !isStatusButton || isAttackNinju || unit.skill >= statusRule.cost;
    const moneyDartMoving = unit?.moveTrail && (now(target) - unit.moveTrail.startedAt) < target.ARRIVE_TOTAL;
    const moneyDartReady = isMoneyDart && unit.skill >= moneyDartCost && !unit.moneyDart && !target.activeMoneyDartCast(unit) && !moneyDartMoving && now(target) >= (unit.ninjuLockedUntil || 0);
    const canUseNinjuInput = !unit || !target.isUnitDisabled(unit) || target.canUseNinjuDuringConsumable(unit);
    const ready = !unit || (unit.alive && canUseNinjuInput && (isStatusButton ? statusRule.available !== false && hasRequiredSkill && hasAttackSoul : moneyDartReady));
    ctx.save();
    if (isAttackNinju && target.images.flashButton) {
      ctx.globalAlpha = ready ? 1 : 0.55;
      ctx.drawImage(target.images.flashButton, x, y, w, h);
      ctx.globalAlpha = 1;
      const textAt = target.applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
      drawNinjuButtonText(text, textAt.x, textAt.y, target.localizedNinjuFontSize(16), "#232323f8", "center");
    } else if (isSpecialNinju && target.images.moneyDartButton) {
      ctx.globalAlpha = ready ? 1 : 0.55;
      ctx.drawImage(target.images.moneyDartButton, x, y, w, h);
      ctx.globalAlpha = 1;
      const textAt = target.applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
      drawNinjuButtonText(text, textAt.x, textAt.y, target.localizedNinjuFontSize(16), "#232323f8", "center");
    } else if ((isSteel || isHotBlood) && target.images.steelButton) {
      ctx.globalAlpha = ready ? 1 : 0.55;
      ctx.drawImage(target.images.steelButton, x, y, w, h);
      ctx.globalAlpha = 1;
      const textAt = target.applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
      drawNinjuButtonText(text, textAt.x, textAt.y, target.localizedNinjuFontSize(16), "#232323f8", "center");
    } else if (isHeal && target.images.healButton) {
      ctx.globalAlpha = ready ? 1 : 0.55;
      ctx.drawImage(target.images.healButton, x, y, w, h);
      ctx.globalAlpha = 1;
      const textAt = target.applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
      drawNinjuButtonText(text, textAt.x, textAt.y, target.localizedNinjuFontSize(16), "#232323f8", "center");
    } else if (isMoneyDart && target.images.moneyDartButton) {
      ctx.globalAlpha = ready ? 1 : 0.55;
      ctx.drawImage(target.images.moneyDartButton, x, y, w, h);
      ctx.globalAlpha = 1;
      const textAt = target.applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
      drawNinjuButtonText(text, textAt.x, textAt.y, target.localizedNinjuFontSize(16), "#232323f8", "center");
    } else {
      ctx.fillStyle = text ? "#c78e42" : "#2d3d38";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#77bec6";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      if (text) drawOutlinedText(text, x + w / 2, y + h / 2 + 1, target.localizedNinjuFontSize(15), "#ffe6a6", "center");
    }
    if (active) {
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(x, y, w, h);
    }
    if ((isSteel || isHotBlood || isHeal || isAttackNinju || isSpecialNinju) && unit && unit.ninju?.type === type && unit.ninju.queue > 0) {
      drawOutlinedText(`x${unit.ninju.queue + 1}`, x + w - 10, y + 8, 12, "#fff2a8", "center");
    }
    ctx.restore();
  };

  const drawSmallCounter = (x, y, color, text) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y - 5, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8f8f5";
    ctx.font = "13px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 20, y - 4);
    ctx.restore();
  };

  const drawSoulHud = () => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const x = 16;
    const y = 470;
    const w = 284;
    const h = 66;
    const barY = y + 44;
    const barH = 7;
    const tickXs = [52, 101, 154, 214, 272];
    const unit = target.selectedHudUnit();
    const soulSteps = Math.min(target.soulStepsPerLevel * target.soulMaxLevel, Math.max(0, unit?.soulSteps || 0));
    const totalProgress = soulSteps / (target.soulStepsPerLevel * target.soulMaxLevel);
    const completedLevel = Math.min(target.soulMaxLevel, Math.floor(soulSteps / target.soulStepsPerLevel));
    const segmentProgress = completedLevel >= target.soulMaxLevel ? 1 : (soulSteps % target.soulStepsPerLevel) / target.soulStepsPerLevel;
    const imageLevel = completedLevel <= 0 ? 1 : completedLevel + 1;
    const imageKey = `soulHud${Math.min(5, imageLevel)}`;
    const fillColors = ["#1b7a2d", "#1b7a2d", "#20248b", "#8c178e", "#c92116"];
    ctx.save();
    if (target.images[imageKey]) {
      ctx.drawImage(target.images[imageKey], x, y, w, h);
    }
    if (totalProgress > 0) {
      const fromTick = tickXs[completedLevel];
      const toTick = tickXs[Math.min(target.soulMaxLevel, completedLevel + 1)];
      const fillEndOffset = completedLevel >= target.soulMaxLevel ? tickXs[target.soulMaxLevel] : fromTick + (toTick - fromTick) * segmentProgress;
      const barX = x + tickXs[0];
      const fillEndX = x + fillEndOffset;
      const fill = Math.max(0, fillEndX - barX);
      ctx.fillStyle = fillColors[completedLevel] || fillColors[0];
      ctx.fillRect(barX, barY, fill, barH);
    }
    ctx.restore();
  };

  const drawTopHud = () => {
    const state = resolveRuntimeState(target);
    const { canvas, ctx } = canvasContext(target);
    if (!ctx || !canvas) return;
    const text = target.roomLocale();
    ctx.save();
    ctx.fillStyle = "rgba(6, 47, 55, .5)";
    ctx.fillRect(0, 0, canvas.width, 32);
    ctx.textBaseline = "middle";
    drawIconImage(target.images.blueIcon, 38, 5, 35, 25);
    drawOutlinedText(text.topHudName, 118, 18, 17, "#f4f3dd", "left");
    drawOutlinedText(text.topHudLevel, 294, 18, 18, "#f4f3dd", "center");
    drawOutlinedText(text.topHudRole, 372, 18, 18, "#f4f3dd", "center");
    const unit = state.units.find((candidate) => candidate.id === target.playerUnitId);
    if (unit) {
      const coord = target.displayCellCoord(unit);
      drawOutlinedText(`${text.cellLabel} [${coord.x},${coord.y}]`, target.grid.left + target.grid.cols * target.grid.cell - 52, 18, 13, "#d9f4ff", "right");
    }
    ctx.restore();
  };

  const drawBottomPlayerHud = () => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const unit = target.selectedHudUnit();
    const hpRatio = unit ? Math.max(0, unit.hp / (unit.maxHp || target.maxHp)) : 0;
    const skillRatio = unit ? Math.max(0, unit.skill / (unit.skillMax || target.maxSkill)) : 0;
    const hpText = unit ? `${Math.max(0, Math.round(unit.hp))}/${Math.round(unit.maxHp || target.maxHp)}` : `0/${Math.round(target.maxHp)}`;
    const text = target.roomLocale();
    ctx.save();
    drawHudBar(45, 574, 165, 30, hpRatio, "#a057be", text.hpBadge, hpText);
    drawHudBar(262, 574, 165, 30, skillRatio, "#38c2f2", text.skillBadge);
    drawOutlinedText(text.weaponBadge, 35, 654, 18, "#f0f0df", "center");
    drawMoneyBox(50, 642, "", 95);
    drawOutlinedText(text.repBadge, 175, 654, 18, "#f0f0df", "center");
    drawMoneyBox(190, 642, "0", 95);
    drawOutlinedText(text.goldBadge, 315, 654, 18, "#f0f0df", "center");
    drawMoneyBox(330, 642, "0", 95);
    ctx.restore();
  };

  const drawInventoryHud = () => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const itemY = target.itemSlotY;
    const ninjuY = 600;
    const startX = target.itemSlotStartX;
    const slotW = target.itemSlotW;
    const gap = target.itemSlotGap;
    const text = target.roomLocale();
    const unit = target.selectedHudUnit();
    ctx.save();
    drawOutlinedText(text.itemBadge, 482, itemY + 14, 22, "#f0f0df", "center");
    drawOutlinedText(text.ninjuBadge, 482, ninjuY + 15, 22, "#f0f0df", "center");
    for (let i = 0; i < 10; i++) {
      const x = startX + i * (slotW + gap);
      const itemType = unit?.itemSlots?.[i] || "";
      drawItemSlot(x, itemY, slotW, target.itemSlotH, Boolean(itemType));
      drawInventoryItemHud(itemType, x, itemY);
    }
    const ninjuLabels = ["", "", "", "", "", ""];
    for (let i = 0; i < ninjuLabels.length; i++) {
      const x = 510 + i * 75;
      drawNinjuSlot(x, ninjuY, 60, 30, ninjuLabels[i], false);
    }
    for (const button of currentNinjuButtonList()) {
      drawNinjuSlot(button.x, button.y, button.w, button.h, button.label, button.type);
    }
    drawSmallCounter(476, 644, "#2479a9", String(target.teamAliveCount("blue")));
    drawSmallCounter(476, 670, "#d8d8d8", String(target.teamAliveCount("grey")));
    ctx.restore();
  };

  const drawGameHud = () => {
    drawSoulHud();
    drawTopHud();
    drawBottomPlayerHud();
    drawInventoryHud();
  };

  const drawNinjuBar = () => {
    const unit = target.selectedHudUnit();
    const { ctx } = canvasContext(target);
    if (!unit || !ctx) return;
    const text = target.roomLocale();
    const active = target.isUnitCastingNinju(unit);
    const gap = target.isUnitInNinjuGap(unit);
    const steelBuff = target.isSteelDefenseActive(unit);
    const hotBloodBuff = target.isHotBloodActive(unit);
    const buff = steelBuff || hotBloodBuff;
    const fallbackCost = hasReadyAttackNinjuInLoadout(unit) ? 0 : target.steelRule().cost;
    if (!active && !gap && !buff && (!unit.alive || unit.skill >= target.steelRule().cost)) return;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(814, 636, 62, 30);
    const buffUntil = Math.max(unit.steelUntil || 0, unit.hotBloodUntil || 0);
    const displayText = active ? text.ninjuCasting : gap ? text.ninjuMovable : buff ? `${Math.ceil((buffUntil - now(target)) / 1000)}${text.secondsSuffix}` : `${text.ninjuSkillCostPrefix} ${fallbackCost}`;
    drawOutlinedText(displayText, 845, 651, 14, "#f7f6d7", "center");
    ctx.restore();
  };

  Object.assign(target, {
    drawGameHud,
    drawSoulHud,
    drawTopHud,
    drawBottomPlayerHud,
    drawHudBar,
    drawMoneyBox,
    drawInventoryHud,
    itemSlotRect,
    drawItemSlot,
    drawInventoryItemHud,
    itemIconByType,
    itemIconSourceByType,
    drawNinjuSlot,
    currentNinjuButtonRects,
    currentNinjuButtonList,
    currentNinjuSlotRects,
    statusButtonRule,
    attackNinjuSoulLevel,
    hasReadyAttackNinjuInLoadout,
    drawSmallCounter,
    drawNinjuButtonText,
    drawIconImage,
    drawOutlinedText,
    drawNinjuBar,
  });

  target.NindouHudRenderer = {
    drawGameHud,
    drawSoulHud,
    drawTopHud,
    drawBottomPlayerHud,
    drawHudBar,
    drawMoneyBox,
    drawInventoryHud,
    itemSlotRect,
    drawItemSlot,
    drawInventoryItemHud,
    itemIconByType,
    itemIconSourceByType,
    drawNinjuSlot,
    currentNinjuButtonRects,
    currentNinjuButtonList,
    currentNinjuSlotRects,
    statusButtonRule,
    attackNinjuSoulLevel,
    hasReadyAttackNinjuInLoadout,
    drawSmallCounter,
    drawNinjuButtonText,
    drawIconImage,
    drawOutlinedText,
    drawNinjuBar,
  };
}
