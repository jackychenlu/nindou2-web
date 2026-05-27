const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAiRules } = require("./helpers/script-loader");

test("AI赤組可無視技與魂直接施放野火或急凍", () => {
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    moveT: 1,
    aiRedCloneAt: 999999,
    aiRedSteelAt: 999999,
    aiRedAttackAt: 0,
  };
  const enemy = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 7,
    y: 5,
  };
  const context = loadAiRules({
    state: { units: [unit, enemy], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: {
      wildfire: { label: "野火" },
      freeze: { label: "急凍" },
    },
  });

  context.tryAiNinjutsu(unit, context.aiProfile(unit), 1000);

  assert.equal(["wildfire", "freeze"].includes(unit.ninju.type), true);
  assert.equal(unit.ninju.attackNinjuLevel, 1);
  assert.equal(unit.skill, 0);
  assert.equal(unit.soulSteps, 0);
});

test("AI赤組被斜角攻擊時可排入溜溜球反擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0.8;
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    weaponReadyAt: 0,
    moveT: 1,
  };
  const attacker = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 6,
    fromX: 6,
    fromY: 6,
    facing: "left",
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, attacker], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.queueAiRedRetaliation(unit, attacker, 1000), true);
  assert.equal(unit.aiRedPendingAction.type, "weapon");

  context.tryAiRedPendingAction(unit, 1200);

  assert.equal(attacker.hp < 300, true);
  assert.equal(context.state.attacks.length, 1);
});

test("AI赤組在直線上會依距離排入延遲撞擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0.2;
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 2,
    y: 5,
    fromX: 2,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    moveT: 1,
    aiNextThink: 0,
  };
  const target = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.tryAiRedCombatAction(unit, target, 1000), true);
  assert.equal(unit.aiRedPendingAction.type, "ram");
  assert.equal(unit.aiRedPendingAction.executeAt, 1700);
});

test("AI赤組被直線攻擊時會在 0.5 秒後排入衝撞反擊", () => {
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 2,
    y: 5,
    fromX: 2,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    weaponReadyAt: 0,
    moveT: 1,
    aiNextThink: 9999,
    damageTaken: 0,
  };
  const attacker = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "left",
    damageDone: 0,
  };
  const context = loadAiRules({
    performance: { now: () => 1000 },
    state: { units: [unit, attacker], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  context.damageUnit(unit, 70, "blue1 直線命中 red1", true, attacker);

  assert.equal(unit.aiRedPendingAction.type, "ram");
  assert.equal(unit.aiRedPendingAction.targetId, attacker.id);
  assert.equal(unit.aiRedPendingAction.executeAt, 1500);
  assert.equal(unit.aiNextThink, 1500);
});

test("AI赤組敵人在九宮格內時會使用溜溜球攻擊", () => {
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "down",
    weaponKey: "weapon8",
    weaponReadyAt: 0,
    moveT: 1,
    damageDone: 0,
  };
  const target = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 6,
    fromX: 6,
    fromY: 6,
    damageTaken: 0,
  };
  const context = loadAiRules({
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.tryAiRedCombatAction(unit, target, 1000), true);

  assert.equal(target.hp < 300, true);
  assert.equal(context.state.attacks.length, 1);
  assert.equal(unit.aiRedPendingAction, undefined);
});

test("太刀達人低於 200 HP 時優先使用活氣", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 199,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 10,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });

  assert.equal(context.tryAiNinjutsu(unit, context.aiProfile(unit), 1000), true);

  assert.equal(unit.ninju.type, "kakki");
  assert.equal(unit.skill, 4);
});

test("太刀達人活氣受玩家相同的技量與模式限制", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const lowSkillUnit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 199,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 5,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { deathModeKey: "death_heal", units: [lowSkillUnit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });

  assert.equal(context.tryAiNinjutsu(lowSkillUnit, context.aiProfile(lowSkillUnit), 1000), false);
  assert.equal(lowSkillUnit.ninju, undefined);

  lowSkillUnit.skill = 10;
  context.state.deathModeKey = "death_command";

  assert.equal(context.tryAiNinjutsu(lowSkillUnit, context.aiProfile(lowSkillUnit), 1500), true);
  assert.equal(lowSkillUnit.ninju.type, "steel");
});

test("太刀達人技量上限固定為玩家正常上限並會扣技", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 9999,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });

  context.updateAi(0, 1000);

  assert.equal(unit.ninju.type, "steel");
  assert.equal(unit.skill, 12);
});

test("太刀達人沒有鋼鐵時會先上鋼鐵而不是攻擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 10,
    soulSteps: 4,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
  };
  const target = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 5,
    fromX: 6,
    fromY: 5,
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  context.updateAi(0.1, 1000);

  assert.equal(unit.ninju.type, "steel");
  assert.equal(target.hp, 300);
  assert.equal(context.state.attacks.length, 0);
});

test("太刀達人有鋼鐵時才會主動使用忍太刀攻擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 10,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    aiNextThink: 0,
    aiActionAt: 0,
    aiPlanKey: "2:6,5:5,5",
    steelUntil: 5000,
    damageDone: 0,
  };
  const target = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 5,
    fromX: 6,
    fromY: 5,
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  context.updateAi(0.1, 1000);

  assert.equal(target.hp < 300, true);
  assert.equal(context.state.attacks.length, 1);
});

