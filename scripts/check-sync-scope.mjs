import { execFileSync } from "node:child_process";

const [base, head] = process.argv.slice(2);
if (!base || !head || process.argv.length !== 4) {
  throw new Error("Usage: node scripts/check-sync-scope.mjs <base> <head>");
}

const paths = execFileSync("git", [
  "diff", "--no-ext-diff", "--name-only", "--no-renames", "-z", `${base}...${head}`, "--",
], { encoding: "utf8" }).split("\0").filter(Boolean);
const unexpected = paths.filter((path) => path !== "sync-state.json" && !path.startsWith("skills/"));
if (unexpected.length > 0) {
  console.error(`Synchronization changes outside the allowed scope: ${unexpected.map((path) => JSON.stringify(path)).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated synchronization scope for ${paths.length} changed paths.`);
}
