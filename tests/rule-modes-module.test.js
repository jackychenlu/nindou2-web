const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, loadCoreRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("rule mode ES module stays in sync with legacy rule mode behavior", async () => {
  const context = loadCoreRules({ state: { deathModeKey: "death_command" } });
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "rule-modes.module.mjs")).href;
  const ruleModesModule = await import(modulePath);

  const summary = ruleModesModule.summarizeRuleModeProfiles(contextValue(context, "modeRuleProfiles"));

  assert.equal(summary.isSynced, true);
  assert.deepEqual(summary.moduleWeaponKeysByMode.modified, ["weapon4", "weapon6", "weapon7", "weapon8"]);
  assert.deepEqual(plain(summary.legacyWeaponKeysByMode.modified), ["weapon4", "weapon6", "weapon7", "weapon8"]);
  assert.deepEqual(summary.moduleNinjutsuKeysByMode.modified, Object.keys(ruleModesModule.modeRuleProfiles.modified.ninjutsu));
  assert.deepEqual(plain(summary.legacyNinjutsuKeysByMode.modified), Object.keys(ruleModesModule.modeRuleProfiles.modified.ninjutsu));
  assert.deepEqual(ruleModesModule.modeRuleProfiles.modified.weapons, plain(contextValue(context, "modeRuleProfiles.modified.weapons")));
  assert.equal(ruleModesModule.currentRuleModeKey({ deathModeKey: "death_command" }), context.currentRuleModeKey());
  assert.equal(ruleModesModule.weaponDamageForMode("weapon4", 999, { deathModeKey: "death_command" }), context.weaponDamageForMode("weapon4", 999));
  assert.deepEqual(ruleModesModule.steelRule({ deathModeKey: "death_command" }), plain(context.steelRule()));
  assert.deepEqual(ruleModesModule.moneyDartRule({ deathModeKey: "death_command" }), plain(context.moneyDartRule()));
  assert.deepEqual(ruleModesModule.attackNinjuRule("angel", { deathModeKey: "death_command" }), plain(context.attackNinjuRule("angel")));
  assert.deepEqual(ruleModesModule.healNinjuRule("genki", { deathModeKey: "death_command" }), plain(context.healNinjuRule("genki")));
  assert.equal(ruleModesModule.healNinjuRule("genki", { deathModeKey: "death_command" }).available, false);
  assert.equal(ruleModesModule.healNinjuRule("kakki", { deathModeKey: "death_command" }).available, false);
  assert.equal(ruleModesModule.healNinjuRule("shinki", { deathModeKey: "death_command" }).available, false);
  assert.deepEqual(plain(context.flashRule()), plain(context.attackNinjuRule("flash")));
  assert.deepEqual(plain(context.wildfireRule()), plain(context.attackNinjuRule("wildfire")));
  assert.deepEqual(plain(context.deathRule()), plain(context.attackNinjuRule("death")));
  assert.deepEqual(plain(context.freezeRule()), plain(context.attackNinjuRule("freeze")));
});

test("rule mode ES module matches original and death-heal legacy behavior", async () => {
  const original = loadCoreRules({ state: { useOriginalMode: true } });
  const deathHeal = loadCoreRules({ state: { units: [], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] } });
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "rule-modes.module.mjs")).href;
  const ruleModesModule = await import(modulePath);

  assert.equal(ruleModesModule.currentRuleModeKey({ useOriginalMode: true }), original.currentRuleModeKey());
  assert.equal(ruleModesModule.weaponDamageForMode("weapon6", 999, { useOriginalMode: true }), original.weaponDamageForMode("weapon6", 999));
  assert.deepEqual(ruleModesModule.steelRule({ useOriginalMode: true }), plain(original.steelRule()));
  assert.equal(ruleModesModule.currentDeathModeKey({}), deathHeal.currentDeathModeKey());
  assert.deepEqual(ruleModesModule.healNinjuRule("kakki", {}), plain(deathHeal.healNinjuRule("kakki")));
});
