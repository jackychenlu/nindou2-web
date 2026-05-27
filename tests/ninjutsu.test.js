const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, plain } = require("./helpers/script-loader");

test("attack ninjutsu can be used at soul 1 even without skill", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 0,
    soulSteps: 27,
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    attackNinjuConfigs: { wildfire: { label: "野火" } },
  });

  context.useAttackNinju("wildfire");

  assert.equal(unit.skill, 0);
  assert.equal(unit.soulSteps, 0);
  assert.equal(unit.ninju.type, "wildfire");
  assert.equal(unit.ninju.attackNinjuLevel, 1);
});

test("attack ninjutsu is blocked below soul 1", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 10,
    soulSteps: 26,
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    attackNinjuConfigs: { death: { label: "死神" } },
  });

  context.useAttackNinju("death");

  assert.equal(unit.skill, 10);
  assert.equal(unit.soulSteps, 26);
  assert.equal(unit.ninju, undefined);
});

test("ported attack ninjutsu spend soul instead of skill", () => {
  for (const type of ["angel", "mouryo"]) {
    const unit = {
      id: 1,
      name: "blue1",
      team: "blue",
      alive: true,
      skill: 0,
      soulSteps: 27,
    };
    const context = loadCombatRules({
      state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
      selectedUnit: () => unit,
      canControlUnit: () => true,
      attackNinjuConfigs: { [type]: { label: type } },
    });

    context.useAttackNinju(type);

    assert.equal(unit.skill, 0);
    assert.equal(unit.soulSteps, 0);
    assert.equal(unit.ninju.type, type);
    assert.equal(unit.ninju.attackNinjuLevel, 1);
  }
});

test("death command blocks genki kakki and shinki use", () => {
  for (const useNinju of ["useGenkiNinju", "useKakkiNinju", "useShinkiNinju"]) {
    const unit = {
      id: 1,
      name: "blue1",
      team: "blue",
      alive: true,
      hp: 100,
      maxHp: 300,
      skill: 20,
    };
    const context = loadCombatRules({
      state: { deathModeKey: "death_command", units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
      selectedUnit: () => unit,
      canControlUnit: () => true,
    });

    context[useNinju]();

    assert.equal(unit.skill, 20);
    assert.equal(unit.ninju, undefined);
  }
});

test("clone ninjutsu teleports the caster and creates two pass-through decoys", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 180,
    maxHp: 300,
    controlMode: "ai_red",
    appearanceKey: "red",
    steelUntil: 4000,
    hotBloodUntil: 0,
    buffAuraType: "steel",
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
  };
  const randomValues = [0, 0, 0];
  const testMath = Object.create(Math);
  testMath.random = () => randomValues.shift() ?? 0;
  const context = loadCombatRules({
    Math: testMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    specialNinjuConfigs: { clone: { label: "分身" } },
  });

  context.useSpecialNinju("clone");

  assert.equal(unit.skill, 10);
  assert.equal(unit.ninju.type, "clone");

  context.triggerSpecialNinju(unit, "clone", 1000);

  assert.notDeepEqual({ x: unit.x, y: unit.y }, { x: 5, y: 5 });
  assert.equal(context.state.cloneDecoys.length, 2);
  assert.equal(context.state.cloneDecoys.some((decoy) => decoy.x === 5 && decoy.y === 5), false);
  assert.equal(
    context.state.cloneDecoys.every((decoy) => !(decoy.x === unit.x && decoy.y === unit.y)),
    true
  );
  const occupiedCloneCells = new Set([
    `${unit.x},${unit.y}`,
    ...context.state.cloneDecoys.map((decoy) => `${decoy.x},${decoy.y}`),
  ]);
  assert.equal(occupiedCloneCells.size, 3);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.casterId === unit.id), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.moveT === 1 && decoy.fromX === decoy.x && decoy.fromY === decoy.y), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.name === unit.name), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.hp === unit.hp && decoy.maxHp === unit.maxHp), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.controlMode === "ai_red" && decoy.appearanceKey === "red"), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.steelUntil === unit.steelUntil && decoy.buffAuraType === "steel"), true);
});

