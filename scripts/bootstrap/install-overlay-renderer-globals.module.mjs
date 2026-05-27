import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

export function installOverlayRendererGlobals(target = globalThis) {
  const countdownStep = (elapsed) => {
    if (elapsed < 500) return { text: target.localizedCountdownText(3), color: "#fff1a8" };
    if (elapsed < 1000) return { text: target.localizedCountdownText(2), color: "#fff1a8" };
    if (elapsed < 1500) return { text: target.localizedCountdownText(1), color: "#fff1a8" };
    if (elapsed < target.countdownTotalMs) return { text: target.localizedCountdownText(0), color: "#ffea4d" };
    return null;
  };

  const drawCountdownOverlay = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { canvas, ctx } = canvasContext(target);
    if (!state || !canvas || !ctx || state.result || state.matchStart || !state.countdownStart) return;
    const elapsed = currentNow - state.countdownStart;
    const step = countdownStep(elapsed);
    if (!step) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, .18)";
    ctx.fillRect(target.grid.left, target.grid.top, target.grid.cols * target.grid.cell, target.grid.rows * target.grid.cell);
    const startText = target.localizedCountdownText(0);
    const shake = step.text === startText ? Math.sin(currentNow / 35) * 8 : 0;
    const scale = step.text === startText ? 1 + Math.sin(currentNow / 70) * 0.06 : 1;
    ctx.translate(canvas.width / 2 + shake, target.grid.top + target.grid.rows * target.grid.cell / 2 - 16);
    ctx.scale(scale, scale);
    target.drawOutlinedText(step.text, 0, 0, step.text === startText ? 76 : 96, step.color, "center");
    ctx.restore();
  };

  const drawResultRow = (values, y, header = false, team = "") => {
    const { ctx } = canvasContext(target);
    if (!ctx) return;
    const x = 186;
    const widths = [150, 100, 80, 140, 140];
    ctx.save();
    ctx.fillStyle = header ? "rgba(255,255,255,.14)" : team === "blue" ? "rgba(80,190,240,.13)" : "rgba(220,220,210,.12)";
    ctx.fillRect(x - 12, y - 18, 606, 34);
    ctx.fillStyle = header ? "#fff1a8" : "#f4fff8";
    ctx.font = `${header ? "700" : "600"} 17px Microsoft JhengHei, sans-serif`;
    let cursor = x;
    for (let i = 0; i < values.length; i++) {
      ctx.fillText(values[i], cursor, y);
      cursor += widths[i];
    }
    ctx.restore();
  };

  const drawResultOverlay = () => {
    const state = resolveRuntimeState(target);
    const { canvas, ctx } = canvasContext(target);
    if (!state?.result || !canvas || !ctx) return;
    ctx.save();
    ctx.fillStyle = "rgba(0, 18, 22, .82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#063d46";
    ctx.strokeStyle = "#d0a65f";
    ctx.lineWidth = 4;
    ctx.fillRect(142, 88, 676, 504);
    ctx.strokeRect(142, 88, 676, 504);

    const text = target.roomLocale();
    const title = state.result.winner === "blue" ? text.victory : text.defeat;
    target.drawOutlinedText(title, canvas.width / 2, 130, 48, state.result.winner === "blue" ? "#78ddff" : "#ff8d7d", "center");
    target.drawOutlinedText(`${text.gameTime} ${target.formatMatchTime(state.result.durationMs)}`, canvas.width / 2, 176, 22, "#f6f2d0", "center");

    ctx.font = "700 17px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    drawResultRow(text.resultHeaders, 214, true);
    const rows = state.units.slice().sort((a, b) => a.team.localeCompare(b.team) || a.id - b.id);
    rows.forEach((unit, index) => {
      drawResultRow([
        unit.name,
        unit.team === "blue" ? "青組" : "灰組",
        String(unit.kills),
        target.formatDamage(unit.damageDone),
        target.formatDamage(unit.damageTaken),
      ], 248 + index * 42, false, unit.team);
    });
    ctx.restore();
  };

  Object.assign(target, {
    drawCountdownOverlay,
    countdownStep,
    drawResultOverlay,
    drawResultRow,
  });

  target.NindouOverlayRenderer = {
    drawCountdownOverlay,
    countdownStep,
    drawResultOverlay,
    drawResultRow,
  };
}
