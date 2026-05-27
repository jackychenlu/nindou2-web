// Asset paths and frame buffers. Loading happens through module bootstrap now.
function createLoopingBgm(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.2; //0 to 1
  return audio;
}

const roomBgm = createLoopingBgm("assets/sounds/bgm/忍2大廳.mp3");
const defaultBattleBgmSrc = "assets/sounds/bgm/忍3鄉野.mp3";
const battleBgmsBySrc = {};

function bgmBySrc(src) {
  const key = src || defaultBattleBgmSrc;
  if (!battleBgmsBySrc[key]) battleBgmsBySrc[key] = createLoopingBgm(key);
  if (typeof musicVolumeInput !== "undefined" && musicVolumeInput) {
    battleBgmsBySrc[key].volume = Number(musicVolumeInput.value) / 100;
  }
  return battleBgmsBySrc[key];
}

const defaultBattleBgm = bgmBySrc(defaultBattleBgmSrc);

const soundSources = {
  move: "assets/sounds/ninja/normalmove.ogg",
  runOver: "assets/sounds/ninja/run_over/3.ogg",
  respawn: "assets/sounds/ninja/respawn_tips_1.ogg",
  weaponDamaged: "assets/sounds/ninja/weapon_damaged.ogg",
  death: "assets/sounds/ninja/death/1.ogg",
  slash1: "assets/sounds/weapon/1.ogg",
  slash2: "assets/sounds/weapon/2.ogg",
  slash3: "assets/sounds/weapon/3.ogg",
  slash4: "assets/sounds/weapon/4.ogg",
  slash5: "assets/sounds/weapon/5.ogg",
  slash6: "assets/sounds/weapon/6.ogg",
  slash7: "assets/sounds/weapon/7.ogg",
  slash8: "assets/sounds/weapon/8.ogg",
  slash9: "assets/sounds/weapon/9.ogg",
  slash10: "assets/sounds/weapon/10.ogg",
  slash19: "assets/sounds/weapon/19.ogg",
  slash20: "assets/sounds/weapon/20.ogg",
  slash44: "assets/sounds/weapon/44.ogg",
  slash106: "assets/sounds/weapon/106.ogg",
  useNinju: "assets/sounds/ninja/useninju.ogg",
  takeDart: "assets/sounds/ninja/takedart.ogg",
  clickItem: "assets/sounds/in_game/click_item.ogg",
  spUp: "assets/sounds/ninja/status/sp_up.ogg",
  shopMoveItem: "assets/sounds/button/purchased.ogg",
  cloneNinju: "assets/sounds/ninja/clone.ogg",
  shootDart: "assets/sounds/ninja/shootdart.ogg",
  statusEnergyUp1: "assets/sounds/ninja/status/energy_up_1.ogg",
  statusEnergyUp2: "assets/sounds/ninja/status/energy_up_2.ogg",
  regenHpSmall: "assets/sounds/ninja/status/regen_hp_s.ogg",
  regenHpLarge: "assets/sounds/ninja/status/regen_hp_l.ogg",
  summonSmall: "assets/sounds/ninja/status/summon/summon_small.ogg",
  summonDeath: "assets/sounds/ninja/status/summon/Death.ogg",
  sevenNinju: "assets/ninju/special_exports/sounds/919.mp3",
  angelNinju: "assets/ninju/special_exports/sounds/1052.mp3",
  mouryoNinju: "assets/ninju/special_exports/sounds/1002.mp3",
  smallThunder: "assets/sounds/ninja/status/damaged/small_thunder.ogg",
  smallFire: "assets/sounds/ninja/status/damaged/small_fire.ogg",
  deathHit: "assets/sounds/ninja/status/damaged/Death1.ogg",
  smallIceHit: "assets/sounds/ninja/status/damaged/small_ice_hit.ogg",
  gameStarted: "assets/sounds/in_game/game_started.ogg",
  soulLevelUp: "assets/sounds/in_game/soul/1.ogg",
  soulMax: "assets/sounds/in_game/soul/3.ogg",
  win: "assets/sounds/in_game/game_end/win.ogg",
  lose: "assets/sounds/in_game/game_end/lose.ogg",
  breakDefault: "assets/sounds/break_item/1.ogg",
  breakVase: "assets/sounds/break_item/2.ogg",
  breakChest: "assets/sounds/break_item/3.ogg",
};

