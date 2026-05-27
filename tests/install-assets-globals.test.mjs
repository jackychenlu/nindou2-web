import test from "node:test";
import assert from "node:assert/strict";

import { installAssetGlobals } from "../scripts/bootstrap/install-assets-globals.module.mjs";

class AudioStub {
  constructor(src) {
    this.src = src;
    this.preload = "";
    this.loop = false;
    this.volume = 0;
  }
  cloneNode() {
    return new AudioStub(this.src);
  }
}

test("installAssetGlobals wires asset globals and compatibility object", () => {
  const target = {
    Audio: AudioStub,
    attackNinjuOutcomeTables: { wildfire: [], death: [], freeze: [] },
  };
  const previousAudio = globalThis.Audio;
  globalThis.Audio = AudioStub;
  try {
    installAssetGlobals(target);
  } finally {
    globalThis.Audio = previousAudio;
  }
  assert.equal(typeof target.bgmBySrc, "function");
  assert.equal(typeof target.soundSources, "object");
  assert.equal(typeof target.imageSources, "object");
  assert.equal(Array.isArray(target.defUpFrameSources), true);
  assert.equal(Array.isArray(target.defUpFrames), true);
  assert.equal(typeof target.attackNinjuConfigs, "object");
  assert.equal(typeof target.NindouAssets, "object");
  assert.equal(target.NindouAssets.soundSources, target.soundSources);
  assert.equal(target.NindouAssets.imageSources, target.imageSources);
});
