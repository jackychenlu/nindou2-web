const CLASSIC_APP_STARTED_FLAG = "NindouClassicAppStarted";

export function classicAppStarter(target = globalThis) {
  return target.NindouAppBootstrap?.startGameApp || target.startGameApp;
}

export function hasClassicAppStarted(target = globalThis) {
  return target[CLASSIC_APP_STARTED_FLAG] === true;
}

export function markClassicAppStarted(target = globalThis) {
  target[CLASSIC_APP_STARTED_FLAG] = true;
}

export function startClassicApp(target = globalThis) {
  if (hasClassicAppStarted(target)) {
    return false;
  }
  const start = classicAppStarter(target);
  if (typeof start !== "function") {
    throw new Error("Classic app bootstrap is not available");
  }
  markClassicAppStarted(target);
  start.call(target);
  return true;
}
