> 一句话：里程碑与验收标准。改动少；"现在做到哪"看 `status.md`。

# Roadmap

**目标**：亲手实现一个 FreeSWITCH-like 组件的信令内核（自研 SIP 栈）。
本仓=知识库 + labs 最小验证件，实现另起仓库（ADR-0004）。

学习里程碑（α–ε）定义在 `plan/plan.yaml`；
仓库里程碑（M1–M4）是"把支撑这事的工具建好"。

| 学习里程碑 | 对应仓库里程碑 |
|---|---|
| — | M1 最小闭环 ✅ |
| — | M2 章节地图 + 计划落地（进行中） |
| L0–L3 前置 / α 报文 / β 事务 | M2 |
| γ 对话与注册 / δ B2BUA | M3 |
| ε 互通与排障 | M4 |

## M1 · 最小闭环 ✅

目录骨架、`AGENTS.md`、`docs/` 全套、rfc3261 入库、wiki 三页样板、vocab 种子、
站点三视图、`npm run check`（锚点校验）。已交付。

## M2 · 章节地图 + 计划落地（进行中）

**目的**：先定"读哪几节、为哪个里程碑服务"，再动手；避免 269 页线性读。

| 产出 | 验收 |
|---|---|
| `wiki/specs/rfc3261.md` 章节地图（读/查/跳 + 服务里程碑） | 每节都有归属，且能指出"这节现在不读" |
| `plan/plan.yaml` 重排为 **L0 骨架 → L1 观察 → L2 原理 → L3 模仿 → α–ε 实现**，共 31 个任务 | 前三段 `code: false`；每段有时间盒 |
| L0–L3 合计约 7–12h，期间不写实现代码 | 心智模型页升 `current`；手拼报文被真实对端接受 |
| `sip/labs/drills/` 首批 3 个 drill | 判据可执行，无"理解了"这类词 |
| `docs/01-workflow.md` 写明"读 spec 的时机" | 新会话不会再去通读 RFC |
| α-1（消息 round-trip）跑通 | 字节级一致 |

**验收**：能连续两周按站点计划推进，且每个 task 完成时都留下一个可跑的 drill。

## M3 · γ + δ（对话、注册、B2BUA）

- `sip/labs/` 增量验证件：registrar、Digest（401/407）、dialog 匹配、双 leg 呼叫
- `media/` 开内容：SDP 3264（offer/answer）、RTP relay、DTMF 4733 —— **δ 里程碑的硬依赖**
- 配套 RFC 增量入库（3581/5626/4028/3264/4733/4475…）
- `sip/labs/abnf/` ABNF 抽出 + RFC 4475 torture tests

**验收**：两台真实软电话经本机 B2BUA 双向通话，异常分支不残留状态。

## M4 · ε 互通与排障

- 与 Linphone / MicroSIP / 真 FreeSWITCH 三方向互通
- NAT（rport/outbound）、session timer（4028）
- lint 脚本化：锚点存在性 + "是否被 Updated by 取代"
- `wiki/specs/` 每个入库 RFC 一页，`updated_by`/`errata` 从 rfc-editor 抄

**验收**：`npm run check` 全绿；给定的 pcap 能按"传输/事务/对话/路由/认证/SDP"分层定位问题。

## 长期义务（贯穿始终）

每次会话收尾更新 `status.md` + `journal.md` + `open-threads.md`；新坑进 `facts.md`。
这条不执行，整个记忆层三周就断更。

## 毕业

- `wiki/` 保留（长期资产，跨主题复用）
- `plan/plan.yaml` 归档为 `plan/archive/<年份>-sip.yaml`
- `sip/labs/` 的验证件按 ADR-0004 处置：长青的迁去实现仓，其余丢弃
- `media/` 按同一套流程继续滚
