import { runAllBridges, runBridgeByKey } from "./run-bridge-sync.mjs";
import { fileURLToPath } from "node:url";
import { listBridgeKeys, validateBridgeManifest } from "./bridge-manifest.mjs";

export function parseArgs(argv) {
  const options = {
    key: "all",
    shouldList: false,
    shouldValidate: false,
    outputJson: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--list") {
      options.shouldList = true;
      continue;
    }
    if (token === "--validate") {
      options.shouldValidate = true;
      continue;
    }
    if (token === "--json") {
      options.outputJson = true;
      continue;
    }
    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (token === "--key" && i + 1 < argv.length) {
      options.key = argv[i + 1];
      continue;
    }
    if (token.startsWith("--key=")) {
      options.key = token.slice("--key=".length);
    }
  }
  return options;
}

export async function runSyncCli(argv) {
  const { key, shouldList, shouldValidate, outputJson, dryRun } = parseArgs(argv);
  if (shouldList) {
    console.log(listBridgeKeys().join("\n"));
    return;
  }
  if (shouldValidate) {
    validateBridgeManifest();
    return;
  }
  let results = [];
  if (key === "all") {
    results = await runAllBridges({ dryRun });
  } else {
    const result = await runBridgeByKey(key, { dryRun });
    results = [result];
  }
  if (outputJson) {
    console.log(JSON.stringify({ count: results.length, results }, null, 2));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await runSyncCli(process.argv.slice(2));
}
