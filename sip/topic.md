> 一句话：SIP 主题的定义——范围、优先级、证据清单、毕业标准。

# topic: sip

## 范围

RFC 3261 为核心，加上真正影响工程实现的配套栈：

| 类别 | RFC | 状态 |
|---|---|---|
| 核心 | 3261 | ✅ 已入库 |
| 事件 | 3262 SUBSCRIBE/NOTIFY、6665（现状） | 待入库 |
| 会话描述 | 3264 SDP offer/answer（横跨 `media/`） | 待入库 |
| 传输/穿透 | 3263 DNS、3581 rport、5626 outbound、6026 | 待入库 |
| 会话维护 | 4028 session timer、4320（3261 更新） | 待入库 |
| 测试 | 4475 torture tests | 待入库（用于 ABNF 校验） |

> 具体 `Updated by` / `Obsoletes` 关系以 rfc-editor 页面为准，见 `raw/rfc/MANIFEST.md`。

## 不在本主题范围

- RTP/RTCP 的媒体传输细节 → `media/`
- SDP 语法本身 → `media/`（SIP 侧只引用 offer/answer 的时序）

## 毕业标准（可验证）

1. 能不看笔记写出 INVITE / REGISTER / BYE / CANCEL / ACK 的合法报文
2. 能画出 ICT / IST / NICT / NIST 四个状态机，并说出每个定时器的存在理由
3. 给定一份 pcap，能定位问题落在「传输 / 事务 / 对话 / 路由 / 认证 / SDP」哪一层
4. `npm run check` 全绿，wiki 无红链残留（或红链都有理由）

## 目录约定

- `raw/` —— 原文只读，见 `raw/rfc/MANIFEST.md`
- `labs/abnf/` —— 从原文抽出的 ABNF + 校验脚本
- `labs/captures/` —— pcap 与文本化报文
- `labs/drills/` —— 练习与对照答案（wiki 页 `drills:` 字段引用）
