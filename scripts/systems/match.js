// ===== Match Flow =====
function checkVictory() {
  if (state.result) return;
  const blueLeft = state.units.some((u) => u.team === "blue" && (u.alive || u.respawning));
  const greyLeft = state.units.some((u) => u.team === "grey" && (u.alive || u.respawning));
  if (!blueLeft) {
    finishMatch("grey");
  } else if (!greyLeft) {
    finishMatch("blue");
  }
}

function finishMatch(winner) {
  const now = performance.now();
  state.gameOver = true;
  state.matchEnd = now;
  state.result = {
    winner,
    durationMs: Math.max(0, now - (state.matchStart || state.countdownStart || now)),
  };
  state.resultClickableAt = now + 2000;
  clearDragState();
  syncBgm();
  if (!state.endSoundPlayed) {
    state.endSoundInstance = playSound(winner === "blue" ? "win" : "lose");
    state.endSoundPlayed = true;
  }
  setMessage(winner === "blue" ? "勝利。" : "敗北。");
}

globalThis.NindouMatch = {
  checkVictory,
  finishMatch,
  runMatchFlowProbe() {
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const localMatchWinner = (probeState) => {
      if (probeState.result) return null;
      const blueLeft = probeState.units?.some((unit) => unit.team === "blue" && (unit.alive || unit.respawning));
      const greyLeft = probeState.units?.some((unit) => unit.team === "grey" && (unit.alive || unit.respawning));
      if (!blueLeft) return "grey";
      if (!greyLeft) return "blue";
      return null;
    };
    const localFinishMatch = (probeState, winner, events) => {
      const now = 5000;
      probeState.gameOver = true;
      probeState.matchEnd = now;
      probeState.result = {
        winner,
        durationMs: Math.max(0, now - (probeState.matchStart || probeState.countdownStart || now)),
      };
      probeState.resultClickableAt = now + 2000;
      events.push("clearDragState");
      events.push("syncBgm");
      if (!probeState.endSoundPlayed) {
        const key = winner === "blue" ? "win" : "lose";
        events.push(`playSound:${key}`);
        probeState.endSoundInstance = { key };
        probeState.endSoundPlayed = true;
      }
      events.push(`setMessage:${winner === "blue" ? "勝利。" : "敗北。"}`);
    };
    const baseState = {
      gameOver: false,
      matchStart: 1000,
      countdownStart: 900,
      endSoundPlayed: false,
      units: [
        { team: "blue", alive: true, respawning: false },
        { team: "grey", alive: false, respawning: false },
      ],
    };
    const probeState = clone(baseState);
    const events = [];
    const winner = localMatchWinner(probeState);
    if (winner) localFinishMatch(probeState, winner, events);
    return {
      winner,
      result: probeState.result,
      resultClickableAt: probeState.resultClickableAt,
      gameOver: probeState.gameOver,
      endSoundPlayed: probeState.endSoundPlayed,
      endSoundKey: probeState.endSoundInstance?.key,
      events,
      noWinner: localMatchWinner({
        units: [
          { team: "blue", alive: true },
          { team: "grey", alive: true },
        ],
      }),
      existingResultWinner: localMatchWinner({ result: { winner: "blue" }, units: [] }),
    };
  },
};