test("太刀達人血量 150 以下且有魂一時才會使用閃光", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 150,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 18,
    soulSteps: 27,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
    steelUntil: 5000,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  assert.equal(context.tryAiNinjutsu(unit, context.aiProfile(unit), 1000), true);
  assert.equal(unit.ninju.type, "flash");
  assert.equal(unit.soulSteps, 0);
});

test("太刀達人血量高於 150 時不會使用閃光", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 151,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 18,
    soulSteps: 27,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
    steelUntil: 5000,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  assert.equal(context.tryAiNinjutsu(unit, context.aiProfile(unit), 1000), true);
  assert.equal(unit.ninju.type, "kakki");
  assert.equal(unit.soulSteps, 27);
});

test("太刀達人的魂條每 30 秒累積一段", () => {
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 18,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
    steelUntil: 5000,
  };
  const context = loadAiRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  context.updateAi(30, 1000);
  assert.equal(unit.soulSteps, 27);

  context.updateAi(30, 31000);
  assert.equal(unit.soulSteps, 54);
});

test("太刀達人未達 90% 技量且未受擊時會盡量原地集技", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 12,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    aiNextThink: 0,
    aiActionAt: 0,
    aiPlanKey: "2:8,6:5,5",
    steelUntil: 5000,
    damageTaken: 0,
  };
  const target = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 8,
    y: 6,
    fromX: 8,
    fromY: 6,
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  context.updateAi(0.1, 1000);

  assert.equal(unit.x, 5);
  assert.equal(unit.y, 5);
  assert.equal(unit.skill > 12, true);
  assert.equal(context.state.attacks.length, 0);
});

test("太刀達人被攻擊後即使未達 90% 技量也比較會移動", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0;
  const unit = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 12,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    weaponReadyAt: 0,
    moveT: 1,
    aiNextThink: 0,
    aiActionAt: 0,
    aiPlanKey: "2:8,6:5,5",
    steelUntil: 5000,
    damageTaken: 50,
  };
  const target = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 8,
    y: 6,
    fromX: 8,
    fromY: 6,
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { flash: { label: "閃光" } },
  });

  unit.aiLastDamageTaken = 0;
  context.updateAi(0.1, 1000);

  assert.equal(unit.x, 8);
  assert.equal(unit.y, 5);
});

test("太刀達人錢鏢準備與投擲機率是錢鏢神人的 49%", () => {
  const unit = { controlMode: "ai_tachi_master" };
  const context = loadAiRules();
  const profile = context.aiProfile(unit);

  assert.equal(profile.moneyDartReadyChance, 0.49);
  assert.equal(profile.moneyDartThrowChance, 0.49);
  assert.equal(profile.moneyDartLineDelayMs, 900);
  assert.equal(context.aiProfile({ controlMode: "ai_money_dart_master" }).moneyDartThrowChance, 1);
});

test("太刀達人發標前需要比錢鏢神人更久的直線等待", () => {
  const tachi = {
    id: 1,
    name: "tachi1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_tachi_master",
    skill: 18,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon3",
    moveT: 1,
  };
  const dartMaster = { ...tachi, id: 2, name: "dart1", controlMode: "ai_money_dart_master" };
  const target = {
    id: 3,
    name: "target",
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
  const tachiContext = loadAiRules({
    state: { units: [tachi, { ...target }], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });
  const dartContext = loadAiRules({
    state: { units: [dartMaster, { ...target }], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
  });

  assert.equal(tachiContext.aiCanStartMoneyDartAfterLineDelay(tachi, 1000), false);
  assert.equal(tachiContext.aiCanStartMoneyDartAfterLineDelay(tachi, 1400), false);
  assert.equal(tachiContext.aiCanStartMoneyDartAfterLineDelay(tachi, 1900), true);
  assert.equal(dartContext.aiCanStartMoneyDartAfterLineDelay(dartMaster, 1000), false);
  assert.equal(dartContext.aiCanStartMoneyDartAfterLineDelay(dartMaster, 1300), true);
});

test("太刀達人的錢鏢命中不使用飛行速度或 projectile", () => {
  const makeUnit = (controlMode) => ({
    id: controlMode === "ai_tachi_master" ? 1 : 2,
    name: controlMode,
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode,
    skill: 18,
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
  });
  const target = {
    id: 3,
    name: "target",
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
  const normalUnit = makeUnit("ai_money_dart_master");
  const tachiUnit = makeUnit("ai_tachi_master");
  const normalContext = loadAiRules({
    state: { units: [normalUnit, { ...target }], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
  });
  const tachiContext = loadAiRules({
    state: { units: [tachiUnit, { ...target }], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
  });

  normalContext.throwMoneyDart(normalUnit, { x: 9, y: 5 });
  tachiContext.throwMoneyDart(tachiUnit, { x: 9, y: 5 });

  assert.equal(normalContext.state.projectiles.length, 0);
  assert.equal(tachiContext.state.projectiles.length, 0);
  assert.equal(normalContext.state.units[1].hp, 230);
  assert.equal(tachiContext.state.units[1].hp, 230);
});
