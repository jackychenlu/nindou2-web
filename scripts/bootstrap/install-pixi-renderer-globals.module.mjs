import {
  createPixiBattleRenderer,
  ensurePixiCanvas,
  rendererPreference,
  shouldUsePixiRenderer,
} from "../rendering/pixi-battle-renderer.module.mjs";

export function installPixiRendererGlobals(target = globalThis) {
  let rendererPromise = null;

  function queryRendererToggle() {
    return target.document?.querySelector?.("#rendererToggle") || null;
  }

  function setRendererPreference(renderer) {
    const nextRenderer = renderer === "pixi" ? "pixi" : "canvas";
    target.NindouRenderer = nextRenderer;
    if (target.document?.documentElement?.dataset) {
      target.document.documentElement.dataset.nindouRenderer = nextRenderer;
    }
    updateBattleRendererToggle();
    return nextRenderer;
  }

  function updateBattleRendererToggle() {
    const toggle = queryRendererToggle();
    const preference = rendererPreference(target);
    if (!toggle) return preference;
    const isPixi = preference === "pixi";
    toggle.textContent = isPixi ? "Pixi" : "Canvas";
    toggle.setAttribute("aria-pressed", isPixi ? "true" : "false");
    toggle.setAttribute("title", isPixi ? "目前使用 Pixi renderer" : "目前使用 Canvas renderer");
    return preference;
  }

  async function getPixiBattleRenderer() {
    if (!rendererPromise) {
      rendererPromise = createPixiBattleRenderer({ target });
    }
    return rendererPromise;
  }

  async function enablePixiBattleRenderer() {
    setRendererPreference("pixi");
    const renderer = await getPixiBattleRenderer();
    renderer.resizeFromCanvas();
    renderer.setEnabled(true);
    updateBattleRendererToggle();
    return renderer;
  }

  async function disablePixiBattleRenderer() {
    setRendererPreference("canvas");
    if (!rendererPromise) return null;
    const renderer = await rendererPromise;
    renderer.setEnabled(false);
    updateBattleRendererToggle();
    return renderer;
  }

  async function toggleBattleRenderer() {
    if (rendererPreference(target) === "pixi") {
      await disablePixiBattleRenderer();
      return "canvas";
    }
    await enablePixiBattleRenderer();
    return "pixi";
  }

  function drawPixiBattleFrame() {
    if (!rendererPromise) return false;
    rendererPromise.then((renderer) => {
      if (!renderer.canvas.hidden) renderer.renderFrame();
    });
    return true;
  }

  Object.assign(target, {
    ensurePixiCanvas: () => ensurePixiCanvas(target),
    getPixiBattleRenderer,
    enablePixiBattleRenderer,
    disablePixiBattleRenderer,
    toggleBattleRenderer,
    setRendererPreference,
    updateBattleRendererToggle,
    drawPixiBattleFrame,
  });

  target.NindouPixiRenderer = {
    rendererPreference: () => rendererPreference(target),
    shouldUsePixiRenderer: () => shouldUsePixiRenderer(target),
    ensurePixiCanvas: () => ensurePixiCanvas(target),
    getPixiBattleRenderer,
    enablePixiBattleRenderer,
    disablePixiBattleRenderer,
    toggleBattleRenderer,
    setRendererPreference,
    updateBattleRendererToggle,
    drawPixiBattleFrame,
  };

  updateBattleRendererToggle();
}
