const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function makeAudio(src) {
  return {
    src,
    preload: "",
    loop: false,
    volume: 0.2,
    paused: true,
    currentTime: 0,
    cloneNode() {
      return makeAudio(src);
    },
    play() {
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
  };
}

function loadAudioContext() {
  const context = createGameContext({
    Audio: class {
      constructor(src) {
        return makeAudio(src);
      }
    },
  });
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/assets.js",
    "scripts/systems/grid.js",
    "scripts/systems/audio.js",
  ]);
}

test("audio ES module stays in sync with legacy audio helpers", async () => {
  const context = loadAudioContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "audio.module.mjs")).href;
  const audioModule = await import(modulePath);
  const legacyAudio = contextValue(context, "globalThis.NindouAudio");
  const summary = audioModule.summarizeAudioHelpers(legacyAudio);

  assert.equal(summary.isSynced, true);
  assert.equal(audioModule.activeBgmKey({ stateLike: { inRoom: true } }), "room");
  assert.equal(audioModule.activeBgmKey({ stateLike: { result: { winner: "grey" } } }), null);
  assert.equal(audioModule.breakSoundKey({ type: "vase" }), "breakVase");
  assert.equal(audioModule.breakSoundKey({ type: "barrel" }), "breakDefault");
});
