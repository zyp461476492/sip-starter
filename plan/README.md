> 一句话：`plan.yaml` 字段说明与写法约定。

# plan/ 说明

`plan.yaml` 是**数据源**，站点从它算出进度。手写 HTML 计划必然失真（见 ADR-0003）。

## 顶层字段

| 字段 | 说明 |
|---|---|
| `active_topic` | 当前主线（`sip` / `media`…）。**主线是状态，不是目录位置** |
| `updated` | 最后修改日期 |
| `phases[]` | 阶段：`id` / `title` / `goal` / `code` / `timebox` / `tasks[]` |

### 阶段字段

| 字段 | 说明 |
|---|---|
| `code` | `true` / `false`。`false` 的阶段**不写实现代码**（`AGENTS.md` §3 第 10 条），站点显示“不写代码” |
| `timebox` | 阶段的时间盒（如 `3–5h`），站点显示在阶段标题下 |

## 任务字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | `p<阶段>-t<序号>`，全文件唯一 |
| `title` | ✅ | 一句话 |
| `why` | ✅ | 为什么现在学它（写给三个月后的自己） |
| `prereq` | ✅ | 前置任务 id 列表，可为空 |
| `sources` | ✅ | 原文锚点，如 `RFC3261 §17`；必须能在 `sip/raw/` 里 grep 到 |
| `wiki` | | 支撑本任务的 wiki 页面 slug；站点用它在计划页标"已支撑/未支撑" |
| `drills` | | `sip/labs/drills/` 下的练习 slug |
| `done_when` | ✅ | **可验证**的完成判据（能做出来，不是"读过了"） |
| `est` | | 单项估时（如 `40min` / `4h`），站点显示为 chip |
| `status` | ✅ | `todo` / `doing` / `done` |

## 写法三条

1. `done_when` 必须能当场验证："能手写 REGISTER 全报文并解释每个头" ✅；"理解事务" ❌。
2. 一个任务只对应一个可验证动作，不要合并三件事。
3. 任务完成后**先更新 wiki/生词，再改 `status: done`**——否则计划跑在知识前面，wiki 变成摆设。

## journal.md

`plan/journal.md` 是每次学习的简短时间线（学什么、卡在哪、多久），append-only。
与 `docs/memory/journal.md` 的区别：那个记**项目**进展，这个记**学习**进展。
