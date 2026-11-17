> 一句话：`sip/zh/` 译文层的**用词唯一口径**。译任何一节之前先查这里；没收录的词先补进来再译。

# 译文用词表（GLOSSARY）

本表只管"怎么译"。**怎么记**（音标、通用义、易错点）在 `vocab/`，两处不重复。

## 硬规则

| # | 规则 | 例子 |
|---|---|---|
| R1 | `MUST` / `MUST NOT` / `SHOULD` / `SHOULD NOT` / `MAY` / `REQUIRED` / `RECOMMENDED` / `OPTIONAL` **保留英文原词**，可加中文括注 | `客户端事务 MUST 重传请求`；`必须（MUST）` |
| R2 | 头域名、参数名、方法名、状态码的 reason phrase、URI scheme **一律不译** | `Via`、`Call-ID`、`branch`、`tag`、`INVITE`、`486 Busy Here`、`sip:`、`sips:` |
| R3 | ABNF 与报文样例原样不动（包括缩进与换行） | `Via =  ( "Via" / "v" ) ...` |
| R4 | 术语首次出现：中文（English），之后只用中文；同一段内不重复括注 | 第一次 `事务（transaction）`，其后 `事务` |
| R5 | 一词一译，不许同义替换。要改译法→先改本表，再回头统一已译节 | `final response` 永远是"最终响应"，不写"终态响应" |
| R6 | 括号内英文一律小写原形，即便原文大写（`INVITE` 除外，它总大写） | `事务（transaction）` 不写 `（Transaction）` |
| R7 | 原文的 "Section x.y" 译作 `§x.y`，与站内锚点一致 | `As discussed in Section 17.1.1.3` → `如 §17.1.1.3 所述` |
| R8 | 拿不准就保留英文并加 `（原文：xxx）`，**不许猜**；同时把该词记进 `docs/memory/open-threads.md` | — |

## A. 协议实体

| 英文 | 固定译法 | 别译成 | 锚点 |
|---|---|---|---|
| user agent (UA) | 用户代理 | 用户代理端 | RFC3261 §6 |
| user agent client (UAC) | 客户端（UAC） | 用户代理客户端 | RFC3261 §6 |
| user agent server (UAS) | 服务端（UAS） | 用户代理服务器 | RFC3261 §6 |
| proxy / proxy server | 代理（服务器） | 代理端、中介 | RFC3261 §6, §16 |
| stateful proxy | 有状态代理 | 带状态代理 | RFC3261 §16.2 |
| stateless proxy | 无状态代理 | 无态代理 | RFC3261 §16.11 |
| registrar | 注册服务器（registrar） | 注册机、注册者 | RFC3261 §10 |
| location service | 位置服务 | 定位服务 | RFC3261 §10 |
| redirect server | 重定向服务器 | 转发服务器 | RFC3261 §8.3 |
| back-to-back user agent (B2BUA) | 背靠背用户代理（B2BUA） | 双边代理 | RFC3261 §6 |
| endpoint / end point | 端点 | 终端（易与终端设备混淆，仅在讲硬件时才用"终端"） | — |
| client / server | 客户端 / 服务端 | 客户机 / 服务器（与 registrar 混用时除外） | — |

## B. 事务与对话

| 英文 | 固定译法 | 别译成 | 锚点 |
|---|---|---|---|
| transaction | 事务 | 交易、传输 | RFC3261 §17 |
| client transaction | 客户端事务 | 客户事务 | RFC3261 §17.1 |
| server transaction | 服务端事务 | 服务事务 | RFC3261 §17.2 |
| dialog | 对话 | 会话、对话期 | RFC3261 §12 |
| session | 会话 | 对话（**与 dialog 严格区分**：session 是媒体会话） | RFC3261 §13 |
| call leg | 呼叫腿 | 呼叫分支、半呼叫 | — |
| early dialog | 早期对话 | 早对话 | RFC3261 §12 |
| route set | 路由集 | 路由集合、路由表 | RFC3261 §12.1.2 |
| remote target | 远端目标 | 远程目标地址 | RFC3261 §12.2.1.1 |
| tag | tag（不译） | 标签 | RFC3261 §19.3 |
| branch | branch（不译） | 分支参数 | RFC3261 §8.1.1.7 |
| Call-ID | Call-ID（不译） | 呼叫标识 | RFC3261 §20.8 |
| merged request | 合并请求 | 重复请求、冲突请求 | RFC3261 §8.2.2.2 |
| glare | 撞车（glare） | 眩光、冲突 | RFC3261 §14.2 |
| transaction user (TU) | 事务用户 | 事务使用者 | RFC3261 §5, §9.2 |
| transport | 传输（层） | 运输 | RFC3261 §18 |

