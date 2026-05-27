import test from "node:test";
import assert from "node:assert/strict";

import { installAudioGlobals } from "../scripts/bootstrap/install-audio-globals.module.mjs";

test("installAudioGlobals wires audio helpers and compatibility object", () => {
  const bgms = {};
  const target = {
    state: { inRoom: true, result: null },
    roomBgm: { paused: true, play: () => Promise.resolve(), pause: () => {}, currentTime: 0, volume: 0.2 },
    defaultBattleBgm: { paused: true, play: () => Promise.resolve(), pause: () => {}, currentTime: 0, volume: 0.2 },
    battleBgmsBySrc: bgms,
    bgmBySrc: (src) => {
      if (!bgms[src]) bgms[src] = { src, paused: true, play: () => Promise.resolve(), pause: () => {}, currentTime: 0, volume: 0.2 };
      return bgms[src];
    },
    currentRoomMapDefinition: () => ({ battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3" }),
    sounds: {},
  };
  installAudioGlobals(target);
  assert.equal(typeof target.playSound, "function");
  assert.equal(typeof target.startBgm, "function");
  assert.equal(typeof target.applyVolumeControls, "function");
  assert.equal(typeof target.NindouAudio, "object");
  assert.equal(typeof target.NindouAudio.runAudioHelperProbe, "function");
  target.state.inRoom = false;
  assert.equal(target.activeBgm().src, "assets/sounds/bgm/忍2鬼島戰鬥.mp3");
});
