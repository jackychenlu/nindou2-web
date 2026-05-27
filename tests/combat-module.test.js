const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, loadCombatRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

const dirs = {
  up: { name: "up", dx: 0, dy: -1 },
  right: { name: "right", dx: 1, dy: 0 },
};

test("combat ES module stays in sync with legacy combat helpers", async () => {
  const context = loadCombatRules({
    performance: { now: () => 1000 },
  });
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "systems", "combat.module.mjs")).href;
  const combatModule = await import(modulePath);
  const legacyCombat = contextValue(context, "globalThis.NindouCombat");
  const summary = combatModule.summarizeCombatHelpers(legacyCombat);

  assert.equal(summary.isSynced, true);
  assert.equal(combatModule.unitWeaponDamage({ weaponKey: "weapon4" }), context.unitWeaponDamage({ weaponKey: "weapon4" }));
  assert.equal(combatModule.unitWeaponDamage({ weaponKey: "weapon4" }, { stateLike: { useOriginalMode: true } }), 50);
  assert.equal(combatModule.unitWeaponDamage({ weaponKey: "weapon4", hotBloodUntil: 2000 }, { now: 1000 }), 80);
  assert.equal(combatModule.defendedDamage({ steelUntil: 2000 }, 170, { now: 1000 }), 100);
  assert.deepEqual(
    combatModule.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon20" }, dirs.right),
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon20" }, dirs.right)),
  );
  assert.deepEqual(
    combatModule.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon8" }, dirs.up),
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon8" }, dirs.up)),
  );
  assert.equal(combatModule.slashSoundKeyForWeapon("weapon20"), context.slashSoundKeyForWeapon("weapon20"));
});
