import {
  checkVictory as checkVictoryModule,
  finishMatch as finishMatchModule,
} from "../systems/match.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

export function installMatchGlobals(target = globalThis) {
  const checkVictory = () => checkVictoryModule(resolveRuntimeState(target), {
    finishMatch: (winner) => finishMatch(winner),
  });

  const finishMatch = (winner) => finishMatchModule(resolveRuntimeState(target), winner, {
    now: target.performance?.now?.() ?? 0,
    clearDragState: target.clearDragState,
    syncBgm: target.syncBgm,
    playSound: target.playSound,
    setMessage: target.setMessage,
  });

  Object.assign(target, { checkVictory, finishMatch });

  target.NindouMatch = {
    checkVictory,
    finishMatch,
    runMatchFlowProbe() {
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
      const stateLike = JSON.parse(JSON.stringify(baseState));
      const events = [];
      const winner = checkVictoryModule(stateLike, {
        finishMatch: (nextWinner) => finishMatchModule(stateLike, nextWinner, {
          now: 5000,
          clearDragState: () => events.push("clearDragState"),
          syncBgm: () => events.push("syncBgm"),
          playSound: (key) => {
            events.push(`playSound:${key}`);
            return { key };
          },
          setMessage: (message) => events.push(`setMessage:${message}`),
        }),
      });
      return {
        winner,
        result: stateLike.result,
        resultClickableAt: stateLike.resultClickableAt,
        gameOver: stateLike.gameOver,
        endSoundPlayed: stateLike.endSoundPlayed,
        endSoundKey: stateLike.endSoundInstance?.key,
        events,
        noWinner: checkVictoryModule({
          units: [
            { team: "blue", alive: true, respawning: false },
            { team: "grey", alive: true, respawning: false },
          ],
        }),
        existingResultWinner: checkVictoryModule({
          result: { winner: "blue" },
          units: [],
        }),
      };
    },
  };
}
