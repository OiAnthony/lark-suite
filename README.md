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

更新由 `npx skills` 管理，不需要重新运行 `lark-cli update`。本仓库每天使用官方 CLI 生成 suite layout；变更会先通过 GitHub Actions 校验并创建 Pull Request。

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

## 范围

- `skills/lark-suite/SKILL.md` 和 `references/*/GUIDE.md` 是官方 CLI 生成的发布产物。
- `sync-state.json` 记录生成所用的 CLI release 和官方 domain 数量，不记录用户凭证或本机路径。
- 本仓库不重新实现 Lark API，也不维护领域指南的独立 fork。

## 许可

生成的指南派生自 [`larksuite/cli`](https://github.com/larksuite/cli)，采用其适用的 MIT license。本仓库是独立的公共镜像。
