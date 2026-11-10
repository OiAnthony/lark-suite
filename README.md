# Lark Suite

这是官方 Lark CLI `suite` layout 的可版本化公共镜像。

## 安装

```bash
npx skills add OiAnthony/lark-suite --skill lark-suite -g -y -a universal
```

安装到用户全局 skill 目录 `~/.agents/skills/lark-suite`。`-g` 指定全局作用域，`-a universal` 直接指向跨 agent 共享的 canonical 目录，因此只写这一处即可被所有读取 `~/.agents/skills` 的 agent 发现；不建议省略该参数，否则 CLI 还会把同一份 skill 扩散到其余基于 `.agents/skills` 的 agent，并额外报告一条 PromptScript 不支持全局安装的失败（该 agent 无全局目录，详见 [vercel-labs/skills#1352](https://github.com/vercel-labs/skills/issues/1352)）。

安装后，`npx skills` 会在全局 skill lock 中记录本仓库来源和 `lark-suite` 目录 hash。领域文档收纳在同一个 skill 的 `references/` 下，不会被发现为独立 skill。

## 更新

```bash
npx skills update lark-suite -g -y
```

更新由 `npx skills` 管理，不需要重新运行 `lark-cli update`。本仓库每天使用官方 CLI 生成 suite layout；变更通过本地校验后创建 Pull Request，并启用 Auto-merge。GitHub 会等待分支保护要求的检查通过，再以 squash 方式合并。

## 本地维护

环境要求：Node.js 22.20 或更高版本、官方 `lark-cli` binary。

```bash
npm install --global @larksuite/cli@latest
npm run sync
npm test
npm run check
npx skills add . --list
```

`npm run sync` 会在临时 `HOME` 中运行 `lark-cli update --skills-layout suite --force --json`，然后只复制生成的 `lark-suite` skill 和 release 状态；不会修改当前用户的 CLI、认证配置或 global skills。

## 配置自动同步合并

1. 创建 GitHub App，仅授予仓库权限 `Contents: Read and write`、`Pull requests: Read and write`，并仅安装到本仓库。
2. 在仓库 Actions 配置中添加变量 `SYNC_APP_ID`（App ID）和 secret `SYNC_APP_PRIVATE_KEY`（App 私钥的完整 PEM 内容）。不要把私钥提交到仓库。
3. 开启仓库的 Allow auto-merge。保留 `master` 分支保护：必需检查为 `verify`、`sync-scope`，要求分支为最新，并对管理员生效。App 不需要绕过分支保护的权限。
4. 将工作流变更合入 `master` 后，运行 `Sync official Lark suite skill`。有生成内容变更时，它会使用短期 App token 创建或更新 PR，并开启 Auto-merge。缺少 App 配置时，工作流会失败，不会退回默认 token。

`verify` 执行测试、产物校验和 skill 发现检查。`sync-scope` 只检查 `automation/sync-lark-suite` 分支，拒绝 fork 来源及 `skills/**`、`sync-state.json` 以外的改动，重命名的两端也会检查。校验脚本取自 PR 的基分支，不执行 PR 中修改后的脚本。其他分支跳过范围检查，但仍须通过 `verify`。

验证配置：

```bash
actionlint .github/workflows/ci.yml .github/workflows/sync.yml
npm test
gh pr checks <PR编号>
gh pr view <PR编号> --json autoMergeRequest,mergeStateStatus
```

本地检查应全部成功；远端同步 PR 应显示 `verify` 和 `sync-scope` 成功，并已启用 Auto-merge，或已自动合并。已有 PR 若没有新提交，开启 Auto-merge 不会重新触发其历史检查，需先处理 Actions 页面显示的批准要求，或在后续同步更新提交后检查新的运行。

## 范围

- `skills/lark-suite/SKILL.md` 和 `references/*/GUIDE.md` 是官方 CLI 生成的发布产物。
- `sync-state.json` 记录生成所用的 CLI release 和官方 domain 数量，不记录用户凭证或本机路径。
- 本仓库不重新实现 Lark API，也不维护领域指南的独立 fork。

## 许可

生成的指南派生自 [`larksuite/cli`](https://github.com/larksuite/cli)，采用其适用的 MIT license。本仓库是独立的公共镜像。
