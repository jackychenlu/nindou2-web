const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

function loadAppearanceContext() {
  const context = createGameContext({
    Audio: class {
      constructor(src) {
        this.src = src;
      }
    },
  });
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/assets.js",
    "scripts/systems/appearance.js",
  ]);
}

test("appearance ES module stays in sync with legacy appearance helpers", async () => {
  const context = loadAppearanceContext();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "appearance.module.mjs")).href;
  const appearanceModule = await import(modulePath);
  const legacyAppearance = contextValue(context, "globalThis.NindouAppearance");
  const summary = appearanceModule.summarizeAppearanceHelpers(legacyAppearance);

  assert.equal(summary.isSynced, true);
  assert.equal(appearanceModule.lookDefinitionByKey("missing").spriteSet, "blue");
  assert.equal(appearanceModule.unitLookDefinition({ team: "grey", controlMode: "ai_red" }).spriteSet, "redBlue");
  assert.equal(appearanceModule.unitLookDefinition({ team: "grey", appearanceKey: "__team_default__" }).spriteSet, "grey");
  assert.equal(appearanceModule.unitLookDefinition({ team: "grey", appearanceKey: "zhaohuo" }).spriteSet, "zhaohuo");

  const imageMap = { eyesFront: "front", eyeSide: "side", redEyesFront: "red-front", redEyeSide: "red-side" };
  assert.equal(appearanceModule.unitEyeFrontSprite({ team: "blue", controlMode: "ai_red" }, imageMap), "red-front");
  assert.equal(appearanceModule.unitEyeSideSprite({ team: "blue", appearanceKey: "missing" }, imageMap), "side");
});
