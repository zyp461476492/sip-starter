> 一句话：媒体传输主题（RTP/RTCP/SDP/ICE/DTLS-SRTP）的占位定义。M3 之前不动内容。

# topic: media

状态：**未开始**。本文件只声明"将来会有这个主题"，避免结构在扩展时变形。

## 为什么现在就有这个目录

结构验证：`sip/` 与 `media/` 平级、`wiki/` 全局唯一（ADR-0001）。先建空壳，
确保新增协议只需要加 `raw/` + `labs/`，wiki 不需要搬家。

## 计划范围（待定，不承诺 RFC 编号）

- SDP（4566 语法 + 3264 offer/answer 语义）
- RTP / RTCP（3550 已被拆分为 3550bis 系列，入库时以 rfc-editor 现状为准）
- NAT 穿透：ICE、STUN、TURN
- 加密：DTLS-SRTP

> 这些都**还没入库**，本文件不含任何技术结论。相关判断一律以将来入库的原文为准。
