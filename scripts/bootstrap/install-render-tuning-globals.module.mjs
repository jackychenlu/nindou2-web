import {
  eyeOffsets,
  moneyDartEyeOffsets,
  moneyDartReadyOffsets,
  moneyDartShootYCorrection,
  moneyDartShootFrameHeads,
  useNinjuSpriteOffset,
  moveEffectOffsets,
  arriveFrameOffset,
  moneyDartVisualOffsets,
} from "../data/render-tuning.module.mjs";

export function installRenderTuningGlobals(target = globalThis) {
  Object.assign(target, {
    eyeOffsets,
    moneyDartEyeOffsets,
    moneyDartReadyOffsets,
    moneyDartShootYCorrection,
    moneyDartShootFrameHeads,
    useNinjuSpriteOffset,
    moveEffectOffsets,
    arriveFrameOffset,
    moneyDartVisualOffsets,
  });

  target.NindouRenderTuning = {
    eyeOffsets,
    moneyDartEyeOffsets,
    moneyDartReadyOffsets,
    moneyDartShootYCorrection,
    moneyDartShootFrameHeads,
    useNinjuSpriteOffset,
    moveEffectOffsets,
    arriveFrameOffset,
    moneyDartVisualOffsets,
  };
}
