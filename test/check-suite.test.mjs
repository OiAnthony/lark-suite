import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("the generated suite mirror passes structural checks", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["scripts/check-suite.mjs"]);
  assert.match(stdout, /lark-suite with \d+ domain guides/);
});
