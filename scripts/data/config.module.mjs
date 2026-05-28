// Keep this module small while the runtime still uses classic scripts.
export const grid = {
  cols: 22,
  rows: 12,
  cell: 44.5,
  left: -9,
  top: 5,
};
export const battleMapDrawInset = {
  left: 5,
  top: 5,
  right: 5,
  bottom: 5,
};
export const defaultRoomMapKey = "country-10";
export const roomMapDefinitions = {
  "country-10": {
    label: "鄉野之十",
    groundImageKey: "arena",
    fallbackImageKey: "bg",
    objectLayout: "country-10",
    coordinateBottomInternalY: 10,
    playableInternalYMin: 1,
    playableInternalYMax: 10,
  },
  "evil-castle-1": {
    label: "極惡城之一",
    groundImageKey: "evilCastleGround",
    maskImageKey: "evilCastleMask",
    battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3",
    objectLayout: "evil-castle-1",
    coordinateBottomInternalY: 11,
    playableInternalYMin: 2,
    playableInternalYMax: 11,
    blockedDisplayCells: ["1,1", "18,1", "1,10", "18,10", "1,18", "18,18"],
    startingDisplayCellsBySlot: {
      blue: {
        1: { x: 9, y: 3 },
        2: { x: 8, y: 1 },
        3: { x: 9, y: 1 },
        4: { x: 10, y: 1 },
      },
      grey: {
        1: { x: 6, y: 9 },
        2: { x: 8, y: 8 },
        3: { x: 11, y: 8 },
        4: { x: 13, y: 9 },
      },
    },
  },
  "evil-castle-2": {
    label: "極惡城之二",
    groundImageKey: "evilCastle2Ground",
    maskImageKey: "evilCastle2Mask",
    battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3",
    objectLayout: "evil-castle-2",
    coordinateBottomInternalY: 11,
    playableInternalYMin: 2,
    playableInternalYMax: 11,
    blockedDisplayCells: ["1,1", "18,1", "1,10", "18,10", "1,18", "18,18"],
    startingDisplayCellsBySlot: {
      blue: {
        1: { x: 9, y: 3 },
        2: { x: 8, y: 1 },
        3: { x: 9, y: 1 },
        4: { x: 10, y: 1 },
      },
      grey: {
        1: { x: 6, y: 9 },
        2: { x: 8, y: 8 },
        3: { x: 11, y: 8 },
        4: { x: 13, y: 9 },
      },
    },
  },
};
export function roomMapDefinitionEntries() {
  return Object.entries(roomMapDefinitions);
}

export const weaponCooldownMs = 1000;
export const weaponDamage = 50;
export const objectHp = 100;
export const maxSkill = 18;
export const tachiMasterSkillMax = 18;
export const holdSeconds = 0;
export const chargePerSecond = 18 / 6.5;
export const respawnMs = 3000;
export const respawnPointerDuration = 1000;
export const playerUnitId = 1;
export const unitsPerTeam = 3;
export const aiSkillRegenPerSecond = 0.42;
export const maxHp = 300;
export const collisionDamage = 40;
export const ARRIVE_FRAME_MS = 65;
export const ARRIVE_TOTAL = ARRIVE_FRAME_MS * 5;
export const PREARRIVE_FRAME_MS = 70;
export const PREARRIVE_TOTAL = PREARRIVE_FRAME_MS * 2;
export const soulStepsPerLevel = 27;
export const soulMaxLevel = 4;
export const ninjuFollowupMoveAllowance = 3;
export const soulCombatGainSteps = soulStepsPerLevel / 5;
export const soulDeathGainSteps = soulStepsPerLevel;
export const ninjuChainGap = 500;
export const ninjuChainMaxGap = 500;
export const moneyDartButtonRect = { x: 508, y: 600, w: 65, h: 30 };
export const steelButtonRect = { x: 582, y: 600, w: 65, h: 30 };
export const hotBloodButtonRect = { x: 656, y: 600, w: 65, h: 30 };
export const genkiButtonRect = { x: 730, y: 600, w: 65, h: 30 };
export const kakkiButtonRect = { x: 804, y: 600, w: 65, h: 30 };
export const shinkiButtonRect = { x: 878, y: 600, w: 65, h: 30 };
export const itemSlotStartX = 510;
export const itemSlotY = 558;
export const itemSlotW = 38;
export const itemSlotH = 34;
export const itemSlotGap = 6;
export const defaultConsumableDisableMs = 1500;
export const defaultConsumableInvincibleMs = 1500;
export const sake4MoveSkillFreeMs = 15000;
export const mapItemDropChance = 1;
export const mapItemDropTypes = ["chest", "vase"];
export const mapGoldDropTypes = ["hay", "barrel", "flower", "stump"];
export const mapConsumableDropTypes = ["backup3", "sake4"];
export const countdownTotalMs = 2500;
export const ui = {
  top: 0,
  bottomTop: 542,
  bottomHeight: 138,
  leftPanelW: 446,
  midX: 446,
};
export const startingAreas = {
  blue: { xMin: 2, xMax: 3, yMin: 3, yMax: 7 },
  grey: { xMin: 16, xMax: 17, yMin: 3, yMax: 7 },
};

