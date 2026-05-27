export function matchWinner(stateLike = {}) {
  if (stateLike.result) return null;
  const blueLeft = stateLike.units?.some((unit) => unit.team === "blue" && (unit.alive || unit.respawning));
  const greyLeft = stateLike.units?.some((unit) => unit.team === "grey" && (unit.alive || unit.respawning));
  if (!blueLeft) return "grey";
  if (!greyLeft) return "blue";
  return null;
}

export function checkVictory(stateLike = {}, callbacks = {}) {
  const winner = matchWinner(stateLike);
  if (!winner) return null;
  callbacks.finishMatch?.(winner);
  return winner;
}

export function finishMatch(stateLike, winner, options = {}) {
  const now = options.now ?? 0;
  const clearDragState = options.clearDragState || (() => {});
  const syncBgm = options.syncBgm || (() => {});
  const playSound = options.playSound || (() => null);
  const setMessage = options.setMessage || (() => {});

  stateLike.gameOver = true;
  stateLike.matchEnd = now;
  stateLike.result = {
    winner,
    durationMs: Math.max(0, now - (stateLike.matchStart || stateLike.countdownStart || now)),
  };
  stateLike.resultClickableAt = now + 2000;
  clearDragState();
  syncBgm();
  if (!stateLike.endSoundPlayed) {
    stateLike.endSoundInstance = playSound(winner === "blue" ? "win" : "lose");
    stateLike.endSoundPlayed = true;
  }
  setMessage(winner === "blue" ? "勝利。" : "敗北。");
  return stateLike.result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeMatchFlow(legacy = {}) {
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
  const moduleState = clone(baseState);
  const moduleEvents = [];
  const winner = checkVictory(moduleState, {
    finishMatch: (nextWinner) => finishMatch(moduleState, nextWinner, {
      now: 5000,
      clearDragState: () => moduleEvents.push("clearDragState"),
      syncBgm: () => moduleEvents.push("syncBgm"),
      playSound: (key) => {
        moduleEvents.push(`playSound:${key}`);
        return { key };
      },
      setMessage: (message) => moduleEvents.push(`setMessage:${message}`),
    }),
  });
  const moduleResult = {
    winner,
    result: moduleState.result,
    resultClickableAt: moduleState.resultClickableAt,
    gameOver: moduleState.gameOver,
    endSoundPlayed: moduleState.endSoundPlayed,
    endSoundKey: moduleState.endSoundInstance?.key,
    events: moduleEvents,
    noWinner: matchWinner({
      units: [
        { team: "blue", alive: true },
        { team: "grey", alive: true },
      ],
    }),
    existingResultWinner: matchWinner({ result: { winner: "blue" }, units: [] }),
  };
  const legacyResult = legacy.runMatchFlowProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
