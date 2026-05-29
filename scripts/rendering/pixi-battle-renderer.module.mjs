const RENDERER_CANVAS = "canvas";
const RENDERER_PIXI = "pixi";

function runtimeWindow(target) {
  return target.window || target;
}

function rendererFromUrl(target) {
  try {
    const location = runtimeWindow(target).location;
    if (!location?.href) return "";
    return new URL(location.href).searchParams.get("renderer") || "";
  } catch {
    return "";
  }
}

export function rendererPreference(target = globalThis) {
  const explicit = typeof target.NindouRenderer === "string" ? target.NindouRenderer : "";
  const dataset = target.document?.documentElement?.dataset?.nindouRenderer || "";
  return (explicit || dataset || rendererFromUrl(target) || RENDERER_CANVAS).trim().toLowerCase();
}

export function shouldUsePixiRenderer(target = globalThis) {
  return rendererPreference(target) === RENDERER_PIXI;
}

function queryGameCanvas(target) {
  return target.canvas || target.document?.querySelector?.("#game") || null;
}

function mirrorCanvasSize(sourceCanvas, targetCanvas) {
  targetCanvas.width = sourceCanvas.width || 800;
  targetCanvas.height = sourceCanvas.height || 600;
  targetCanvas.style.width = sourceCanvas.style?.width || `${targetCanvas.width}px`;
  targetCanvas.style.height = sourceCanvas.style?.height || `${targetCanvas.height}px`;
}

export function ensurePixiCanvas(target = globalThis, sourceCanvas = queryGameCanvas(target)) {
  if (!sourceCanvas?.parentNode || !target.document?.createElement) return null;
  const existing = target.document.querySelector?.("#pixiGame");
  if (existing) return existing;
  const pixiCanvas = target.document.createElement("canvas");
  pixiCanvas.id = "pixiGame";
  pixiCanvas.className = sourceCanvas.className || "";
  pixiCanvas.setAttribute("aria-label", sourceCanvas.getAttribute?.("aria-label") || "Pixi battle renderer");
  mirrorCanvasSize(sourceCanvas, pixiCanvas);
  pixiCanvas.hidden = !shouldUsePixiRenderer(target);
  sourceCanvas.insertAdjacentElement?.("afterend", pixiCanvas);
  return pixiCanvas;
}

function runtimeState(target) {
  return target.NindouRuntimeState?.getState?.() || {};
}

function currentNow(target) {
  return target.performance?.now?.() ?? performance.now();
}

function battleMapRect(target) {
  const grid = target.grid || {};
  const inset = target.battleMapDrawInset || { left: 0, top: 0, right: 0, bottom: 0 };
  const width = (grid.cols || 0) * (grid.cell || 0);
  const height = (grid.rows || 0) * (grid.cell || 0);
  return {
    x: (grid.left || 0) + inset.left,
    y: (grid.top || 0) + inset.top,
    w: width - inset.left - inset.right,
    h: height - inset.top - inset.bottom,
  };
}

function imageForMap(target, mapDefinition = target.currentRoomMapDefinition?.() || {}) {
  const images = target.images || {};
  const groundImage = images[mapDefinition.groundImageKey] || images.arena;
  const fallbackImage = images[mapDefinition.fallbackImageKey] || images.bg;
  const maskImage = images[mapDefinition.maskImageKey];
  return { groundImage, fallbackImage, maskImage };
}

function drawImageSprite({ Sprite, Texture, layer, image, rect, alpha = 1 }) {
  if (!image || !Sprite || !Texture) return false;
  const sprite = new Sprite(Texture.from(image));
  sprite.x = rect.x;
  sprite.y = rect.y;
  sprite.width = rect.w;
  sprite.height = rect.h;
  sprite.alpha = alpha;
  layer.addChild(sprite);
  return true;
}

function imageSize(image, fallback = 62) {
  return {
    w: Number(image?.width) || fallback,
    h: Number(image?.height) || fallback,
  };
}

function drawNaturalSprite({ Sprite, Texture, layer, image, x, y, w = null, h = null, alpha = 1, tint = null }) {
  if (!image || !Sprite || !Texture) return null;
  const size = imageSize(image);
  const sprite = new Sprite(Texture.from(image));
  sprite.x = x;
  sprite.y = y;
  sprite.width = w ?? size.w;
  sprite.height = h ?? size.h;
  sprite.alpha = alpha;
  if (tint !== null) sprite.tint = tint;
  layer.addChild(sprite);
  return sprite;
}

