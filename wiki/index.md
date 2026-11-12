# wiki 索引（符号表）

> 查询入口：先在这里定位页面，再读页面。**不要凭记忆回答 SIP 问题。**

已编译的原文：`sip/raw/rfc/rfc3261.txt`（RFC 3261，269 页）。其余 RFC 见
`sip/raw/rfc/MANIFEST.md` 的待入库清单。

## concepts/（概念）

| 页面 | 一句话 | 状态 |
|---|---|---|
| [[concepts/transaction]] | 一次请求及其全部响应；ICT/IST/NICT/NIST 两套状态机 | current |
| concepts/dialog | 对话 = Call-ID + 两个 tag（待建） | — |

## messages/（消息与头域）

| 页面 | 一句话 | 状态 |
|---|---|---|
| [[messages/headers/via]] | 请求路径 + 响应回程 + `branch` 即事务标识 | current |

待建（按需，不要一次全建）：`headers/contact`、`headers/cseq`、`headers/to-from`、
`methods/invite`、`methods/register`、`status/1xx`、`status/4xx`

## flows/（流程）

| 页面 | 一句话 | 状态 |
|---|---|---|
| [[flows/basic-call]] | INVITE → 1xx → 2xx → ACK → BYE 全流程 | draft |

## specs/（每个 RFC 一页）

| 页面 | 一句话 | 状态 |
|---|---|---|
| specs/rfc3261 | SIP 核心协议（待建，M3 起建） | — |

## questions/（我的问题）

规则：问题 → 查原文 → 结论 file back 进概念页 → 本页只留结论链接与日期。
目前为空，M2 起用。

## 关于红链

`[[x/y]]` 指向不存在的页面时，站点会显示为"待建"。**红链是待办清单，不是错误**——
但一个概念被红链引用三次以上，就该建页了。
