const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
const { contextValue, loadCombatRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("weapon ES module stays in sync with legacy weapon data", async () => {
  const context = loadCombatRules();
  const legacyWeapons = contextValue(context, "weaponDefinitions");
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "weapons.module.mjs")).href;
  const configModulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "config.module.mjs")).href;
  const weaponsModule = await import(modulePath);
  const configModule = await import(configModulePath);

  const summary = weaponsModule.summarizeWeaponCatalog(legacyWeapons);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(plain(summary.moduleMeta), plain(summary.legacyMeta));
  assert.equal(configModule.weaponCooldownMs, contextValue(context, "weaponCooldownMs"));
  assert.deepEqual(summary.moduleKeys, JSON.parse(JSON.stringify(legacyWeapons.map((weapon) => weapon.key))));
  assert.equal(summary.defaultKey, contextValue(context, "defaultWeaponKey"));
  assert.deepEqual(weaponsModule.weaponDefinitions, JSON.parse(JSON.stringify(legacyWeapons)));
  assert.deepEqual(weaponsModule.buildWeaponAttackAnimationReport(), plain(context.buildWeaponAttackAnimationReport()));
  assert.equal(weaponsModule.weaponSoundKey("weapon7"), contextValue(context, 'weaponSoundKey("weapon7")'));
  assert.equal(
    weaponsModule.weaponFrameSource(weaponsModule.weaponDefinitionForKey("weapon7"), "right", "attack", 0),
    contextValue(context, 'weaponFrameSource(weaponDefinitionForKey("weapon7"), "right", "attack", 0)'),
  );
  assert.deepEqual(
    weaponsModule.weaponAttackOffset("weapon10", "up", 100, 80),
    plain(contextValue(context, 'weaponAttackOffset("weapon10", "up", 100, 80)')),
  );
  assert.deepEqual(
    weaponsModule.weaponFrames.weapon1,
    plain(contextValue(context, "weaponFrames.weapon1")),
  );
});

test("classic weapons bridge is generated from module source", () => {
  const classicPath = path.join(repoRoot, "scripts", "data", "weapons.js");
  const classicSource = fs.readFileSync(classicPath, "utf8");

  assert.equal(classicSource.includes("// AUTO-GENERATED FILE."), true);
  assert.equal(classicSource.includes("// Run: npm run sync:weapons"), true);
  assert.equal(classicSource.includes("globalThis.NindouWeapons = {"), true);
  assert.equal(classicSource.includes("import "), false);
  assert.equal(classicSource.includes("export const "), false);
});
