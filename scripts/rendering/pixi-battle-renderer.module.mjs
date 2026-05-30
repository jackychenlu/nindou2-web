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

// ===== Internal helpers =====

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

function drawNaturalSprite({ Sprite, Texture, layer, image, x, y, w = null, h = null, alpha = 1, tint = null, rotation = 0, anchorX = 0, anchorY = 0 }) {
  if (!image || !Sprite || !Texture) return null;
  const size = imageSize(image);
  const sprite = new Sprite(Texture.from(image));
  sprite.anchor.set(anchorX, anchorY);
  sprite.x = x;
  sprite.y = y;
  sprite.width = w ?? size.w;
  sprite.height = h ?? size.h;
  sprite.alpha = alpha;
  if (rotation) sprite.rotation = rotation;
  if (tint !== null) sprite.tint = tint;
  layer.addChild(sprite);
  return sprite;
}

function addText({ Text, layer, value, x, y, size = 12, color = "#fff7d6", align = "center", noStroke = false }) {
  if (!Text || value === undefined || value === null) return null;
  const style = {
    fontFamily: "Microsoft JhengHei, sans-serif",
    fontSize: size,
    fontWeight: "700",
    fill: color,
    align,
  };
  if (!noStroke) style.stroke = { color: "rgba(0,0,0,0.78)", width: 3 };
  const text = new Text({ text: String(value), style });
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

function resolveActiveBuffAuraType(target, unit) {
  if (!unit) return "";
  const now = currentNow(target);
  const isSake4Free = Boolean(unit.moveSkillFreeUntil && now < unit.moveSkillFreeUntil);
  const auraVisible = (unit.buffAuraVisibleAt ?? 0) <= now;
  if (unit.buffAuraType === "steel" && target.isSteelDefenseActive?.(unit)) return "steel";
  if (unit.buffAuraType === "hotBlood" && target.isHotBloodActive?.(unit)) return "hotBlood";
  if (unit.buffAuraType === "sake4" && isSake4Free && auraVisible) return "sake4";
  if (unit.buffAuraType === "magicWater" && isSake4Free && auraVisible) return "magicWater";
  if (target.isSteelDefenseActive?.(unit)) return "steel";
  if (target.isHotBloodActive?.(unit)) return "hotBlood";
  if (isSake4Free && auraVisible) return "sake4";
  return "";
}

const AURA_TINTS = {
  steel: 0x5feeff,
  hotBlood: 0xff2d24,
  sake4: 0xffd94d,
  magicWater: 0xb56cff,
};

const AURA_OFFSETS = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]];

function renderAuraOutline({ Sprite, Texture, layer, image, x, y, w, h, auraType, now: nowMs }) {
  const tint = AURA_TINTS[auraType];
  if (!tint || !image) return;
  const pulse = 0.66 + Math.sin(nowMs / 170) * 0.1;
  for (const [dx, dy] of AURA_OFFSETS) {
    const s = new Sprite(Texture.from(image));
    s.x = x + dx;
    s.y = y + dy;
    s.width = w;
    s.height = h;
    s.tint = tint;
    s.alpha = pulse;
    layer.addChild(s);
  }
}

