const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, plain } = require("./helpers/script-loader");

const dirs = {
  up: { name: "up", dx: 0, dy: -1 },
  right: { name: "right", dx: 1, dy: 0 },
};

test("武器傷害會依規則模式切換", () => {
  const modified = loadCombatRules();
  const original = loadCombatRules({ state: { useOriginalMode: true, units: [], objects: [] } });

  assert.equal(modified.unitWeaponDamage({ weaponKey: "weapon4" }), 40);
  assert.equal(original.unitWeaponDamage({ weaponKey: "weapon4" }), 50);
  assert.equal(modified.unitWeaponDamage({ weaponKey: "weapon6" }), 13);
  assert.equal(original.unitWeaponDamage({ weaponKey: "weapon6" }), 25);
});

test("熱血狀態會套用武器傷害倍率", () => {
  const context = loadCombatRules({
    performance: { now: () => 1000 },
  });

  assert.equal(context.unitWeaponDamage({ weaponKey: "weapon4", hotBloodUntil: 2000 }), 80);
  assert.equal(context.unitWeaponDamage({ weaponKey: "weapon4", hotBloodUntil: 500 }), 40);
});

test("鋼鐵狀態會降低受到的傷害", () => {
  const context = loadCombatRules({
    performance: { now: () => 1000 },
  });

  assert.equal(context.defendedDamage({ steelUntil: 2000 }, 170), 100);
  assert.equal(context.defendedDamage({ steelUntil: 500 }, 170), 170);
});

test("line2 武器會命中正前方兩格", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon4" }, dirs.right)),
    [{ x: 6, y: 5 }, { x: 7, y: 5 }],
  );
});

test("ring8 武器會命中周圍八格", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon8" }, dirs.up)),
    [
      { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
      { x: 4, y: 5 }, { x: 6, y: 5 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
    ],
  );
});

test("line6 武器會命中正前方六格", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon10" }, dirs.right)),
    [
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
      { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 },
    ],
  );
});

test("weapon19 surround area hits all adjacent cells", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon19" }, dirs.up)),
    [
      { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
      { x: 4, y: 5 }, { x: 6, y: 5 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
    ],
  );
});

test("weapon20 wide331 area hits a 3-3-1 shape", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon20" }, dirs.right)),
    [
      { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 },
      { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 },
      { x: 8, y: 5 },
    ],
  );
});

test("NinjaS 武器會命中前方三格橫列", () => {
  const context = loadCombatRules();

  assert.deepEqual(
    plain(context.weaponAreaCells({ x: 5, y: 5, weaponKey: "weapon44" }, dirs.up)),
    [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }],
  );
});