test("clone ninjutsu can use map-specific playable bottom row cells", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    x: 5,
    y: 5,
  };
  const context = loadCombatRules({
    state: {
      roomMapKey: "evil-castle-1",
      units: [unit],
      objects: [],
      projectiles: [],
      moneyDartCasts: [],
      cloneDecoys: [],
    },
  });

  assert.equal(
    context.cloneOpenCells(unit).some((cell) => cell.x === 3 && cell.y === 11),
    true
  );
});

test("clone decoys are removed when their caster dies", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 10,
    maxHp: 10,
    skill: 20,
    soulSteps: 0,
    kills: 0,
    damageDone: 0,
    damageTaken: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
  };
  const attacker = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 10,
    maxHp: 10,
    kills: 0,
    damageDone: 0,
    damageTaken: 0,
    soulSteps: 0,
  };
  const context = loadCombatRules({
    state: {
      units: [unit, attacker],
      objects: [],
      projectiles: [],
      moneyDartCasts: [],
      cloneDecoys: [
        { casterId: 1, x: 4, y: 5 },
        { casterId: 1, x: 6, y: 5 },
        { casterId: 2, x: 8, y: 5 },
      ],
    },
  });

  context.damageUnit(unit, 10, "test", false, attacker);

  assert.equal(unit.alive, false);
  assert.deepEqual(plain(context.state.cloneDecoys), [{ casterId: 2, x: 8, y: 5 }]);
});

test("money dart is not charged twice when it is already queued", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    ninju: {
      type: "steel",
      phase: "active",
      startedAt: 0,
      duration: 1500,
      queue: 0,
      pendingMoneyDart: true,
    },
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
  });
  context.moneyDartRule().cost = 5;

  context.useMoneyDart();

  assert.equal(unit.skill, 20);
  assert.equal(unit.ninju.pendingMoneyDart, true);
});

test("money dart hits immediately on a clear straight line without projectile speed", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    moneyDart: { startedAt: 0, invincibleUntil: 0 },
    damageDone: 0,
    damageTaken: 0,
  };
  const target = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 9,
    y: 5,
    fromX: 9,
    fromY: 5,
    damageDone: 0,
    damageTaken: 0,
  };
  const context = loadCombatRules({
    performance: { now: () => 1000 },
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });

  context.throwMoneyDart(unit, { x: 9, y: 5 });

  assert.equal(target.hp, 230);
  assert.equal(unit.damageDone, 70);
  assert.equal(target.damageTaken, 70);
  assert.equal(unit.moneyDart, null);
  assert.equal(context.state.projectiles.length, 0);
  assert.equal(context.state.moneyDartCasts.length, 1);
});

test("shinki starts heal effects and stiffness on all living teammates at cast start", () => {
  const caster = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 120,
    maxHp: 300,
    disabledUntil: 0,
    skill: 10,
  };
  const teammate = {
    id: 2,
    name: "blue2",
    team: "blue",
    alive: true,
    hp: 50,
    maxHp: 300,
    disabledUntil: 200,
  };
  const enemy = {
    id: 3,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 80,
    maxHp: 300,
    disabledUntil: 0,
  };
  const effects = [];
  const cancelled = [];
  const context = loadCombatRules({
    performance: { now: () => 1000 },
    state: { deathModeKey: "death_heal", units: [caster, teammate, enemy], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => caster,
    canControlUnit: () => true,
    localizedNinjuTypeLabel: () => "神氣",
    addNinjuDamageEffect: (...args) => effects.push(args),
    cancelDragIfPressed: (unit) => cancelled.push(unit.id),
  });

  context.useShinkiNinju();

  assert.equal(caster.hp, 120);
  assert.equal(teammate.hp, 50);
  assert.equal(enemy.hp, 80);
  assert.equal(caster.disabledUntil, 2500);
  assert.equal(teammate.disabledUntil, 2500);
  assert.equal(enemy.disabledUntil, 0);
  assert.deepEqual(cancelled, [1, 2]);
  assert.deepEqual(
    effects.map(([type, unit, now, duration]) => ({ type, id: unit.id, now, duration })),
    [
      { type: "shinki", id: 1, now: 1000, duration: 1500 },
      { type: "shinki", id: 2, now: 1000, duration: 1500 },
    ]
  );

  context.refreshStatusNinju(caster, "shinki", 2500);

  assert.equal(caster.hp, 220);
  assert.equal(teammate.hp, 150);
  assert.equal(effects.length, 2);
});

