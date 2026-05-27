import { CLASSIC_RUNTIME_SCRIPT_PATHS } from "./classic-runtime-manifest.module.mjs";

export const CLASSIC_RUNTIME_BUNDLE_PATH = "scripts/generated/classic-runtime.bundle.js";
const BUNDLE_ONLY_ERROR_PREFIX = "Classic runtime bundle load failed";

function hasScriptLoaded(path) {
  return Boolean(document.querySelector(`script[data-classic-runtime="${path}"]`));
}

function loadScriptSequential(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = path;
    script.async = false;
    script.dataset.classicRuntime = path;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error(`Failed to load classic runtime script: ${path}`)));
    document.body.appendChild(script);
  });
}

export async function loadClassicRuntimeScripts(paths = CLASSIC_RUNTIME_SCRIPT_PATHS) {
  for (const path of paths) {
    if (hasScriptLoaded(path)) {
      continue;
    }
    await loadScriptSequential(path);
  }
}

export async function loadClassicRuntime({ allowScriptFallback = false } = {}) {
  if (CLASSIC_RUNTIME_SCRIPT_PATHS.length === 0) {
    return {
      mode: "none",
      loaded: [],
    };
  }
  if (!hasScriptLoaded(CLASSIC_RUNTIME_BUNDLE_PATH)) {
    try {
      await loadScriptSequential(CLASSIC_RUNTIME_BUNDLE_PATH);
    } catch (error) {
      if (!allowScriptFallback) {
        throw new Error(`${BUNDLE_ONLY_ERROR_PREFIX}: ${CLASSIC_RUNTIME_BUNDLE_PATH}`, { cause: error });
      }
      await loadClassicRuntimeScripts();
      return {
        mode: "scripts",
        loaded: [...CLASSIC_RUNTIME_SCRIPT_PATHS],
      };
    }
  }
  return {
    mode: "bundle",
    loaded: [CLASSIC_RUNTIME_BUNDLE_PATH],
  };
}
