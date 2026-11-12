# ADR-0001 一个全局编译层，协议只切证据层

状态：current ｜ 日期：2026-11-12

## 背景

初始草案把 `sip/` 与 `wiki/` 并列，`other/` 留给后续协议。这会产生一个歧义：
`sip/` 里放的是 SIP 知识还是 SIP 素材？若按协议各建一套 wiki，等学 RTP/SDP/ICE 时，
`offer-answer`、`ICE candidate`、`DTLS-SRTP` 这类横跨两边的页面会有两个住所，最终分叉。

## 决定

- 编译层只有一层：`wiki/`，按**概念区**（concepts / messages / flows / specs / questions）组织，不按协议组织。
- 协议只切**证据层与实验层**：`sip/raw| labs/`、将来 `media/raw|labs/`。
- 页面归属用 frontmatter `topics: [sip, media]` 标记，可多值。
- 取消 `other/`，改用协议族命名（`media/`、`webrtc/`、`ims/`）；"当前主线"由 `plan/plan.yaml`
  的 `active_topic` 声明，属于状态而非位置。

## 后果

- 得到：跨协议知识有唯一住所；新增协议只需加 `raw/` + `labs/`，wiki 不需要搬家。
- 放弃：按协议一眼看全"这个协议我有多少页"的直观性——需要时用 `topics` 过滤，站点后续可加视图。
- 重新考虑的触发条件：若某个协议的 wiki 规模超过总量一半且几乎不被其他协议引用，
  才考虑拆出独立编译层。
