import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installBattleRuntimeGlobals(target = globalThis) {
  const canDraggedUnitMoveNow = (unit) => target.canUnitMoveNow(unit) || target.canUseConsumableFollowupMove(unit);

  const updateCharging = (dt) => {
    const state = resolveRuntimeState(target);
    if (!state?.pressedUnit || state.gameOver) return;
    if (!canDraggedUnitMoveNow(state.pressedUnit)) return;
    const held = (now(target) - state.pressTime) / 1000;
    if (held < target.holdSeconds) return;
    if (!target.pointerIsOnUnit(state.pressedUnit)) {
      state.charging = true;
      target.setMessage(`${state.pressedUnit.name}：請把滑鼠移回角色身上才能繼續集氣。`);
      return;
    }

    state.charging = true;
    const skillLimit = state.pressedUnit.skillMax || target.maxSkill;
    state.pressedUnit.skill = Math.min(skillLimit, state.pressedUnit.skill + target.chargePerSecond * dt);
    target.setMessage(`${state.pressedUnit.name} 集氣中 ${state.pressedUnit.skill.toFixed(1)} / ${skillLimit}`);
  };

  const updateMatchState = (currentNow) => {
    const state = resolveRuntimeState(target);
    if (!state || state.inRoom || state.matchStart || state.result) return;
    state.matchStart = currentNow;
    state.lastFrame = currentNow;
    state.startSoundPlayed = true;
    target.setMessage("開始。");
  };

  const isMatchActive = () => {
    const state = resolveRuntimeState(target);
    return Boolean(state && !state.inRoom && state.matchStart && !state.result);
  };

  const useNinjuByType = (type) => {
    if (type === "moneyDart") target.useMoneyDart();
    else if (type === "steel") target.useSteelNinju();
    else if (type === "hotBlood") target.useHotBloodNinju();
    else if (target.attackNinjuConfigs[type]) target.useAttackNinju(type);
    else if (target.specialNinjuConfigs[type]) target.useSpecialNinju(type);
    else if (type === "genki") target.useGenkiNinju();
    else if (type === "kakki") target.useKakkiNinju();
    else if (type === "shinki") target.useShinkiNinju();
  };

  Object.assign(target, {
    updateCharging,
    canDraggedUnitMoveNow,
    updateMatchState,
    isMatchActive,
    useNinjuByType,
  });

  target.NindouBattleRuntime = {
    updateCharging,
    canDraggedUnitMoveNow,
    updateMatchState,
    isMatchActive,
    useNinjuByType,
  };
}