const images = {};
const mapFolder = "assets/map/map/鄉野10";
const sounds = Object.fromEntries(Object.entries(soundSources).map(([key, src]) => {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = 0.2;
  return [key, audio];
}));

const aiLookDirections = ["right", "left", "up", "down"];
const aiDirectionImageNames = { right: "right", left: "left", up: "up", down: "down" };

function aiIdleImageSources(imageKeyPrefix, folderPrefix) {
  return Object.fromEntries(aiLookDirections.map((direction) => [
    `${imageKeyPrefix}${direction.replace(/^./, (letter) => letter.toUpperCase())}`,
    `assets/characters/ai/idle/${folderPrefix}_idle/${aiDirectionImageNames[direction]}.png`,
  ]));
}

function aiPrearriveFrameSources(folderPrefix, symbolGroups) {
  return Object.fromEntries(aiLookDirections.map((direction, index) => [
    direction,
    symbolGroups[index].map((symbolName) => `assets/characters/ai/prearrive/${folderPrefix}_prearrive/${symbolName}`),
  ]));
}

function aiArriveFrameSources(folderPrefix) {
  return Object.fromEntries(aiLookDirections.map((direction) => [
    direction,
    Array.from({ length: 5 }, (_, frameIndex) => `assets/characters/ai/arrive/${folderPrefix}_arrive/${direction}/${frameIndex + 1}.png`),
  ]));
}

function aiUseNinjuFrameSources(folderPrefix) {
  return Array.from({ length: 12 }, (_, index) => `assets/characters/ai/use_ninju/${folderPrefix}_use_ninju/${index + 1}.png`);
}

function aiMoneyDartReadyFrameSources(folderPrefix) {
  return aiLookDirections.map((direction) => `assets/characters/ai/dart/${folderPrefix}_dart/${aiDirectionImageNames[direction]}.png`);
}

function aiMoneyDartShootFrameSources(folderPrefix) {
  return Object.fromEntries(aiLookDirections.map((direction) => [
    direction,
    Array.from({ length: 7 }, (_, frameIndex) => `assets/characters/ai/dart_shoot/${folderPrefix}_dart_shoot/${direction}/${frameIndex + 1}.png`),
  ]));
}

const lookDefinitions = {
  default: {
    labelKey: "defaultLookOption",
    roomAvatarSrc: "assets/room/ui/b_team.png",
    roomAvatarEyeSrc: "assets/characters/parts/eyes-middle/11.png",
    drawEyes: true,
    eyeFrontImageKey: "eyesFront",
    eyeSideImageKey: "eyeSide",
    spriteSet: "blue",
    moveSet: "blue",
    useNinjuSet: "blue",
    moneyDartReadySet: "b",
    moneyDartShootSet: "b",
  },
  red: {
    labelKey: "redLookOption",
    roomAvatarSrc: "assets/characters/ai/idle/a1_idle/down.png",
    roomAvatarEyeSrc: "assets/characters/eyes/middle/57.png",
    drawEyes: true,
    eyeFrontImageKey: "redEyesFront",
    eyeSideImageKey: "redEyeSide",
    spriteSet: "redBlue",
    moveSet: "red",
    useNinjuSet: "red",
    moneyDartReadySet: "r",
    moneyDartShootSet: "r",
  },
  zhaohuo: {
    labelKey: "zhaohuoLookOption",
    roomAvatarSrc: "assets/characters/ai/idle/趙活_idle/down.png",
    roomAvatarEyeSrc: null,
    drawEyes: false,
    eyeFrontImageKey: "eyesFront",
    eyeSideImageKey: "eyeSide",
    spriteSet: "zhaohuo",
    moveSet: "zhaohuo",
    useNinjuSet: "zhaohuo",
    moneyDartReadySet: "b",
    moneyDartShootSet: "zhaohuo",
  },
};

const baseTeamLookDefinitions = {
  blue: lookDefinitions.default,
  grey: {
    roomAvatarSrc: "assets/room/ui/g_team.png",
    roomAvatarEyeSrc: "assets/characters/parts/eyes-middle/11.png",
    drawEyes: true,
    eyeFrontImageKey: "eyesFront",
    eyeSideImageKey: "eyeSide",
    spriteSet: "grey",
    moveSet: "grey",
    useNinjuSet: "grey",
    moneyDartReadySet: "g",
    moneyDartShootSet: "g",
  },
};

