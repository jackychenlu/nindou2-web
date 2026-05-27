import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  CONFIG_BRIDGE_END_MARKER,
  CONFIG_BRIDGE_START_MARKER,
  CONFIG_LITERAL_KEYS,
  CONFIG_SCALAR_KEYS,
  NINDOU_CONFIG_EXPORT_KEYS,
} from "./config-bridge-spec.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function toLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function buildConfigAssignments(configModule, keys, serializer) {
  return keys.map((key) => `const ${key} = ${serializer(configModule[key])};`).join("\n");
}

export function buildConfigBridgeBlock(configModule) {
  const literalAssignments = buildConfigAssignments(configModule, CONFIG_LITERAL_KEYS, toLiteral);
  const scalarAssignments = buildConfigAssignments(configModule, CONFIG_SCALAR_KEYS, String);
  const configExports = NINDOU_CONFIG_EXPORT_KEYS.join(",\n  ");
  return `${CONFIG_BRIDGE_START_MARKER}
// AUTO-GENERATED SECTION.
// Source: scripts/data/config.module.mjs
// Run: npm run sync:config-nindou
${literalAssignments}
${scalarAssignments}
function roomMapDefinitionEntries() {
  return Object.entries(roomMapDefinitions);
}

globalThis.NindouConfig = {
  ${configExports},
};
${CONFIG_BRIDGE_END_MARKER}`;
}

export async function generateConfigBridgeSection() {
  const modulePath = path.join(repoRoot, "scripts", "data", "config.module.mjs");
  const classicPath = path.join(repoRoot, "scripts", "data", "config.js");
  const configModule = await import(pathToFileURL(modulePath).href);
  const source = await fs.readFile(classicPath, "utf8");
  const start = source.indexOf(CONFIG_BRIDGE_START_MARKER);
  const end = source.indexOf(CONFIG_BRIDGE_END_MARKER);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Config bridge markers not found in scripts/data/config.js");
  }
  const before = source.slice(0, start);
  const after = source.slice(end + CONFIG_BRIDGE_END_MARKER.length);
  const block = buildConfigBridgeBlock(configModule);
  await fs.writeFile(classicPath, `${before}${block}${after}`, "utf8");
}
