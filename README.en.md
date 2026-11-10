# Lark Suite

Versioned public mirror of the official Lark CLI `suite` layout.

## Install

```bash
npx skills add OiAnthony/lark-suite --skill lark-suite -g -y -a universal
```

This installs into the user-global skill directory `~/.agents/skills/lark-suite`. `-g` selects the global scope, and `-a universal` targets the canonical directory shared across agents, so writing that single location makes the skill visible to every agent that reads `~/.agents/skills`. Do not drop the flag: without it the CLI also fans the same skill out to the remaining `.agents/skills`-based agents and reports an extra PromptScript global-install failure (that agent has no global directory; see [vercel-labs/skills#1352](https://github.com/vercel-labs/skills/issues/1352)).

`npx skills` records this repository as the global skill source and tracks the `lark-suite` directory hash in the skill lock. Domain guides live under one skill's `references/` directory and are not discovered as standalone skills.

## Update

```bash
npx skills update lark-suite -g -y
```

Updates are managed by `npx skills`; users do not need to run `lark-cli update` again. This repository regenerates the suite layout daily with the official CLI. After local validation, the workflow opens a pull request and enables auto-merge. GitHub squash-merges it only after the branch protection requirements pass.

## Local maintenance

Requirements: Node.js 22.20 or later and the official `lark-cli` binary.

```bash
npm install --global @larksuite/cli@latest
npm run sync
npm test
npm run check
npx skills add . --list
```

`npm run sync` runs `lark-cli update --skills-layout suite --force --json` in a temporary `HOME`, then copies only the generated `lark-suite` skill and release state. It does not modify the current user's CLI, auth configuration, or global skills.

## Configure automatic synchronization merges

1. Create a GitHub App with repository permissions `Contents: Read and write` and `Pull requests: Read and write`, and install it only on this repository.
2. Add the Actions repository variable `SYNC_APP_ID` (the App ID) and secret `SYNC_APP_PRIVATE_KEY` (the full PEM private key). Never commit the private key.
3. Enable Allow auto-merge. Keep `master` protected with required checks `verify` and `sync-scope`, require branches to be up to date, and enforce the rules for administrators. The App does not need a branch protection bypass.
4. After merging the workflow changes into `master`, run `Sync official Lark suite skill`. When generated content changes, it uses a short-lived App token to create or update a PR and enable auto-merge. Missing App configuration fails the workflow; it does not fall back to the default token.

`verify` runs the tests, validates the artifacts, and checks skill discovery. `sync-scope` runs only for `automation/sync-lark-suite`. It rejects fork sources and changes outside `skills/**` and `sync-state.json`, including both sides of renames. The validator comes from the PR base branch, not the modified PR scripts. Other branches skip this scope check but must still pass `verify`.

Validate the configuration:

```bash
actionlint .github/workflows/ci.yml .github/workflows/sync.yml
npm test
gh pr checks <PR-number>
gh pr view <PR-number> --json autoMergeRequest,mergeStateStatus
```

Local checks should pass. On a synchronization PR, both `verify` and `sync-scope` should pass, and auto-merge should be enabled or the PR should already be merged. Enabling auto-merge on an existing PR without a new commit does not rerun historical checks. Resolve any approval requirement shown on the Actions page, or inspect the new run after a later synchronization updates the PR commit.

## Scope

- `skills/lark-suite/SKILL.md` and `references/*/GUIDE.md` are generated release artifacts from the official CLI.
- `sync-state.json` records the CLI release and official domain count used to generate the mirror; it contains no credentials or local paths.
- This repository does not reimplement Lark APIs or maintain an independent fork of each domain guide.

## License

Generated guides are derived from [`larksuite/cli`](https://github.com/larksuite/cli) and use its applicable MIT license. This repository is an independent public mirror.
