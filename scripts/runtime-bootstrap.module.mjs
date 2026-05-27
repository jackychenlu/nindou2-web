import { CLASSIC_RUNTIME_SCRIPT_PATHS } from "./classic-runtime-manifest.module.mjs";
import { loadClassicRuntime } from "./load-classic-runtime.module.mjs";
import { installAppearanceGlobals } from "./bootstrap/install-appearance-globals.module.mjs";
import { installAppBootstrapGlobals } from "./bootstrap/install-app-bootstrap-globals.module.mjs";
import { installAssetGlobals } from "./bootstrap/install-assets-globals.module.mjs";
import { installAssetLoaderGlobals } from "./bootstrap/install-asset-loader-globals.module.mjs";
import { installAiGlobals } from "./bootstrap/install-ai-globals.module.mjs";
import { installAudioGlobals } from "./bootstrap/install-audio-globals.module.mjs";
import { installBattleInputGlobals } from "./bootstrap/install-battle-input-globals.module.mjs";
import { installBattleRuntimeGlobals } from "./bootstrap/install-battle-runtime-globals.module.mjs";
import { installBattleSetupGlobals } from "./bootstrap/install-battle-setup-globals.module.mjs";
import { installCombatRendererGlobals } from "./bootstrap/install-combat-renderer-globals.module.mjs";
import { installCombatGlobals } from "./bootstrap/install-combat-globals.module.mjs";
import { installConfigGlobals } from "./bootstrap/install-config-globals.module.mjs";
import { installConsumablesGlobals } from "./bootstrap/install-consumables-globals.module.mjs";
import { installEffectsRendererGlobals } from "./bootstrap/install-effects-renderer-globals.module.mjs";
import { installGameGlobals } from "./bootstrap/install-game-globals.module.mjs";
import { installGameFlowGlobals } from "./bootstrap/install-game-flow-globals.module.mjs";
import { installGridGlobals } from "./bootstrap/install-grid-globals.module.mjs";
import { installHudRendererGlobals } from "./bootstrap/install-hud-renderer-globals.module.mjs";
import { installLocaleGlobals } from "./bootstrap/install-locales-globals.module.mjs";
import { installMapGlobals } from "./bootstrap/install-map-globals.module.mjs";
import { installMatchGlobals } from "./bootstrap/install-match-globals.module.mjs";
import { installMovementGlobals } from "./bootstrap/install-movement-globals.module.mjs";
import { installMovementRendererGlobals } from "./bootstrap/install-movement-renderer-globals.module.mjs";
import { installNinjutsuGlobals } from "./bootstrap/install-ninjutsu-globals.module.mjs";
import { installOverlayRendererGlobals } from "./bootstrap/install-overlay-renderer-globals.module.mjs";
import { installRenderTuningGlobals } from "./bootstrap/install-render-tuning-globals.module.mjs";
import { installRoomUiGlobals } from "./bootstrap/install-room-ui-globals.module.mjs";
import { installRuleModeGlobals } from "./bootstrap/install-rule-modes-globals.module.mjs";
import { installSceneRendererGlobals } from "./bootstrap/install-scene-renderer-globals.module.mjs";
import { installStateHelpersGlobals } from "./bootstrap/install-state-helpers-globals.module.mjs";
import { installStatusUiGlobals } from "./bootstrap/install-status-ui-globals.module.mjs";
import { installUnitRendererGlobals } from "./bootstrap/install-unit-renderer-globals.module.mjs";
import { installWeaponGlobals } from "./bootstrap/install-weapons-globals.module.mjs";
import { startClassicApp } from "./bootstrap/start-classic-app.module.mjs";
import { runDefaultModuleProbe } from "./probe/module-probe-entry.module.mjs";

export const RUNTIME_MODE_CLASSIC = "classic";
export const RUNTIME_MODE_MODULE = "module";

