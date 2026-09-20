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

Updates are managed by `npx skills`; users do not need to run `lark-cli update` again. This repository regenerates the suite layout daily with the official CLI, and GitHub Actions validates changes before opening a pull request.

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

## Scope

- `skills/lark-suite/SKILL.md` and `references/*/GUIDE.md` are generated release artifacts from the official CLI.
- `sync-state.json` records the CLI release and official domain count used to generate the mirror; it contains no credentials or local paths.
- This repository does not reimplement Lark APIs or maintain an independent fork of each domain guide.

## License

Generated guides are derived from [`larksuite/cli`](https://github.com/larksuite/cli) and use its applicable MIT license. This repository is an independent public mirror.
