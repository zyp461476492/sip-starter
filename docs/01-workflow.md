> 一句话：一次 ingest、一次学习、一次 lint 分别该按什么顺序动手。

# 01 工作流

## A. 一次 ingest（编译一条来源）

以"编译 RFC 3261 §17"为例。

| 步 | 动作 | 产出 |
|---|---|---|
| 1 | 确认原文在 `sip/raw/rfc/`，`MANIFEST.md` 有 URL/日期/sha256 | MANIFEST 行 |
| 2 | 读原文；把要点、疑问、与既有页冲突处与人对齐（别自己拍） | `docs/memory/journal.md` 一条 |
| 3 | 写/更新 `wiki/specs/rfc3261.md`（边界、摘要、章节地图、与其他 RFC 的关系） | specs 页 |
| 4 | 更新 `wiki/index.md` 对应 area | index |
| 5 | 横跨更新受影响页（概念/消息/流程，通常 3–15 页） | 若干 wiki 页 |
| 6 | 追加 `wiki/log.md`：`## [YYYY-MM-DD] ingest \| RFC3261 §17 Transactions` | log 行 |
| 7 | 抽生词进 `vocab/candidates.yaml`（不直接进 `terms.yaml`） | 候选词条 |

**一条来源 = 一次扇出写**。只新建一页、不更新旧页，等于把 wiki 退化成博客。

## B. 一次学习（人的侧）

**前提：本仓不写实现，只做 labs 验证件（ADR-0004）。方式与判据见 [`03-learning-method.md`](03-learning-method.md)。**

| 步 | 动作 |
|---|---|
| 0 | 看 `wiki/specs/rfc3261.md` 的章节地图，确认本节服务哪个里程碑（α–ε） |
| 1 | 从站点计划页挑一个 task，读它的 `sources`（RFC 节）与 `wiki` 页 |
| 2 | **实现前一刻**才读该节原文，边读边对着状态图/报文字段做笔记 |
| 3 | 在 `sip/labs/drills/` 写一个 drill 并跑通（判据必须可执行） |
| 4 | 把卡住的地方写成 `wiki/questions/<slug>.md`（问题 + 已查到的证据 + 未解） |
| 5 | 解决后：结论 file back 进概念页，问题页只留结论链接与日期，状态改 `answered` |
| 6 | 更新 `plan/plan.yaml` 该 task 的 `status`；确认生词晋升（candidates → terms） |

## C. 一次 lint（体检）

| 步 | 检查 | 判据 |
|---|---|---|
| 1 | 锚点存在性 | wiki 里每个 `§x.y` 能在对应 raw 里 grep 到 |
| 2 | 时效性 | 论断是否已被 Updated by / errata 取代（以 rfc-editor 为准） |
| 3 | 结构 | 孤儿页、缺页的重要概念、缺失交叉引用、坏 wikilink |
| 4 | 数据 | yaml 必填字段、枚举值、`wiki:`/`drills:` 引用是否都能解析 |
| 5 | 输出 | 只报告不改内容 → `docs/memory/open-threads.md` |

`npm run check` 覆盖第 1、3（链接）、4 项中机器可判定的部分；其余需人/LLM 判断。

## 遗留清单（M2 / M3 要补的东西）

- [x] M2：`plan.yaml` 改成按里程碑（α 报文 / β 事务 / γ 对话与注册 / δ B2BUA / ε 互通）组织
- [x] M2：`wiki/specs/rfc3261.md` 章节地图（读/查/跳 + 服务哪个里程碑）
- [x] M2：首批三个 drill（msg-parse / options-uas / transaction-timers）
- [ ] M2：跑通 α-1（消息 round-trip），把"我踩到的"回写
- [ ] M2：`vocab/candidates.yaml` 晋升流程跑通（含晋升脚本或手工口令）
- [ ] M2：`wiki/questions/` 首批真问题 + file-back 样板
- [ ] M3：配套 RFC 增量入库（3581/5626/4028/3264/4733/4475…）+ errata 对齐
- [ ] M3：`sip/labs/abnf/` 抽出 ABNF 并跑 RFC 4475 torture tests
- [ ] M3：lint 脚本化（锚点存在性 + 时效性检查）
- [ ] M3：`media/` 开内容（SDP 3264 + RTP + DTMF 4733，δ 里程碑需要）
