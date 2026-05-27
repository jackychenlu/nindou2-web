import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function gameCanvas(target) {
  return target.document?.querySelector?.("#game");
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installBattleInputGlobals(target = globalThis) {
  const pointerMove = (event) => {
    const state = resolveRuntimeState(target);
    const canvas = gameCanvas(target);
    if (!state?.pointer || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = (event.clientX - rect.left) * canvas.width / rect.width;
    state.pointer.y = (event.clientY - rect.top) * canvas.height / rect.height;
    state.pointer.cell = target.pointToCell(state.pointer.x, state.pointer.y);

    const lookUnit = state.pressedUnit || target.selectedUnit();
    if (lookUnit && target.canControlUnit(lookUnit) && lookUnit.alive && !target.isUnitDisabled(lookUnit)) {
      target.updateFacingFromPointer(lookUnit);
    }

    if (!state.pressedUnit || !event.buttons) return;
    const start = target.cellCenter(state.pressedUnit.x, state.pressedUnit.y);
    const dx = state.pointer.x - start.x;
    const dy = state.pointer.y - start.y;
    if (Math.hypot(dx, dy) > 12) {
      state.dragMoved = true;
    }
  };

  const pointerDown = (event) => {
    const state = resolveRuntimeState(target);
    if (!state || state.inRoom) return;
    if (state.result) {
      if (now(target) < (state.resultClickableAt || 0)) return;
      target.returnToRoomFromResult();
      return;
    }
    target.startBgm();
    pointerMove(event);
    if (!target.isMatchActive()) return;
    const cell = state.pointer.cell;
    for (let index = 0; index < 10; index++) {
      if (target.pointInRect(state.pointer.x, state.pointer.y, target.itemSlotRect(index))) {
        target.useItemSlot(index);
        return;
      }
    }
    for (const button of target.currentNinjuButtonList()) {
      if (target.pointInRect(state.pointer.x, state.pointer.y, button)) {
        target.useNinjuByType(button.type);
        return;
      }
    }
    if (!cell || state.gameOver) return;

    const unitRaw = target.unitAt(cell.x, cell.y);
    const unitMoving = unitRaw && unitRaw.moveTrail && (now(target) - unitRaw.moveTrail.startedAt) < target.ARRIVE_TOTAL;
    const unit = unitMoving ? null : unitRaw;
    const selected = target.selectedUnit();
    state.pressedUnit = unit && target.canControlUnit(unit) && !unit.moneyDart ? unit : null;
    state.pressTime = now(target);
    state.dragMoved = false;
    state.charging = false;

    if (selected && selected.moneyDart) {
      if (cell.x !== selected.x || cell.y !== selected.y) {
        target.throwMoneyDart(selected, cell);
      } else {
        target.setMessage(`${selected.name}：請選擇上、下、左、右其中一個方向丟出錢鏢。`);
      }
      return;
    }

    if (unit && target.canControlUnit(unit)) {
      state.selectedId = unit.id;
      target.setMessage(`${unit.name}：請持續按住以累積技量。`);
      return;
    }

    if (unit && selected && unit.team !== selected.team) {
      if (target.manhattan(selected, unit) === 1) {
        target.attack(selected, unit);
      } else {
        target.attackAimedWeapon(selected, cell);
      }
      return;
    }

    if (selected && (cell.x !== selected.x || cell.y !== selected.y)) {
      target.attackAimedWeapon(selected, cell);
      return;
    }

    target.setMessage("移動必須先按住角色集氣，再拖到目標格。");
  };

  const pointerUp = (event) => {
    const state = resolveRuntimeState(target);
    if (!state) return;
    target.startBgm();
    pointerMove(event);
    const cell = state.pressedUnit ? target.dragMoveTargetCell(state.pressedUnit) : null;
    if (state.charging && state.dragMoved && state.pressedUnit && cell) {
      target.skillMove(state.pressedUnit, cell);
    } else if (state.pressedUnit) {
      target.setMessage(`${state.pressedUnit.name}：已集到 ${state.pressedUnit.skill.toFixed(1)} 技。`);
    }

    state.pressedUnit = null;
    state.dragMoved = false;
    state.charging = false;
  };

  Object.assign(target, {
    pointerDown,
    pointerMove,
    pointerUp,
  });

  target.NindouBattleInput = {
    pointerDown,
    pointerMove,
    pointerUp,
  };
}
