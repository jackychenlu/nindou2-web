const test = require("node:test");
const assert = require("node:assert/strict");

const { createGameContext, loadScripts, plain } = require("./helpers/script-loader");

function loadGridContext(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/grid.js",
  ]);
}

function loadMapContext(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/grid.js",
    "scripts/data/map.js",
  ]);
}

test("玩家座標與內部座標可以正確互轉", () => {
  const context = loadGridContext({
    state: {
      roomMapKey: "country-10",
      units: [],
      objects: [],
    },
  });

  const internal = context.internalCellCoord({ x: 1, y: 1 });
  assert.deepEqual(plain(internal), { x: 2, y: 10 });
  assert.deepEqual(plain(context.displayCellCoord(internal)), { x: 1, y: 1 });
});

test("永久障礙會擋住外框與不可走邊界", () => {
  const context = loadGridContext({
    state: {
      roomMapKey: "country-10",
      units: [],
      objects: [],
    },
  });

  assert.equal(context.isPermanentObstacle(0, 5), true);
  assert.equal(context.isPermanentObstacle(1, 5), true);
  assert.equal(context.isPermanentObstacle(2, 5), false);
  assert.equal(context.isPermanentObstacle(21, 5), true);
  assert.equal(context.isPermanentObstacle(20, 5), true);
  assert.equal(context.isPermanentObstacle(19, 5), false);
  assert.equal(context.isPermanentObstacle(2, 0), true);
  assert.equal(context.isPermanentObstacle(2, 11), true);
});

test("極惡城之一保留玩家座標上下 10 格可走範圍", () => {
  const context = loadGridContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });
  const isDisplayObstacle = (x, y) => {
    const internal = context.internalCellCoord({ x, y });
    return context.isPermanentObstacle(internal.x, internal.y);
  };

  assert.equal(isDisplayObstacle(5, 10), false);
  assert.equal(isDisplayObstacle(5, 11), true);
  assert.equal(isDisplayObstacle(5, 12), true);
});

test("極惡城之一座標往下位移一格", () => {
  const context = loadGridContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });

  assert.deepEqual(plain(context.displayCellCoord({ x: 11, y: 10 })), { x: 10, y: 2 });
  assert.deepEqual(plain(context.internalCellCoord({ x: 10, y: 1 })), { x: 11, y: 11 });
  assert.equal(context.isPermanentObstacle(11, 1), true);
  assert.equal(context.isPermanentObstacle(11, 11), false);
});

test("極惡城之一指定角落座標不可走", () => {
  const context = loadGridContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });
  const isDisplayObstacle = (x, y) => {
    const internal = context.internalCellCoord({ x, y });
    return context.isPermanentObstacle(internal.x, internal.y);
  };

  assert.equal(isDisplayObstacle(1, 1), true);
  assert.equal(isDisplayObstacle(18, 1), true);
  assert.equal(isDisplayObstacle(1, 10), true);
  assert.equal(isDisplayObstacle(18, 10), true);
  assert.equal(isDisplayObstacle(1, 18), true);
  assert.equal(isDisplayObstacle(18, 18), true);
  assert.equal(isDisplayObstacle(2, 1), false);
  assert.equal(isDisplayObstacle(17, 1), false);
  assert.equal(isDisplayObstacle(2, 10), false);
  assert.equal(isDisplayObstacle(17, 10), false);
});

