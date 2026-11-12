---
id: concepts/transaction
title: Transaction（事务）
topics: [sip]
status: current
specs: ["RFC3261 §17", "RFC3261 §17.1.1.1", "RFC3261 §17.1.2.1", "RFC3261 附录 A Table 4"]
drills: []
updated: 2026-11-12
---

# Transaction（事务）

一句话：**一次请求及其全部响应构成一个事务**，它是 SIP 里负责"重传与去重"的那一层，
位于传输层之上、对话框层之下。INVITE 事务与非 INVITE 事务是两套不同的状态机。

## 定义（原文）

> SIP is a transactional protocol: interactions between components take
> place in a series of independent message exchanges.  Specifically, a
> SIP transaction consists of a single request and any responses to
> that request, which include zero or more provisional responses and
> one or more final responses.
（RFC 3261 §17）

INVITE 事务有个例外，必须记住：

> In the case of a transaction where the request was an INVITE (known as an INVITE transaction), the
> transaction also includes the ACK only if the final response was not
> a 2xx response.  If the response was a 2xx, the ACK is not considered
> part of the transaction.
（RFC 3261 §17）

**为什么排除 2xx 后的 ACK**（同一个 §17，紧接着的解释）：

> The reason for this separation is rooted in the importance of
> delivering all 200 (OK) responses to an INVITE to the UAC.
（RFC 3261 §17）

即：200 OK 可能有多份（forking 场景），只有 UAS 负责重传它们、只有 UAC 负责 ACK 它们，
这份 ACK 没有服务端事务与之配对，因此"自成事务"。

## 客户端事务 / 服务端事务

> Transactions have a client side and a server side.  The client side
> is known as a client transaction and the server side as a server
> transaction.  The client transaction sends the request, and the
> server transaction sends the response.
（RFC 3261 §17）

> A stateless proxy does not contain a client or server transaction.
> ...  As far as SIP
> transactions are concerned, stateless proxies are effectively
> transparent.
（RFC 3261 §17）

所以四种组合：ICT / IST / NICT / NIST。**无状态代理不参与事务**——这是排障时区分
"消息没到"和"事务重传"的关键前提。

## 两种事务的行为差异

INVITE 事务是三方握手：

> The INVITE transaction consists of a three-way handshake.  The client
> transaction sends an INVITE, the server transaction sends responses,
> and the client transaction sends an ACK.
（RFC 3261 §17.1.1.1）

非 INVITE 事务没有 ACK：

> Non-INVITE transactions do not make use of ACK.  They are simple
> request-response interactions.
（RFC 3261 §17.1.2.1）

一个容易被忽略的后果：

> Unlike an INVITE transaction, a non-INVITE transaction has no special
> handling for the 2xx response.  The result is that only a single 2xx
> response to a non-INVITE is ever delivered to a UAC.
（RFC 3261 §17.1.2.1）

## 计时器（默认值）

来自附录 A 的 Table 4，只抄与本页相关的一行（完整表以原文为准）：

| Timer | 值 | 含义 |
|---|---|---|
| T1 | 500 ms 默认 | RTT 估计，几乎所有计时器都按 T1 缩放 |
| T2 | 4 s | 非 INVITE 请求与 INVITE 响应的最大重传间隔 |
| T4 | 5 s | 消息在网络中停留的最长时间 |
| Timer A | 初始 T1 | INVITE 请求重传间隔（仅 UDP） |
| Timer B | 64*T1 | INVITE 事务超时 |
| Timer F | 64*T1 | 非 INVITE 事务超时 |
| Timer H | 64*T1 | 等待 ACK 的时间 |
| Timer J | 64*T1（UDP） | 等待非 INVITE 请求重传的时间 |
| Timer K | T4（UDP） | 等待响应重传的时间 |

T1 的语义与默认值原文（RFC 3261 §17.1.1.1）：

> T1 is an estimate of the round-trip time (RTT), and
> it defaults to 500 ms.  Nearly all of the transaction timers
> described here scale with T1, and changing T1 adjusts their values.

## 与相邻概念的关系

- 事务 → 驱动 [[flows/basic-call]] 里的重传与 ACK 时机
- 事务标识符 = `branch` 参数，见 [[messages/headers/via]]
- 事务之上才是对话（[[concepts/dialog]]，待建）：事务解决"这一条消息可靠送达"，
  对话解决"这一通会话的生命周期"，两者不能混为一谈

## 排障要点（待补 drill）

- UDP 下"同一请求收到两次响应"：先看是否属于不同事务（branch 不同 = 不同事务）
- 2xx 之后 ACK 没有重传机制，2xx 本身靠 UAS 重传，这与 INVITE 事务的超时逻辑无关

## 待解问题

- `wiki/questions/` 待建：非 UDP（TCP/TLS）下 Timer A/E/G 的行为差异，需要对照 §17.1.1.2 与 §17.1.2.2
  原文逐条核一遍（本页未核对）
