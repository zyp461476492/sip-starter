---
id: concepts/dialog
title: Dialog（对话）
topics: [sip]
status: draft
specs: ["RFC3261 §12", "RFC3261 §12.1.1", "RFC3261 §12.1.2", "RFC3261 §6", "RFC3261 §13.1"]
drills: []
updated: 2026-11-16
---

# Dialog（对话）

一句话：**对话是两端从"有人接听"到"挂断"这段期间的上下文**，由 `Call-ID` + 两个 `tag`
唯一标识；它给对话内的每个请求（ACK / BYE / RE-INVITE）提供**路由（route set）与排序（CSeq）**
依据，本身不是"一条连接"。

## 定义（原文）

> A dialog
> represents a peer-to-peer SIP relationship between two user agents
> that persists for some time.  The dialog facilitates sequencing of
> messages between the user agents and proper routing of requests
> between both of them.  The dialog represents a context in which to
> interpret SIP messages.
（RFC 3261 §12）

> A dialog is identified at each UA with a dialog ID, which consists of
> a Call-ID value, a local tag and a remote tag.  The dialog ID at each
> UA involved in the dialog is not the same.  Specifically, the local
> tag at one UA is identical to the remote tag at the peer UA.  The
> tags are opaque tokens that facilitate the generation of unique
> dialog IDs.
（RFC 3261 §12）

**每个 UA 记的 dialog ID 不一样**：自己生成的 tag 是 local，抄来的 tag 是 remote，两端镜像。
对着抓包只看 `Call-ID` 就以为"找到同一个对话了"，是这里最常见的错。

## 什么时候才建立

- INVITE 的 **2xx** 才建立对话（1xx 只建立事务；3xx–6xx 的 ACK 属于 INVITE 事务，也不建立）
- forking 收到多份 2xx → **一通呼叫、多个对话**（§13.1）
- 删除：BYE 的 200 OK，或 3xx–6xx 的 ACK

## 两端各存哪些字段

UAS 侧（发 2xx 时构造，§12.1.1）：

> The route set MUST be set to the list of URIs in the Record-Route
> header field from the request, taken in order and preserving all URI
> parameters.  If no Record-Route header field is present in the
> request, the route set MUST be set to the empty set.  This route set,
> even if empty, overrides any pre-existing route set for future
> requests in this dialog.  The remote target MUST be set to the URI
> from the Contact header field of the request.
（RFC 3261 §12.1.1）

> The remote sequence number MUST be set to the value of the sequence
> number in the CSeq header field of the request.  The local sequence
> number MUST be empty.  The call identifier component of the dialog ID
> MUST be set to the value of the Call-ID in the request.  The local
> tag component of the dialog ID MUST be set to the tag in the To field
> in the response to the request (which always includes a tag), and the
> remote tag component of the dialog ID MUST be set to the tag from the
> From field in the request.
（RFC 3261 §12.1.1）

UAC 侧（收 2xx 时构造，§12.1.2）：同名字段、local/remote 对调，且 **Record-Route 要反序**：

> The route set MUST be set to the list of URIs in the Record-Route
> header field from the response, taken in reverse order and preserving
> all URI parameters.
（RFC 3261 §12.1.2）

> The local sequence number MUST be set to the value of the sequence
> number in the CSeq header field of the request.  The remote sequence
> number MUST be empty (it is established when the remote UA sends a
> request within the dialog).  The call identifier component of the
> dialog ID MUST be set to the value of the Call-ID in the request.
> The local tag component of the dialog ID MUST be set to the tag in
> the From field in the request, and the remote tag component of the
> dialog ID MUST be set to the tag in the To field of the response.
（RFC 3261 §12.1.2）

| 字段 | UAS | UAC |
|---|---|---|
| dialog ID | Call-ID + **自己生成的 To.tag** + 请求的 From tag | Call-ID + 请求的 From tag（自己生成）+ **响应的 To.tag** |
| route set | 请求的 Record-Route，**正序** | 响应的 Record-Route，**反序** |
| remote target | 请求的 Contact | 响应的 Contact |
| local CSeq | **初始为空** | INVITE 的 CSeq（下一个请求 +1） |
| remote CSeq | INVITE 的 CSeq | **初始为空**，等对方第一个对话内请求 |

## 谁维护对话状态、谁不维护

- **UAC / UAS**：维护（§12.1.1 / §12.1.2）
- **代理**：不维护对话，有状态代理只维护事务

> Stateful Proxy: A logical entity that maintains the client and
> server transaction state machines defined by this specification
> during the processing of a request, also known as a transaction
> stateful proxy.
（RFC 3261 §6）

- **B2BUA**：维护，而且被迫参与

> Unlike a proxy server, it maintains dialog
> state and must participate in all requests sent on the dialogs
> it has established.
（RFC 3261 §6）

## route set 为空意味着什么

没有 Record-Route 时 route set 是空集 → 对话内请求**直接发给 remote target（对端 Contact）**，
代理被绕开。这就是 [[flows/basic-call]] 的 Figure 1 里 ACK / BYE 能画成一条贯穿线的原因，
不是"ACK 必须走原路"。代理要留在信令路径上，必须在 INVITE 里加 `Record-Route`（§16.6，待编译）。

## 与相邻概念

- [[concepts/transaction]]：事务在对话之下；2xx 的 ACK 不属于 INVITE 事务，但属于对话
- [[flows/basic-call]]：完整 F1–F14 里看这些字段从哪条消息来
- [[messages/headers/via]]：Via 管"响应怎么回去"，Contact / route set 管"下一个请求往哪发"

## 未核对 / 待补

- Target refresh request（§12.2.1.2）：remote target 何时更新，未编译
- 对话内请求的完整发送流程（§12.2.1）：未编译
- 本页 `status: draft`；升 `current` 的条件：编译 §12.2 并在 L1 抓包里核对一次 route set