const imageSources = {
  bg: `${mapFolder}/bg.png`,
  arena: `${mapFolder}/arena-base.png`,
  evilCastleGround: "assets/map/極惡城/1/1.png",
  evilCastleMask: "assets/map/極惡城/1/2.png",
  evilCastle2Ground: "assets/map/極惡城/2/1.png",
  evilCastle2Mask: "assets/map/極惡城/2/2.png",
  evilCastleBlock033: "assets/map/極惡城/1/033-01.png",
  evilCastleBlock035: "assets/map/極惡城/1/035-01.png",
  evilCastleBlock036: "assets/map/極惡城/1/036-01.png",
  evilCastleDoor1: "assets/map/map/極惡城1/door-overlay.png",
  blueDown: "assets/characters/idle/blue/down.png",
  blueLeft: "assets/characters/idle/blue/left.png",
  blueRight: "assets/characters/idle/blue/right.png",
  blueUp: "assets/characters/idle/blue/up.png",
  ...aiIdleImageSources("redBlue", "a1"),
  ...aiIdleImageSources("zhaohuo", "趙活"),
  greyDown: "assets/characters/idle/grey/down.png",
  greyLeft: "assets/characters/idle/grey/left.png",
  greyRight: "assets/characters/idle/grey/right.png",
  greyUp: "assets/characters/idle/grey/up.png",
  tree: `${mapFolder}/tree.png`,
  hay: `${mapFolder}/hay.png`,
  vase: `${mapFolder}/vase.png`,
  barrel: `${mapFolder}/barrel.png`,
  chest: `${mapFolder}/chest.png`,
  flower: `${mapFolder}/flower.png`,
  rock: `${mapFolder}/rock.png`,
  stump: `${mapFolder}/stump.png`,
  flashButton: "assets/ninju/buttons/1.png",
  steelButton: "assets/ninju/buttons/2.png",
  moneyDartButton: "assets/ninju/buttons/3.png",
  healButton: "assets/ninju/buttons/4.png",
  blueIcon: "assets/ui/b_icon.png",
  greyIcon: "assets/ui/g_icon.png",
  blueTeam: "assets/ui/b_team.png",
  greyTeam: "assets/ui/g_team.png",
  soulHud1: "assets/ui/soul/1.png",
  soulHud2: "assets/ui/soul/2.png",
  soulHud3: "assets/ui/soul/3.png",
  soulHud4: "assets/ui/soul/4.png",
  soulHud5: "assets/ui/soul/5.png",
  barBackground: "assets/ui/bar/bar_background.png",
  barFrame: "assets/ui/bar/bar.png",
  barLight: "assets/ui/bar/bar_light.png",
  playerOutline: "assets/ui/playerpanel_outline.png",
  playerPointer: "assets/ui/pointer.png",
  nameBar: "assets/room/ui/name_bar.png",
  moneyPanel: "assets/ui/money_panel.png",
  itemButton: "assets/ui/item_button.png",
  ninjutsuBox: "assets/ninju/buttons/ninjutsuBox.png",
  ninjuIcon1: "assets/consumables/1.png",
  ninjuIcon2: "assets/consumables/2.png",
  ninjuIcon3: "assets/consumables/3.png",
  ninjuIcon4: "assets/consumables/4.png",
  ninjuIcon5: "assets/consumables/5.png",
  ninjuIcon6: "assets/consumables/6.png",
  backup3Item: "assets/consumables/3.png",
  sake4Item: "assets/consumables/4.png",
  chargeOuter: "assets/characters/charge/outer_moving.png",
  eyesFront: "assets/characters/parts/eyes-middle/11.png",
  eyeSide: "assets/characters/parts/eyes-look-right/11.png",
  redEyesFront: "assets/characters/eyes/middle/57.png",
  redEyeSide: "assets/characters/eyes/middle/57.png",
};

