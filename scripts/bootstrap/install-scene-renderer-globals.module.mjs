import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

export function installSceneRendererGlobals(target = globalThis) {
  const battleMapRect = () => ({
    x: target.grid.left + target.battleMapDrawInset.left,
    y: target.grid.top + target.battleMapDrawInset.top,
    w: target.grid.cols * target.grid.cell - target.battleMapDrawInset.left - target.battleMapDrawInset.right,
    h: target.grid.rows * target.grid.cell - target.battleMapDrawInset.top - target.battleMapDrawInset.bottom,
  });

  const drawCornerGem = (x, y) => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "#224d43";
    ctx.strokeStyle = "#d0a15b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#75c7a5";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawUiPanels = () => {
    const { canvas, ctx } = canvasContext(target);
    if (!canvas || !ctx) return;
    const bottom = target.ui.bottomTop;
    ctx.save();
    ctx.fillStyle = "#074451";
    ctx.fillRect(0, bottom, canvas.width, target.ui.bottomHeight);
    ctx.fillStyle = "#052b32";
    ctx.fillRect(8, bottom + 10, target.ui.leftPanelW - 18, target.ui.bottomHeight - 18);
    ctx.fillRect(target.ui.midX + 10, bottom + 10, canvas.width - target.ui.midX - 18, target.ui.bottomHeight - 18);
    ctx.restore();
  };

  const drawFrame = () => {
    const { canvas, ctx } = canvasContext(target);
    if (!canvas || !ctx) return;
    const bottom = target.ui.bottomTop;
    ctx.save();
    ctx.strokeStyle = "#7b2417";
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, canvas.width - 6, bottom - 4);
    ctx.strokeRect(3, bottom, canvas.width - 6, canvas.height - bottom - 4);
    ctx.beginPath();
    ctx.moveTo(target.ui.midX, bottom);
    ctx.lineTo(target.ui.midX, canvas.height - 4);
    ctx.stroke();
    for (const [x, y] of [
      [9, 9],
      [canvas.width - 9, 9],
      [9, bottom - 2],
      [canvas.width - 9, bottom - 2],
      [9, canvas.height - 9],
      [target.ui.midX, bottom],
      [target.ui.midX, canvas.height - 9],
      [canvas.width - 9, canvas.height - 9],
    ]) {
      drawCornerGem(x, y);
    }
    ctx.restore();
  };

  const drawBackdrop = () => {
    const { canvas, ctx } = canvasContext(target);
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#062f37";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawUiPanels();
    const mapDrawRect = battleMapRect();
    const mapDefinition = target.currentRoomMapDefinition();
    const groundImage = target.images[mapDefinition.groundImageKey] || target.images.arena;
    const fallbackImage = target.images[mapDefinition.fallbackImageKey] || target.images.bg;
    if (groundImage) {
      ctx.drawImage(groundImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
    } else if (fallbackImage) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(fallbackImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#74ad7f";
      ctx.fillRect(mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
    }
    drawFrame();
  };

  const drawMapMaskOverlay = () => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const mapDefinition = target.currentRoomMapDefinition();
    const maskImage = target.images[mapDefinition.maskImageKey];
    if (!maskImage) return;
    const mapDrawRect = battleMapRect();
    ctx.drawImage(maskImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
  };

  const drawBoard = () => {
    const { ctx } = canvasContext(target);
    const state = resolveRuntimeState(target);
    if (!ctx || !state) return;
    for (let y = 0; y < target.grid.rows; y++) {
      for (let x = 0; x < target.grid.cols; x++) {
        const r = target.cellRect(x, y);
        const hovered = state.pointer.cell && state.pointer.cell.x === x && state.pointer.cell.y === y;
        if (hovered) {
          ctx.fillStyle = target.isBlockedCell(x, y) ? "rgba(255, 82, 69, .22)" : "rgba(255, 238, 124, .22)";
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
      }
    }

    const selected = target.selectedUnit();
    if (!selected) return;
    for (const n of target.neighbors(selected.x, selected.y)) {
      if (!target.inside(n.x, n.y)) continue;
      const r = target.cellRect(n.x, n.y);
      ctx.fillStyle = target.unitAt(n.x, n.y) ? "rgba(255,95,83,.26)" : "rgba(103,212,179,.20)";
      if (target.isBlockedCell(n.x, n.y)) ctx.fillStyle = "rgba(255,224,109,.18)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  };

  Object.assign(target, {
    battleMapRect,
    drawBackdrop,
    drawMapMaskOverlay,
    drawUiPanels,
    drawFrame,
    drawCornerGem,
    drawBoard,
  });

  target.NindouSceneRenderer = {
    battleMapRect,
    drawBackdrop,
    drawMapMaskOverlay,
    drawUiPanels,
    drawFrame,
    drawCornerGem,
    drawBoard,
  };
}
