import { access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLASSIC_RUNTIME_SCRIPT_PATHS } from "../classic-runtime-manifest.module.mjs";
import {
  CLASSIC_RUNTIME_BUNDLE_PATH,
  buildClassicRuntimeBundle,
} from "./build-classic-runtime-bundle.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function repoFile(relativePath) {
  return path.join(repoRoot, relativePath);
}

export function bundleSourcePaths() {
  return [
    "scripts/classic-runtime-manifest.module.mjs",
    ...CLASSIC_RUNTIME_SCRIPT_PATHS,
  ];
}

export function isBundleStaleFromStats(bundleMtimeMs, sourceMtimeMsList) {
  return sourceMtimeMsList.some((mtimeMs) => mtimeMs > bundleMtimeMs);
}

export async function shouldRebuildClassicRuntimeBundle() {
  const bundlePath = repoFile(CLASSIC_RUNTIME_BUNDLE_PATH);
  if (CLASSIC_RUNTIME_SCRIPT_PATHS.length === 0) {
    try {
      await access(bundlePath);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await access(bundlePath);
  } catch {
    return true;
  }

  const bundleInfo = await stat(bundlePath);
  const sourceStats = await Promise.all(
    bundleSourcePaths().map((relativePath) => stat(repoFile(relativePath))),
  );
  return isBundleStaleFromStats(
    bundleInfo.mtimeMs,
    sourceStats.map((info) => info.mtimeMs),
  );
}

export async function ensureClassicRuntimeBundle({ quiet = false } = {}) {
  const rebuilt = await shouldRebuildClassicRuntimeBundle();
  if (!rebuilt) {
    if (!quiet) {
      console.log(JSON.stringify({
        ok: true,
        rebuilt: false,
        bundlePath: CLASSIC_RUNTIME_BUNDLE_PATH,
      }, null, 2));
    }
    return {
      rebuilt: false,
      bundlePath: CLASSIC_RUNTIME_SCRIPT_PATHS.length === 0 ? null : CLASSIC_RUNTIME_BUNDLE_PATH,
      scriptCount: CLASSIC_RUNTIME_SCRIPT_PATHS.length,
      skipped: CLASSIC_RUNTIME_SCRIPT_PATHS.length === 0,
    };
  }

  const buildResult = await buildClassicRuntimeBundle();
  const result = {
    rebuilt: true,
    ...buildResult,
  };
  if (!quiet) {
    console.log(JSON.stringify(result, null, 2));
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const quiet = process.argv.includes("--quiet");
  ensureClassicRuntimeBundle({ quiet }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