const defUpFrameSources = Array.from({ length: 31 }, (_, index) => `assets/ninju/status/def_up/${index + 1}.png`);
const defUpFrames = [];
const atkUpFrameSources = Array.from({ length: 31 }, (_, index) => `assets/ninju/status/atk_up/${index + 1}.png`);
const atkUpFrames = [];
const regenHpSmallFrameSources = Array.from({ length: 23 }, (_, index) => `assets/ninju/status/regen_hp_s/${String(index + 1).padStart(2, "0")}.png`);
const regenHpSmallFrames = [];
const regenHpLargeFrameSources = Array.from({ length: 24 }, (_, index) => `assets/ninju/status/regen_hp_l/${String(index + 1).padStart(2, "0")}.png`);
const regenHpLargeFrames = [];
const consumableRegenSpFrameSources = Array.from({ length: 16 }, (_, index) => `assets/consumables/regen_sp/${String(index + 1).padStart(2, "0")}.png`);
const consumableRegenSpFrames = [];
const smallThunderSummonFrameSources = Array.from({ length: 25 }, (_, index) => `assets/ninju/status/summon/small_thunder/${String(index + 1).padStart(2, "0")}.png`);
const smallThunderSummonFrames = [];
const smallThunderDamagedFrameSources = Array.from({ length: 36 }, (_, index) => `assets/ninju/status/damaged/small_thunder/${index + 1}.png`);
const smallThunderDamagedFrames = [];
const smallFireSummonFrameSources = Array.from({ length: 23 }, (_, index) => `assets/ninju/status/summon/small_fire/F/${String(index + 1).padStart(2, "0")}.png`);
const smallFireSummonFrames = [];
const smallFireDamagedFrameSources = Array.from({ length: 43 }, (_, index) => `assets/ninju/status/small_fire/F/${index + 1}.png`);
const smallFireDamagedFrames = [];
const deathSummonFrameSources = Array.from({ length: 42 }, (_, index) => `assets/ninju/status/summon/death/${index + 1}.png`);
const deathSummonFrames = [];
const deathDamagedFrameSources = Array.from({ length: 41 }, (_, index) => `assets/ninju/status/damaged/death/Symbol ${5990004 + index}.png`);
const deathDamagedFrames = [];
const smallIceSummonFrameSources = Array.from({ length: 23 }, (_, index) => `assets/ninju/status/summon/small_ice/${String(index + 1).padStart(2, "0")}.png`);
const smallIceSummonFrames = [];
const smallIceDamagedFrameSources = Array.from({ length: 40 }, (_, index) => `assets/ninju/status/small_ice/${index + 1}.png`);
const smallIceDamagedFrames = [];
const smallIceBreakFrameSources = Array.from({ length: 2 }, (_, index) => `assets/ninju/status/small_ice/${41 + index}.png`);
const smallIceBreakFrames = [];
const damageFailFrameSources = Array.from({ length: 10 }, (_, index) => `assets/ninju/status/damage_fail/${index + 1}.png`);
const damageFailFrames = [];
const faintedFrameSources = Array.from({ length: 34 }, (_, index) => `assets/ninju/status/fainted/${index + 1}.png`);
const faintedFrames = [];
const damageSuccessSmallFrameSources = Array.from({ length: 10 }, (_, index) => `assets/ninju/status/damage_success/small/Symbol ${3090001 + index}.png`);
const damageSuccessSmallFrames = [];
const damageSuccessMiddleFrameSources = Array.from({ length: 10 }, (_, index) => `assets/ninju/status/damage_success/middle/Symbol ${3090001 + index}.png`);
const damageSuccessMiddleFrames = [];
const damageSuccessBigFrameSources = Array.from({ length: 10 }, (_, index) => `assets/ninju/status/damage_success/big/${index + 1}.png`);
const damageSuccessBigFrames = [];
const damageSuccessNinjuSuccessFrameSources = Array.from({ length: 10 }, (_, index) => `assets/ninju/status/damage_success/norm/${index + 1}.png`);
const damageSuccessNinjuSuccessFrames = [];
const sevenNinjuFrameSources = Array.from({ length: 43 }, (_, index) => `assets/ninju/special_exports/sprites/DefineSprite_946_Seven/${index + 1}.png`);
const sevenNinjuFrames = [];
const cloneNinjuFrameSources = Array.from({ length: 40 }, (_, index) => `assets/characters/b_clone/${index + 1}.png`);
const cloneNinjuFrames = [];
const cloneRedNinjuFrameSources = Array.from({ length: 40 }, (_, index) => `assets/characters/ai/clone/a1_clone/${index + 1}.png`);
const cloneRedNinjuFrames = [];
const cloneGreyNinjuFrameSources = Array.from({ length: 40 }, (_, index) => `assets/characters/g_clone/${index + 1}.png`);
const cloneGreyNinjuFrames = [];
const angelNinjuFrameSources = Array.from({ length: 43 }, (_, index) => `assets/ninju/special_exports/sprites/DefineSprite_1049_Angel/${index + 1}.png`);
const angelNinjuFrames = [];
const mouryoNinjuFrameSources = Array.from({ length: 43 }, (_, index) => `assets/ninju/special_exports/sprites/DefineSprite_1067_Mouryou/${index + 1}.png`);
const mouryoNinjuFrames = [];
const mouryoNinjuHitFrameSources = Array.from({ length: 45 }, (_, index) => `assets/ninju/special_exports/sprites/DefineSprite_580_Dmg_Mouryou/${index + 1}.png`);
const mouryoNinjuHitFrames = [];
const specialNinjuConfigs = {
  seven: {
    label: "\u4e03\u9053",
    rule: "seven",
    summonFrames: sevenNinjuFrames,
    hitFrames: [],
    castSound: "sevenNinju",
    castSize: 150,
  },
  clone: {
    label: "\u5206\u8eab",
    rule: "clone",
    summonFrames: cloneNinjuFrames,
    hitFrames: [],
    castSize: 70,
  },
};
const attackNinjuConfigs = {
  flash: {
    label: "\u9583\u5149",
    rule: "flashRule",
    summonFrames: smallThunderSummonFrames,
    hitFrames: smallThunderDamagedFrames,
    castSound: "summonSmall",
    hitSound: "smallThunder",
  },
  wildfire: {
    label: "\u91ce\u706b",
    rule: "wildfireRule",
    summonFrames: smallFireSummonFrames,
    hitFrames: smallFireDamagedFrames,
    castSound: "summonSmall",
    hitSound: "smallFire",
    outcomes: attackNinjuOutcomeTables.wildfire,
  },
  death: {
    label: "\u6b7b\u795e",
    rule: "deathRule",
    summonFrames: deathSummonFrames,
    hitFrames: deathDamagedFrames,
    castSound: "summonDeath",
    hitSound: "deathHit",
    outcomes: attackNinjuOutcomeTables.death,
  },
  freeze: {
    label: "\u6025\u51cd",
    rule: "freezeRule",
    summonFrames: smallIceSummonFrames,
    hitFrames: smallIceDamagedFrames,
    castSound: "summonSmall",
    hitSound: "smallIceHit",
    holdHitLastFrame: true,
    breakEffect: "freezeBreak",
    hitBodyEffect: null,
    outcomes: attackNinjuOutcomeTables.freeze,
  },
  angel: {
    label: "\u5929\u4f7f",
    rule: "angel",
    summonFrames: angelNinjuFrames,
    hitFrames: [],
    castSound: "angelNinju",
    castSize: 150,
  },
  mouryo: {
    label: "\u9b4d\u9b4e",
    rule: "mouryo",
    summonFrames: mouryoNinjuFrames,
    hitFrames: mouryoNinjuHitFrames,
    castSound: "mouryoNinju",
    hitSound: "mouryoNinju",
    castSize: 150,
  },
};
const chargeRedFrameSources = Array.from({ length: 4 }, (_, index) => `assets/characters/charge/inner_fire/${index + 1}.png`);
const chargeYellowFrameSources = Array.from({ length: 4 }, (_, index) => `assets/characters/charge/inner_fire/${index + 5}.png`);
const chargeRedFrames = [];
const chargeYellowFrames = [];
// 回技角色方向素材：b/g × 4 方向 × 2 幀（1=right, 2=left, 3=up, 4=down）
const chargeDirFrameSources = {
  b: {
    right: [1, 2].map((f) => `assets/characters/b_charge/1/${f}.png`),
    left:  [1, 2].map((f) => `assets/characters/b_charge/2/${f}.png`),
    up:    [1, 2].map((f) => `assets/characters/b_charge/3/${f}.png`),
    down:  [1, 2].map((f) => `assets/characters/b_charge/4/${f}.png`),
  },
  g: {
    right: [1, 2].map((f) => `assets/characters/g_charge/1/${f}.png`),
    left:  [1, 2].map((f) => `assets/characters/g_charge/2/${f}.png`),
    up:    [1, 2].map((f) => `assets/characters/g_charge/3/${f}.png`),
    down:  [1, 2].map((f) => `assets/characters/g_charge/4/${f}.png`),
  },
};
const chargeDirFrames = {
  b: { right: [], left: [], up: [], down: [] },
  g: { right: [], left: [], up: [], down: [] },
};
const respawnPointerFrameSources = Array.from({ length: 32 }, (_, index) => `assets/characters/pointers/respawn/${index + 1}.png`);
const respawnPointerFrames = [];
const dragArrowFrameSources = {
  right: Array.from({ length: 6 }, (_, index) => `assets/characters/pointers/drag-arrow/right/${index + 1}.png`),
  left: Array.from({ length: 6 }, (_, index) => `assets/characters/pointers/drag-arrow/left/${index + 1}.png`),
  up: Array.from({ length: 6 }, (_, index) => `assets/characters/pointers/drag-arrow/up/${index + 1}.png`),
  down: Array.from({ length: 6 }, (_, index) => `assets/characters/pointers/drag-arrow/down/${index + 1}.png`),
};
const dragArrowFrames = { right: [], left: [], up: [], down: [] };

