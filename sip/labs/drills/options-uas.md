---
slug: options-uas
phase: alpha
specs: ["RFC3261 §11.2", "RFC3261 §8.2.6"]
wiki: ["specs/rfc3261"]
---

# drill: 最小 UAS 应答 OPTIONS

## 目标

对一条 OPTIONS 请求返回**合法**的 200 响应——第一个能被第三方工具验收的产物。

## 输入

- 用 `sipsak` 或 `sipexer` 生成真实 OPTIONS（不要手写请求，避免自己给自己出简单题）
- 响应模板参考 `sip/raw/rfc/rfc3261.txt` §11.2 与 §20 对应头域定义

## 做法

1. 只处理 OPTIONS，其它方法回 405（先别做通用 UAS）
2. 响应必须：回显全部 Via（顺序不变）、补 `To` 的 tag、`CSeq` 原样、
   `Content-Length: 0`（或与实际 body 一致）
3. 先在 UDP 上跑通，再切 TCP

## 判据

- `sipsak -s sip:test@127.0.0.1:5060` 返回 200，且不报 "no CRLF" / "bad response"
- Wireshark 里响应的 To.tag 非空、Via 数量与请求一致
- 请求带了两个 Via 时，响应也是两个（顺序相同）

## 我踩到的

（做完立刻填）