export const REQUIRED_CLASSIC_GLOBALS = Object.freeze([
  "NindouConfig",
  "NindouWeapons",
  "NindouNinjutsu",
  "NindouLocales",
  "NindouMaps",
  "NindouAssets",
  "NindouAssetLoader",
  "NindouRuleModes",
  "NindouRoomUi",
  "NindouAppearance",
  "NindouStateHelpers",
  "NindouGrid",
  "NindouGameFlow",
  "NindouAudio",
  "NindouBattleRuntime",
  "NindouBattleInput",
  "NindouBattleSetup",
  "NindouMatch",
  "NindouConsumables",
  "NindouMovement",
  "NindouMovementRenderer",
  "NindouSceneRenderer",
  "NindouOverlayRenderer",
  "NindouEffectsRenderer",
  "NindouStatusUi",
  "NindouCombatRenderer",
  "NindouHudRenderer",
  "NindouUnitRenderer",
  "NindouAi",
  "NindouCombat",
  "NindouRuntimeState",
  "NindouGame",
]);

function documentRuntimeMode(target) {
  const mode = target?.document?.documentElement?.dataset?.nindouRuntimeMode;
  return typeof mode === "string" ? mode.trim().toLowerCase() : "";
}

export function resolveRuntimeMode(target = globalThis) {
  const explicit = typeof target.NindouRuntimeMode === "string"
    ? target.NindouRuntimeMode.trim().toLowerCase()
    : "";
  const mode = explicit || documentRuntimeMode(target);
  if (mode === RUNTIME_MODE_MODULE) {
    return RUNTIME_MODE_MODULE;
  }
  return RUNTIME_MODE_CLASSIC;
}

export function missingClassicGlobals(target = globalThis, required = REQUIRED_CLASSIC_GLOBALS) {
  return required.filter((key) => typeof target[key] === "undefined");
}

export async function bootstrapRuntime({
  target = globalThis,
  mode = resolveRuntimeMode(target),
  scriptPaths = CLASSIC_RUNTIME_SCRIPT_PATHS, // kept for compatibility metadata
  allowScriptFallback = false,
  warn = console.warn,
} = {}) {
  let loadedScriptCount = 0;
  let loadMode = "none";
  let appStarted = false;
  if (mode === RUNTIME_MODE_CLASSIC) {
    installConfigGlobals(target);
    installAssetGlobals(target);
    installAssetLoaderGlobals(target);
    installAppearanceGlobals(target);
    installWeaponGlobals(target);
    installNinjutsuGlobals(target);
    installGameGlobals(target);
    installRenderTuningGlobals(target);
    installLocaleGlobals(target);
    installMapGlobals(target);
    installRuleModeGlobals(target);
    installRoomUiGlobals(target);
    installStateHelpersGlobals(target);
    installGridGlobals(target);
    installGameFlowGlobals(target);
    installAudioGlobals(target);
    installBattleRuntimeGlobals(target);
    installBattleInputGlobals(target);
    installBattleSetupGlobals(target);
    installMatchGlobals(target);
    installConsumablesGlobals(target);
    installMovementGlobals(target);
    installCombatGlobals(target);
    installAiGlobals(target);
    installSceneRendererGlobals(target);
    installOverlayRendererGlobals(target);
    installEffectsRendererGlobals(target);
    installStatusUiGlobals(target);
    installMovementRendererGlobals(target);
    installUnitRendererGlobals(target);
    installCombatRendererGlobals(target);
    installHudRendererGlobals(target);
    const loadResult = await loadClassicRuntime({ allowScriptFallback });
    loadMode = loadResult.mode;
    loadedScriptCount = loadResult.loaded.length;
    installAppBootstrapGlobals(target);
    appStarted = startClassicApp(target);
  }
  const missingGlobals = mode === RUNTIME_MODE_CLASSIC ? missingClassicGlobals(target) : [];
  if (missingGlobals.length > 0) {
    warn(`[nindou-runtime] missing classic globals: ${missingGlobals.join(", ")}`);
  }
  const probeRuntime = runDefaultModuleProbe({ target, warn });
  return {
    mode,
    loadMode,
    loadedScriptCount,
    appStarted,
    missingGlobals,
    isReady: missingGlobals.length === 0,
    probeRuntime,
  };
}