function addText({ Text, layer, value, x, y, size = 12, color = "#fff7d6", align = "center" }) {
  if (!Text || value === undefined || value === null) return null;
  const text = new Text({
    text: String(value),
    style: {
      fontFamily: "Microsoft JhengHei, sans-serif",
      fontSize: size,
      fontWeight: "700",
      fill: color,
      stroke: { color: "rgba(0,0,0,0.78)", width: 3 },
      align,
    },
  });
  text.anchor?.set?.(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
  text.x = x;
  text.y = y;
  layer.addChild(text);
  return text;
}

function fillRect(graphics, rect, color, alpha = 1) {
  graphics.rect(rect.x, rect.y, rect.w, rect.h);
  graphics.fill({ color, alpha });
}

function strokeRect(graphics, rect, color, width = 1, alpha = 1) {
  graphics.rect(rect.x, rect.y, rect.w, rect.h);
  graphics.stroke({ color, width, alpha });
}

function sortedMapObjects(target) {
  const state = runtimeState(target);
  return (state.objects || [])
    .filter((object) => object.alive && !object.hidden)
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function mapObjectRect(target, object) {
  const grid = target.grid || {};
  const center = target.cellCenter?.(object.x, object.y) || {
    x: (grid.left || 0) + (object.x + 0.5) * (grid.cell || 0),
    y: (grid.top || 0) + (object.y + 0.5) * (grid.cell || 0),
  };
  const scale = object.scale || 1;
  const width = (grid.cell || 0) * (object.drawWidthCells || scale);
  const height = (grid.cell || 0) * (object.drawHeightCells || scale);
  const anchorY = object.drawAnchorY ?? 0.72;
  const drawX = center.x + (object.drawOffsetX || 0);
  const drawY = center.y + (object.drawOffsetY || 0);
  return {
    x: drawX - width / 2,
    y: drawY - height * anchorY,
    w: width,
    h: height,
    fallbackX: center.x - width / 2,
    fallbackY: center.y - height / 2,
  };
}

function unitPoint(target, unit) {
  if (typeof target.unitPosition === "function") return target.unitPosition(unit);
  if (typeof target.cellCenter === "function") return target.cellCenter(unit.x, unit.y);
  const grid = target.grid || {};
  return {
    x: (grid.left || 0) + (unit.x + 0.5) * (grid.cell || 0),
    y: (grid.top || 0) + (unit.y + 0.5) * (grid.cell || 0),
  };
}

function unitSpriteImage(target, unit) {
  if (typeof target.unitSprite === "function") return target.unitSprite(unit);
  const look = target.unitLookDefinition?.(unit) || {};
  const prefix = look.spriteSet || (unit.team === "blue" ? "blue" : "grey");
  const facing = unit.facing || "down";
  const suffix = facing.charAt(0).toUpperCase() + facing.slice(1);
  return target.images?.[prefix + suffix] || null;
}

function activeUnits(target) {
  const state = runtimeState(target);
  return (state.units || [])
    .filter((unit) => unit.alive)
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x || String(a.id).localeCompare(String(b.id)));
}

function cloneDecoys(target) {
  const state = runtimeState(target);
  return (state.cloneDecoys || []).map((decoy) => target.cloneDecoyVisualState?.(decoy) || decoy);
}

function frameByProgress(frames, progress) {
  if (!Array.isArray(frames) || frames.length === 0) return null;
  return frames[Math.min(frames.length - 1, Math.floor(Math.min(0.999, Math.max(0, progress)) * frames.length))] || null;
}

function frameByElapsed(frames, elapsed, duration, frameDurationMs = 0) {
  if (!Array.isArray(frames) || frames.length === 0) return null;
  const index = frameDurationMs
    ? Math.floor(elapsed / frameDurationMs)
    : Math.floor(Math.min(0.999, Math.max(0, elapsed / Math.max(1, duration))) * frames.length);
  return frames[Math.min(frames.length - 1, Math.max(0, index))] || null;
}

export async function createPixiBattleRenderer({
  target = globalThis,
  canvas = ensurePixiCanvas(target),
  importPixi = () => import("pixi.js"),
} = {}) {
  if (!canvas) {
    throw new Error("Pixi battle renderer requires a canvas element");
  }

  const { Application, Container, Graphics, Sprite, Text, Texture } = await importPixi();
  const app = new Application();
  await app.init({
    canvas,
    width: canvas.width || 800,
    height: canvas.height || 600,
    backgroundAlpha: 0,
    antialias: false,
  });

  const layers = {
    backdrop: new Container(),
    board: new Container(),
    mapObjects: new Container(),
    units: new Container(),
    effects: new Container(),
    hud: new Container(),
  };
  app.stage.addChild(...Object.values(layers));

  const backdropGraphics = new Graphics();
  const boardOverlay = new Graphics();
  const mapObjectFallbacks = new Graphics();
  const moveTrailGraphics = new Graphics();
  const unitGraphics = new Graphics();
  const hudGraphics = new Graphics();
  layers.backdrop.addChild(backdropGraphics);
  layers.board.addChild(boardOverlay);
  layers.mapObjects.addChild(mapObjectFallbacks);
  layers.units.addChild(unitGraphics);
  layers.effects.addChild(moveTrailGraphics);
  layers.hud.addChild(hudGraphics);

  function resizeFromCanvas(sourceCanvas = queryGameCanvas(target)) {
    if (!sourceCanvas) return;
    mirrorCanvasSize(sourceCanvas, canvas);
    app.renderer.resize(canvas.width || 800, canvas.height || 600);
  }

  function clearLayer(layer, keep = 0) {
    const childCount = layer.children?.length || 0;
    if (childCount <= keep) return;
    if (typeof layer.removeChildren === "function") {
      layer.removeChildren(keep, childCount);
      return;
    }
    if (Array.isArray(layer.children)) {
      layer.children.splice(keep);
    }
  }

  function renderBackdrop() {
    clearLayer(layers.backdrop, 1);
    backdropGraphics.clear();
    const rect = battleMapRect(target);
    const { groundImage, fallbackImage, maskImage } = imageForMap(target);
    const drewGround = drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: groundImage, rect });
    if (!drewGround) {
      const drewFallback = drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: fallbackImage, rect, alpha: 0.8 });
      if (!drewFallback) fillRect(backdropGraphics, rect, 0x74ad7f, 1);
    }
    drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: maskImage, rect });
  }

  function renderBoard() {
    boardOverlay.clear();
    const grid = target.grid;
    if (grid?.cols && grid?.rows && grid?.cell) {
      const state = runtimeState(target);
      for (let y = 0; y < grid.rows; y += 1) {
        for (let x = 0; x < grid.cols; x += 1) {
          const hovered = state.pointer?.cell && state.pointer.cell.x === x && state.pointer.cell.y === y;
          if (!hovered) continue;
          const rect = target.cellRect?.(x, y) || { x: grid.left + x * grid.cell, y: grid.top + y * grid.cell, w: grid.cell, h: grid.cell };
          const blocked = target.isBlockedCell?.(x, y);
          fillRect(boardOverlay, rect, blocked ? 0xff5245 : 0xffee7c, 0.22);
        }
      }

      const selected = target.selectedUnit?.();
      if (selected) {
        for (const cell of target.neighbors?.(selected.x, selected.y) || []) {
          if (!target.inside?.(cell.x, cell.y)) continue;
          const rect = target.cellRect?.(cell.x, cell.y) || { x: grid.left + cell.x * grid.cell, y: grid.top + cell.y * grid.cell, w: grid.cell, h: grid.cell };
          const color = target.isBlockedCell?.(cell.x, cell.y)
            ? 0xffe06d
            : target.unitAt?.(cell.x, cell.y)
              ? 0xff5f53
              : 0x67d4b3;
          fillRect(boardOverlay, rect, color, target.isBlockedCell?.(cell.x, cell.y) ? 0.18 : 0.22);
        }
      }

      boardOverlay.rect(grid.left, grid.top, grid.cols * grid.cell, grid.rows * grid.cell);
      boardOverlay.stroke({ color: 0x7b2417, width: 4 });
    }
  }

  function renderMapObjects() {
    clearLayer(layers.mapObjects, 1);
    mapObjectFallbacks.clear();
    for (const object of sortedMapObjects(target)) {
      const rect = mapObjectRect(target, object);
      const image = target.images?.[object.type];
      if (image) {
        const sprite = new Sprite(Texture.from(image));
        sprite.x = rect.x;
        sprite.y = rect.y;
        sprite.width = rect.w;
        sprite.height = rect.h;
        layers.mapObjects.addChild(sprite);
        if (object.hitFlash > 0) {
          const flash = new Sprite(Texture.from(image));
          flash.x = rect.x;
          flash.y = rect.y;
          flash.width = rect.w;
          flash.height = rect.h;
          flash.alpha = object.hitFlash * 0.75;
          flash.tint = 0xffffff;
          layers.mapObjects.addChild(flash);
        }
      } else {
        fillRect(
          mapObjectFallbacks,
          { x: rect.fallbackX, y: rect.fallbackY, w: rect.w, h: rect.h },
          object.breakable ? 0xd9d260 : 0x245038,
          1,
        );
      }
    }
  }

  function renderMoveTrails(now = currentNow(target)) {
    moveTrailGraphics.clear();
    const state = runtimeState(target);
    for (const unit of state.units || []) {
      if (!unit.moveTrail) continue;
      const age = now - unit.moveTrail.startedAt;
      const total = Math.max(target.ARRIVE_TOTAL || 1, target.PREARRIVE_TOTAL || 1);
      if (age >= total) continue;
      const trail = unit.moveTrail;
      const dir = trail.facing || unit.facing || "down";
      const look = target.unitLookDefinition?.(unit) || {};
      const team = look.moveSet || trail.team || (unit.team === "grey" ? "grey" : "blue");
      const dest = target.cellCenter?.(unit.x, unit.y) || unitPoint(target, unit);
      const src = target.cellCenter?.(trail.fromX, trail.fromY) || dest;

      if (age < (target.PREARRIVE_TOTAL || 0)) {
        const frames = target.movePrearriveFrames?.[team]?.[dir] || [];
        const fi = Math.min(1, Math.floor(age / Math.max(1, target.PREARRIVE_FRAME_MS || 1)));
        const frame = frames[fi];
        if (frame) {
          const size = imageSize(frame);
          drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: src.x - size.w / 2, y: src.y - 41 });
        }
      }

      if (age < (target.ARRIVE_TOTAL || 0)) {
        const frames = target.moveArriveFrames?.[team]?.[dir] || [];
        const fi = Math.min(4, Math.floor(age / Math.max(1, target.ARRIVE_FRAME_MS || 1)));
        const frame = frames[fi];
        if (frame) {
          const size = imageSize(frame);
          const offset = target.arriveFrameOffset?.(dir, dest.x, dest.y, size.w, size.h) || { x: dest.x - size.w / 2, y: dest.y - size.h / 2 };
          drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: offset.x, y: offset.y, w: size.w, h: size.h });
        }
      }
    }
  }

  function renderUnitBadge(unit, p) {
    const maxHp = unit.maxHp || target.maxHp || 1;
    const ratio = Math.max(0, Math.min(1, (unit.hp || 0) / maxHp));
    const bar = { x: p.x - 25, y: p.y - 70, w: 50, h: 8 };
    fillRect(unitGraphics, bar, 0x101414, 0.72);
    fillRect(unitGraphics, { ...bar, w: bar.w * ratio }, 0xe02020, 1);
    strokeRect(unitGraphics, bar, 0xe8c000, 1.2);
    addText({ Text, layer: layers.units, value: `${Math.max(0, Math.round(unit.hp || 0))}/${Math.round(maxHp)}`, x: p.x, y: p.y - 66, size: 7 });
    const label = target.battleUnitName?.(unit) || unit.name || target.roomTeamLabel?.(unit.team) || unit.team || "";
    if (label) {
      const nameRect = { x: p.x - 34, y: p.y - 58, w: 68, h: 16 };
      fillRect(unitGraphics, nameRect, 0x0b1010, 0.55);
      strokeRect(unitGraphics, nameRect, unit.team === "blue" ? 0x5bb8ff : 0xd2d2d2, 1);
      addText({ Text, layer: layers.units, value: label, x: p.x, y: p.y - 50, size: 10, color: unit.team === "blue" ? "#9ed7ff" : "#eeeeee" });
    }
  }

  function renderUnit(unit, { alpha = 1, showBadge = true } = {}) {
    const state = runtimeState(target);
    const p = unitPoint(target, unit);
    const isPlayer = unit.id === target.playerUnitId;
    const selected = unit.id === state.selectedId;
    const moving = unit.moveTrail && currentNow(target) - unit.moveTrail.startedAt < (target.ARRIVE_TOTAL || 0);
    const useNinjuSprite = target.unitUseNinjuSprite?.(unit);
    const image = useNinjuSprite || unitSpriteImage(target, unit);

    if (selected && !isPlayer) {
      unitGraphics.circle?.(p.x, p.y + 4, 31);
      unitGraphics.stroke({ color: 0xffe06d, width: 4, alpha: 0.85 });
    }

    if (unit.hitFlash > 0) {
      unitGraphics.circle?.(p.x, p.y - 10, 34);
      unitGraphics.fill({ color: 0xff5148, alpha: Math.min(0.75, unit.hitFlash) });
    }

    if (image && !moving) {
      const spritePoint = useNinjuSprite
        ? { x: p.x + (target.useNinjuSpriteOffset?.x || 0), y: p.y + (target.useNinjuSpriteOffset?.y || 0) }
        : p;
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image, x: spritePoint.x - 31, y: spritePoint.y - 47, w: 62, h: 62, alpha });
    } else if (!moving) {
      unitGraphics.circle?.(p.x, p.y - 12, 24);
      unitGraphics.fill({ color: unit.team === "blue" ? 0x5bb8ff : 0xb5b9b3, alpha });
    }

    if (unit.moneyDart && !moving) {
      const elapsed = currentNow(target) - unit.moneyDart.startedAt;
      const ready = target.moneyDartPickupOrReadyFrame?.(unit, elapsed);
      if (ready) {
        const offset = target.moneyDartReadyOffsets?.[unit.facing] || { dx: 0, dy: 0 };
        drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: ready, x: p.x - 31 + offset.dx, y: p.y - 47 + offset.dy, w: 62, h: 62, alpha });
      }
    }

    const pointer = isPlayer ? target.images?.playerPointer : null;
    if (pointer) {
      const size = imageSize(pointer);
      const bob = Math.sin(currentNow(target) / 350) * 3;
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: pointer, x: p.x - size.w / 2, y: p.y - 47 - size.h - 4 + bob, alpha });
    }

    if (showBadge && !isPlayer) renderUnitBadge(unit, p);
  }

  function renderUnits() {
    clearLayer(layers.units, 1);
    unitGraphics.clear();
    for (const decoy of cloneDecoys(target)) renderUnit(decoy, { alpha: 0.9, showBadge: true });
    for (const unit of activeUnits(target)) renderUnit(unit);
  }

  function renderConsumableEffects(now = currentNow(target)) {
    const state = runtimeState(target);
    for (const effect of state.consumableEffects || []) {
      const elapsed = now - effect.startedAt;
      if (elapsed < 0 || elapsed >= effect.duration) continue;
      const frameGroups = target.consumableEffectFrameGroups?.(effect.type) || [];
      const frames = frameGroups.find((group) => group.length > 0) || [];
      if (!frames.length) continue;
      const unit = (state.units || []).find((candidate) => candidate.id === effect.unitId);
      if (!unit?.alive) continue;
      const p = unitPoint(target, unit);
      const frameIndexFrame = frameByElapsed(frames, elapsed, effect.duration, effect.frameDurationMs);
      const frameIndex = Math.max(0, frames.indexOf(frameIndexFrame));
      for (const group of frameGroups) {
        const frame = group[frameIndex];
        if (frame) drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: p.x - 46, y: p.y - 68, w: 92, h: 92, alpha: 0.9 });
      }
    }
  }

  function renderNinjuEffects(now = currentNow(target)) {
    const state = runtimeState(target);
    for (const unit of state.units || []) {
      if (!unit.alive || !target.isUnitCastingNinju?.(unit)) continue;
      const frames = target.ninjuCastFrames?.(unit.ninju.type, unit) || [];
      const frame = frameByProgress(frames, (now - unit.ninju.startedAt) / Math.max(1, unit.ninju.duration));
      if (!frame) continue;
      const p = unitPoint(target, unit);
      const config = target.attackNinjuConfigs?.[unit.ninju.type] || target.specialNinjuConfigs?.[unit.ninju.type];
      if (config?.castBox) {
        drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: p.x + config.castBox.x, y: p.y + config.castBox.y, w: config.castBox.w, h: config.castBox.h, alpha: 0.85 });
      } else {
        const size = config?.castSize || 92;
        drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: p.x - size / 2, y: p.y - 22 - size / 2, w: size, h: size, alpha: 0.85 });
      }
    }

    for (const effect of state.ninjuDamageEffects || []) {
      if (now < effect.startedAt) continue;
      const elapsed = now - effect.startedAt;
      if (elapsed >= effect.duration) continue;
      const frames = target.ninjuDamageFrames?.(effect.type) || [];
      const frame = frameByElapsed(frames, elapsed, effect.frameDuration || effect.duration);
      if (!frame) continue;
      const effectTarget = (state.units || []).find((unit) => unit.id === effect.targetId);
      const p = effectTarget && (effectTarget.alive || effectTarget.respawning) ? unitPoint(target, effectTarget) : effect.at;
      if (!p) continue;
      const placement = target.ninjuDamageEffectPlacement?.(effect.type) || { x: 0, y: 22, w: 138, h: 138 };
      drawNaturalSprite({
        Sprite,
        Texture,
        layer: layers.effects,
        image: frame,
        x: p.x + placement.x - placement.w / 2,
        y: p.y - placement.y - placement.h / 2,
        w: placement.w,
        h: placement.h,
        alpha: 0.9,
      });
    }

    renderConsumableEffects(now);
  }

  function weaponAttackPlacement(frame, from, to, direction, weaponKey, hand = false) {
    const scaleFn = hand ? target.weaponHandScale : target.weaponAttackScale;
    const offsetFn = hand ? target.weaponHandOffset : target.weaponAttackOffset;
    const scale = 1.55 * (scaleFn?.(weaponKey) || 1);
    const size = imageSize(frame);
    const w = size.w * scale;
    const h = size.h * scale;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const anchor = { x: from.x + dx * 34, y: from.y + dy * 31 };
    const offset = offsetFn?.(weaponKey, direction, w, h) || { x: -w / 2, y: -h / 2 };
    const at = target.applyOffset?.(anchor, offset) || { x: anchor.x + offset.x, y: anchor.y - offset.y };
    return { x: at.x, y: at.y, w, h };
  }

  function renderAttacks(now = currentNow(target)) {
    const state = runtimeState(target);
    for (const attack of state.attacks || []) {
      const age = (now - attack.startedAt) / Math.max(1, attack.duration);
      if (!Number.isFinite(age) || age >= 1) continue;
      const from = target.cellCenter?.(attack.from.x, attack.from.y) || unitPoint(target, attack.from);
      const to = target.cellCenter?.(attack.to.x, attack.to.y) || unitPoint(target, attack.to);
      const weaponKey = attack.weaponKey || target.defaultWeaponKey;
      const weaponFrameSet = target.weaponFrames?.[weaponKey] || target.weaponFrames?.[target.defaultWeaponKey] || {};
      const frames = weaponFrameSet.attack?.[attack.direction] || [];
      const handFrames = weaponFrameSet.hand?.[attack.direction] || [];
      const frame = frameByProgress(frames, age);
      const handFrame = frameByProgress(handFrames, age);
      if (handFrame) drawImageSprite({ Sprite, Texture, layer: layers.effects, image: handFrame, rect: weaponAttackPlacement(handFrame, from, to, attack.direction, weaponKey, true), alpha: 0.98 });
      if (frame) {
        drawImageSprite({ Sprite, Texture, layer: layers.effects, image: frame, rect: weaponAttackPlacement(frame, from, to, attack.direction, weaponKey), alpha: 0.98 });
      } else {
        const cx = from.x + (to.x - from.x) * 0.62;
        const cy = from.y + (to.y - from.y) * 0.62 - 16;
        moveTrailGraphics.circle?.(cx, cy, 36 + age * 12);
        moveTrailGraphics.stroke({ color: 0xfff4a6, width: Math.max(2, 8 * (1 - age * 0.35)), alpha: Math.max(0, age < 0.65 ? 0.7 : (1 - age) / 0.35) });
      }
    }
  }

  function renderMoneyDartShootAnimations(now = currentNow(target)) {
    const state = runtimeState(target);
    for (const cast of state.moneyDartCasts || []) {
      const progress = (now - cast.startedAt) / Math.max(1, cast.duration);
      if (!Number.isFinite(progress) || progress < 0 || progress >= 1 || now - cast.startedAt > 1000) continue;
      const unit = (state.units || []).find((candidate) => candidate.id === cast.unitId && candidate.alive);
      if (!unit) continue;
      const teamKey = target.unitLookDefinition?.(unit).moneyDartShootSet || (unit.team === "blue" ? "b" : "g");
      const frames = ((target.moneyDartShootFrames?.[teamKey] || {})[cast.dir] || []).filter((frame) => frame && (frame.naturalWidth ?? frame.width ?? 1) > 0);
      const frame = frameByProgress(frames, progress);
      if (!frame) continue;
      const frameIdx = Math.max(0, frames.indexOf(frame));
      const p = unitPoint(target, unit);
      const placement = target.moneyDartShootPlacement?.(cast.dir, frame, p, frameIdx);
      if (!placement) continue;
      drawImageSprite({ Sprite, Texture, layer: layers.effects, image: frame, rect: placement, alpha: 0.98 });
    }
  }

  function renderHud() {
    clearLayer(layers.hud, 1);
    hudGraphics.clear();
    const canvasWidth = canvas.width || 960;
    const state = runtimeState(target);
    const text = target.roomLocale?.() || {};
    const unit = target.selectedHudUnit?.() || (state.units || []).find((candidate) => candidate.id === target.playerUnitId);
    fillRect(hudGraphics, { x: 0, y: 0, w: canvasWidth, h: 32 }, 0x062f37, 0.5);
    addText({ Text, layer: layers.hud, value: text.topHudName || "", x: 118, y: 18, size: 17, color: "#f4f3dd", align: "left" });
    if (unit) {
      const hpRatio = Math.max(0, Math.min(1, (unit.hp || 0) / (unit.maxHp || target.maxHp || 1)));
      const skillRatio = Math.max(0, Math.min(1, (unit.skill || 0) / (unit.skillMax || target.maxSkill || 1)));
      fillRect(hudGraphics, { x: 45, y: 574, w: 165, h: 30 }, 0x26302c, 1);
      fillRect(hudGraphics, { x: 51, y: 580, w: 153 * hpRatio, h: 18 }, 0xa057be, 1);
      strokeRect(hudGraphics, { x: 45, y: 574, w: 165, h: 30 }, 0xd4a85e, 2);
      addText({ Text, layer: layers.hud, value: `${Math.max(0, Math.round(unit.hp || 0))}/${Math.round(unit.maxHp || target.maxHp || 0)}`, x: 128, y: 589, size: 14 });
      fillRect(hudGraphics, { x: 262, y: 574, w: 165, h: 30 }, 0x26302c, 1);
      fillRect(hudGraphics, { x: 268, y: 580, w: 153 * skillRatio, h: 18 }, 0x38c2f2, 1);
      strokeRect(hudGraphics, { x: 262, y: 574, w: 165, h: 30 }, 0xd4a85e, 2);
    }

    const itemSlots = unit?.itemSlots || [];
    for (let i = 0; i < 10; i += 1) {
      const x = (target.itemSlotStartX || 510) + i * ((target.itemSlotW || 38) + (target.itemSlotGap || 7));
      const y = target.itemSlotY || 642;
      const w = target.itemSlotW || 38;
      const h = target.itemSlotH || 34;
      fillRect(hudGraphics, { x, y, w, h }, itemSlots[i] ? 0x12626d : 0x163f49, 1);
      strokeRect(hudGraphics, { x, y, w, h }, 0x5eb5b3, 2);
      const icon = target.itemIconByType?.(itemSlots[i]);
      if (icon) drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: icon, x: x + 7, y: y + 5, w: 24, h: 24 });
    }
  }

  function renderFrame() {
    const now = currentNow(target);
    renderBackdrop();
    renderBoard();
    renderMapObjects();
    clearLayer(layers.effects, 1);
    renderMoveTrails(now);
    renderUnits();
    renderNinjuEffects(now);
    renderMoneyDartShootAnimations(now);
    renderAttacks(now);
    renderHud();
    app.renderer.render(app.stage);
  }

  function setEnabled(enabled) {
    canvas.hidden = !enabled;
    const sourceCanvas = queryGameCanvas(target);
    if (sourceCanvas && sourceCanvas !== canvas) {
      sourceCanvas.hidden = Boolean(enabled);
    }
  }

  function destroy() {
    app.destroy(false);
    canvas.remove?.();
  }

  return {
    app,
    canvas,
    layers,
    renderBackdrop,
    renderBoard,
    renderMapObjects,
    renderMoveTrails,
    renderUnits,
    renderNinjuEffects,
    renderConsumableEffects,
    renderAttacks,
    renderMoneyDartShootAnimations,
    renderHud,
    renderFrame,
    resizeFromCanvas,
    setEnabled,
    destroy,
  };
}