const moveDirections = aiLookDirections;
const movePrearriveFrameSources = {
  blue: Object.fromEntries(moveDirections.map((direction) => [
    direction,
    Array.from({ length: 2 }, (_, index) => `assets/characters/move/blue/prearrive/${direction}/${index + 1}.png`),
  ])),
  red: aiPrearriveFrameSources("a1", [
    ["right1.png", "right2.png"],
    ["left1.png", "left2.png"],
    ["up1.png", "up2.png"],
    ["down1.png", "down2.png"],
  ]),
  grey: Object.fromEntries(moveDirections.map((direction) => [
    direction,
    Array.from({ length: 2 }, (_, index) => `assets/characters/move/grey/prearrive/${direction}/${index + 1}.png`),
  ])),
  zhaohuo: Object.fromEntries(moveDirections.map((direction) => [
    direction,
    Array.from({ length: 2 }, (_, index) => `assets/characters/move/blue/prearrive/${direction}/${index + 1}.png`),
  ])),
};
const moveArriveFrameSources = {
  blue: Object.fromEntries(moveDirections.map((direction) => [
    direction,
    Array.from({ length: 5 }, (_, index) => `assets/characters/move/blue/arrive/${direction}/${index + 1}.png`),
  ])),
  red: aiArriveFrameSources("a1"),
  grey: Object.fromEntries(moveDirections.map((direction) => [
    direction,
    Array.from({ length: 5 }, (_, index) => `assets/characters/move/grey/arrive/${direction}/${index + 1}.png`),
  ])),
  zhaohuo: aiArriveFrameSources("趙活"),
};
const movePrearriveFrames = {
  blue: { right: [], left: [], up: [], down: [] },
  red: { right: [], left: [], up: [], down: [] },
  grey: { right: [], left: [], up: [], down: [] },
  zhaohuo: { right: [], left: [], up: [], down: [] },
};
const moveArriveFrames = {
  blue: { right: [], left: [], up: [], down: [] },
  red: { right: [], left: [], up: [], down: [] },
  grey: { right: [], left: [], up: [], down: [] },
  zhaohuo: { right: [], left: [], up: [], down: [] },
};
const useNinjuFrameSources = {
  blue: Array.from({ length: 12 }, (_, index) => `assets/characters/use-ninju/blue/${index + 1}.png`),
  red: aiUseNinjuFrameSources("a1"),
  grey: Array.from({ length: 12 }, (_, index) => `assets/characters/use-ninju/grey/${index + 1}.png`),
  zhaohuo: aiUseNinjuFrameSources("趙活"),
};
const useNinjuFrames = { blue: [], red: [], grey: [], zhaohuo: [] };

