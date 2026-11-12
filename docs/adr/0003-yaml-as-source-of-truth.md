# ADR-0003 计划与词库以 yaml 为唯一数据源

状态：current ｜ 日期：2026-11-12

## 背景

学习计划、生词本天然想做成网页（进度条、抽卡）。但手写 HTML 会立刻失真：
改一次计划要动 HTML，动几次就没人维护了，最后连"学到哪"都不可信。

## 决定

- `plan/plan.yaml`：阶段 → 任务，含 `prereq` / `sources` / `wiki` / `drills` / `done_when` / `status`。
- `vocab/terms.yaml`（人工确认）+ `vocab/candidates.yaml`（LLM 抽取的候选池）。
- 站点、脚本、lint 都只消费这两份数据；HTML 一律生成。

## 后果

- 得到：单一数据源，进度可自动算（`status` + wiki 页存在性），词条能反查"出现在哪几页"，
  数据可以被 `npm run check` 校验（字段枚举、引用可解析）。
- 放弃：直接在网页上编辑；改数据要开编辑器（对个人项目可接受）。
- 附带纪律：候选池与正式本分离，LLM 只能写候选池——否则词库三个月变垃圾场。
