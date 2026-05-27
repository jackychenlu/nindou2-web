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

export function installMovementRendererGlobals(target = globalThis) {
  const drawMoveTrails = (now) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.units || !ctx) return;
    for (const unit of state.units) {
      if (!unit.moveTrail) continue;
      const age = now - unit.moveTrail.startedAt;
      if (age >= Math.max(target.ARRIVE_TOTAL, target.PREARRIVE_TOTAL)) {
        unit.moveTrail = null;
        continue;
      }

      const trail = unit.moveTrail;
      const dir = trail.facing;
      const team = target.unitLookDefinition(unit).moveSet || trail.team || (unit.team === "grey" ? "grey" : "blue");
      const dest = target.cellCenter(unit.x, unit.y);
      const src = target.cellCenter(trail.fromX, trail.fromY);

      if (age < target.PREARRIVE_TOTAL) {
        const fi = Math.min(1, Math.floor(age / target.PREARRIVE_FRAME_MS));
        const frame = target.movePrearriveFrames[team]?.[dir]?.[fi];
        if (frame) ctx.drawImage(frame, src.x - frame.width / 2, src.y - frame.height / 2);
      }

      if (age < target.ARRIVE_TOTAL) {
        const fi = Math.min(4, Math.floor(age / target.ARRIVE_FRAME_MS));
        const frame = target.moveArriveFrames[team]?.[dir]?.[fi];
        if (frame) {
          const off = target.arriveFrameOffset(dir, dest.x, dest.y, frame.width, frame.height);
          if (dir === "right" || dir === "left") {
            ctx.save();
            ctx.beginPath();
            ctx.rect(off.x, dest.y - 47, frame.width, 62);
            ctx.clip();
            ctx.drawImage(frame, off.x, off.y, frame.width, frame.height);
            ctx.restore();
          } else {
            ctx.drawImage(frame, off.x, off.y, frame.width, frame.height);
          }
        }
      }
    }
  };

  const unitPosition = (unit) => {
    const targetCell = target.cellCenter(unit.x, unit.y);
    if (unit.moveT >= 1) return targetCell;
    const from = target.cellCenter(unit.fromX, unit.fromY);
    const t = 1 - Math.pow(1 - unit.moveT, 3);
    unit.moveT = Math.min(1, unit.moveT + 0.08);
    return {
      x: from.x + (targetCell.x - from.x) * t,
      y: from.y + (targetCell.y - from.y) * t,
    };
  };

  const unitMoveDirection = (unit) => {
    const dx = unit.x - unit.fromX;
    const dy = unit.y - unit.fromY;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    if (dy !== 0) return dy > 0 ? "down" : "up";
    return unit.facing || "down";
  };

  const unitMoveSprite = (unit, direction, progress) => {
    const team = target.unitLookDefinition(unit).moveSet || (unit.team === "blue" ? "blue" : "grey");
    const frameSet = progress < 0.35 ? target.movePrearriveFrames : target.moveArriveFrames;
    const frames = frameSet[team]?.[direction] || [];
    const available = frames.filter(Boolean);
    if (!available.length) return null;
    const localProgress = progress < 0.35 ? progress / 0.35 : (progress - 0.35) / 0.65;
    const index = Math.min(available.length - 1, Math.floor(localProgress * available.length));
    return available[index];
  };

  const unitUseNinjuSprite = (unit) => {
    if (!unit || unit.moneyDart || !target.isUnitCastingNinju(unit)) return null;
    const team = target.unitLookDefinition(unit).useNinjuSet || (unit.team === "blue" ? "blue" : "grey");
    const frames = (target.useNinjuFrames[team] || []).filter(Boolean);
    if (!frames.length) return null;
    const progress = Math.min(0.999, (currentNow(target) - unit.ninju.startedAt) / unit.ninju.duration);
    return frames[Math.floor(progress * frames.length)];
  };

  const moveEffectPhase = (progress) => (progress < 0.35 ? "prearrive" : "arrive");

  const drawUnitImage = (sprite, p, bob = 0, naturalSize = false, direction = "down", phase = "arrive") => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    if (!naturalSize) {
      ctx.drawImage(sprite, p.x - 31, p.y - 47 + bob, 62, 62);
      return;
    }
    const offset = target.moveEffectOffsets[phase]?.[direction] || { x: 0, y: 0 };
    const yOffset = sprite.height > sprite.width ? 78 : 26;
    ctx.drawImage(sprite, p.x - sprite.width / 2 + offset.x, p.y - yOffset + bob - offset.y);
  };

  const drawDragArrow = (from, to, direction, enough) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const directionName = typeof direction === "string" ? direction : direction?.name;
    const frame = target.dragArrowFrames[directionName]?.[0];
    if (!frame) return;
    const arrowY = -18;
    const thickness = 32;
    const minLength = 36;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(minLength, Math.abs(dx) + Math.abs(dy));

    ctx.save();
    ctx.globalAlpha = enough ? 0.95 : 0.45;
    if (directionName === "right") {
      ctx.drawImage(frame, from.x, from.y + arrowY - thickness / 2, length, thickness);
    } else if (directionName === "left") {
      ctx.drawImage(frame, from.x - length, from.y + arrowY - thickness / 2, length, thickness);
    } else if (directionName === "up") {
      ctx.drawImage(frame, from.x - thickness / 2, from.y + arrowY - length, thickness, length);
    } else if (directionName === "down") {
      ctx.drawImage(frame, from.x - thickness / 2, from.y + arrowY, thickness, length);
    }
    ctx.restore();
  };

  const drawDrag = () => {
    const state = resolveRuntimeState(target);
    if (!state?.charging || !state.dragMoved || !state.pressedUnit) return;
    if (!target.canDraggedUnitMoveNow(state.pressedUnit)) return;
    const moveTarget = target.dragMoveTargetCell(state.pressedUnit);
    if (!moveTarget) return;
    const maxDistance = Math.floor(state.pressedUnit.skill);
    const reachable = maxDistance >= 1 ? target.reachableMoveCell(state.pressedUnit, moveTarget, maxDistance) : null;
    if (!reachable) return;
    const from = unitPosition(state.pressedUnit);
    const to = target.cellCenter(reachable.x, reachable.y);
    const dist = target.manhattan(state.pressedUnit, reachable);
    const enough = state.pressedUnit.skill >= Math.max(1, dist);
    const direction = target.directionFromTarget(state.pressedUnit, reachable);
    if (!direction) return;
    drawDragArrow(from, to, direction, enough);
  };

  const updateFacingFromPointer = (unit) => {
    const state = resolveRuntimeState(target);
    if (!state?.pointer) return;
    const origin = target.cellCenter(unit.x, unit.y);
    const dx = state.pointer.x - origin.x;
    const dy = state.pointer.y - origin.y;
    if (Math.hypot(dx, dy) < 8) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      unit.facing = dx > 0 ? "right" : "left";
    } else {
      unit.facing = dy > 0 ? "down" : "up";
    }
  };

  Object.assign(target, {
    drawMoveTrails,
    unitPosition,
    unitMoveDirection,
    unitMoveSprite,
    unitUseNinjuSprite,
    moveEffectPhase,
    drawUnitImage,
    drawDrag,
    drawDragArrow,
    updateFacingFromPointer,
  });

  target.NindouMovementRenderer = {
    drawMoveTrails,
    unitPosition,
    unitMoveDirection,
    unitMoveSprite,
    unitUseNinjuSprite,
    moveEffectPhase,
    drawUnitImage,
    drawDrag,
    drawDragArrow,
    updateFacingFromPointer,
  };
}
