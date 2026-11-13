# AGENTS.md — sip-starter 工作约定

给 AI 编码助手（Pi / Codex / Claude Code）的**约束清单**。

本文件只放"必须怎么做 / 禁止怎么做"。**解释与历史一律不进这里**，去 `docs/adr/`。
觉得某条约束该改，先开 ADR，再改本文件。

---

## 0. 冷启动读入顺序（每次新会话按序读）

1. 本文件（约束）
2. `docs/status.md` —— 现在做到哪、下一步是什么
3. `docs/memory/facts.md` —— 已经踩过的坑，别再踩
4. `docs/memory/open-threads.md` —— 未决问题
5. 需要背景时才读 `docs/adr/`、`docs/00-design.md`

回答 SIP 领域问题时，**入口是 `wiki/index.md`，不是记忆**。记忆与 wiki 冲突时，以 wiki + `sip/raw/` 为准。

---

## 1. 三分法（这三条边界不许破）

| 问题 | 归属 | 谁写 |
|---|---|---|
| 必须怎么做 / 禁止怎么做 | `AGENTS.md` | 人，极少改 |
| 为什么这么定 / 当初发生了什么 | `docs/` | 人 + agent |
| SIP 是什么 | `wiki/` | 只有 LLM |

禁止：把解释塞进本文件、把决策写进 wiki、把领域知识放进 `docs/`。

---

## 2. 目录语义

| 目录 | 性质 | 写入权限 |
|---|---|---|
| `sip/raw/`、`media/raw/` | 不可变证据（RFC 原文、errata、图） | **只读**，仅可追加新文件 |
| `sip/labs/`、`media/labs/` | ABNF、报文样例、抓包、练习 | 人 + LLM |
| `wiki/` | 编译产物（领域知识） | **仅 LLM** |
| `plan/plan.yaml`、`vocab/terms.yaml` | 人工确认的数据 | **仅人** |
| `vocab/candidates.yaml` | 待确认候选 | LLM 可写 |
| `site/` | 生成器与样式 | 人 + LLM；`site/dist/` 永不手改 |
| `docs/` | 项目文档与记忆 | 人 + agent |

`raw/` 只追加不改写：不重排版、不"顺手整理"、不修 typo。

---

## 3. 硬规则

1. **引用纪律**：任何规范性论断必须 `> 原文引用` + 紧随其后的锚点 ``（RFC 3261 §8.1.1.7）``。
   禁止凭记忆改写 `MUST` / `MUST NOT` / `SHOULD` 的语义。拿不准就写进 `wiki/questions/`，不许猜。
2. **不凭记忆填元数据**：`wiki/specs/rfc*.md` 的 `obsoletes` / `updated_by` / `errata` 字段只能从
   rfc-editor 抄，抄不到写 `unknown`，禁止推断。
3. **ABNF 不转述**：从原文抽到 `sip/labs/abnf/`，wiki 只引用不复述；语法正确性以脚本校验为准。
4. **slug 即 ID**：wiki 文件名为小写连字符 slug；站内链接一律 `[[area/slug]]`，禁止相对路径。
5. **中英边界**：正文中文，术语、代码、原文引用保持英文原样。
6. **一条来源要扇出**：ingest 不是新建一页，而是横跨更新相关概念页/消息页/流程页（通常 3–15 页）。
7. **好答案要回写**：query 得到的结论必须 file back 进 wiki（新建或补充页面），不许只留在对话里。
8. **会话收尾义务**：每次会话结束必须
   - 覆盖 `docs/status.md`（只写现在）
   - 追加 `docs/memory/journal.md` 一条（`## [YYYY-MM-DD] 里程碑 | 标题`）
   - 未完成项落 `docs/memory/open-threads.md`（必须带触发条件或关闭日期）
   - 新踩的坑落 `docs/memory/facts.md`（症状 → 结论 → 证据）