test("極惡城之一 033、035、036 與 door1 障礙物佔格且不可破壞", () => {
  const context = loadMapContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });
  const objects = context.buildMapObjects();
  context.state.objects = objects;
  const objectAtDisplay = (x, y) => {
    const internal = context.internalCellCoord({ x, y });
    return context.objectAt(internal.x, internal.y);
  };

  assert.equal(objects.length, 32);
  assert.equal(objects.filter((object) => !object.hidden).length, 15);
  for (const [xMin, yMin, xMax, yMax] of [[3, 3, 5, 4], [14, 3, 16, 4]]) {
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const object = objectAtDisplay(x, y);
        assert.equal(object?.type, "evilCastleBlock033");
        assert.equal(object.breakable, false);
        assert.equal(context.isBlockedCell(object.x, object.y), true);
      }
    }
  }
  for (const [x, y] of [[2, 5], [17, 5], [5, 2], [14, 2], [3, 7], [16, 7]]) {
    const object = objectAtDisplay(x, y);
    assert.equal(object?.type, "evilCastleBlock035");
    assert.equal(object.breakable, false);
    assert.equal(context.isBlockedCell(object.x, object.y), true);
  }
  for (const [x, y] of [[7, 8], [7, 9], [7, 10], [12, 8], [12, 9], [12, 10]]) {
    const object = objectAtDisplay(x, y);
    assert.equal(object?.type, "evilCastleBlock036");
    assert.equal(object.breakable, false);
    assert.equal(context.isBlockedCell(object.x, object.y), true);
  }
  for (let x = 8; x <= 11; x++) {
    for (let y = 11; y <= 12; y++) {
      const object = objectAtDisplay(x, y);
      assert.equal(object?.type, "evilCastleDoor1");
      assert.equal(object.breakable, false);
      assert.equal(context.isBlockedCell(object.x, object.y), true);
    }
  }
  assert.equal(objectAtDisplay(4, 5), null);
  assert.equal(objectAtDisplay(15, 5), null);
  assert.equal(objectAtDisplay(6, 4), null);
  assert.equal(objectAtDisplay(13, 4), null);
});

test("極惡城之一固定出生點不被地圖障礙佔用", () => {
  const context = loadMapContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });
  context.state.objects = context.buildMapObjects();

  const cells = [
    { x: 9, y: 3 },
    { x: 8, y: 1 },
    { x: 9, y: 1 },
    { x: 10, y: 1 },
    { x: 6, y: 9 },
    { x: 8, y: 8 },
    { x: 11, y: 8 },
    { x: 13, y: 9 },
  ];
  for (const displayCell of cells) {
    const internal = context.internalCellCoord(displayCell);
    assert.equal(context.isBlockedCell(internal.x, internal.y), false);
  }
});

test("極惡城之二有獨立 layout 接線", () => {
  const context = loadMapContext({
    state: {
      roomMapKey: "evil-castle-2",
      units: [],
      objects: [],
    },
  });
  context.state.objects = context.buildMapObjects();
  const isDisplayObstacle = (x, y) => {
    const internal = context.internalCellCoord({ x, y });
    return context.isBlockedCell(internal.x, internal.y);
  };

  assert.deepEqual(plain(context.displayCellCoord({ x: 11, y: 10 })), { x: 10, y: 2 });
  assert.equal(isDisplayObstacle(5, 10), false);
  assert.equal(isDisplayObstacle(5, 11), true);
  assert.equal(isDisplayObstacle(3, 3), false);
  assert.equal(isDisplayObstacle(3, 4), true);
  assert.equal(isDisplayObstacle(3, 5), true);
  assert.equal(isDisplayObstacle(3, 6), false);
  assert.equal(isDisplayObstacle(14, 4), true);
  assert.equal(isDisplayObstacle(14, 5), true);
  assert.equal(isDisplayObstacle(14, 6), false);
  assert.equal(isDisplayObstacle(2, 4), true);
  assert.equal(isDisplayObstacle(17, 4), true);
  assert.equal(isDisplayObstacle(2, 5), false);
  assert.equal(isDisplayObstacle(17, 5), false);
  assert.equal(isDisplayObstacle(7, 5), false);
  assert.equal(isDisplayObstacle(7, 6), true);
  assert.equal(isDisplayObstacle(5, 2), false);
  assert.equal(isDisplayObstacle(14, 2), false);
  assert.equal(isDisplayObstacle(11, 2), false);
  assert.equal(isDisplayObstacle(12, 6), true);
  assert.equal(isDisplayObstacle(8, 1), false);
  assert.equal(context.currentRoomMapDefinition().objectLayout, "evil-castle-2");
  assert.equal(context.buildMapObjects().length, 28);
});

test("物件佔用格會被視為阻擋格", () => {
  const context = loadGridContext({
    state: {
      useOriginalMode: false,
      units: [],
      objects: [{ x: 4, y: 5, alive: true }],
    },
  });

  assert.equal(context.isBlockedCell(4, 5), true);
  assert.equal(context.isBlockedCell(4, 6), false);
});

test("every map object layout can build an object array", () => {
  const context = loadMapContext({
    state: {
      roomMapKey: "evil-castle-1",
      units: [],
      objects: [],
    },
  });

  for (const [mapKey] of context.roomMapDefinitionEntries()) {
    context.state.roomMapKey = mapKey;
    const objects = context.buildMapObjects();
    assert.equal(Array.isArray(objects), true);
  }
});
