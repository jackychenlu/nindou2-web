const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadAssetContext() {
  const audioSources = [];
  const context = createGameContext({
    Audio: class {
      constructor(src) {
        this.src = src;
        this.preload = "";
        this.loop = false;
        this.volume = 0;
        audioSources.push(src);
      }
    },
  });
  loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/assets.js",
  ]);
  context.__audioSources = audioSources;
  return context;
}

test("asset ES module stays in sync with legacy asset data", async () => {
  const context = loadAssetContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "assets.module.mjs")).href;
  const assetModule = await import(modulePath);
  const legacyAssets = contextValue(context, "globalThis.NindouAssets");
  const summary = assetModule.summarizeAssetCatalog(legacyAssets);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(summary.soundKeys, Object.keys(legacyAssets.soundSources));
  assert.deepEqual(summary.imageKeys, Object.keys(legacyAssets.imageSources));
  assert.deepEqual(summary.attackNinjuConfigKeys, Object.keys(legacyAssets.attackNinjuConfigs));
  assert.deepEqual(summary.specialNinjuConfigKeys, Object.keys(legacyAssets.specialNinjuConfigs));
  assert.equal(summary.defaultRoomBgmSrc, "assets/sounds/bgm/忍2大廳.mp3");
  assert.ok(context.__audioSources.includes("assets/sounds/bgm/忍2大廳.mp3"));
  assert.ok(context.__audioSources.includes(summary.defaultBattleBgmSrc));
});
