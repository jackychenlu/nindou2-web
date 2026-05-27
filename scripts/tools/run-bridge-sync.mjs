import { BRIDGE_MANIFEST, bridgeByKey, validateBridgeManifest } from "./bridge-manifest.mjs";
import { executeBridgeEntries } from "./bridge-execution.mjs";

validateBridgeManifest();

export async function runBridgeByKey(key, options = {}) {
  const entry = bridgeByKey(key);
  if (!entry) {
    throw new Error(`Unknown bridge key: ${key}`);
  }
  const [result] = await executeBridgeEntries([entry], options);
  return result;
}

export async function runAllBridges(options = {}) {
  return executeBridgeEntries(BRIDGE_MANIFEST, options);
}
