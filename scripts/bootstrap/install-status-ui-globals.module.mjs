import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function query(target, selector) {
  return target.document?.querySelector?.(selector) || null;
}

export function installStatusUiGlobals(target = globalThis) {
  const updatePanel = () => {
    const unit = target.selectedHudUnit();
    if (!unit) return;
    const unitInfoEl = query(target, "#unitInfo");
    const skillFillEl = query(target, "#skillFill");
    if (!unitInfoEl || !skillFillEl) return;
    const text = target.roomLocale();
    const coord = target.displayCellCoord(unit);
    const skillLimit = unit.skillMax || target.maxSkill;
    unitInfoEl.innerHTML = `
    <div>HP: ${Math.round(unit.hp)}/${unit.maxHp || target.maxHp}</div>
    <div>${text.panelSkill}: ${unit.skill.toFixed(1)} / ${skillLimit}</div>
    <div>${text.panelCell}: [${coord.x}, ${coord.y}]</div>
  `;
    skillFillEl.style.width = `${Math.min(100, unit.skill / skillLimit * 100)}%`;
  };

  const setMessage = (text) => {
    const state = resolveRuntimeState(target);
    const statusEl = query(target, "#status");
    if (state) state.message = text;
    if (statusEl) statusEl.textContent = text;
  };

  Object.assign(target, {
    updatePanel,
    setMessage,
  });

  target.NindouStatusUi = {
    updatePanel,
    setMessage,
  };
}
