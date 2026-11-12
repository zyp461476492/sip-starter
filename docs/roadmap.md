> 一句话：里程碑与验收标准。改动少；"现在做到哪"看 `status.md`。

# Roadmap

## M1 · 最小闭环 ✅ 目标

**目的**：把管道跑通、把结构的错在一小时内暴露，不追求内容量。

| 产出 | 验收 |
|---|---|
| 目录骨架（`sip/ media/ wiki/ plan/ vocab/ site/ docs/ scripts/`） | 结构符合 `00-design.md` |
| `AGENTS.md`（约束 + 冷启动路由 + 收尾义务） | 新会话只读它就能正确工作 |
| `sip/raw/rfc/rfc3261.txt` + `MANIFEST.md` + 抓取脚本 | sha256 可复核 |
| `wiki/` 样板 3 页 + `index.md` + `log.md` | 所有 `§` 锚点能在 raw 里 grep 到 |
| `vocab/terms.yaml` 5 条 + `schema.md` | 含 `domain_meaning` / `confusion` |
| `plan/plan.yaml` 2 项 | 站点能显示"已支撑 / 未支撑" |
| `site/build.mjs` + 三视图 | `npm run site` 后浏览器点得通 |
| `docs/` 全套（含 ADR 0001–0003、memory 四件） | 冷启动可续 |

## M2 · 计划全貌 + 学习纪律

- `plan/plan.yaml` 铺完 SIP 八阶段、数十个任务，每项 `done_when` 可验证
- 生词候选池流程上线（ingest 抽 → 人确认晋升）
- `wiki/questions/` 首批真问题 + file-back 样板
- 站点加复习抽卡与进度条细化
- `sip/labs/drills/` 前两个练习（REGISTER 全流程、IST/NIST 状态推演）

**验收**：能连续两周每天按站点给的任务学，且 wiki 页数/生词数同步增长。

## M3 · 证据层铺全 + lint 可执行

- 配套 RFC 全量入库（3262/3264/3263/3581/4028/4320/5626/6026/6665…）+ errata 对齐
- `wiki/specs/` 每个 RFC 一页，`updated_by`/`errata` 字段从 rfc-editor 抄
- `sip/labs/abnf/` ABNF 抽出 + RFC 4475 torture tests 跑通
- lint 脚本化：锚点存在性 + 时效性检查
- `media/` 建空壳 + `topic.md`

**验收**：`npm run check` 全绿；随便问一个 SIP 问题，wiki 能给出带锚点的答案且锚点可复核。

## 长期义务（贯穿始终）

每次会话收尾更新 `status.md` + `journal.md` + `open-threads.md`；新坑进 `facts.md`。
这条不执行，整个记忆层三周就断更。

## 毕业（SIP 阶段结束时）

- `wiki/` 保留（长期资产）
- `plan/plan.yaml` 归档为 `plan/archive/2026-sip.yaml`
- `docs/memory/facts.md` 保留（跨主题复用）
- `media/` 开始按同一套流程滚
