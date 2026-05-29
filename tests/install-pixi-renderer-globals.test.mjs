import test from "node:test";
import assert from "node:assert/strict";

import { installPixiRendererGlobals } from "../scripts/bootstrap/install-pixi-renderer-globals.module.mjs";
import {
  createPixiBattleRenderer,
  rendererPreference,
  shouldUsePixiRenderer,
} from "../scripts/rendering/pixi-battle-renderer.module.mjs";

function createTarget({ renderer = "" } = {}) {
  const inserted = [];
  const sourceCanvas = {
    id: "game",
    width: 960,
    height: 680,
    className: "game-canvas",
    style: {},
    parentNode: {},
    hidden: false,
    getAttribute: (name) => (name === "aria-label" ? "Battle canvas" : ""),
    insertAdjacentElement: (position, element) => inserted.push([position, element]),
  };
  const document = {
    documentElement: { dataset: renderer ? { nindouRenderer: renderer } : {} },
    querySelector: (selector) => {
      if (selector === "#game") return sourceCanvas;
      if (selector === "#pixiGame") return inserted.find((entry) => entry[1].id === "pixiGame")?.[1] || null;
      return null;
    },
    createElement: () => ({
      style: {},
      setAttribute(name, value) {
        this[name] = value;
      },
      remove() {
        this.removed = true;
      },
    }),
  };
  return {
    document,
    canvas: sourceCanvas,
    grid: { left: 10, top: 20, cols: 3, rows: 4, cell: 32 },
    battleMapDrawInset: { left: 1, top: 2, right: 3, bottom: 4 },
    images: {
      arena: { id: "arena" },
      bg: { id: "bg" },
      mask: { id: "mask" },
      tree: { id: "tree" },
      blueDown: { id: "blueDown", width: 62, height: 62 },
      playerPointer: { id: "pointer", width: 18, height: 20 },
      backup3Item: { id: "backup3Item", width: 20, height: 20 },
    },
    NindouRuntimeState: {
      getState: () => ({
        pointer: { cell: { x: 1, y: 1 } },
        objects: [
          { x: 2, y: 2, type: "rock", alive: true, breakable: true },
          { x: 0, y: 1, type: "tree", alive: true, scale: 1.5, drawAnchorY: 0.8 },
          { x: 1, y: 0, type: "hidden", alive: true, hidden: true },
        ],
        units: [
          { id: 1, team: "blue", alive: true, x: 1, y: 1, facing: "down", hp: 80, maxHp: 100, skill: 5, skillMax: 10, itemSlots: ["backup3"] },
        ],
        selectedId: 1,
        consumableEffects: [],
        ninjuDamageEffects: [],
      }),
    },
    currentRoomMapDefinition: () => ({ groundImageKey: "missing", fallbackImageKey: "bg", maskImageKey: "mask" }),
    cellRect: (x, y) => ({ x: x * 10, y: y * 10, w: 10, h: 10 }),
    cellCenter: (x, y) => ({ x: 10 + x * 32 + 16, y: 20 + y * 32 + 16 }),
    isBlockedCell: (x, y) => x === 1 && y === 1,
    selectedUnit: () => ({ x: 1, y: 1 }),
    neighbors: () => [{ x: 1, y: 2 }],
    inside: () => true,
    unitAt: () => null,
    unitLookDefinition: () => ({ spriteSet: "blue", drawEyes: true }),
    unitPosition: (unit) => ({ x: 10 + unit.x * 32 + 16, y: 20 + unit.y * 32 + 16 }),
    unitSprite: (unit) => (unit.team === "blue" ? { id: "blueDown", width: 62, height: 62 } : null),
    selectedHudUnit: () => ({ id: 1, team: "blue", alive: true, x: 1, y: 1, facing: "down", hp: 80, maxHp: 100, skill: 5, skillMax: 10, itemSlots: ["backup3"] }),
    battleUnitName: () => "忍豆",
    roomLocale: () => ({ topHudName: "忍豆", hpBadge: "體", skillBadge: "技" }),
    itemSlotStartX: 510,
    itemSlotW: 38,
    itemSlotGap: 7,
    itemSlotY: 642,
    itemSlotH: 34,
    itemIconByType: (type) => (type === "backup3" ? { id: "backup3Item", width: 20, height: 20 } : null),
    maxHp: 100,
    maxSkill: 10,
    playerUnitId: 1,
    inserted,
  };
}

