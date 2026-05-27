import test from "node:test";
import assert from "node:assert/strict";

import {
  CLASSIC_RUNTIME_BUNDLE_PATH,
  loadClassicRuntime,
  loadClassicRuntimeScripts,
} from "../scripts/load-classic-runtime.module.mjs";
import { CLASSIC_RUNTIME_SCRIPT_PATHS } from "../scripts/classic-runtime-manifest.module.mjs";

function makeFakeDocument() {
  const loaded = [];
  return {
    loaded,
    querySelector(selector) {
      const match = selector.match(/\[data-classic-runtime="(.+)"\]/);
      if (!match) return null;
      return loaded.includes(match[1]) ? {} : null;
    },
    createElement() {
      const listeners = new Map();
      return {
        dataset: {},
        addEventListener(type, handler) {
          listeners.set(type, handler);
        },
        trigger(type) {
          listeners.get(type)?.();
        },
      };
    },
    body: {
      appendChild(script) {
        loaded.push(script.dataset.classicRuntime);
        script.trigger("load");
      },
    },
  };
}

function makeBundleFailureDocument() {
  const fakeDocument = makeFakeDocument();
  fakeDocument.body.appendChild = function appendChild(script) {
    fakeDocument.loaded.push(script.dataset.classicRuntime);
    if (script.dataset.classicRuntime === CLASSIC_RUNTIME_BUNDLE_PATH) {
      script.trigger("error");
      return;
    }
    script.trigger("load");
  };
  return fakeDocument;
}

test("loadClassicRuntime skips bundle when runtime manifest is empty", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeFakeDocument();
  global.document = fakeDocument;
  try {
    const result = await loadClassicRuntime();
    assert.equal(result.mode, "none");
    assert.deepEqual(result.loaded, []);
    assert.deepEqual(fakeDocument.loaded, []);
  } finally {
    global.document = previousDocument;
  }
});

test("loadClassicRuntime ignores fallback when runtime manifest is empty", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeBundleFailureDocument();
  global.document = fakeDocument;
  try {
    const result = await loadClassicRuntime({ allowScriptFallback: true });
    assert.equal(result.mode, "none");
    assert.deepEqual(result.loaded, CLASSIC_RUNTIME_SCRIPT_PATHS);
    assert.deepEqual(fakeDocument.loaded, []);
  } finally {
    global.document = previousDocument;
  }
});

test("loadClassicRuntimeScripts can still load explicit legacy script lists", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeFakeDocument();
  global.document = fakeDocument;
  try {
    const explicitPaths = ["scripts/data/config.js", "scripts/data/rule-modes.js"];
    await loadClassicRuntimeScripts(explicitPaths);
    assert.deepEqual(fakeDocument.loaded, explicitPaths);
  } finally {
    global.document = previousDocument;
  }
});
