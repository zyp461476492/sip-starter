> 一句话：本仓库当前做到哪、下一步做什么。**只写现在，历史进 `memory/journal.md`**。

last_updated: 2026-11-12

## 现在

M1（最小闭环）已完成：

- 目录骨架、`AGENTS.md`、`docs/` 全套（ADR 0001–0003 + memory 四件）
- 证据层：`sip/raw/rfc/rfc3261.txt`（15067 行，sha256 已记账）+ 抓取脚本
- 编译层：`wiki/` 三页样板（transaction / via / basic-call）+ `index.md` + `log.md`
- 数据层：`vocab/terms.yaml` 5 条、`plan/plan.yaml` 2 项
- 展示层：`npm run site` 生成三视图（计划 / 知识库 / 生词本）+ `search.json`

## 下一步（有序）

1. 人工过一遍三页样板：引用密度、"熟词僻义"取舍是否符合预期
2. M2 起手：`plan/plan.yaml` 铺完 SIP 八阶段任务表
3. `sip/labs/drills/` 第一个练习（REGISTER 全流程 + 401/407 两次重发）

## 阻塞 / 待你决定

- 无