export const ninjutsuRuleProfiles = {
  modified: {
    moneyDart: {
      cost: 0,
      damage: 70,
      readyMs: 200,
      postThrowNinjuLockMs: 200,
    },
    steel: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      defenseMultiplier: 1.7,
    },
    hotBlood: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      weaponDamageMultiplier: 2,
    },
    genki: {
      cost: 2,
      castDurationMs: 1500,
      healAmount: 0,
      effect: "steelNoDefense",
    },
    kakki: {
      available: false,
      cost: 6,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "selfHeal",
    },
    shinki: {
      available: false,
      cost: 10,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "teamHeal",
    },
    flash: {
      cost: 0, // 閃光
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    wildfire: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    death: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    freeze: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.35,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 10000,
    },
    angel: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 100,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    mouryo: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 145,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    seven: {
      cost: 7,
      castDurationMs: 1720,
      damage: 130,
    },
    clone: {
      cost: 10,
      castDurationMs: 1600,
    },
  },
  original: {
    moneyDart: {
      cost: 0,
      damage: 100,
      readyMs: 250,
      postThrowNinjuLockMs: 250,
    },
    steel: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      defenseMultiplier: 2,
    },
    hotBlood: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      weaponDamageMultiplier: 2,
    },
    genki: {
      available: false,
      cost: 3,
      castDurationMs: 1500,
      healAmount: 50,
      effect: "selfHeal",
    },
    kakki: {
      available: false,
      cost: 6,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "selfHeal",
    },
    shinki: {
      available: false,
      cost: 10,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "teamHeal",
    },
    flash: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.3,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    wildfire: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    death: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    freeze: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.35,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 10000,
    },
    angel: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 100,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    mouryo: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 145,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    seven: {
      cost: 7,
      castDurationMs: 1720,
      damage: 130,
    },
    clone: {
      cost: 10,
      castDurationMs: 1600,
    },
  },
};

export const attackNinjuOutcomeTables = {
  wildfire: [
    { chance: 0.3, damage: 50, headEffect: "flashHitHead" },
    { chance: 0.2, damage: 100, headEffect: "wildfireMiddleHitHead" },
  ],
  death: [
    { chance: 0.0, damage: 99999, headEffect: "flashHitHead" },
    { chance: 0.0, damage: 99999, headEffect: "deathMiddleHitHead" },
    { chance: 0.0, damage: 99999, headEffect: "deathBigHitHead" },
    { chance: 0.1, damage: 99999, headEffect: "deathNinjuSuccess" },
  ],
  freeze: [
    { chance: 0.35, damage: 50, headEffect: "deathNinjuSuccess", hitDisableMs: 10000 },
  ],
};

export function summarizeConfigConstants(legacy = {}) {
  const moduleResult = {
    weaponCooldownMs,
    weaponDamage,
    objectHp,
    maxSkill,
    tachiMasterSkillMax,
    soulStepsPerLevel,
    soulMaxLevel,
    ninjuFollowupMoveAllowance,
    ninjutsuModes: Object.keys(ninjutsuRuleProfiles),
    modifiedNinjutsuKeys: Object.keys(ninjutsuRuleProfiles.modified || {}),
    originalNinjutsuKeys: Object.keys(ninjutsuRuleProfiles.original || {}),
    countdownTotalMs,
    grid,
    battleMapDrawInset,
    defaultRoomMapKey,
    roomMapKeys: Object.keys(roomMapDefinitions),
    ui,
    startingAreas,
    itemSlotRect: {
      x: itemSlotStartX,
      y: itemSlotY,
      w: itemSlotW,
      h: itemSlotH,
      gap: itemSlotGap,
    },
  };
  const legacyResult = {
    weaponCooldownMs: legacy.weaponCooldownMs,
    weaponDamage: legacy.weaponDamage,
    objectHp: legacy.objectHp,
    maxSkill: legacy.maxSkill,
    tachiMasterSkillMax: legacy.tachiMasterSkillMax,
    soulStepsPerLevel: legacy.soulStepsPerLevel,
    soulMaxLevel: legacy.soulMaxLevel,
    ninjuFollowupMoveAllowance: legacy.ninjuFollowupMoveAllowance,
    ninjutsuModes: Object.keys(legacy.ninjutsuRuleProfiles || {}),
    modifiedNinjutsuKeys: Object.keys(legacy.ninjutsuRuleProfiles?.modified || {}),
    originalNinjutsuKeys: Object.keys(legacy.ninjutsuRuleProfiles?.original || {}),
    countdownTotalMs: legacy.countdownTotalMs,
    grid: legacy.grid,
    battleMapDrawInset: legacy.battleMapDrawInset,
    defaultRoomMapKey: legacy.defaultRoomMapKey,
    roomMapKeys: Object.keys(legacy.roomMapDefinitions || {}),
    ui: legacy.ui,
    startingAreas: legacy.startingAreas,
    itemSlotRect: {
      x: legacy.itemSlotStartX,
      y: legacy.itemSlotY,
      w: legacy.itemSlotW,
      h: legacy.itemSlotH,
      gap: legacy.itemSlotGap,
    },
  };
  return {
    moduleResult,
    legacyResult,
    isSynced: JSON.stringify(moduleResult) === JSON.stringify(legacyResult),
  };
}

