const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, loadCoreRules, plain } = require("./helpers/script-loader");

test("modified 模式使用調整後的武器與忍術數值", () => {
  const context = loadCoreRules({ state: { deathModeKey: "death_command" } });

  assert.equal(context.currentRuleModeKey(), "modified");
  assert.equal(context.weaponDamageForMode("weapon4", 999), 40);
  assert.equal(context.weaponDamageForMode("unknown", 33), 33);
  assert.deepEqual(plain(context.steelRule()), {
    cost: 6,
    castDurationMs: 1500,
    durationMs: 15000,
    defenseMultiplier: 1.7,
  });
  assert.equal(context.moneyDartRule().damage, 70);
  assert.equal(context.moneyDartRule().cost, 0);
  assert.equal(context.moneyDartRule().readyMs, 200);
  assert.equal("speed" in context.moneyDartRule(), false);
  assert.equal(context.attackNinjuRule("flash").cost, 0);
  assert.equal(context.attackNinjuRule("wildfire").cost, 0);
  assert.equal(context.attackNinjuRule("angel").damage, 100);
  assert.equal(context.attackNinjuRule("mouryo").damage, 145);
  assert.equal(context.specialNinjuRule("seven").damage, 130);
  assert.equal(context.specialNinjuRule("clone").cost, 10);
  assert.equal(context.healNinjuRule("kakki").cost, 6);
  assert.equal(context.healNinjuRule("genki").effect, "steelNoDefense");
  assert.equal(context.healNinjuRule("genki").available, false);
  assert.equal(context.healNinjuRule("kakki").available, false);
  assert.equal(context.healNinjuRule("shinki").available, false);
});

test("original 模式使用原版覆蓋數值", () => {
  const context = loadCoreRules({ state: { useOriginalMode: true } });

  assert.equal(context.currentRuleModeKey(), "original");
  assert.equal(context.weaponDamageForMode("weapon4", 999), 50);
  assert.equal(context.weaponDamageForMode("weapon6", 999), 25);
  assert.equal(context.steelRule().cost, 6);
  assert.equal(context.steelRule().defenseMultiplier, 2);
  assert.equal(context.hotBloodRule().cost, 6);
  assert.equal(context.moneyDartRule().damage, 100);
});

test("預設絕命模式是絕命回血", () => {
  const context = loadCoreRules({ state: { units: [], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] } });

  assert.equal(context.currentDeathModeKey(), "death_heal");
  assert.equal(context.healNinjuRule("kakki").available, true);
  assert.equal(context.healNinjuRule("shinki").available, true);
});

test("極惡城地圖使用專屬戰鬥配樂", () => {
  const context = loadCombatRules({ state: { roomMapKey: "evil-castle-1", units: [], objects: [], projectiles: [], moneyDartCasts: [] } });

  assert.equal(
    plain(context.currentRoomMapDefinition()).battleBgmSrc,
    "assets/sounds/bgm/忍2鬼島戰鬥.mp3"
  );
});
