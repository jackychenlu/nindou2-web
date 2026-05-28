const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
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
test("audio ES module exposes current helper behavior", async () => {
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "audio.module.mjs")).href;
  const audioModule = await import(modulePath);
  const summary = audioModule.summarizeAudioHelpers();

  assert.equal(audioModule.activeBgmKey({ stateLike: { inRoom: true } }), "room");
  assert.equal(audioModule.activeBgmKey({ stateLike: { result: { winner: "grey" } } }), null);
  assert.equal(audioModule.breakSoundKey({ type: "vase" }), "breakVase");
  assert.equal(audioModule.breakSoundKey({ type: "barrel" }), "breakDefault");
  assert.equal(summary.moduleResult.playedVolume, 0.2);
  assert.ok(Math.abs(summary.moduleResult.shopMoveItemVolume - 0.12) < 1e-9);
  assert.ok(Math.abs(summary.moduleResult.quieterPlayedVolume - 0.14) < 1e-9);
  assert.ok(Math.abs(audioModule.playSound({ breakVase: makeAudio("vase.ogg") }, "breakVase", { volumeMultiplier: 0.7 }).volume - 0.14) < 1e-9);
  assert.ok(Math.abs(audioModule.playSound({ breakVase: makeAudio("vase.ogg") }, "breakVase", 0.7).volume - 0.14) < 1e-9);
});
