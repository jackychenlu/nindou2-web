import { BRIDGE_REGISTRY, BRIDGE_REGISTRY_ORDER } from "./bridge-definitions/bridge-registry.mjs";
import { DATA_BRIDGE_KEYS } from "../shared/data-domain-manifest.module.mjs";

export const BRIDGE_MANIFEST = BRIDGE_REGISTRY_ORDER.map((key) => BRIDGE_REGISTRY[key]);
export const BRIDGE_KEYS = BRIDGE_MANIFEST.map((entry) => entry.key);

export function validateBridgeManifest(manifest = BRIDGE_MANIFEST) {
  const seenKeys = new Set();
  for (const entry of manifest) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Bridge manifest entry must be an object");
    }
    if (typeof entry.key !== "string" || !entry.key.length) {
      throw new Error("Bridge manifest entry missing key");
    }
    if (seenKeys.has(entry.key)) {
      throw new Error(`Duplicate bridge key: ${entry.key}`);
    }
    seenKeys.add(entry.key);
    if (typeof entry.moduleRelativePath !== "string" || typeof entry.classicRelativePath !== "string") {
      throw new Error(`Bridge ${entry.key} missing module/classic path`);
    }
    if (typeof entry.runScriptName !== "string" || !entry.runScriptName.length) {
      throw new Error(`Bridge ${entry.key} missing runScriptName`);
    }
    const hasGenerate = typeof entry.generate === "function";
    const hasTransform = typeof entry.transform === "function";
    if (!hasGenerate && !hasTransform) {
      throw new Error(`Bridge ${entry.key} needs generate or transform`);
    }
  }
  const keys = manifest.map((entry) => entry.key);
  for (const requiredKey of DATA_BRIDGE_KEYS) {
    if (!keys.includes(requiredKey)) {
      throw new Error(`Bridge manifest missing required data bridge: ${requiredKey}`);
    }
  }
  return true;
}

export function bridgeByKey(key) {
  return BRIDGE_MANIFEST.find((entry) => entry.key === key) || null;
}

export function listBridgeKeys() {
  return BRIDGE_KEYS.slice();
}
