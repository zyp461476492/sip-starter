> 一句话：append-only 时间线。每次会话一条，前缀固定，可 grep。

# journal

格式固定，便于 `grep "^## \[" journal.md | tail -5`：

```markdown
## [YYYY-MM-DD] 里程碑 | 标题
- 做：
- 变：
- 留：
```

---

## [2026-11-12] M1 | 目录骨架 + rfc3261 入库 + 站点三视图

- 做：`sip/ media/ wiki/ plan/ vocab/ site/ docs/ scripts/` 骨架；`AGENTS.md`；`docs/` 全套
  （ADR 0001–0003 + memory 四件）；rfc3261.txt 入库并记 sha256；`wiki/` 三页样板
  （concepts/transaction、messages/headers/via、flows/basic-call）；`vocab/terms.yaml` 5 条；
  `plan/plan.yaml` 2 项；`site/build.mjs` 生成三视图
- 变：站点确定为自写生成器（ADR-0002）；wiki 定为全局单层（ADR-0001）；取消 `other/`
- 留：M2 的阶段任务表、第一个 drill、生词晋升流程 → `open-threads.md`

## [2026-11-12] M1.1 | 生词本加音标与发音

- 做：`vocab/schema.md` 新增 `phonetic`（转必填）/`say`/`audio` 三字段；5 条词条补英美音标；
  卡片加 🔊、工具栏加 US/UK 与慢速、抽卡自动先读一遍；构建支持 `vocab/audio/` 本地音频
- 变：发音走浏览器 `speechSynthesis`（零外部依赖），本地 mp3 为可选增强
- 留：`phonetic` 现在是必填，新词条漏写会被 `npm run check` 拦住（已实测）