// ===== Factory =====

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
    frame: new Container(),
    overlay: new Container(),
  };
  app.stage.addChild(...Object.values(layers));

  const backdropGraphics = new Graphics();
  const boardOverlay = new Graphics();
  const mapObjectFallbacks = new Graphics();
  const moveTrailGraphics = new Graphics();
  const unitGraphics = new Graphics();
  const hudGraphics = new Graphics();
  const frameGraphics = new Graphics();
  const overlayGraphics = new Graphics();
  layers.backdrop.addChild(backdropGraphics);
  layers.board.addChild(boardOverlay);
  layers.mapObjects.addChild(mapObjectFallbacks);
  layers.units.addChild(unitGraphics);
  layers.effects.addChild(moveTrailGraphics);
  layers.hud.addChild(hudGraphics);
  layers.frame.addChild(frameGraphics);
  layers.overlay.addChild(overlayGraphics);

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
    if (Array.isArray(layer.children)) layer.children.splice(keep);
  }

  // ===== Scene =====

  function drawCornerGem(x, y) {
    frameGraphics.circle(x, y, 9);
    frameGraphics.fill({ color: 0x224d43 });
    frameGraphics.circle(x, y, 9);
    frameGraphics.stroke({ color: 0xd0a15b, width: 3 });
    frameGraphics.circle(x, y, 4);
    frameGraphics.fill({ color: 0x75c7a5 });
  }

  function renderSceneBorder() {
    frameGraphics.clear();
    const cw = canvas.width || 960;
    const ch = canvas.height || 680;
    const ui = target.ui || {};
    const bottom = ui.bottomTop ?? 468;
    const midX = ui.midX ?? 456;

    frameGraphics.rect(3, 3, cw - 6, bottom - 4);
    frameGraphics.stroke({ color: 0x7b2417, width: 5 });
    frameGraphics.rect(3, bottom, cw - 6, ch - bottom - 4);
    frameGraphics.stroke({ color: 0x7b2417, width: 5 });
    frameGraphics.moveTo(midX, bottom);
    frameGraphics.lineTo(midX, ch - 4);
    frameGraphics.stroke({ color: 0x7b2417, width: 5 });

    for (const [gx, gy] of [
      [9, 9], [cw - 9, 9],
      [9, bottom - 2], [cw - 9, bottom - 2],
      [9, ch - 9], [midX, bottom],
      [midX, ch - 9], [cw - 9, ch - 9],
    ]) {
      drawCornerGem(gx, gy);
    }
  }

  function renderUiPanels() {
    const cw = canvas.width || 960;
    const ch = canvas.height || 680;
    const ui = target.ui || {};
    const bottom = ui.bottomTop ?? 468;
    const bottomHeight = ui.bottomHeight ?? (ch - bottom);
    const leftPanelW = ui.leftPanelW ?? 450;
    const midX = ui.midX ?? 456;

    fillRect(backdropGraphics, { x: 0, y: bottom, w: cw, h: bottomHeight }, 0x074451, 1);
    fillRect(backdropGraphics, { x: 8, y: bottom + 10, w: leftPanelW - 18, h: bottomHeight - 18 }, 0x052b32, 1);
    fillRect(backdropGraphics, { x: midX + 10, y: bottom + 10, w: cw - midX - 18, h: bottomHeight - 18 }, 0x052b32, 1);
  }

  function renderBackdrop() {
    clearLayer(layers.backdrop, 1);
    backdropGraphics.clear();
    const cw = canvas.width || 960;
    const ch = canvas.height || 680;
    fillRect(backdropGraphics, { x: 0, y: 0, w: cw, h: ch }, 0x062f37, 1);
    renderUiPanels();
    const rect = battleMapRect(target);
    const { groundImage, fallbackImage, maskImage } = imageForMap(target);
    const drewGround = drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: groundImage, rect });
    if (!drewGround) {
      const drewFallback = drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: fallbackImage, rect, alpha: 0.8 });
      if (!drewFallback) fillRect(backdropGraphics, rect, 0x74ad7f, 1);
    }
    drawImageSprite({ Sprite, Texture, layer: layers.backdrop, image: maskImage, rect });
  }

  // ===== Board =====

  function renderBoard() {
    boardOverlay.clear();
    const grid = target.grid;
    if (!grid?.cols || !grid?.rows || !grid?.cell) return;
    const state = runtimeState(target);
    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.cols; x += 1) {
        const hovered = state.pointer?.cell && state.pointer.cell.x === x && state.pointer.cell.y === y;
        if (!hovered) continue;
        const rect = target.cellRect?.(x, y) || { x: grid.left + x * grid.cell, y: grid.top + y * grid.cell, w: grid.cell, h: grid.cell };
        fillRect(boardOverlay, rect, target.isBlockedCell?.(x, y) ? 0xff5245 : 0xffee7c, 0.22);
      }
    }
    const selected = target.selectedUnit?.();
    if (selected) {
      for (const cell of target.neighbors?.(selected.x, selected.y) || []) {
        if (!target.inside?.(cell.x, cell.y)) continue;
        const rect = target.cellRect?.(cell.x, cell.y) || { x: grid.left + cell.x * grid.cell, y: grid.top + cell.y * grid.cell, w: grid.cell, h: grid.cell };
        const color = target.isBlockedCell?.(cell.x, cell.y) ? 0xffe06d : target.unitAt?.(cell.x, cell.y) ? 0xff5f53 : 0x67d4b3;
        fillRect(boardOverlay, rect, color, target.isBlockedCell?.(cell.x, cell.y) ? 0.18 : 0.22);
      }
    }
    boardOverlay.rect(grid.left, grid.top, grid.cols * grid.cell, grid.rows * grid.cell);
    boardOverlay.stroke({ color: 0x7b2417, width: 4 });
  }

  // ===== Map Objects =====

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
        fillRect(mapObjectFallbacks, { x: rect.fallbackX, y: rect.fallbackY, w: rect.w, h: rect.h }, object.breakable ? 0xd9d260 : 0x245038, 1);
      }
    }
  }

  // ===== Move Trails =====

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
          if (dir === "right" || dir === "left") {
            const maskG = new Graphics();
            maskG.rect(offset.x, dest.y - 47, size.w, 62).fill({ color: 0xffffff });
            const sprite = new Sprite(Texture.from(frame));
            sprite.x = offset.x;
            sprite.y = offset.y;
            sprite.width = size.w;
            sprite.height = size.h;
            sprite.mask = maskG;
            layers.effects.addChild(maskG);
            layers.effects.addChild(sprite);
          } else {
            drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: offset.x, y: offset.y, w: size.w, h: size.h });
          }
        }
      }
    }
  }

  // ===== Units =====

  function renderUnitEyes(unit, p, bob = 0, offsetTable = null) {
    if (target.unitLookDefinition?.(unit)?.drawEyes === false) return;
    const facing = unit.facing || "down";
    const table = offsetTable || target.eyeOffsets || {};
    const offset = Object.prototype.hasOwnProperty.call(table, facing) ? table[facing] : table.down;
    if (!offset) return;

    if (facing === "left" || facing === "right") {
      const sideEye = target.unitEyeSideSprite?.(unit);
      if (!sideEye) return;
      const sprite = new Sprite(Texture.from(sideEye));
      sprite.width = offset.w;
      sprite.height = offset.h;
      sprite.y = p.y - offset.y + bob;
      if (facing === "left") {
        sprite.scale.x = -Math.abs(sprite.scale.x);
        sprite.x = p.x + offset.x + offset.w;
      } else {
        sprite.x = p.x + offset.x;
      }
      layers.units.addChild(sprite);
    } else {
      const frontEye = target.unitEyeFrontSprite?.(unit);
      if (!frontEye) return;
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: frontEye, x: p.x + offset.x, y: p.y - offset.y + bob, w: offset.w, h: offset.h });
    }
  }

  function renderHeldMoneyDart(unit, p) {
    if (!unit.moneyDart || target.activeMoneyDartCast?.(unit)) return;
    const elapsed = currentNow(target) - unit.moneyDart.startedAt;
    const pickupMs = 300;
    if (elapsed < pickupMs) {
      const idleSprite = unitSpriteImage(target, unit);
      if (idleSprite) drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: idleSprite, x: p.x - 31, y: p.y - 47, w: 62, h: 62 });
      const pickupFrames = target.moneyDartPickupFrames || [];
      if (pickupFrames.length > 0) {
        const idx = Math.min(pickupFrames.length - 1, Math.floor((elapsed / pickupMs) * pickupFrames.length));
        const dartFrame = pickupFrames[idx];
        if (dartFrame) drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: dartFrame, x: p.x - 18, y: p.y - 25, w: 36, h: 36 });
      }
      renderUnitEyes(unit, p, 0);
    } else {
      const look = target.unitLookDefinition?.(unit) || {};
      const key = look.moneyDartReadySet || (unit.team === "grey" ? "g" : "b");
      const dirIndex = { right: 0, left: 1, up: 2, down: 3 }[unit.facing] ?? 0;
      const readyFrame = (target.moneyDartReadyFrames?.[key] || [])[dirIndex] || null;
      const readyOff = target.moneyDartReadyOffsets?.[unit.facing] || { dx: 0, dy: 0 };
      if (readyFrame) drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: readyFrame, x: p.x - 31 + readyOff.dx, y: p.y - 47 + readyOff.dy, w: 62, h: 62 });
      renderUnitEyes(unit, p, 0, target.moneyDartEyeOffsets || target.eyeOffsets);
    }
  }

  function renderRespawnPointer(unit, p) {
    const time = currentNow(target);
    if (!unit.respawnTipUntil || time >= unit.respawnTipUntil) return;
    const remaining = unit.respawnTipUntil - time;
    const elapsed = (target.respawnPointerDuration || 2000) - remaining;
    const progress = Math.min(0.999, Math.max(0, elapsed / (target.respawnPointerDuration || 2000)));
    const frames = target.respawnPointerFrames || [];
    const frame = frames[Math.floor(progress * frames.length)];
    if (!frame) return;
    const fade = Math.min(1, remaining / 180);
    const bounce = Math.sin(time / 70) * 3;
    drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: frame, x: p.x - 24, y: p.y - 126 + bounce, w: 142, h: 125, alpha: fade });
  }

  function renderChargeEffect(p, chargeLayer = "all", unit = null) {
    const time = currentNow(target);
    const redFrames = target.chargeRedFrames || [];
    const yellowFrames = target.chargeYellowFrames || [];
    const redFrame = redFrames[Math.floor(time / 120) % Math.max(1, redFrames.length)];
    const yellowFrame = yellowFrames[Math.floor(time / 120) % Math.max(1, yellowFrames.length)];
    const facing = unit ? (unit.facing || "down") : "down";
    const fireOff = {
      up: { x: 0, y: -35, rot: 0 }, down: { x: 0, y: -35, rot: 0 },
      right: { x: -5, y: -35, rot: -0.3 }, left: { x: 5, y: -35, rot: 0.3 },
      "up-right": { x: -3, y: -35, rot: 0.15 }, "up-left": { x: 3, y: -35, rot: -0.15 },
      "down-right": { x: -3, y: -35, rot: 0.2 }, "down-left": { x: 3, y: -35, rot: -0.2 },
    };
    const off = fireOff[facing] || fireOff.down;
    const fx = p.x + off.x;
    const fy = p.y + off.y;

    if ((chargeLayer === "all" || chargeLayer === "back") && target.images?.chargeOuter) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: target.images.chargeOuter, x: p.x - 39, y: p.y - 55, w: 78, h: 78, alpha: 0.82 });
    }
    if ((chargeLayer === "all" || chargeLayer === "front") && redFrame) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: redFrame, x: fx, y: fy, w: 50, h: 60, alpha: 0.82, anchorX: 0.5, anchorY: 0.5, rotation: off.rot });
    }
    if ((chargeLayer === "all" || chargeLayer === "front") && yellowFrame) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.units, image: yellowFrame, x: fx, y: fy, w: 32, h: 38, alpha: 0.72, anchorX: 0.5, anchorY: 0.5, rotation: off.rot });
    }
  }

  function renderUnitBadge(unit, p) {
    const maxHp = unit.maxHp || target.maxHp || 1;
    const ratio = Math.max(0, Math.min(1, (unit.hp || 0) / maxHp));
    const bar = { x: p.x - 25, y: p.y - 70, w: 50, h: 8 };

    if (target.images?.barBackground) {
      drawImageSprite({ Sprite, Texture, layer: layers.units, image: target.images.barBackground, rect: bar });
    } else {
      fillRect(unitGraphics, bar, 0x101414, 0.72);
    }
    fillRect(unitGraphics, { ...bar, w: bar.w * ratio }, 0xe02020, 1);
    strokeRect(unitGraphics, bar, 0xe8c000, 1.2);
    strokeRect(unitGraphics, { x: bar.x + 1, y: bar.y + 1, w: bar.w - 2, h: bar.h - 2 }, 0xffffff, 0.6, 0.25);

    const hpText = `${Math.max(0, Math.round(unit.hp || 0))}/${Math.round(maxHp)}`;
    addText({ Text, layer: layers.units, value: hpText, x: p.x, y: p.y - 66, size: 7 });

    const label = target.battleUnitName?.(unit) || unit.name || target.roomTeamLabel?.(unit.team) || unit.team || "";
    if (label) {
      const nameW = Math.max(68, label.length * 9 + 22);
      const nameRect = { x: p.x - nameW / 2, y: p.y - 58, w: nameW, h: 16 };
      if (target.images?.nameBar) {
        drawImageSprite({ Sprite, Texture, layer: layers.units, image: target.images.nameBar, rect: nameRect });
      } else {
        fillRect(unitGraphics, nameRect, 0x0b1010, 0.55);
      }
      strokeRect(unitGraphics, nameRect, unit.team === "blue" ? 0x5bb8ff : 0xd2d2d2, 1);
      addText({ Text, layer: layers.units, value: label, x: p.x, y: p.y - 50, size: 10, color: unit.team === "blue" ? "#9ed7ff" : "#eeeeee" });
    }
  }

  function renderUnit(unit, { alpha = 1, showBadge = true } = {}) {
    const state = runtimeState(target);
    const p = unitPoint(target, unit);
    const isPlayer = unit.id === target.playerUnitId;
    const selected = unit.id === state.selectedId;
    const now = currentNow(target);
    const moving = unit.moveTrail && now - unit.moveTrail.startedAt < (target.ARRIVE_TOTAL || 0);
    const moneyDartCasting = target.activeMoneyDartCast?.(unit);
    const useNinjuSprite = target.unitUseNinjuSprite?.(unit);
    const image = useNinjuSprite || unitSpriteImage(target, unit);
    const auraType = resolveActiveBuffAuraType(target, unit);

    if (selected && !isPlayer) {
      unitGraphics.circle?.(p.x, p.y + 4, 31);
      unitGraphics.stroke({ color: 0xffe06d, width: 4, alpha: 0.85 });
    }

    if (state.charging && state.pressedUnit === unit) {
      renderChargeEffect(p, "back", unit);
    }

    if (unit.hitFlash > 0) {
      unitGraphics.circle?.(p.x, p.y - 10, 34);
      unitGraphics.fill({ color: 0xff5148, alpha: Math.min(0.75, unit.hitFlash) });
    }

    if (!moneyDartCasting && !moving && !unit.moneyDart) {
      if (image) {
        const spritePoint = useNinjuSprite
          ? { x: p.x + (target.useNinjuSpriteOffset?.x || 0), y: p.y + (target.useNinjuSpriteOffset?.y || 0) }
          : p;
        if (auraType) {
          renderAuraOutline({ Sprite, Texture, layer: layers.units, image, x: spritePoint.x - 31, y: spritePoint.y - 47, w: 62, h: 62, auraType, now });
        }
        drawNaturalSprite({ Sprite, Texture, layer: layers.units, image, x: spritePoint.x - 31, y: spritePoint.y - 47, w: 62, h: 62, alpha });
        if (useNinjuSprite) renderUnitEyes({ ...unit, facing: "down" }, p, 0);
        else renderUnitEyes(unit, p, 0);
      } else if (!isPlayer) {
        unitGraphics.circle?.(p.x, p.y - 12, 24);
        unitGraphics.fill({ color: unit.team === "blue" ? 0x5bb8ff : 0xb5b9b3, alpha });
      }
    }

    if (state.charging && state.pressedUnit === unit) {
      renderChargeEffect(p, "front", unit);
    }

    if (!moneyDartCasting && !moving && unit.moneyDart && auraType) {
      const elapsed = now - unit.moneyDart.startedAt;
      const pickupMs = 300;
      let auraImage;
      let auraX = p.x - 31, auraY = p.y - 47;
      if (elapsed < pickupMs) {
        auraImage = unitSpriteImage(target, unit);
      } else {
        const look = target.unitLookDefinition?.(unit) || {};
        const key = look.moneyDartReadySet || (unit.team === "grey" ? "g" : "b");
        const dirIndex = { right: 0, left: 1, up: 2, down: 3 }[unit.facing] ?? 0;
        auraImage = (target.moneyDartReadyFrames?.[key] || [])[dirIndex] || unitSpriteImage(target, unit);
        const readyOff = target.moneyDartReadyOffsets?.[unit.facing] || { dx: 0, dy: 0 };
        auraX = p.x - 31 + readyOff.dx;
        auraY = p.y - 47 + readyOff.dy;
      }
      if (auraImage) renderAuraOutline({ Sprite, Texture, layer: layers.units, image: auraImage, x: auraX, y: auraY, w: 62, h: 62, auraType, now });
    }

    if (!moving) renderHeldMoneyDart(unit, p);
    renderRespawnPointer(unit, p);

    const pointer = isPlayer ? target.images?.playerPointer : null;
    if (pointer) {
      const size = imageSize(pointer);
      const bob = Math.sin(now / 350) * 3;
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

  // ===== Drag Arrow =====

  function renderDrag() {
    const state = runtimeState(target);
    if (!state.charging || !state.dragMoved || !state.pressedUnit) return;
    if (!target.canDraggedUnitMoveNow?.(state.pressedUnit)) return;
    const moveTarget = target.dragMoveTargetCell?.(state.pressedUnit);
    if (!moveTarget) return;
    const maxDistance = Math.floor(state.pressedUnit.skill);
    const reachable = maxDistance >= 1 ? target.reachableMoveCell?.(state.pressedUnit, moveTarget, maxDistance) : null;
    if (!reachable) return;
    const from = unitPoint(target, state.pressedUnit);
    const to = target.cellCenter?.(reachable.x, reachable.y);
    if (!to) return;
    const dist = target.manhattan?.(state.pressedUnit, reachable) ?? 0;
    const enough = state.pressedUnit.skill >= Math.max(1, dist);
    const direction = target.directionFromTarget?.(state.pressedUnit, reachable);
    if (!direction) return;
    const dirName = typeof direction === "string" ? direction : direction?.name;
    const arrowFrame = target.dragArrowFrames?.[dirName]?.[0];
    if (!arrowFrame) return;

    const arrowY = -18;
    const thickness = 32;
    const length = Math.max(36, Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
    const alpha = enough ? 0.95 : 0.45;
    let rx = from.x, ry = from.y + arrowY - thickness / 2, rw = length, rh = thickness;
    if (dirName === "left") { rx = from.x - length; }
    else if (dirName === "up") { rx = from.x - thickness / 2; ry = from.y + arrowY - length; rw = thickness; rh = length; }
    else if (dirName === "down") { rx = from.x - thickness / 2; ry = from.y + arrowY; rw = thickness; rh = length; }
    drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: arrowFrame, x: rx, y: ry, w: rw, h: rh, alpha });
  }

  // ===== Ninju / Consumable Effects =====

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
      const frameIndex = effect.frameDurationMs
        ? Math.floor(elapsed / effect.frameDurationMs)
        : Math.floor(Math.min(0.999, elapsed / effect.duration) * frames.length);
      for (const group of frameGroups) {
        const frame = group[Math.min(group.length - 1, frameIndex)];
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
      drawNaturalSprite({ Sprite, Texture, layer: layers.effects, image: frame, x: p.x + placement.x - placement.w / 2, y: p.y - placement.y - placement.h / 2, w: placement.w, h: placement.h, alpha: 0.9 });
    }
    renderConsumableEffects(now);
  }

  // ===== Attacks =====

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
        // Dual-layer slash arc matching Canvas drawSlashArc
        const centerX = from.x + (to.x - from.x) * 0.62;
        const centerY = from.y + (to.y - from.y) * 0.62 - 16;
        const side = attack.side ?? 1;
        const baseAngle = Math.atan2(to.y - from.y, to.x - from.x);
        const start = baseAngle - side * (1.1 - age * 0.35);
        const end = baseAngle + side * (0.75 + age * 0.35);
        const alpha = Math.max(0, age < 0.65 ? 1 : (1 - age) / 0.35);
        moveTrailGraphics.arc(centerX, centerY, 39 + age * 14, start, end, side < 0);
        moveTrailGraphics.stroke({ color: 0xfff4a6, width: 9 * (1 - age * 0.35), alpha: alpha * 0.95 });
        moveTrailGraphics.arc(centerX, centerY, 51 + age * 10, start + side * 0.1, end, side < 0);
        moveTrailGraphics.stroke({ color: 0x73e4ff, width: 3, alpha: Math.min(0.75, alpha) });
      }
    }
  }

  // ===== Money Dart Shoot =====

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
      const auraType = resolveActiveBuffAuraType(target, unit);
      if (auraType) renderAuraOutline({ Sprite, Texture, layer: layers.effects, image: frame, x: placement.x, y: placement.y, w: placement.w, h: placement.h, auraType, now });
      drawImageSprite({ Sprite, Texture, layer: layers.effects, image: frame, rect: placement, alpha: 0.98 });
    }
  }

  // ===== HUD =====

  function hudText(value, x, y, size, color, align = "left") {
    addText({ Text, layer: layers.hud, value, x, y, size, color, align });
  }

  function renderHudBar(x, y, w, h, ratio, barColor, label, valueText = "") {
    fillRect(hudGraphics, { x, y, w, h }, 0x26302c, 1);
    strokeRect(hudGraphics, { x, y, w, h }, 0xd4a85e, 2);
    fillRect(hudGraphics, { x: x + 6, y: y + 6, w: w - 12, h: h - 12 }, 0x080808, 1);
    fillRect(hudGraphics, { x: x + 6, y: y + 6, w: Math.max(0, (w - 12) * ratio), h: h - 12 }, barColor, 1);
    hudGraphics.circle(x - 10, y + h / 2, 20);
    hudGraphics.fill({ color: 0x4a4a3d });
    hudGraphics.circle(x - 10, y + h / 2, 20);
    hudGraphics.stroke({ color: 0xd4a85e, width: 2 });
    hudText(label, x - 10, y + h / 2 + 1, 19, "#e9f3dc", "center");
    if (valueText) hudText(valueText, x + w / 2, y + h / 2 + 1, 15, "#fff7d6", "center");
  }

  function renderMoneyBox(x, y, text, w = 180) {
    if (target.images?.moneyPanel) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: target.images.moneyPanel, x, y: y - 4, w, h: 30 });
    } else {
      fillRect(hudGraphics, { x, y: y - 4, w, h: 30 }, 0x2a9cca, 1);
    }
    strokeRect(hudGraphics, { x, y: y - 4, w, h: 30 }, 0x041316, 3);
    hudText(text, x + w / 2, y + 11, 18, "#38c2f2", "center");
  }

  function renderTopHud() {
    const cw = canvas.width || 960;
    const state = runtimeState(target);
    const text = target.roomLocale?.() || {};
    fillRect(hudGraphics, { x: 0, y: 0, w: cw, h: 32 }, 0x062f37, 0.5);
    if (target.images?.blueIcon) drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: target.images.blueIcon, x: 38, y: 5, w: 35, h: 25 });
    hudText(text.topHudName || "", 118, 18, 17, "#f4f3dd", "left");
    hudText(text.topHudLevel || "", 294, 18, 18, "#f4f3dd", "center");
    hudText(text.topHudRole || "", 372, 18, 18, "#f4f3dd", "center");
    const unit = (state.units || []).find((u) => u.id === target.playerUnitId);
    if (unit) {
      const coord = target.displayCellCoord?.(unit);
      if (coord) {
        const rightX = (target.grid?.left || 0) + (target.grid?.cols || 0) * (target.grid?.cell || 0) - 52;
        hudText(`${text.cellLabel || ""} [${coord.x},${coord.y}]`, rightX, 18, 13, "#d9f4ff", "right");
      }
    }
  }

  function renderBottomHud() {
    const unit = target.selectedHudUnit?.();
    const text = target.roomLocale?.() || {};
    const hpRatio = unit ? Math.max(0, Math.min(1, (unit.hp || 0) / (unit.maxHp || target.maxHp || 1))) : 0;
    const skillRatio = unit ? Math.max(0, Math.min(1, (unit.skill || 0) / (unit.skillMax || target.maxSkill || 1))) : 0;
    const hpText = unit ? `${Math.max(0, Math.round(unit.hp || 0))}/${Math.round(unit.maxHp || target.maxHp || 0)}` : "";
    renderHudBar(45, 574, 165, 30, hpRatio, 0xa057be, text.hpBadge || "体", hpText);
    renderHudBar(262, 574, 165, 30, skillRatio, 0x38c2f2, text.skillBadge || "技");
    hudText(text.weaponBadge || "武", 35, 654, 18, "#f0f0df", "center");
    renderMoneyBox(50, 642, "", 95);
    hudText(text.repBadge || "聲", 175, 654, 18, "#f0f0df", "center");
    renderMoneyBox(190, 642, "0", 95);
    hudText(text.goldBadge || "金", 315, 654, 18, "#f0f0df", "center");
    renderMoneyBox(330, 642, "0", 95);
  }

  function renderSoulHud() {
    const x = 16, y = 470, w = 284, h = 66;
    const barY = y + 44, barH = 7;
    const tickXs = [52, 101, 154, 214, 272];
    const unit = target.selectedHudUnit?.();
    const stepsPerLevel = target.soulStepsPerLevel || 1;
    const maxLevel = target.soulMaxLevel || 5;
    const soulSteps = Math.min(stepsPerLevel * maxLevel, Math.max(0, unit?.soulSteps || 0));
    const completedLevel = Math.min(maxLevel, Math.floor(soulSteps / stepsPerLevel));
    const segmentProgress = completedLevel >= maxLevel ? 1 : (soulSteps % stepsPerLevel) / stepsPerLevel;
    const imageKey = `soulHud${Math.min(5, completedLevel <= 0 ? 1 : completedLevel + 1)}`;
    const fillColors = [0x1b7a2d, 0x1b7a2d, 0x20248b, 0x8c178e, 0xc92116];

    if (target.images?.[imageKey]) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: target.images[imageKey], x, y, w, h });
    }
    if (soulSteps > 0) {
      const fromTick = tickXs[completedLevel] ?? 0;
      const toTick = tickXs[Math.min(maxLevel, completedLevel + 1)] ?? tickXs[maxLevel];
      const fillEnd = completedLevel >= maxLevel ? tickXs[maxLevel] : fromTick + (toTick - fromTick) * segmentProgress;
      const barX = x + tickXs[0];
      const fill = Math.max(0, x + fillEnd - barX);
      fillRect(hudGraphics, { x: barX, y: barY, w: fill, h: barH }, fillColors[completedLevel] || fillColors[0], 1);
    }
  }

  function renderNinjuSlot(x, y, w, h, label, type) {
    const unit = target.selectedHudUnit?.();
    const isAttack = Boolean(target.attackNinjuConfigs?.[type]);
    const isSpecial = Boolean(target.specialNinjuConfigs?.[type]);
    const isSteel = type === "steel" || type === true;
    const isHotBlood = type === "hotBlood";
    const isHeal = type === "genki" || type === "kakki" || type === "shinki";
    const isMoneyDart = type === "moneyDart";
    const isStatus = isSteel || isHotBlood || isHeal || isAttack || isSpecial;
    const statusRule = isStatus && target.statusButtonRule ? target.statusButtonRule(type) : null;
    const dartCost = isMoneyDart && target.moneyDartRule ? target.moneyDartRule().cost : 0;
    const now = currentNow(target);
    const dartMoving = unit?.moveTrail && (now - unit.moveTrail.startedAt) < (target.ARRIVE_TOTAL || 0);
    const dartReady = isMoneyDart && unit && (unit.skill || 0) >= dartCost && !unit.moneyDart && !target.activeMoneyDartCast?.(unit) && !dartMoving && now >= (unit.ninjuLockedUntil || 0);
    const hasSoul = !isAttack || (target.attackNinjuSoulLevel?.(unit) || 0) >= 1;
    const hasSkill = !isStatus || isAttack || !statusRule || !unit || (unit.skill || 0) >= statusRule.cost;
    const canUse = !unit || !target.isUnitDisabled?.(unit) || target.canUseNinjuDuringConsumable?.(unit);
    const ready = !unit || (unit.alive && canUse && (isStatus ? (statusRule?.available !== false && hasSkill && hasSoul) : dartReady));

    let btnImg = null;
    if (isAttack && target.images?.flashButton) btnImg = target.images.flashButton;
    else if ((isSpecial || isMoneyDart) && target.images?.moneyDartButton) btnImg = target.images.moneyDartButton;
    else if ((isSteel || isHotBlood) && target.images?.steelButton) btnImg = target.images.steelButton;
    else if (isHeal && target.images?.healButton) btnImg = target.images.healButton;

    if (btnImg) {
      drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: btnImg, x, y, w, h, alpha: ready ? 1 : 0.55 });
      if (label) {
        const fontSize = target.localizedNinjuFontSize?.(16) || 16;
        addText({ Text, layer: layers.hud, value: label, x: x + w / 2, y: y + h / 2 + 1, size: fontSize, color: "#232323f8", align: "center", noStroke: true });
      }
    } else {
      fillRect(hudGraphics, { x, y, w, h }, label ? 0xc78e42 : 0x2d3d38, 1);
      strokeRect(hudGraphics, { x, y, w, h }, 0x77bec6, 2);
      if (label) {
        const fontSize = target.localizedNinjuFontSize?.(15) || 15;
        hudText(label, x + w / 2, y + h / 2 + 1, fontSize, "#ffe6a6", "center");
      }
    }
    if ((isSteel || isHotBlood || isHeal || isAttack || isSpecial) && unit?.ninju?.type === type && (unit.ninju.queue || 0) > 0) {
      hudText(`x${unit.ninju.queue + 1}`, x + w - 10, y + 8, 12, "#fff2a8", "center");
    }
  }

  function renderInventoryHud() {
    const text = target.roomLocale?.() || {};
    const unit = target.selectedHudUnit?.();
    const itemY = target.itemSlotY || 642;
    const ninjuY = 600;
    const startX = target.itemSlotStartX || 510;
    const slotW = target.itemSlotW || 38;
    const slotH = target.itemSlotH || 34;
    const gap = target.itemSlotGap || 7;

    hudText(text.itemBadge || "道具", 482, itemY + 14, 22, "#f0f0df", "center");
    hudText(text.ninjuBadge || "忍術", 482, ninjuY + 15, 22, "#f0f0df", "center");

    for (let i = 0; i < 10; i += 1) {
      const sx = startX + i * (slotW + gap);
      const itemType = unit?.itemSlots?.[i] || "";
      fillRect(hudGraphics, { x: sx, y: itemY, w: slotW, h: slotH }, itemType ? 0x12626d : 0x163f49, 1);
      strokeRect(hudGraphics, { x: sx, y: itemY, w: slotW, h: slotH }, 0x5eb5b3, 2);
      fillRect(hudGraphics, { x: sx + 4, y: itemY + 3, w: slotW - 8, h: 4 }, 0xffffff, 0.12);
      const icon = target.itemIconByType?.(itemType);
      if (icon) drawNaturalSprite({ Sprite, Texture, layer: layers.hud, image: icon, x: sx + 7, y: itemY + 5, w: 24, h: 24 });
    }

    for (let i = 0; i < 6; i += 1) {
      renderNinjuSlot(510 + i * 75, ninjuY, 60, 30, "", false);
    }
    for (const button of target.currentNinjuButtonList?.() || []) {
      renderNinjuSlot(button.x, button.y, button.w, button.h, button.label, button.type);
    }

    hudGraphics.ellipse(476, 644 - 5, 12, 8);
    hudGraphics.fill({ color: 0x2479a9 });
    hudText(String(target.teamAliveCount?.("blue") ?? ""), 496, 640, 13, "#e8f8f5", "left");
    hudGraphics.ellipse(476, 670 - 5, 12, 8);
    hudGraphics.fill({ color: 0xd8d8d8 });
    hudText(String(target.teamAliveCount?.("grey") ?? ""), 496, 666, 13, "#e8f8f5", "left");
  }

  function renderNinjuBar() {
    const unit = target.selectedHudUnit?.();
    if (!unit) return;
    const text = target.roomLocale?.() || {};
    const now = currentNow(target);
    const active = target.isUnitCastingNinju?.(unit);
    const gap = target.isUnitInNinjuGap?.(unit);
    const steelBuff = target.isSteelDefenseActive?.(unit);
    const hotBloodBuff = target.isHotBloodActive?.(unit);
    const buff = steelBuff || hotBloodBuff;
    const steelCost = target.steelRule?.().cost || 7;
    const fallbackCost = target.hasReadyAttackNinjuInLoadout?.(unit) ? 0 : steelCost;
    if (!active && !gap && !buff && (!unit.alive || (unit.skill || 0) >= steelCost)) return;
    fillRect(hudGraphics, { x: 814, y: 636, w: 62, h: 30 }, 0x000000, 0.55);
    const buffUntil = Math.max(unit.steelUntil || 0, unit.hotBloodUntil || 0);
    const displayText = active
      ? (text.ninjuCasting || "施放")
      : gap
        ? (text.ninjuMovable || "可動")
        : buff
          ? `${Math.ceil((buffUntil - now) / 1000)}${text.secondsSuffix || "秒"}`
          : `${text.ninjuSkillCostPrefix || "技"}${fallbackCost}`;
    hudText(displayText, 845, 651, 14, "#f7f6d7", "center");
  }

  function renderHud() {
    clearLayer(layers.hud, 1);
    hudGraphics.clear();
    renderSoulHud();
    renderTopHud();
    renderBottomHud();
    renderInventoryHud();
    renderNinjuBar();
  }

  // ===== Result Overlay =====

  function renderResultRow(values, y, header = false, team = "") {
    const rx = 186;
    const widths = [150, 100, 80, 140, 140];
    overlayGraphics.rect(rx - 12, y - 18, 606, 34);
    overlayGraphics.fill({ color: header ? 0xffffff : team === "blue" ? 0x50bef0 : 0xdcdcd2, alpha: header ? 0.14 : 0.12 });
    const textColor = header ? "#fff1a8" : "#f4fff8";
    let cursor = rx;
    for (let i = 0; i < values.length; i += 1) {
      addText({ Text, layer: layers.overlay, value: values[i], x: cursor, y, size: 17, color: textColor, align: "left" });
      cursor += widths[i];
    }
  }

  function renderResultOverlay() {
    clearLayer(layers.overlay, 1);
    overlayGraphics.clear();
    const state = runtimeState(target);
    if (!state.result) return;
    const cw = canvas.width || 960;
    const ch = canvas.height || 680;
    const text = target.roomLocale?.() || {};

    fillRect(overlayGraphics, { x: 0, y: 0, w: cw, h: ch }, 0x001216, 0.82);
    fillRect(overlayGraphics, { x: 142, y: 88, w: 676, h: 504 }, 0x063d46, 1);
    strokeRect(overlayGraphics, { x: 142, y: 88, w: 676, h: 504 }, 0xd0a65f, 4);

    const title = state.result.winner === "blue" ? (text.victory || "勝利") : (text.defeat || "敗北");
    addText({ Text, layer: layers.overlay, value: title, x: cw / 2, y: 130, size: 48, color: state.result.winner === "blue" ? "#78ddff" : "#ff8d7d", align: "center" });
    addText({ Text, layer: layers.overlay, value: `${text.gameTime || "時間"} ${target.formatMatchTime?.(state.result.durationMs) || ""}`, x: cw / 2, y: 176, size: 22, color: "#f6f2d0", align: "center" });

    renderResultRow(text.resultHeaders || ["名稱", "隊伍", "擊殺", "傷害輸出", "傷害承受"], 214, true, "");
    const rows = (state.units || []).slice().sort((a, b) => (a.team || "").localeCompare(b.team || "") || (a.id || 0) - (b.id || 0));
    rows.forEach((unit, index) => {
      renderResultRow([
        unit.name || "",
        unit.team === "blue" ? "青組" : "灰組",
        String(unit.kills || 0),
        target.formatDamage?.(unit.damageDone) ?? String(Math.round(unit.damageDone || 0)),
        target.formatDamage?.(unit.damageTaken) ?? String(Math.round(unit.damageTaken || 0)),
      ], 248 + index * 42, false, unit.team || "");
    });
  }

  // ===== Main orchestrator =====

  function renderFrame() {
    const now = currentNow(target);
    renderBackdrop();
    renderBoard();
    renderMapObjects();
    clearLayer(layers.effects, 1);
    renderMoveTrails(now);
    renderUnits();
    renderDrag();
    renderNinjuEffects(now);
    renderMoneyDartShootAnimations(now);
    renderAttacks(now);
    renderHud();
    renderSceneBorder();
    renderResultOverlay();
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
