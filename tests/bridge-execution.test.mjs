import test from "node:test";
import assert from "node:assert/strict";

import { executeBridgeEntries } from "../scripts/tools/bridge-execution.mjs";

test("bridge execution returns deterministic result metadata", async () => {
  const calls = [];
  const entries = [
    {
      key: "a",
      generate: async () => { calls.push("a"); },
    },
    {
      key: "b",
      generate: async () => { calls.push("b"); },
    },
  ];
  const results = await executeBridgeEntries(entries);
  assert.deepEqual(calls, ["a", "b"]);
  assert.equal(results.length, 2);
  assert.equal(results[0].key, "a");
  assert.equal(results[0].mode, "generate");
  assert.equal(results[0].dryRun, false);
  assert.equal(results[0].changed, null);
  assert.equal(typeof results[0].startedAt, "string");
  assert.equal(typeof results[0].finishedAt, "string");
});
