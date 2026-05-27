import { generateClassicBridge } from "./classic-bridge-generator.mjs";
import fs from "node:fs/promises";

export async function executeBridgeEntry(entry, options = {}) {
  const { dryRun = false } = options;
  const startedAt = new Date().toISOString();
  let changed = null;
  if (typeof entry.generate === "function") {
    await entry.generate({ dryRun });
    return {
      key: entry.key,
      mode: "generate",
      dryRun,
      changed,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }
  if (dryRun) {
    const current = await fs.readFile(entry.classicRelativePath, "utf8");
    const { output } = await generateClassicBridge({
      ...entry,
      write: false,
    });
    changed = current !== output;
  } else {
    await generateClassicBridge(entry);
  }
  return {
    key: entry.key,
    mode: "transform",
    dryRun,
    changed,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

export async function executeBridgeEntries(entries, options = {}) {
  const results = [];
  for (const entry of entries) {
    // Keep deterministic order for stable diffs/logs.
    // Bridges may have implicit dependencies via shared source modules.
    const result = await executeBridgeEntry(entry, options);
    results.push(result);
  }
  return results;
}
