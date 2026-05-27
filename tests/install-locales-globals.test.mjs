import test from "node:test";
import assert from "node:assert/strict";

import { installLocaleGlobals } from "../scripts/bootstrap/install-locales-globals.module.mjs";

test("installLocaleGlobals wires locale helpers and compatibility object", () => {
  const target = {};
  installLocaleGlobals(target);
  assert.equal(typeof target.roomLocale, "function");
  assert.equal(typeof target.localizedControlModeLabel, "function");
  assert.equal(typeof target.localizedRuleModeLabel, "function");
  assert.equal(typeof target.NindouLocales, "object");
  assert.equal(target.NindouLocales.localizedNinjuLabel, target.localizedNinjuLabel);
  assert.equal(target.NindouLocales.localeText, target.roomLocaleText);
});
