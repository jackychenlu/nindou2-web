import {
  defaultRoomBgmSrc,
  defaultBattleBgmSrc,
  soundSources,
  soundVolumeMultipliers,
  imageSources,
  lookDefinitions,
  baseTeamLookDefinitions,
  frameSourceCatalog,
  chargeDirFrameSources,
  dragArrowFrameSources,
  movePrearriveFrameSources,
  moveArriveFrameSources,
  useNinjuFrameSources,
  moneyDartReadyFrameSources,
  moneyDartShootFrameSources,
} from "../data/assets.module.mjs";

function createLoopingBgm(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.2;
  return audio;
}

function emptyDirectionFrames() {
  return { right: [], left: [], up: [], down: [] };
}

function emptyNestedFrameBuffers(sourceGroups = {}) {
  return Object.fromEntries(
    Object.keys(sourceGroups).map((key) => [key, emptyDirectionFrames()]),
  );
}

function emptyFlatFrameBuffers(sourceGroups = {}) {
  return Object.fromEntries(
    Object.keys(sourceGroups).map((key) => [key, []]),
  );
}

export function installAssetGlobals(target = globalThis) {
  const roomBgm = createLoopingBgm(defaultRoomBgmSrc);
  const battleBgmsBySrc = {};
  const bgmBySrc = (src) => {
    const key = src || defaultBattleBgmSrc;
    if (!battleBgmsBySrc[key]) battleBgmsBySrc[key] = createLoopingBgm(key);
    if (typeof target.musicVolumeInput !== "undefined" && target.musicVolumeInput) {
      battleBgmsBySrc[key].volume = Number(target.musicVolumeInput.value) / 100;
    }
    return battleBgmsBySrc[key];
  };
  const defaultBattleBgm = bgmBySrc(defaultBattleBgmSrc);

  const images = {};
  const sounds = Object.fromEntries(Object.entries(soundSources).map(([key, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 0.2 * (soundVolumeMultipliers[key] ?? 1);
    return [key, audio];
  }));

  const defUpFrameSources = frameSourceCatalog.defUp;
  const atkUpFrameSources = frameSourceCatalog.atkUp;
  const regenHpSmallFrameSources = frameSourceCatalog.regenHpSmall;
  const regenHpLargeFrameSources = frameSourceCatalog.regenHpLarge;
  const consumableRegenSpFrameSources = frameSourceCatalog.consumableRegenSp;
  const consumableMagicWaterFrameSources = frameSourceCatalog.consumableMagicWater;
  const consumableMagicWaterEffectFrameSources = frameSourceCatalog.consumableMagicWaterEffect;
  const smallThunderSummonFrameSources = frameSourceCatalog.smallThunderSummon;
  const smallThunderDamagedFrameSources = frameSourceCatalog.smallThunderDamaged;
  const smallFireSummonFrameSources = frameSourceCatalog.smallFireSummon;
  const smallFireDamagedFrameSources = frameSourceCatalog.smallFireDamaged;
  const deathSummonFrameSources = frameSourceCatalog.deathSummon;
  const deathDamagedFrameSources = frameSourceCatalog.deathDamaged;
  const smallIceSummonFrameSources = frameSourceCatalog.smallIceSummon;
  const smallIceDamagedFrameSources = frameSourceCatalog.smallIceDamaged;
  const smallIceBreakFrameSources = frameSourceCatalog.smallIceBreak;
  const damageFailFrameSources = frameSourceCatalog.damageFail;
  const faintedFrameSources = frameSourceCatalog.fainted;
  const damageSuccessSmallFrameSources = frameSourceCatalog.damageSuccessSmall;
  const damageSuccessMiddleFrameSources = frameSourceCatalog.damageSuccessMiddle;
  const damageSuccessBigFrameSources = frameSourceCatalog.damageSuccessBig;
  const damageSuccessNinjuSuccessFrameSources = frameSourceCatalog.damageSuccessNinjuSuccess;
  const sevenNinjuFrameSources = frameSourceCatalog.sevenNinju;
  const cloneNinjuFrameSources = frameSourceCatalog.cloneNinju;
  const cloneRedNinjuFrameSources = frameSourceCatalog.cloneRedNinju;
  const cloneGreyNinjuFrameSources = frameSourceCatalog.cloneGreyNinju;
  const cloneZhaohuoNinjuFrameSources = frameSourceCatalog.cloneZhaohuoNinju;
  const angelNinjuFrameSources = frameSourceCatalog.angelNinju;
  const mouryoNinjuFrameSources = frameSourceCatalog.mouryoNinju;
  const mouryoNinjuHitFrameSources = frameSourceCatalog.mouryoNinjuHit;
  const chargeRedFrameSources = frameSourceCatalog.chargeRed;
  const chargeYellowFrameSources = frameSourceCatalog.chargeYellow;
  const respawnPointerFrameSources = frameSourceCatalog.respawnPointer;
  const moneyDartPickupFrameSources = frameSourceCatalog.moneyDartPickup;

  const defUpFrames = [];
  const atkUpFrames = [];
  const regenHpSmallFrames = [];
  const regenHpLargeFrames = [];
  const consumableRegenSpFrames = [];
  const consumableMagicWaterFrames = [];
  const consumableMagicWaterEffectFrames = [];
  const smallThunderSummonFrames = [];
  const smallThunderDamagedFrames = [];
  const smallFireSummonFrames = [];
  const smallFireDamagedFrames = [];
  const deathSummonFrames = [];
  const deathDamagedFrames = [];
  const smallIceSummonFrames = [];
  const smallIceDamagedFrames = [];
  const smallIceBreakFrames = [];
  const damageFailFrames = [];
  const faintedFrames = [];
  const damageSuccessSmallFrames = [];
  const damageSuccessMiddleFrames = [];
  const damageSuccessBigFrames = [];
  const damageSuccessNinjuSuccessFrames = [];
  const sevenNinjuFrames = [];
  const cloneNinjuFrames = [];
  const cloneRedNinjuFrames = [];
  const cloneGreyNinjuFrames = [];
  const cloneZhaohuoNinjuFrames = [];
  const angelNinjuFrames = [];
  const mouryoNinjuFrames = [];
  const mouryoNinjuHitFrames = [];
  const chargeRedFrames = [];
  const chargeYellowFrames = [];
  const respawnPointerFrames = [];
  const moneyDartPickupFrames = [];

  const chargeDirFrames = {
    b: emptyDirectionFrames(),
    g: emptyDirectionFrames(),
  };
  const dragArrowFrames = emptyDirectionFrames();
  const movePrearriveFrames = emptyNestedFrameBuffers(movePrearriveFrameSources);
  const moveArriveFrames = emptyNestedFrameBuffers(moveArriveFrameSources);
  const useNinjuFrames = emptyFlatFrameBuffers(useNinjuFrameSources);
  const moneyDartReadyFrames = emptyFlatFrameBuffers(moneyDartReadyFrameSources);
  const moneyDartShootFrames = emptyNestedFrameBuffers(moneyDartShootFrameSources);

  const specialNinjuConfigs = {
    seven: {
      label: "七道",
      rule: "seven",
      summonFrames: sevenNinjuFrames,
      hitFrames: [],
      castSound: {
	    sound1: "sevenstart",
	    delay1: 0.0,
		sound2: "seven",
		delay2: 0.7,
		sound3: "seven",
		delay3: 0.75,
		sound4: "seven",
		delay4: 0.80,
		sound5: "seven",
		delay5: 0.85,
		sound6: "seven",
		delay6: 0.90,
		sound7: "seven",
		delay7: 0.95,
		sound8: "seven",
		delay8: 1.0,
		sound9: "seven",
		delay9: 1.05,
		sound10: "seven",
		delay10: 1.1,
		sound11: "seven",
		delay11: 1.15,
		sound12: "soulMax",
		delay12: 1.45,
	  },
      castSize: 150,
	  castBox: { x: -62, y: -75, w: 120, h: 39 },
    },
    clone: {
      label: "分身",
      rule: "clone",
      summonFrames: cloneNinjuFrames,
      hitFrames: [],
      castSize: 70,
	  castBox: { x: -84, y: -40, w: 176, h: 46 },
    },
  };

  const attackNinjuConfigs = {
    flash: {
      label: "閃光",
      rule: "flashRule",
      summonFrames: smallThunderSummonFrames,
      hitFrames: smallThunderDamagedFrames,
      castSound: "summonSmall",
      hitSound: "smallThunder",
	  outcomes: target.attackNinjuOutcomeTables?.flash,
	  castSize: 100, 
	  castBox: { x: -50, y: -70, w: 100, h: 100 },
	  damageDelayMs: 1500
    },
    wildfire: {
      label: "野火",
      rule: "wildfireRule",
      summonFrames: smallFireSummonFrames,
      hitFrames: smallFireDamagedFrames,
	  castSound: "summonSmall",
	  hitSound: {
	    sound1: "smallFire",
	    delay1: 0,
	    volume1: 0.0,
	    sound2: "firehit",
	    delay2: 1.0,
	    volume2: 0.0
	  },
	  outcomes: target.attackNinjuOutcomeTables?.wildfire,
	  castSize: 100, 
	  castBox: { x: -50, y: -70, w: 100, h: 100 },
	  damageDelayMs: 1500,
    },
    death: {
      label: "死神",
      rule: "deathRule",
      summonFrames: deathSummonFrames,
      hitFrames: deathDamagedFrames,
      castSound: "summonDeath",
      hitSound: "deathHit",
      outcomes: target.attackNinjuOutcomeTables?.death,
	  castSize: 100, 
	  castBox: { x: -50, y: -100, w: 175, h: 130 },
	  damageDelayMs: 1500,
	  hitBodyEffect: null
    },
    freeze: {
      label: "急凍",
      rule: "freezeRule",
      summonFrames: smallIceSummonFrames,
      hitFrames: smallIceDamagedFrames,
      castSound: "summonSmall",
      hitSound: "smallIce",
      holdHitLastFrame: true,
      breakEffect: "freezeBreak",
	  hitBodyEffect: null,
	  outcomes: target.attackNinjuOutcomeTables?.freeze,
	  castSize: 100, 
	  castBox: { x: -62, y: -80, w: 125, h: 125 },
	  damageDelayMs: 1500
    },
    angel: {
      label: "天使",
      rule: "angel",
      summonFrames: angelNinjuFrames,
      hitFrames: [],
      castSound: "angelNinju",
      castSize: 150,
    },
    mouryo: {
      label: "魍魎",
      rule: "mouryo",
      summonFrames: mouryoNinjuFrames,
      hitFrames: mouryoNinjuHitFrames,
      castSound: "mouryoNinju",
      hitSound: "mouryoNinju",
      castSize: 150,
    },
  };

  Object.assign(target, {
    roomBgm,
    defaultBattleBgmSrc,
    battleBgmsBySrc,
    bgmBySrc,
    defaultBattleBgm,
    images,
    sounds,
    soundSources,
    soundVolumeMultipliers,
    imageSources,
    lookDefinitions,
    baseTeamLookDefinitions,
    defUpFrameSources,
    atkUpFrameSources,
    regenHpSmallFrameSources,
    regenHpLargeFrameSources,
    consumableRegenSpFrameSources,
    consumableMagicWaterFrameSources,
    consumableMagicWaterEffectFrameSources,
    smallThunderSummonFrameSources,
    smallThunderDamagedFrameSources,
    smallFireSummonFrameSources,
    smallFireDamagedFrameSources,
    deathSummonFrameSources,
    deathDamagedFrameSources,
    smallIceSummonFrameSources,
    smallIceDamagedFrameSources,
    smallIceBreakFrameSources,
    damageFailFrameSources,
    faintedFrameSources,
    damageSuccessSmallFrameSources,
    damageSuccessMiddleFrameSources,
    damageSuccessBigFrameSources,
    damageSuccessNinjuSuccessFrameSources,
    sevenNinjuFrameSources,
    cloneNinjuFrameSources,
    cloneRedNinjuFrameSources,
    cloneGreyNinjuFrameSources,
    cloneZhaohuoNinjuFrameSources,
    angelNinjuFrameSources,
    mouryoNinjuFrameSources,
    mouryoNinjuHitFrameSources,
    chargeRedFrameSources,
    chargeYellowFrameSources,
    respawnPointerFrameSources,
    moneyDartPickupFrameSources,
    defUpFrames,
    atkUpFrames,
    regenHpSmallFrames,
    regenHpLargeFrames,
    consumableRegenSpFrames,
    consumableMagicWaterFrames,
    consumableMagicWaterEffectFrames,
    smallThunderSummonFrames,
    smallThunderDamagedFrames,
    smallFireSummonFrames,
    smallFireDamagedFrames,
    deathSummonFrames,
    deathDamagedFrames,
    smallIceSummonFrames,
    smallIceDamagedFrames,
    smallIceBreakFrames,
    damageFailFrames,
    faintedFrames,
    damageSuccessSmallFrames,
    damageSuccessMiddleFrames,
    damageSuccessBigFrames,
    damageSuccessNinjuSuccessFrames,
    sevenNinjuFrames,
    cloneNinjuFrames,
    cloneRedNinjuFrames,
    cloneGreyNinjuFrames,
    cloneZhaohuoNinjuFrames,
    angelNinjuFrames,
    mouryoNinjuFrames,
    mouryoNinjuHitFrames,
    chargeRedFrames,
    chargeYellowFrames,
    respawnPointerFrames,
    moneyDartPickupFrames,
    chargeDirFrameSources,
    chargeDirFrames,
    dragArrowFrameSources,
    dragArrowFrames,
    movePrearriveFrameSources,
    movePrearriveFrames,
    moveArriveFrameSources,
    moveArriveFrames,
    useNinjuFrameSources,
    useNinjuFrames,
    moneyDartReadyFrameSources,
    moneyDartReadyFrames,
    moneyDartShootFrameSources,
    moneyDartShootFrames,
    specialNinjuConfigs,
    attackNinjuConfigs,
  });

  target.NindouAssets = {
    defaultRoomBgmSrc,
    defaultBattleBgmSrc,
    soundSources,
    imageSources,
    lookDefinitions,
    baseTeamLookDefinitions,
    frameSourceCatalog,
    chargeDirFrameSources,
    dragArrowFrameSources,
    movePrearriveFrameSources,
    moveArriveFrameSources,
    useNinjuFrameSources,
    moneyDartReadyFrameSources,
    moneyDartShootFrameSources,
    specialNinjuConfigs,
    attackNinjuConfigs,
  };
}