// 錢鏢備彈靜態幀（b/g_dart，4 幀對應 right/left/up/down）。
const moneyDartReadyFrameSources = {
  b: Array.from({ length: 4 }, (_, i) => `assets/characters/b_dart/${i + 1}.png`),
  r: aiMoneyDartReadyFrameSources("a1"),
  g: Array.from({ length: 4 }, (_, i) => `assets/characters/g_dart/${i + 1}.png`),
};
const moneyDartReadyFrames = { b: [], r: [], g: [] };

// 拿標起身動畫：dart 由小到完整的出現動畫（10 幀，與隊伍無關）。
const moneyDartPickupFrameSources = Array.from({ length: 10 }, (_, i) => `assets/characters/dart/${i + 1}.png`);
const moneyDartPickupFrames = [];
// 射鏢動畫，依隊伍與方向各 7 幀，按檔案順序播放。
const moneyDartShootFrameSources = {
  b: {
    right: Array.from({ length: 7 }, (_, i) => `assets/characters/b_dart_shoot/1/${i + 1}.png`),
    left:  Array.from({ length: 7 }, (_, i) => `assets/characters/b_dart_shoot/2/${i + 1}.png`),
    up:    Array.from({ length: 7 }, (_, i) => `assets/characters/b_dart_shoot/3/${i + 1}.png`),
    down:  Array.from({ length: 7 }, (_, i) => `assets/characters/b_dart_shoot/4/${i + 1}.png`),
  },
  r: aiMoneyDartShootFrameSources("a1"),
  zhaohuo: aiMoneyDartShootFrameSources("趙活"),
  g: {
    right: Array.from({ length: 7 }, (_, i) => `assets/characters/g_dart_shoot/1/${i + 1}.png`),
    left:  Array.from({ length: 7 }, (_, i) => `assets/characters/g_dart_shoot/2/${i + 1}.png`),
    up:    Array.from({ length: 7 }, (_, i) => `assets/characters/g_dart_shoot/3/${i + 1}.png`),
    down:  Array.from({ length: 7 }, (_, i) => `assets/characters/g_dart_shoot/4/${i + 1}.png`),
  },
};
const moneyDartShootFrames = {
  b: { right: [], left: [], up: [], down: [] },
  r: { right: [], left: [], up: [], down: [] },
  zhaohuo: { right: [], left: [], up: [], down: [] },
  g: { right: [], left: [], up: [], down: [] },
};

