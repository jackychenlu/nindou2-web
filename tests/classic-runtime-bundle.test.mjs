import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildClassicRuntimeBundle } from "../scripts/tools/build-classic-runtime-bundle.mjs";

const repoRoot = path.resolve(process.cwd());
const bundlePath = path.join(repoRoot, "scripts/generated/classic-runtime.bundle.js");

test("classic runtime bundle is omitted when manifest has no runtime scripts", async () => {
  const result = await buildClassicRuntimeBundle();
  assert.equal(result.scriptCount, 0);
  assert.equal(result.skipped, true);
  assert.equal(fs.existsSync(bundlePath), false);
});
