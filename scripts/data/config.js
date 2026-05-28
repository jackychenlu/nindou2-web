// Shared gameplay constants. Keep this file data-only so it can move to Phaser later.

// NINDOU_CONFIG_BRIDGE_START
// AUTO-GENERATED SECTION.
// Source: scripts/data/config.module.mjs
// Run: npm run sync:config-nindou
const ninjutsuRuleProfiles = {
  "modified": {
    "moneyDart": {
      "cost": 0,
      "damage": 70,
      "readyMs": 200,
      "postThrowNinjuLockMs": 200
    },
    "steel": {
      "cost": 6,
      "castDurationMs": 1500,
      "durationMs": 15000,
      "defenseMultiplier": 1.7
    },
    "hotBlood": {
      "cost": 6,
      "castDurationMs": 1500,
      "durationMs": 15000,
      "weaponDamageMultiplier": 2
    },
    "genki": {
      "cost": 2,
      "castDurationMs": 1500,
      "healAmount": 0,
      "effect": "steelNoDefense"
    },
    "kakki": {
      "available": false,
      "cost": 6,
      "castDurationMs": 1500,
      "healAmount": 100,
      "effect": "selfHeal"
    },
    "shinki": {
      "available": false,
      "cost": 10,
      "castDurationMs": 1500,
      "healAmount": 100,
      "effect": "teamHeal"
    },
    "flash": {
      "cost": 0,
      "castDurationMs": 1500,
      "hitChance": 0.6,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "wildfire": {
      "cost": 0,
      "castDurationMs": 1500,
      "hitChance": 0.6,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "death": {
      "cost": 7,
      "castDurationMs": 1500,
      "hitChance": 0.6,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "freeze": {
      "cost": 7,
      "castDurationMs": 1500,
      "hitChance": 0.35,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 10000
    },
    "angel": {
      "cost": 7,
      "castDurationMs": 1720,
      "hitChance": 0.6,
      "damage": 100,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "mouryo": {
      "cost": 7,
      "castDurationMs": 1720,
      "hitChance": 0.6,
      "damage": 145,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "seven": {
      "cost": 7,
      "castDurationMs": 1720,
      "damage": 130
    },
    "clone": {
      "cost": 10,
      "castDurationMs": 1600
    }
  },
  "original": {
    "moneyDart": {
      "cost": 0,
      "damage": 100,
      "readyMs": 200,
      "postThrowNinjuLockMs": 200
    },
    "steel": {
      "cost": 6,
      "castDurationMs": 1500,
      "durationMs": 15000,
      "defenseMultiplier": 2
    },
    "hotBlood": {
      "cost": 6,
      "castDurationMs": 1500,
      "durationMs": 15000,
      "weaponDamageMultiplier": 2
    },
    "genki": {
      "available": false,
      "cost": 3,
      "castDurationMs": 1500,
      "healAmount": 50,
      "effect": "selfHeal"
    },
    "kakki": {
      "available": false,
      "cost": 6,
      "castDurationMs": 1500,
      "healAmount": 100,
      "effect": "selfHeal"
    },
    "shinki": {
      "available": false,
      "cost": 10,
      "castDurationMs": 1500,
      "healAmount": 100,
      "effect": "teamHeal"
    },
    "flash": {
      "cost": 0,
      "castDurationMs": 1500,
      "hitChance": 0.3,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "wildfire": {
      "cost": 0,
      "castDurationMs": 1500,
      "hitChance": 0.6,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "death": {
      "cost": 7,
      "castDurationMs": 1500,
      "hitChance": 0.6,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "freeze": {
      "cost": 7,
      "castDurationMs": 1500,
      "hitChance": 0.35,
      "damage": 50,
      "missDisableMs": 1500,
      "hitDisableMs": 10000
    },
    "angel": {
      "cost": 7,
      "castDurationMs": 1720,
      "hitChance": 0.6,
      "damage": 100,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "mouryo": {
      "cost": 7,
      "castDurationMs": 1720,
      "hitChance": 0.6,
      "damage": 145,
      "missDisableMs": 1500,
      "hitDisableMs": 3500
    },
    "seven": {
      "cost": 7,
      "castDurationMs": 1720,
      "damage": 130
    },
    "clone": {
      "cost": 10,
      "castDurationMs": 1600
    }
  }
};
const attackNinjuOutcomeTables = {
  "wildfire": [
    {
      "chance": 0.3,
      "damage": 50,
      "headEffect": "flashHitHead"
    },
    {
      "chance": 0.2,
      "damage": 100,
      "headEffect": "wildfireMiddleHitHead"
    }
  ],
  "death": [
    {
      "chance": 0,
      "damage": 9999,
      "headEffect": "flashHitHead"
    },
    {
      "chance": 0,
      "damage": 9999,
      "headEffect": "deathMiddleHitHead"
    },
    {
      "chance": 0,
      "damage": 9999,
      "headEffect": "deathBigHitHead"
    },
    {
      "chance": 0.08,
      "damage": 9999,
      "headEffect": "deathNinjuSuccess"
    }
  ],
  "freeze": [
    {
      "chance": 0.35,
      "damage": 50,
      "headEffect": "flashHitHead",
      "hitDisableMs": 10000
    }
  ]
};
const moneyDartButtonRect = {
  "x": 508,
  "y": 600,
  "w": 65,
  "h": 30
};
const steelButtonRect = {
  "x": 582,
  "y": 600,
  "w": 65,
  "h": 30
};
const hotBloodButtonRect = {
  "x": 656,
  "y": 600,
  "w": 65,
  "h": 30
};
const genkiButtonRect = {
  "x": 730,
  "y": 600,
  "w": 65,
  "h": 30
};
const kakkiButtonRect = {
  "x": 804,
  "y": 600,
  "w": 65,
  "h": 30
};
const shinkiButtonRect = {
  "x": 878,
  "y": 600,
  "w": 65,
  "h": 30
};
const mapItemDropTypes = [
  "chest",
  "vase",
  "barrel",
  "hay"
];
const mapGoldDropTypes = [
  "hay"
];
const mapConsumableDropTypes = [
  "backup3",
  "sake4"
];
const ui = {
  "top": 0,
  "bottomTop": 542,
  "bottomHeight": 138,
  "leftPanelW": 446,
  "midX": 446
};
const startingAreas = {
  "blue": {
    "xMin": 2,
    "xMax": 3,
    "yMin": 3,
    "yMax": 7
  },
  "grey": {
    "xMin": 16,
    "xMax": 17,
    "yMin": 3,
    "yMax": 7
  }
};
const grid = {
  "cols": 22,
  "rows": 12,
  "cell": 44.5,
  "left": -9,
  "top": 5
};
const battleMapDrawInset = {
  "left": 5,
  "top": 5,
  "right": 5,
  "bottom": 5
};
const defaultRoomMapKey = "country-10";
const roomMapDefinitions = {
  "country-10": {
    "label": "鄉野之十",
    "groundImageKey": "arena",
    "fallbackImageKey": "bg",
    "objectLayout": "country-10",
    "coordinateBottomInternalY": 10,
    "playableInternalYMin": 1,
    "playableInternalYMax": 10
  },
  "evil-castle-1": {
    "label": "極惡城之一",
    "groundImageKey": "evilCastleGround",
    "maskImageKey": "evilCastleMask",
    "battleBgmSrc": "assets/sounds/bgm/忍2鬼島戰鬥.mp3",
    "objectLayout": "evil-castle-1",
    "coordinateBottomInternalY": 11,
    "playableInternalYMin": 2,
    "playableInternalYMax": 11,
    "blockedDisplayCells": [
      "1,1",
      "18,1",
      "1,10",
      "18,10",
      "1,18",
      "18,18"
    ],
    "startingDisplayCellsBySlot": {
      "blue": {
        "1": {
          "x": 9,
          "y": 3
        },
        "2": {
          "x": 8,
          "y": 1
        },
        "3": {
          "x": 9,
          "y": 1
        },
        "4": {
          "x": 10,
          "y": 1
        }
      },
      "grey": {
        "1": {
          "x": 6,
          "y": 9
        },
        "2": {
          "x": 8,
          "y": 8
        },
        "3": {
          "x": 11,
          "y": 8
        },
        "4": {
          "x": 13,
          "y": 9
        }
      }
    }
  },
  "evil-castle-2": {
    "label": "極惡城之二",
    "groundImageKey": "evilCastle2Ground",
    "maskImageKey": "evilCastle2Mask",
    "battleBgmSrc": "assets/sounds/bgm/忍2鬼島戰鬥.mp3",
    "objectLayout": "evil-castle-2",
    "coordinateBottomInternalY": 11,
    "playableInternalYMin": 2,
    "playableInternalYMax": 11,
    "blockedDisplayCells": [
      "1,1",
      "18,1",
      "1,10",
      "18,10",
      "1,18",
      "18,18"
    ],
    "startingDisplayCellsBySlot": {
      "blue": {
        "1": {
          "x": 9,
          "y": 3
        },
        "2": {
          "x": 8,
          "y": 1
        },
        "3": {
          "x": 9,
          "y": 1
        },
        "4": {
          "x": 10,
          "y": 1
        }
      },
      "grey": {
        "1": {
          "x": 6,
          "y": 9
        },
        "2": {
          "x": 8,
          "y": 8
        },
        "3": {
          "x": 11,
          "y": 8
        },
        "4": {
          "x": 13,
          "y": 9
        }
      }
    }
  }
};
const itemSlotStartX = 510;
const itemSlotY = 558;
const itemSlotW = 38;
const itemSlotH = 34;
const itemSlotGap = 6;
const defaultConsumableDisableMs = 1500;
const defaultConsumableInvincibleMs = 1500;
const sake4MoveSkillFreeMs = 15000;
const mapItemDropChance = 0.4;
const countdownTotalMs = 2500;
const soulCombatGainSteps = 5.4;
const soulDeathGainSteps = 27;
const ninjuChainGap = 500;
const ninjuChainMaxGap = 500;
const weaponCooldownMs = 1000;
const weaponDamage = 50;
const objectHp = 100;
const maxSkill = 18;
const tachiMasterSkillMax = 18;
const soulStepsPerLevel = 27;
const soulMaxLevel = 4;
const ninjuFollowupMoveAllowance = 3;
const holdSeconds = 0;
const chargePerSecond = 2.769230769230769;
const respawnMs = 3000;
const respawnPointerDuration = 1000;
const playerUnitId = 1;
const unitsPerTeam = 3;
const aiSkillRegenPerSecond = 0.42;
const maxHp = 300;
const collisionDamage = 40;
const ARRIVE_FRAME_MS = 65;
const ARRIVE_TOTAL = 325;
const PREARRIVE_FRAME_MS = 70;
const PREARRIVE_TOTAL = 140;
function roomMapDefinitionEntries() {
  return Object.entries(roomMapDefinitions);
}

globalThis.NindouConfig = {
  weaponCooldownMs,
  weaponDamage,
  objectHp,
  maxSkill,
  tachiMasterSkillMax,
  soulStepsPerLevel,
  soulMaxLevel,
  ninjuFollowupMoveAllowance,
  countdownTotalMs,
  grid,
  battleMapDrawInset,
  defaultRoomMapKey,
  roomMapDefinitions,
  ui,
  startingAreas,
  itemSlotStartX,
  itemSlotY,
  itemSlotW,
  itemSlotH,
  itemSlotGap,
  ninjutsuRuleProfiles,
};
// NINDOU_CONFIG_BRIDGE_END