globalThis.NindouAssets = {
  defaultRoomBgmSrc: "assets/sounds/bgm/忍2大廳.mp3",
  defaultBattleBgmSrc,
  soundSources,
  imageSources,
  lookDefinitions,
  baseTeamLookDefinitions,
  frameSourceCatalog: {
    defUp: defUpFrameSources,
    atkUp: atkUpFrameSources,
    regenHpSmall: regenHpSmallFrameSources,
    regenHpLarge: regenHpLargeFrameSources,
    consumableRegenSp: consumableRegenSpFrameSources,
    smallThunderSummon: smallThunderSummonFrameSources,
    smallThunderDamaged: smallThunderDamagedFrameSources,
    smallFireSummon: smallFireSummonFrameSources,
    smallFireDamaged: smallFireDamagedFrameSources,
    deathSummon: deathSummonFrameSources,
    deathDamaged: deathDamagedFrameSources,
    smallIceSummon: smallIceSummonFrameSources,
    smallIceDamaged: smallIceDamagedFrameSources,
    smallIceBreak: smallIceBreakFrameSources,
    damageFail: damageFailFrameSources,
    fainted: faintedFrameSources,
    damageSuccessSmall: damageSuccessSmallFrameSources,
    damageSuccessMiddle: damageSuccessMiddleFrameSources,
    damageSuccessBig: damageSuccessBigFrameSources,
    damageSuccessNinjuSuccess: damageSuccessNinjuSuccessFrameSources,
    sevenNinju: sevenNinjuFrameSources,
    cloneNinju: cloneNinjuFrameSources,
    cloneRedNinju: cloneRedNinjuFrameSources,
    cloneGreyNinju: cloneGreyNinjuFrameSources,
    angelNinju: angelNinjuFrameSources,
    mouryoNinju: mouryoNinjuFrameSources,
    mouryoNinjuHit: mouryoNinjuHitFrameSources,
    chargeRed: chargeRedFrameSources,
    chargeYellow: chargeYellowFrameSources,
    respawnPointer: respawnPointerFrameSources,
    moneyDartPickup: moneyDartPickupFrameSources,
  },
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
