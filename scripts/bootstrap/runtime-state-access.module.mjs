import { defaultGrid } from "../systems/grid.module.mjs";

function runtimeStateBridge(target) {
  const bridge = target?.NindouRuntimeState;
  return bridge && typeof bridge === "object" ? bridge : null;
}

export function resolveRuntimeState(target = globalThis) {
  if (target?.state && typeof target.state === "object") return target.state;
  const bridge = runtimeStateBridge(target);
  if (bridge && typeof bridge.getState === "function") {
    const stateLike = bridge.getState();
    if (stateLike && typeof stateLike === "object") return stateLike;
  }
  return null;
}

export function resolveRuntimeGrid(target = globalThis) {
  if (target?.grid && typeof target.grid === "object") return target.grid;
  const bridge = runtimeStateBridge(target);
  if (bridge && typeof bridge.getGrid === "function") {
    const gridLike = bridge.getGrid();
    if (gridLike && typeof gridLike === "object") return gridLike;
  }
  return defaultGrid;
}

export function resolveRuntimeRoomMapKey(target = globalThis) {
  const stateLike = resolveRuntimeState(target);
  return stateLike?.roomMapKey || target?.defaultRoomMapKey || "";
}
