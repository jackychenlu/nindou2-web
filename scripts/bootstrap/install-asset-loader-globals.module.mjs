function imageConstructor(target) {
  return target.Image || Image;
}

export function installAssetLoaderGlobals(target = globalThis) {
  const loadFrame = (src, frameTarget, index) => new Promise((resolve) => {
    const ImageCtor = imageConstructor(target);
    const img = new ImageCtor();
    img.onload = () => {
      frameTarget[index] = img;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  });

  const loadFrameGroup = (sources, frameTarget) => sources.map((src, index) => loadFrame(src, frameTarget, index));
  const loadFrameGroups = (groups) => groups.flatMap(([sources, frameTarget]) => loadFrameGroup(sources, frameTarget));
  const loadKeyedFrameGroups = (sourceGroups, targetGroups) => (
    Object.entries(sourceGroups).flatMap(([key, sources]) => loadFrameGroup(sources, targetGroups[key]))
  );
  const loadNestedFrameGroups = (sourceGroups, targetGroups) => (
    Object.entries(sourceGroups).flatMap(([groupKey, directions]) => (
      Object.entries(directions).flatMap(([direction, sources]) => (
        loadFrameGroup(sources, targetGroups[groupKey][direction])
      ))
    ))
  );

  const loadStaticImages = () => Object.entries(target.imageSources).map(([key, src]) => new Promise((resolve) => {
    const ImageCtor = imageConstructor(target);
    const img = new ImageCtor();
    img.onload = () => {
      target.images[key] = img;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  }));

  const loadWeaponFrames = () => target.weaponDefinitions.flatMap((weapon) => (
    ["right", "left", "up", "down"].flatMap((direction) => (
      ["hand", "attack"].flatMap((kind) => (
        Array.from({ length: weapon.frameCount }, (_, index) => {
          const src = target.weaponFrameSource(weapon, direction, kind, index);
          return loadFrame(src, target.weaponFrames[weapon.key][kind][direction], index);
        })
      ))
    ))
  ));

  const loadImages = () => {
    const frameGroups = [
      [target.defUpFrameSources, target.defUpFrames],
      [target.atkUpFrameSources, target.atkUpFrames],
      [target.regenHpSmallFrameSources, target.regenHpSmallFrames],
      [target.regenHpLargeFrameSources, target.regenHpLargeFrames],
      [target.consumableRegenSpFrameSources, target.consumableRegenSpFrames],
      [target.consumableMagicWaterFrameSources, target.consumableMagicWaterFrames],
      [target.consumableMagicWaterEffectFrameSources, target.consumableMagicWaterEffectFrames],
      [target.smallThunderSummonFrameSources, target.smallThunderSummonFrames],
      [target.smallThunderDamagedFrameSources, target.smallThunderDamagedFrames],
      [target.smallFireSummonFrameSources, target.smallFireSummonFrames],
      [target.smallFireDamagedFrameSources, target.smallFireDamagedFrames],
      [target.deathSummonFrameSources, target.deathSummonFrames],
      [target.deathDamagedFrameSources, target.deathDamagedFrames],
      [target.smallIceSummonFrameSources, target.smallIceSummonFrames],
      [target.smallIceDamagedFrameSources, target.smallIceDamagedFrames],
      [target.smallIceBreakFrameSources, target.smallIceBreakFrames],
      [target.damageFailFrameSources, target.damageFailFrames],
      [target.faintedFrameSources, target.faintedFrames],
      [target.damageSuccessSmallFrameSources, target.damageSuccessSmallFrames],
      [target.damageSuccessMiddleFrameSources, target.damageSuccessMiddleFrames],
      [target.damageSuccessBigFrameSources, target.damageSuccessBigFrames],
      [target.damageSuccessNinjuSuccessFrameSources, target.damageSuccessNinjuSuccessFrames],
      [target.sevenNinjuFrameSources, target.sevenNinjuFrames],
      [target.cloneNinjuFrameSources, target.cloneNinjuFrames],
      [target.cloneRedNinjuFrameSources, target.cloneRedNinjuFrames],
      [target.cloneGreyNinjuFrameSources, target.cloneGreyNinjuFrames],
      [target.cloneZhaohuoNinjuFrameSources, target.cloneZhaohuoNinjuFrames],
      [target.angelNinjuFrameSources, target.angelNinjuFrames],
      [target.mouryoNinjuFrameSources, target.mouryoNinjuFrames],
      [target.mouryoNinjuHitFrameSources, target.mouryoNinjuHitFrames],
      [target.moneyDartPickupFrameSources, target.moneyDartPickupFrames],
      [target.respawnPointerFrameSources, target.respawnPointerFrames],
      [target.chargeRedFrameSources, target.chargeRedFrames],
      [target.chargeYellowFrameSources, target.chargeYellowFrames],
    ];

    return Promise.all([
      ...loadStaticImages(),
      ...loadFrameGroups(frameGroups),
      ...loadKeyedFrameGroups(target.moneyDartReadyFrameSources, target.moneyDartReadyFrames),
      ...loadKeyedFrameGroups(target.dragArrowFrameSources, target.dragArrowFrames),
      ...loadKeyedFrameGroups(target.useNinjuFrameSources, target.useNinjuFrames),
      ...loadNestedFrameGroups(target.movePrearriveFrameSources, target.movePrearriveFrames),
      ...loadNestedFrameGroups(target.moveArriveFrameSources, target.moveArriveFrames),
      ...loadNestedFrameGroups(target.moneyDartShootFrameSources, target.moneyDartShootFrames),
      ...loadWeaponFrames(),
    ]);
  };

  Object.assign(target, {
    loadImages,
    loadStaticImages,
    loadFrameGroups,
    loadFrameGroup,
    loadKeyedFrameGroups,
    loadNestedFrameGroups,
    loadWeaponFrames,
    loadFrame,
  });

  target.NindouAssetLoader = {
    loadImages,
    loadStaticImages,
    loadFrameGroups,
    loadFrameGroup,
    loadKeyedFrameGroups,
    loadNestedFrameGroups,
    loadWeaponFrames,
    loadFrame,
  };
}
