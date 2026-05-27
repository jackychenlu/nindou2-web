import test from "node:test";
import assert from "node:assert/strict";

import {
  classicAppStarter,
  hasClassicAppStarted,
  markClassicAppStarted,
  startClassicApp,
} from "../scripts/bootstrap/start-classic-app.module.mjs";

test("classicAppStarter prefers NindouAppBootstrap startGameApp", () => {
  const startGameApp = () => {};
  const target = {
    NindouAppBootstrap: {
      startGameApp,
    },
    startGameApp: () => {},
  };
  assert.equal(classicAppStarter(target), startGameApp);
});

test("startClassicApp starts exactly once and marks target", () => {
  let callCount = 0;
  const target = {
    NindouAppBootstrap: {
      startGameApp() {
        callCount += 1;
      },
    },
  };
  assert.equal(startClassicApp(target), true);
  assert.equal(startClassicApp(target), false);
  assert.equal(callCount, 1);
  assert.equal(hasClassicAppStarted(target), true);
});

test("markClassicAppStarted updates the started flag", () => {
  const target = {};
  assert.equal(hasClassicAppStarted(target), false);
  markClassicAppStarted(target);
  assert.equal(hasClassicAppStarted(target), true);
});

test("startClassicApp throws when bootstrap function is missing", () => {
  assert.throws(
    () => startClassicApp({}),
    /Classic app bootstrap is not available/,
  );
});