9. **计划是假设，不是承诺**：任何 task 开工时若发现前提不成立（缺前置知识 / 判据写错 / 顺序错了），
   **当场改 `plan.yaml` 并记 `open-threads.md`**，不许硬做完再补。改计划不是失败，掩盖假设才是。
10. **`code: false` 的阶段不得产出实现代码**（验证脚本、手工拼报文除外）。
    标记见 `plan/plan.yaml` 的阶段字段，站点会显示“不写代码”。

---

## 4. 三个操作

### Ingest（编译一条来源）

1. 确认文件在 `sip/raw/` 下且 `sip/raw/rfc/MANIFEST.md` 有 URL / 日期 / sha256 记录；缺则先补
2. 读原文，把要点与分歧与人讨论（结论记 `docs/memory/journal.md`）
3. 写或更新 `wiki/specs/rfc<N>.md`（边界、摘要、章节地图、与其他 RFC 的关系）
4. 更新 `wiki/index.md` 对应 area 条目
5. 横跨更新受影响的 `concepts/`、`messages/`、`flows/` 页面
6. 追加 `wiki/log.md`：`## [YYYY-MM-DD] ingest | RFC3261 §17 Transactions`
7. 抽生词写入 `vocab/candidates.yaml`（**不许**直接写 `terms.yaml`）

### Query（提问）

1. 先读 `wiki/index.md` 定位候选页，再读页面，带锚点作答
2. 答案必须能追溯到 `sip/raw/` 的原文；核不到就标 `未核对`
3. 结论 file back 进 wiki，并在 `wiki/log.md` 记 `query` 条目

### 批量补全候选词（vocab fix）

触发语：「批量补全候选词」「把缺 source 的词补上」

1. 读 `vocab/candidates.yaml`，筛 `missing` 非空的条目
2. 逐词在 `sip/raw/` 里 grep，找到**真正定义它**的章节（不是随便一处出现）
3. 填 `domain_meaning`（一句中文，贴着原文措辞）与 `confusion` 草案；原文看不出易错点时留空
4. 写回：`status: drafted`、`drafted_by: agent`，**重算 `missing`**（用 `scripts/vocab-lookup.mjs` 的 `computeMissing`）
5. 追加 `wiki/log.md` 一条，说明改了哪几条、哪几条没敢动
6. 禁止写 `vocab/terms.yaml`——晋升必须由人做

### Lint（体检）

1. 锚点存在性：wiki 里每个 `§x.y` 都能在对应 raw 文件里 grep 到
2. 时效性：论断是否已被 Updated by / errata 取代（以 rfc-editor 为准）
3. 结构：孤儿页、缺失的重要概念页、缺失交叉引用、失效 wikilink
4. lint **只报告不改内容**，结果写 `docs/memory/open-threads.md`

---

## 5. 站点

`npm run site` → `site/dist/`（不入库）。要改外观改 `site/assets/`，要改渲染改 `site/build.mjs`。
`npm run check` 只做校验不写文件（锚点、wikilink、yaml 字段）。

---

## 6. 提交

一个里程碑一个 commit，message 用 `M<n>: <做了什么>`。`site/dist/` 与 `node_modules/` 不入库。

---

## 7. 图表

说明图统一用**全局技能 `svg-diagram`**（手写内联 SVG，不用截图/ASCII）。

- 技能源码在本仓 `tools/skills/svg-diagram/`（纳入版本管理），装到全局用 `scripts/install-skills.sh`
- 全局位置：`~/.pi/agent/skills/svg-diagram/`；`tools/` **不是**技能发现目录，所以不会重名冲突

1. SVG 源文件放 `wiki/assets/<slug>.svg`（素材，不入 dist）
2. md 里写 `![图说明](assets/<slug>.svg)`，构建时会把文件内容内联进页面
3. **类名必须带 `dg-` 前缀**（`.dg-th` / `.dg-arr` / `.dg-lane`），否则内联时会污染页面样式
4. 交付前必须跑 `node ~/.pi/agent/skills/svg-diagram/scripts/svg-check.mjs <svg>`，再用 `render.mjs` 截图肉眼确认
