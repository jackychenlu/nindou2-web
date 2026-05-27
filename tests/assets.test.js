const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const assetDataPath = path.join(repoRoot, "scripts/data/assets.js");

function loadAssetContext() {
  const audioSources = [];
  const context = vm.createContext({
    console,
    Audio: class {
      constructor(src) {
        this.src = src;
        audioSources.push(src);
      }
    },
  });

  for (const relativePath of ["scripts/data/config.js", "scripts/data/weapons.js", "scripts/data/assets.js"]) {
    const code = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
    vm.runInContext(code, context, { filename: relativePath });
  }

  context.__audioSources = audioSources;
  context.__assetSourceNames = assetSourceNames();
  return context;
}

function loadMapAssetContext(overrides = {}) {
  const context = loadAssetContext();
  Object.assign(context, {
    state: { roomMapKey: "evil-castle-1", units: [], objects: [], ...(overrides.state || {}) },
  });

  for (const relativePath of ["scripts/systems/grid.js", "scripts/data/map.js"]) {
    const code = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
    vm.runInContext(code, context, { filename: relativePath });
  }

  return context;
}

function assetSourceNames() {
  const source = fs.readFileSync(assetDataPath, "utf8");
  const names = new Set(["imageSources", "soundSources", "roomMapDefinitions"]);
  for (const match of source.matchAll(/\bconst\s+([A-Za-z0-9_]+Sources)\b/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function assetReferences(context) {
  return vm.runInContext(`(() => {
    const refs = [];
    const add = (source, key, value) => {
      if (typeof value === "string") {
        if (/^(assets|\\.\\/assets)\\//.test(value)) refs.push({ source, key, path: value });
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => add(source, key + "[" + index + "]", item));
        return;
      }
      if (value && typeof value === "object") {
        Object.entries(value).forEach(([childKey, childValue]) => add(source, key ? key + "." + childKey : childKey, childValue));
      }
    };

    __assetSourceNames.forEach((source) => add(source, "", eval(source)));
    add("lookDefinitions", "", lookDefinitions);
    add("baseTeamLookDefinitions", "", baseTeamLookDefinitions);
    weaponDefinitions.forEach((weapon) => {
      ["attack", "hand"].forEach((kind) => {
        ["right", "left", "up", "down"].forEach((direction) => {
          Array.from({ length: weapon.frameCount }, (_, index) => {
            add("weaponFrames", weapon.key + "." + kind + "." + direction + "[" + index + "]", weaponFrameSource(weapon, direction, kind, index));
          });
        });
      });
    });
    add("audioSources", "", __audioSources);

    return refs;
  })()`, context);
}

function markupAssetReferences() {
  const refs = [];
  const add = (source, key, value) => {
    if (!value || /^(https?:|data:|#)/.test(value)) return;
    refs.push({ source, key, path: value });
  };

  const indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  for (const match of indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    add("index.html", match[0], match[1]);
  }

  const styleCss = fs.readFileSync(path.join(repoRoot, "style.css"), "utf8");
  for (const match of styleCss.matchAll(/url\((?:"([^"]+)"|'([^']+)'|([^)]+))\)/g)) {
    add("style.css", match[0], match[1] || match[2] || match[3].trim());
  }

  return refs;
}

test("asset data only references files that exist", () => {
  const missing = [...assetReferences(loadAssetContext()), ...markupAssetReferences()].filter((ref) => {
    const relativePath = ref.path.startsWith("./") ? ref.path.slice(2) : ref.path;
    return !fs.existsSync(path.join(repoRoot, relativePath));
  });

  assert.equal(missing.length, 0, JSON.stringify(missing, null, 2));
});

test("map definitions and objects reference known image keys", () => {
  const context = loadMapAssetContext();
  const failures = vm.runInContext(`(() => {
    const failures = [];
    const hasImage = (key) => Boolean(imageSources[key]);

    for (const [mapKey, definition] of roomMapDefinitionEntries()) {
      if (definition.groundImageKey && !hasImage(definition.groundImageKey)) {
        failures.push({ mapKey, field: "groundImageKey", key: definition.groundImageKey });
      }
      if (definition.fallbackImageKey && !hasImage(definition.fallbackImageKey)) {
        failures.push({ mapKey, field: "fallbackImageKey", key: definition.fallbackImageKey });
      }
      if (definition.maskImageKey && !hasImage(definition.maskImageKey)) {
        failures.push({ mapKey, field: "maskImageKey", key: definition.maskImageKey });
      }

      state.roomMapKey = mapKey;
      for (const object of buildMapObjects()) {
        if (!hasImage(object.type)) {
          failures.push({ mapKey, field: "object.type", key: object.type });
        }
      }
    }

    return failures;
  })()`, context);

  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
});

test("look definitions reference known sprite and frame sets", () => {
  const context = loadAssetContext();
  const failures = vm.runInContext(`(() => {
    const failures = [];
    const lookEntries = [
      ...Object.entries(lookDefinitions),
      ...Object.entries(baseTeamLookDefinitions).map(([key, look]) => ["team:" + key, look]),
    ];
    const hasImage = (key) => Boolean(imageSources[key]);
    const hasDirectionalImages = (prefix) => ["Down", "Left", "Right", "Up"].every((suffix) => hasImage(prefix + suffix));
    const hasMoveSet = (key) => Boolean(movePrearriveFrameSources[key] && moveArriveFrameSources[key]);
    const hasUseNinjuSet = (key) => Boolean(useNinjuFrameSources[key]);
    const hasMoneyDartReadySet = (key) => Boolean(moneyDartReadyFrameSources[key]);
    const hasMoneyDartShootSet = (key) => Boolean(moneyDartShootFrameSources[key]);

    for (const [lookKey, look] of lookEntries) {
      if (look.eyeFrontImageKey && !hasImage(look.eyeFrontImageKey)) failures.push({ lookKey, field: "eyeFrontImageKey", key: look.eyeFrontImageKey });
      if (look.eyeSideImageKey && !hasImage(look.eyeSideImageKey)) failures.push({ lookKey, field: "eyeSideImageKey", key: look.eyeSideImageKey });
      if (look.spriteSet && !hasDirectionalImages(look.spriteSet)) failures.push({ lookKey, field: "spriteSet", key: look.spriteSet });
      if (look.moveSet && !hasMoveSet(look.moveSet)) failures.push({ lookKey, field: "moveSet", key: look.moveSet });
      if (look.useNinjuSet && !hasUseNinjuSet(look.useNinjuSet)) failures.push({ lookKey, field: "useNinjuSet", key: look.useNinjuSet });
      if (look.moneyDartReadySet && !hasMoneyDartReadySet(look.moneyDartReadySet)) failures.push({ lookKey, field: "moneyDartReadySet", key: look.moneyDartReadySet });
      if (look.moneyDartShootSet && !hasMoneyDartShootSet(look.moneyDartShootSet)) failures.push({ lookKey, field: "moneyDartShootSet", key: look.moneyDartShootSet });
    }

    return failures;
  })()`, context);

  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
});
