const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("config ES module stays in sync with legacy config constants", async () => {
  const context = loadScripts(createGameContext(), [
    "scripts/data/config.js",
  ]);
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "config.module.mjs")).href;
  const configModule = await import(modulePath);
  const legacyConfig = contextValue(context, "globalThis.NindouConfig");
  const summary = configModule.summarizeConfigConstants(legacyConfig);

  assert.equal(summary.isSynced, true);
  assert.equal(summary.moduleResult.countdownTotalMs, contextValue(context, "countdownTotalMs"));
  assert.equal(summary.legacyResult.countdownTotalMs, contextValue(context, "countdownTotalMs"));
  assert.deepEqual(plain(summary.moduleResult.grid), plain(contextValue(context, "grid")));
  assert.deepEqual(plain(summary.legacyResult.grid), plain(contextValue(context, "grid")));
  assert.deepEqual(plain(summary.moduleResult.ui), plain(contextValue(context, "ui")));
  assert.deepEqual(plain(summary.legacyResult.ui), plain(contextValue(context, "ui")));
  assert.deepEqual(plain(summary.moduleResult.itemSlotRect), {
    x: contextValue(context, "itemSlotStartX"),
    y: contextValue(context, "itemSlotY"),
    w: contextValue(context, "itemSlotW"),
    h: contextValue(context, "itemSlotH"),
    gap: contextValue(context, "itemSlotGap"),
  });
  assert.deepEqual(plain(summary.legacyResult.itemSlotRect), {
    x: contextValue(context, "itemSlotStartX"),
    y: contextValue(context, "itemSlotY"),
    w: contextValue(context, "itemSlotW"),
    h: contextValue(context, "itemSlotH"),
    gap: contextValue(context, "itemSlotGap"),
  });
  assert.equal(configModule.weaponCooldownMs, contextValue(context, "weaponCooldownMs"));
  assert.equal(configModule.weaponDamage, contextValue(context, "weaponDamage"));
  assert.equal(configModule.objectHp, contextValue(context, "objectHp"));
  assert.equal(configModule.maxSkill, contextValue(context, "maxSkill"));
  assert.equal(configModule.holdSeconds, contextValue(context, "holdSeconds"));
  assert.equal(configModule.chargePerSecond, contextValue(context, "chargePerSecond"));
  assert.equal(configModule.respawnMs, contextValue(context, "respawnMs"));
  assert.equal(configModule.respawnPointerDuration, contextValue(context, "respawnPointerDuration"));
  assert.equal(configModule.playerUnitId, contextValue(context, "playerUnitId"));
  assert.equal(configModule.unitsPerTeam, contextValue(context, "unitsPerTeam"));
  assert.equal(configModule.aiSkillRegenPerSecond, contextValue(context, "aiSkillRegenPerSecond"));
  assert.equal(configModule.maxHp, contextValue(context, "maxHp"));
  assert.equal(configModule.collisionDamage, contextValue(context, "collisionDamage"));
  assert.equal(configModule.ARRIVE_FRAME_MS, contextValue(context, "ARRIVE_FRAME_MS"));
  assert.equal(configModule.ARRIVE_TOTAL, contextValue(context, "ARRIVE_TOTAL"));
  assert.equal(configModule.PREARRIVE_FRAME_MS, contextValue(context, "PREARRIVE_FRAME_MS"));
  assert.equal(configModule.PREARRIVE_TOTAL, contextValue(context, "PREARRIVE_TOTAL"));
  assert.deepEqual(configModule.ninjutsuRuleProfiles, plain(contextValue(context, "ninjutsuRuleProfiles")));
  assert.deepEqual(configModule.attackNinjuOutcomeTables, plain(contextValue(context, "attackNinjuOutcomeTables")));
  assert.deepEqual(configModule.moneyDartButtonRect, plain(contextValue(context, "moneyDartButtonRect")));
  assert.deepEqual(configModule.steelButtonRect, plain(contextValue(context, "steelButtonRect")));
  assert.deepEqual(configModule.hotBloodButtonRect, plain(contextValue(context, "hotBloodButtonRect")));
  assert.deepEqual(configModule.genkiButtonRect, plain(contextValue(context, "genkiButtonRect")));
  assert.deepEqual(configModule.kakkiButtonRect, plain(contextValue(context, "kakkiButtonRect")));
  assert.deepEqual(configModule.shinkiButtonRect, plain(contextValue(context, "shinkiButtonRect")));
  assert.equal(configModule.itemSlotStartX, contextValue(context, "itemSlotStartX"));
  assert.equal(configModule.itemSlotY, contextValue(context, "itemSlotY"));
  assert.equal(configModule.itemSlotW, contextValue(context, "itemSlotW"));
  assert.equal(configModule.itemSlotH, contextValue(context, "itemSlotH"));
  assert.equal(configModule.itemSlotGap, contextValue(context, "itemSlotGap"));
  assert.equal(configModule.defaultConsumableDisableMs, contextValue(context, "defaultConsumableDisableMs"));
  assert.equal(configModule.defaultConsumableInvincibleMs, contextValue(context, "defaultConsumableInvincibleMs"));
  assert.equal(configModule.sake4MoveSkillFreeMs, contextValue(context, "sake4MoveSkillFreeMs"));
  assert.equal(configModule.mapItemDropChance, contextValue(context, "mapItemDropChance"));
  assert.deepEqual(configModule.mapItemDropTypes, plain(contextValue(context, "mapItemDropTypes")));
  assert.deepEqual(configModule.mapGoldDropTypes, plain(contextValue(context, "mapGoldDropTypes")));
  assert.deepEqual(configModule.mapConsumableDropTypes, plain(contextValue(context, "mapConsumableDropTypes")));
  assert.equal(configModule.countdownTotalMs, contextValue(context, "countdownTotalMs"));
  assert.deepEqual(configModule.grid, plain(contextValue(context, "grid")));
  assert.deepEqual(configModule.battleMapDrawInset, plain(contextValue(context, "battleMapDrawInset")));
  assert.equal(configModule.defaultRoomMapKey, contextValue(context, "defaultRoomMapKey"));
  assert.deepEqual(configModule.roomMapDefinitions, plain(contextValue(context, "roomMapDefinitions")));
  assert.deepEqual(configModule.roomMapDefinitionEntries(), plain(context.roomMapDefinitionEntries()));
  assert.deepEqual(configModule.ui, plain(contextValue(context, "ui")));
  assert.deepEqual(configModule.startingAreas, plain(contextValue(context, "startingAreas")));
  assert.equal(configModule.soulCombatGainSteps, contextValue(context, "soulCombatGainSteps"));
  assert.equal(configModule.soulDeathGainSteps, contextValue(context, "soulDeathGainSteps"));
  assert.equal(configModule.ninjuChainGap, contextValue(context, "ninjuChainGap"));
  assert.equal(configModule.ninjuChainMaxGap, contextValue(context, "ninjuChainMaxGap"));
});

test("config bridge section is generated from module workflow", () => {
  const fs = require("node:fs");
  const configText = fs.readFileSync(path.join(repoRoot, "scripts", "data", "config.js"), "utf8");
  assert.equal(configText.includes("// NINDOU_CONFIG_BRIDGE_START"), true);
  assert.equal(configText.includes("// NINDOU_CONFIG_BRIDGE_END"), true);
  assert.equal(configText.includes("Run: npm run sync:config-nindou"), true);
});
