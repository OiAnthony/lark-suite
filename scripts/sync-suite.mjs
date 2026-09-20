import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(repoRoot, "skills", "lark-suite");
const temporaryHome = await mkdtemp(join(tmpdir(), "lark-suite-sync-"));

function run(command, args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with ${code}`));
        return;
      }
      resolvePromise(stdout);
    });
  });
}

try {
  const env = {
    ...process.env,
    HOME: temporaryHome,
    XDG_CONFIG_HOME: join(temporaryHome, ".config"),
    XDG_DATA_HOME: join(temporaryHome, ".local", "share"),
  };
  const output = await run("lark-cli", ["update", "--skills-layout", "suite", "--force", "--json"], env);
  const result = JSON.parse(output);
  if (!result.ok || result.skills_summary?.layout !== "suite") {
    throw new Error(`Unexpected lark-cli update response: ${output.trim()}`);
  }

  await rm(destination, { recursive: true, force: true });
  await cp(join(temporaryHome, ".agents", "skills", "lark-suite"), destination, {
    recursive: true,
    dereference: true,
  });

  // The current official generator emits this link relative to the source tree.
  // Rewrite it to the sibling guide path used by the published suite layout.
  const skillMakerGuide = join(destination, "references", "lark-skill-maker", "GUIDE.md");
  const skillMakerText = await readFile(skillMakerGuide, "utf8");
  await writeFile(
    skillMakerGuide,
    skillMakerText.replaceAll("../lark-suite/references/lark-shared/GUIDE.md", "../lark-shared/GUIDE.md"),
  );

  const state = {
    source: "larksuite/cli",
    cliVersion: result.current_version,
    releaseUrl: result.url,
    skillsLayout: result.skills_summary.layout,
    officialDomainCount: result.skills_summary.official,
    localPathRepairs: [
      "references/lark-skill-maker/GUIDE.md: ../lark-suite/references/lark-shared/GUIDE.md -> ../lark-shared/GUIDE.md",
    ],
  };
  await writeFile(join(repoRoot, "sync-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify(state));
} finally {
  await rm(temporaryHome, { recursive: true, force: true });
}
