---
id: messages/headers/via
title: Via（途经头域）
topics: [sip]
status: current
specs: ["RFC3261 §8.1.1.7", "RFC3261 §20.42", "RFC3261 §18"]
drills: []
updated: 2026-11-12
---

# Via（途经头域）

一句话：**请求一路经过的路径 + 响应该往回走的路径**，同时 `branch` 参数兼作事务标识符。
它是 SIP 里"路由 + 事务"两件事共用的一个头域，所以最容易记混。

## 作用（原文）

> The Via header field indicates the path taken by the request so far
> and indicates the path that should be followed in routing responses.
> The branch ID parameter in the Via header field values serves as a
> transaction identifier, and is used by proxies to detect loops.
（RFC 3261 §20.42）

> The Via header field indicates the transport used for the transaction
> and identifies the location where the response is to be sent.
（RFC 3261 §8.1.1.7）

## UAC 生成规则（原文）

> When the UAC creates a request, it MUST insert a Via into that
> request.  The protocol name and protocol version in the header field
> MUST be SIP and 2.0, respectively.  The Via header field value MUST
> contain a branch parameter.  This parameter is used to identify the
> transaction created by that request.
（RFC 3261 §8.1.1.7）

> The branch parameter value MUST be unique across space and time for
> all requests sent by the UA.  The exceptions to this rule are CANCEL
> and ACK for non-2xx responses.
（RFC 3261 §8.1.1.7）

> The branch ID inserted by an element compliant with this
> specification MUST always begin with the characters "z9hG4bK".
（RFC 3261 §8.1.1.7）

三点合起来是一条很实用的判据：**看到 `branch` 不以 `z9hG4bK` 开头，基本可以判定是
RFC 2543 时代的老实现**（原文明确说这个 magic cookie 就是为了区分老实现）。

## 结构

> A Via header field value contains the transport protocol used to send
> the message, the client's host name or network address, and possibly
> the port number at which it wishes to receive responses.  A Via
> header field value can also contain parameters such as "maddr",
> "ttl", "received", and "branch"
（RFC 3261 §20.42）

> Transport protocols defined here are "UDP", "TCP", "TLS", and "SCTP".
> "TLS" means TLS over TCP.  When a request is sent to a SIPS URI, the
> protocol still indicates "SIP", and the transport protocol is TLS.
（RFC 3261 §20.42）

原文给的两个例子（§20.42）：

```
Via: SIP/2.0/UDP erlang.bell-telephone.com:5060;branch=z9hG4bK87asdks7
Via: SIP/2.0/UDP 192.0.2.1:5060 ;received=192.0.2.207
     ;branch=z9hG4bK77asjd
```

`received` 的来历（同一处原文的解释，正是 NAT/多网卡场景的原型）：

> The sender guessed wrong
> as to which network interface would be used.  Erlang.bell-
> telephone.com noticed the mismatch and added a parameter to the
> previous hop's Via header field value, containing the address that
> the packet actually came from.
（RFC 3261 §20.42）

compact form 是 `v`（§20.42）。

## 谁写谁读

| 角色 | 动作 | 锚点 |
|---|---|---|
| UAC | 生成请求时**必须**插入第一个 Via | §8.1.1.7 |
| 代理 | 转发时在顶部追加自己的 Via | §16.6（待核） |
| UAS | 把响应按顶部 Via 逐跳回送 | §18.2.2（待核） |
| 传输层 | 设置 `maddr` / `ttl` / `sent-by` | §8.1.1.7、§18 |

> The Via header maddr, ttl, and sent-by components will be set when
> the request is processed by the transport layer (Section 18).
（RFC 3261 §8.1.1.7）

## 与事务的关系

`branch` 就是事务标识的一部分：同一 INVITE 与其非 2xx 的 ACK、以及 CANCEL，
**必须复用同一个 branch**（§8.1.1.7 原文列出这两个例外）。
这条规则解释了为什么"取消一通呼叫"的 CANCEL 不会命中新事务。

详见 [[concepts/transaction]]。

## 未核对 / 待补

- `rport`（RFC 3581）与 NAT 穿越：本仓库尚未入库 RFC 3581，**不做任何结论**
- 代理侧 Via 处理细节（§16.6 Item 8、§16.7 Item 3）只读了指向，未逐条编译
