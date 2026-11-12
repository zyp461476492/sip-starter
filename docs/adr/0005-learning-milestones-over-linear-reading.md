# ADR-0005 学习方案：按可运行里程碑推进，分层读 spec

状态：current ｜ 日期：2026-11-12

## 背景

目标是**亲手实现一个 FreeSWITCH-like 组件的信令内核（自研 SIP 栈）**，不是"了解 SIP"。

待处理量：RFC 3261 共 269 页，本仓 grep 出 314 个章节标题（含子节）；另有配套栈
（SDP 3264、RTP、rport 3581、outbound 5626、session timer 4028、DTMF 4733…）。

RFC 3261 的结构问题：它把四类文档缝在一个文件里（骨架 / 状态机 / 参考手册 / 垂直专题），
且存在严重前向引用——§8 讲 UAC/UAS 行为时按流程引用 §12（对话）与 §17（事务），而它们在后面。

## 备选与否决理由

| 备选 | 否决理由 |
|---|---|
| a) 全文粗读一遍 | 保留率低；§23 S/MIME、§27 IANA、§28 Changes 与目标无关；前向引用击穿理解 |
| b) 先提炼重点摘要再学 | 摘要必然转述 `MUST`/`MUST NOT` 而走形（违反 `AGENTS.md` §3）；且一定压缩掉边缘条款（ACK 两套规则、TCP framing、CANCEL 竞态、Record-Route 路径） |
| c) 组装现成栈（sofia-sip/pjsip），把力气放媒体与控制面 | 与"亲手实现 SIP 栈"的学习目标冲突。**记录在案：若目标转为产品化，此项必须重新评估**（自研栈在工程上通常是负资产） |
| d) 按 RFC 章节顺序排计划 | 章节顺序 ≠ 依赖顺序；正确顺序是报文 → 事务 → 对话 → 应用 |
| **e) 采用：按可运行里程碑 α–ε 倒推 + 章节四分类地图** | — |

## 决定

1. `plan/plan.yaml` 以里程碑 α（报文）/ β（事务）/ γ（对话与注册）/ δ（B2BUA）/ ε（互通）组织，
   不按章节；每个任务的 `done_when` 必须是**工具可验证的行为**。
2. 章节→里程碑的映射作为实例放 `wiki/specs/rfc3261.md`；分类**规则**放 `docs/03-learning-method.md`。
   **规则在 docs，实例在 wiki**——将来 media 的每个 RFC 照此办理。
3. 验收物三分：drill（本仓可丢弃）/ impl（另仓，ADR-0004）/ wiki（长期资产）。
4. **讨论过程不留存**，只留判断与依据（与 `docs/memory/README.md` 的"journal 不写流水账"同源）。

## 后果

- 得到：计划与实现依赖顺序一致；每一步都有外部验收物；学习方法可平移到 media 主题
- 放弃：不能按 RFC 目录翻计划（查"§17 学了没"要走章节地图）；`plan.yaml` 与 RFC 目录不再同构
- 风险：里程碑粒度粗，某些节可能永远不被触达 → 由章节地图的"服务"列兜底，lint 时检查冗余

## 重新考虑的触发条件

1. 发现自己靠"跳读"漏了基础（例如说不清 dialog 与 transaction 的边界）→ 回到骨架层：
   §4 Overview of Operation、§24 Examples、§7 Messages、§6 Definitions
2. 若目标转为"能上线扛并发" → 重评备选 c（组装现成栈）
3. 若 milestones 数量超过 8 个 → 说明切得太细，合并

## 相关

- 方法正文：`docs/03-learning-method.md`
- 章节实例：`wiki/specs/rfc3261.md`
- 代码归属：ADR-0004
- 计划数据：`plan/plan.yaml`