test("shinki can be queued while its cast-start stiffness is active", () => {
  const caster = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 120,
    maxHp: 300,
    disabledUntil: 0,
    skill: 20,
  };
  const messages = [];
  const context = loadCombatRules({
    performance: { now: () => 1000 },
    state: { deathModeKey: "death_heal", units: [caster], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => caster,
    canControlUnit: () => true,
    localizedNinjuTypeLabel: () => "神氣",
    setMessage: (message) => messages.push(message),
  });

  context.useShinkiNinju();
  context.useShinkiNinju();

  assert.equal(caster.skill, 0);
  assert.equal(caster.ninju.type, "shinki");
  assert.equal(caster.ninju.queue, 1);
  assert.equal(caster.ninju.pendingType, "shinki");
  assert.equal(messages.at(-1), "blue1 已排入神氣。");
});

test("ninjutsu clicked during consumable active phase is queued after the item animation", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 10,
    disabledUntil: 2500,
    consumableUse: { phase: "active", type: "backup3", startedAt: 1000, duration: 1500, chainMoves: 3 },
  };
  const messages = [];
  const context = loadCombatRules({
    performance: { now: () => 1000 },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    setMessage: (message) => messages.push(message),
  });

  context.useGenkiNinju();

  assert.equal(unit.skill, 7);
  assert.equal(unit.ninju, undefined);
  assert.equal(unit.consumableUse.pendingNinjutsu.length, 1);
  assert.equal(unit.consumableUse.pendingNinjutsu[0].type, "genki");
  assert.equal(messages.at(-1), "blue1 已排入元氣。");
});

test("ninjutsu-ninjutsu-item keeps item animation after both ninjutsu animations", () => {
  let now = 1000;
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 20,
    items: { backup3: 1 },
    itemSlots: ["backup3"],
    disabledUntil: 0,
  };
  const context = loadCombatRules({
    performance: { now: () => now },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
  });

  context.useGenkiNinju();
  context.useKakkiNinju();
  context.useBackupItem(0);

  assert.equal(unit.ninju.type, "genki");
  assert.equal(unit.ninju.queue, 1);
  assert.equal(unit.ninju.pendingConsumables.length, 1);
  assert.equal(unit.ninju.pendingConsumables[0], "backup3");
  assert.equal(unit.consumableUse, undefined);

  now = 2500;
  context.updateNinju(now);
  assert.equal(unit.ninju.phase, "gap");
  assert.equal(unit.consumableUse, undefined);

  now = 3000;
  context.updateNinju(now);
  assert.equal(unit.ninju.type, "kakki");
  assert.equal(unit.ninju.phase, "active");
  assert.equal(unit.consumableUse, undefined);

  now = 4500;
  context.updateNinju(now);
  assert.equal(unit.ninju, null);
  assert.equal(unit.consumableUse.type, "backup3");
  assert.equal(unit.consumableUse.phase, "active");
  assert.equal(unit.consumableUse.startedAt, 4500);
});

test("item-ninjutsu-ninjutsu keeps ninjutsu animations after item animation", () => {
  let now = 1000;
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 20,
    items: { backup3: 1 },
    itemSlots: ["backup3"],
    disabledUntil: 0,
  };
  const context = loadCombatRules({
    performance: { now: () => now },
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], consumableEffects: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
  });

  context.useBackupItem(0);
  context.useGenkiNinju();
  context.useKakkiNinju();

  assert.equal(unit.consumableUse.type, "backup3");
  assert.equal(unit.consumableUse.pendingNinjutsu.length, 2);
  assert.equal(unit.ninju, undefined);

  now = 2500;
  context.updateConsumables(now);
  assert.equal(unit.consumableUse, null);
  assert.equal(unit.ninju.type, "genki");
  assert.equal(unit.ninju.phase, "active");
  assert.equal(unit.ninju.queue, 1);

  now = 4000;
  context.updateNinju(now);
  assert.equal(unit.ninju.phase, "gap");

  now = 4500;
  context.updateNinju(now);
  assert.equal(unit.ninju.type, "kakki");
  assert.equal(unit.ninju.phase, "active");
});
