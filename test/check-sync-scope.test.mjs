import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const validator = fileURLToPath(new URL("../scripts/check-sync-scope.mjs", import.meta.url));

function repository(t) {
  const cwd = mkdtempSync(join(tmpdir(), "lark-sync-scope-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8" }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Scope test");
  git("config", "user.email", "scope-test@example.invalid");
  const write = (path, text) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), text);
  };
  const commit = () => {
    git("add", ".");
    git("commit", "--quiet", "-m", "fixture");
    return git("rev-parse", "HEAD");
  };
  write("README.md", "project documentation\n");
  write("skills/lark-suite/SKILL.md", "original skill\n");
  const base = commit();
  const check = (head, comparisonBase = base) => spawnSync(process.execPath, [validator, comparisonBase, head], { cwd, encoding: "utf8" });
  return { git, write, commit, base, check };
}

test("accepts generated skill changes, new paths, and release state", (t) => {
  const repo = repository(t);
  repo.write("skills/lark-suite/SKILL.md", "updated skill\n");
  repo.write("skills/lark-suite/references/new guide\nwith newline.md", "guide\n");
  repo.write("sync-state.json", "{}\n");
  const result = repo.check(repo.commit());
  assert.equal(result.status, 0, result.stderr);
});

test("rejects workflow changes mixed with generated content", (t) => {
  const repo = repository(t);
  repo.write("skills/lark-suite/SKILL.md", "updated skill\n");
  repo.write(".github/workflows/ci.yml", "modified workflow\n");
  const result = repo.check(repo.commit());
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /\.github\/workflows\/ci\.yml/);
});

test("rejects moving an out-of-scope file into the allowed tree", (t) => {
  const repo = repository(t);
  repo.git("mv", "README.md", "skills/README.md");
  const result = repo.check(repo.commit());
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /"README\.md"/);
});

test("rejects moving generated content outside the allowed tree", (t) => {
  const repo = repository(t);
  repo.git("mv", "skills/lark-suite/SKILL.md", "SKILL.md");
  const result = repo.check(repo.commit());
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /"SKILL\.md"/);
});

test("compares the PR diff rather than unrelated changes on the base branch", (t) => {
  const repo = repository(t);
  repo.write("skills/lark-suite/SKILL.md", "updated skill\n");
  const head = repo.commit();
  repo.git("checkout", "--quiet", "--detach", repo.base);
  repo.write("README.md", "documentation changed on base\n");
  const newerBase = repo.commit();
  const result = repo.check(head, newerBase);
  assert.equal(result.status, 0, result.stderr);
});

test("fails closed when a comparison commit cannot be resolved", (t) => {
  const repo = repository(t);
  const result = repo.check("0000000000000000000000000000000000000000");
  assert.notEqual(result.status, 0);
});
