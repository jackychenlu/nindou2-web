const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadMatchContext() {
  const context = createGameContext();
  return loadScripts(context, [
    "scripts/systems/match.js",
  ]);
}

test("match ES module stays in sync with legacy match flow", async () => {
  const context = loadMatchContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "match.module.mjs")).href;
  const matchModule = await import(modulePath);
  const legacyMatch = contextValue(context, "globalThis.NindouMatch");
  const summary = matchModule.summarizeMatchFlow(legacyMatch);

  assert.equal(summary.isSynced, true);
  assert.equal(matchModule.matchWinner({
    units: [
      { team: "blue", alive: false, respawning: false },
      { team: "grey", alive: true, respawning: false },
    ],
  }), "grey");
  assert.equal(matchModule.matchWinner({
    units: [
      { team: "blue", alive: true, respawning: false },
      { team: "grey", alive: false, respawning: true },
    ],
  }), null);

  const stateLike = { matchStart: 100, units: [], endSoundPlayed: true };
  const events = [];
  matchModule.finishMatch(stateLike, "grey", {
    now: 600,
    clearDragState: () => events.push("clear"),
    syncBgm: () => events.push("bgm"),
    playSound: (key) => events.push(key),
    setMessage: (message) => events.push(message),
  });
  assert.deepEqual(stateLike.result, { winner: "grey", durationMs: 500 });
  assert.deepEqual(events, ["clear", "bgm", "敗北。"]);
});