function fakePixi() {
  class Application {
    constructor() {
      this.stage = { children: [], addChild: (...children) => this.stage.children.push(...children) };
      this.renderer = {
        resize: (...args) => { this.resizeArgs = args; },
        render: (...args) => { this.renderArgs = args; },
      };
    }

    async init(options) {
      this.options = options;
    }

    destroy(removeView) {
      this.destroyed = removeView;
    }
  }

  class Container {
    constructor() {
      this.children = [];
    }

    addChild(...children) {
      this.children.push(...children);
    }

    removeChildren(start = 0) {
      this.children.splice(start);
    }
  }

  class Graphics {
    constructor() {
      this.calls = [];
    }

    clear() {
      this.calls.push("clear");
    }

    rect(...args) {
      this.calls.push(["rect", ...args]);
    }

    fill(...args) {
      this.calls.push(["fill", ...args]);
    }

    stroke(...args) {
      this.calls.push(["stroke", ...args]);
    }

    circle(...args) {
      this.calls.push(["circle", ...args]);
    }
  }

  class Sprite {
    constructor(texture) {
      this.texture = texture;
    }
  }

  class Text {
    constructor(options) {
      this.options = options;
      this.anchor = { set: (...args) => { this.anchorArgs = args; } };
    }
  }

  const Texture = {
    from: (image) => ({ image }),
  };

  return { Application, Container, Graphics, Sprite, Text, Texture };
}

test("pixi renderer preference is explicit and opt-in", () => {
  assert.equal(rendererPreference({}), "canvas");
  assert.equal(shouldUsePixiRenderer(createTarget({ renderer: "pixi" })), true);
  assert.equal(shouldUsePixiRenderer({ NindouRenderer: "canvas" }), false);
});

test("installPixiRendererGlobals exposes opt-in helpers without starting Pixi", () => {
  const target = createTarget({ renderer: "pixi" });

  installPixiRendererGlobals(target);

  assert.equal(typeof target.NindouPixiRenderer, "object");
  assert.equal(target.NindouPixiRenderer.rendererPreference(), "pixi");
  assert.equal(target.NindouPixiRenderer.shouldUsePixiRenderer(), true);
  assert.equal(target.drawPixiBattleFrame(), false);
  assert.equal(target.inserted.length, 0);
});

test("createPixiBattleRenderer creates layered stage and can render a grid frame", async () => {
  const target = createTarget({ renderer: "pixi" });
  const canvas = target.document.createElement("canvas");

  const renderer = await createPixiBattleRenderer({
    target,
    canvas,
    importPixi: async () => fakePixi(),
  });

  renderer.resizeFromCanvas();
  renderer.setEnabled(true);
  renderer.renderFrame();

  assert.equal(renderer.app.stage.children.length, 6);
  assert.equal(renderer.canvas.hidden, false);
  assert.equal(target.canvas.hidden, true);
  assert.deepEqual(renderer.app.resizeArgs, [960, 680]);
  assert.equal(renderer.app.renderArgs[0], renderer.app.stage);
  assert.equal(renderer.layers.backdrop.children.length, 3);
  assert.equal(renderer.layers.backdrop.children[1].texture.image.id, "arena");
  assert.equal(renderer.layers.backdrop.children[2].texture.image.id, "mask");
  assert.equal(renderer.layers.board.children[0].calls.some((call) => Array.isArray(call) && call[0] === "fill"), true);
  assert.equal(renderer.layers.mapObjects.children.length, 2);
  assert.equal(renderer.layers.mapObjects.children[1].texture.image.id, "tree");
  assert.equal(renderer.layers.mapObjects.children[0].calls.some((call) => Array.isArray(call) && call[0] === "fill"), true);
  assert.equal(renderer.layers.units.children.some((child) => child.texture?.image?.id === "blueDown"), true);
  assert.equal(renderer.layers.hud.children.some((child) => child.texture?.image?.id === "backup3Item"), true);
});
