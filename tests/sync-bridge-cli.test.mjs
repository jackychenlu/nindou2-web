import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../scripts/tools/sync-bridge.mjs";

test("parseArgs defaults to all", () => {
  assert.deepEqual(parseArgs([]), {
    key: "all",
    shouldList: false,
    shouldValidate: false,
    outputJson: false,
    dryRun: false,
  });
});

test("parseArgs reads --key value", () => {
  assert.equal(parseArgs(["--key", "map"]).key, "map");
});

test("parseArgs reads --key=value", () => {
  assert.equal(parseArgs(["--key=rule-modes"]).key, "rule-modes");
});

test("parseArgs supports --list and --validate flags", () => {
  const options = parseArgs(["--list", "--validate"]);
  assert.equal(options.shouldList, true);
  assert.equal(options.shouldValidate, true);
});

test("parseArgs supports --json flag", () => {
  const options = parseArgs(["--json"]);
  assert.equal(options.outputJson, true);
});

test("parseArgs supports --dry-run flag", () => {
  const options = parseArgs(["--dry-run"]);
  assert.equal(options.dryRun, true);
});