## C. 路由与代理行为

| 英文 | 固定译法 | 别译成 | 锚点 |
|---|---|---|---|
| target set | 目标集 | 目标集合、目标列表 | RFC3261 §16.5 |
| loose routing | 松散路由 | 松路由、宽松路由 | RFC3261 §16.5 |
| strict routing | 严格路由 | 严路由 | RFC3261 §16.5 |
| Route header field | Route 头域 | 路由头 | RFC3261 §20.34 |
| Record-Route | Record-Route（不译） | 记录路由头 | RFC3261 §20.30 |
| Route Information Preprocessing | 路由信息预处理 | 路由预处理 | RFC3261 §16.4 |
| Request Forwarding | 请求转发 | 转发请求（作节标题时用前者） | RFC3261 §16.6 |
| Response Processing | 响应处理 | — | RFC3261 §16.7 |
| forking / fork | 分叉 | 复制、克隆 | RFC3261 §4, §16.6 |
| sequential search | 顺序搜索 | 串行查找 | RFC3261 §16.6 |
| parallel search | 并行搜索 | 平行查找 | RFC3261 §16.6 |
| hop-by-hop | 逐跳 | 点对点、单跳 | — |
| end-to-end | 端到端 | 首尾 | — |

## D. 消息、头域与传输

| 英文 | 固定译法 | 别译成 | 锚点 |
|---|---|---|---|
| request / response | 请求 / 响应 | 申请 / 应答 | RFC3261 §7 |
| Request-Line / Status-Line | Request-Line / Status-Line（不译） | 请求行 / 状态行 | RFC3261 §7.1, §7.2 |
| header field | 头域 | 头部、字段头 | RFC3261 §7.3 |
| method | 方法 | 动作、指令 | RFC3261 §7.1 |
| provisional response | 临时响应 | 临时应答、暂定响应 | RFC3261 §7.2 |
| final response | 最终响应 | 终态响应、结束响应 | RFC3261 §7.2 |
| retransmission | 重传 | 重发、重试 | RFC3261 §17 |
| timeout | 超时 | 逾时 | — |
| unreliable transport | 不可靠传输 | 非可靠传输 | RFC3261 §18 |
| reliable transport | 可靠传输 | — | RFC3261 §18 |
| framing | 分帧 | 成帧、组帧 | RFC3261 §18.3 |
| transaction layer / transport layer | 事务层 / 传输层 | — | RFC3261 §5 |
| offer/answer | 提议/应答（offer/answer） | 报价/回答 | RFC3261 §4, RFC 3264 |
| early media | 早期媒体 | 早媒体 | 3261 未用该词，见 RFC 3960 |
| quench (retransmissions) | 压住 | 抑制、扑灭 | RFC3261 §17.1.1.1 |

## E. 状态码与结果

| 英文 | 固定译法 | 锚点 |
|---|---|---|
| 1xx / 2xx / 3xx / 4xx / 5xx / 6xx | 1xx / 2xx …（不译，不写"一类响应"） | RFC3261 §21 |
| provisional / success / redirection / request failure / server failure / global failure | 临时 / 成功 / 重定向 / 请求失败 / 服务端失败 / 全局失败 | RFC3261 §21 |
| reason phrase | reason phrase（不译，如 `486 Busy Here`） | RFC3261 §7.2 |

## F. 不确定就先记下来的词

译到不确定的词，**不要临时决定**：先在本表加一行（或写进下面的"待定"），再在
`docs/memory/open-threads.md` 记一条，关闭后回填本表。

| 英文 | 暂定 | 备注 |
|---|---|---|
| （空） | — | — |

## 与其他文件的关系

- `vocab/terms.yaml`（人工确认）与 `vocab/candidates.yaml`（草稿）：一个词的**记忆卡**——音标、通用义、易错点。
- 本表：一个词的**译法**。两处对一个词可以有不同详细度，但译法必须只有一种。
- `sip/zh/rfc3261/<节号>.md`：正文译文，frontmatter 记 `en_sha` / `status`；校验见 `scripts/zh-check.mjs`。
