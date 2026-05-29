import test from "node:test";
import assert from "node:assert/strict";

import { installAssetLoaderGlobals } from "../scripts/bootstrap/install-asset-loader-globals.module.mjs";

class ImageStub {
  set src(value) {
    this._src = value;
    this.onload?.();
  }

  get src() {
    return this._src;
  }
}

test("installAssetLoaderGlobals wires image loaders and compatibility object", async () => {
  const target = {
    Image: ImageStub,
    imageSources: { bg: "assets/map/map/10/bg.webp" },
    images: {},
    weaponDefinitions: [{
      key: "weapon1",
      frameCount: 1,
    }],
    weaponFrameSource: () => "assets/weapons/1/1.webp",
    weaponFrames: { weapon1: { hand: { right: [], left: [], up: [], down: [] }, attack: { right: [], left: [], up: [], down: [] } } },
    defUpFrameSources: [],
    defUpFrames: [],
    atkUpFrameSources: [],
    atkUpFrames: [],
    regenHpSmallFrameSources: [],
    regenHpSmallFrames: [],
    regenHpLargeFrameSources: [],
    regenHpLargeFrames: [],
    consumableRegenSpFrameSources: [],
    consumableRegenSpFrames: [],
    consumableMagicWaterFrameSources: Array.from({ length: 40 }, (_, index) => `assets/consumables/magic_water/${index + 1}.webp`),
    consumableMagicWaterFrames: [],
    consumableMagicWaterEffectFrameSources: Array.from({ length: 40 }, (_, index) => `assets/consumables/magic_water/effect__${index + 1}.webp`),
    consumableMagicWaterEffectFrames: [],
    smallThunderSummonFrameSources: [],
    smallThunderSummonFrames: [],
    smallThunderDamagedFrameSources: [],
    smallThunderDamagedFrames: [],
    smallFireSummonFrameSources: [],
    smallFireSummonFrames: [],
    smallFireDamagedFrameSources: [],
    smallFireDamagedFrames: [],
    deathSummonFrameSources: [],
    deathSummonFrames: [],
    deathDamagedFrameSources: [],
    deathDamagedFrames: [],
    smallIceSummonFrameSources: [],
    smallIceSummonFrames: [],
    smallIceDamagedFrameSources: [],
    smallIceDamagedFrames: [],
    smallIceBreakFrameSources: [],
    smallIceBreakFrames: [],
    damageFailFrameSources: [],
    damageFailFrames: [],
    faintedFrameSources: [],
    faintedFrames: [],
    damageSuccessSmallFrameSources: [],
    damageSuccessSmallFrames: [],
    damageSuccessMiddleFrameSources: [],
    damageSuccessMiddleFrames: [],
    damageSuccessBigFrameSources: [],
    damageSuccessBigFrames: [],
    damageSuccessNinjuSuccessFrameSources: [],
    damageSuccessNinjuSuccessFrames: [],
    sevenNinjuFrameSources: [],
    sevenNinjuFrames: [],
    cloneNinjuFrameSources: [],
    cloneNinjuFrames: [],
    cloneRedNinjuFrameSources: [],
    cloneRedNinjuFrames: [],
    cloneGreyNinjuFrameSources: [],
    cloneGreyNinjuFrames: [],
    cloneZhaohuoNinjuFrameSources: [],
    cloneZhaohuoNinjuFrames: [],
    angelNinjuFrameSources: [],
    angelNinjuFrames: [],
    mouryoNinjuFrameSources: [],
    mouryoNinjuFrames: [],
    mouryoNinjuHitFrameSources: [],
    mouryoNinjuHitFrames: [],
    moneyDartPickupFrameSources: [],
    moneyDartPickupFrames: [],
    respawnPointerFrameSources: [],
    respawnPointerFrames: [],
    chargeRedFrameSources: [],
    chargeRedFrames: [],
    chargeYellowFrameSources: [],
    chargeYellowFrames: [],
    moneyDartReadyFrameSources: {},
    moneyDartReadyFrames: {},
    dragArrowFrameSources: {},
    dragArrowFrames: {},
    useNinjuFrameSources: {},
    useNinjuFrames: {},
    movePrearriveFrameSources: {},
    movePrearriveFrames: {},
    moveArriveFrameSources: {},
    moveArriveFrames: {},
    moneyDartShootFrameSources: {},
    moneyDartShootFrames: {},
  };

  installAssetLoaderGlobals(target);

  assert.equal(typeof target.loadImages, "function");
  assert.equal(typeof target.loadFrame, "function");
  assert.equal(typeof target.NindouAssetLoader, "object");
  await target.loadImages();
  assert.equal(target.images.bg.src, "assets/map/map/10/bg.webp");
  assert.equal(target.weaponFrames.weapon1.hand.right[0].src, "assets/weapons/1/1.webp");
  assert.equal(target.consumableMagicWaterFrames.length, 40);
  assert.equal(target.consumableMagicWaterFrames[0].src, "assets/consumables/magic_water/1.webp");
  assert.equal(target.consumableMagicWaterFrames[39].src, "assets/consumables/magic_water/40.webp");
  assert.equal(target.consumableMagicWaterEffectFrames.length, 40);
  assert.equal(target.consumableMagicWaterEffectFrames[0].src, "assets/consumables/magic_water/effect__1.webp");
  assert.equal(target.consumableMagicWaterEffectFrames[39].src, "assets/consumables/magic_water/effect__40.webp");
});
