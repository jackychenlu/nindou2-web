const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, plain } = require("./helpers/script-loader");

test("所有武器的揮砍動畫總時長都等於各自 cooldownMs", () => {
  const context = loadCombatRules();
  const report = plain(context.buildWeaponAttackAnimationReport());

  for (const row of report) {
    assert.equal(
      row.animationDurationMs,
      row.cooldownMs,
      `${row.key} 動畫時長應等於 cooldownMs`,
    );
  }
});

test("極冰鬼切丸的揮砍動畫總時長是 1000ms", () => {
  const context = loadCombatRules();

  assert.equal(context.weaponAttackAnimationDurationMs("weapon7"), 1000);
  assert.equal(context.weaponAttackFrameDurationMs("weapon7"), 1000 / 22);
});

test("playSlash 產生的實際攻擊動畫 duration 會套用武器動畫時長", () => {
  const context = loadCombatRules({
    performance: { now: () => 4321 },
    directionFromTarget: () => ({ name: "right" }),
  });

  const attacker = { id: 1, x: 5, y: 5, facing: "right", weaponKey: "weapon7" };
  const target = { x: 6, y: 5 };

  context.playSlash(attacker, target);

  const attack = plain(context.state.attacks[0]);
  assert.equal(attack.duration, 1000);
  assert.equal(attack.startedAt, 4321);
  assert.equal(attack.direction, "right");
});

test("武器素材路徑與音效 key 由武器資料層提供", () => {
  const context = loadCombatRules();
  const weapon = context.weaponDefinitionForKey("weapon7");

  assert.equal(context.weaponFrameSource(weapon, "right", "attack", 0), `assets/weapon/${weapon.folder}/right_attack/1.png`);
  assert.equal(context.weaponSoundKey("weapon7"), "slash7");
  assert.equal(context.slashSoundKeyForWeapon("weapon7"), "slash7");
});

test("武器 attack 與 hand 視覺參數由武器資料層提供", () => {
  const context = loadCombatRules();

  assert.equal(context.weaponAttackScale("weapon4"), 0.5);
  assert.equal(context.weaponHandScale("weapon6"), 0.72);
  assert.deepEqual(plain(context.weaponAttackOffset("weapon10", "up", 100, 80)), { x: -75, y: 60 });
  assert.deepEqual(plain(context.weaponHandOffset("weapon8", "left", 100, 80)), { x: -22, y: 88 });
});
