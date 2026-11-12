> 一句话：`sip/raw/rfc/` 下每个文件的来源与校验和。只追加，不修改既有条目。

# MANIFEST

由 `scripts/fetch-rfc.sh` 自动登记。

| 文件 | URL | 抓取日期 | 字节 | 行数 | sha256 |
|---|---|---|---|---|---|
| rfc3261.txt | https://www.rfc-editor.org/rfc/rfc3261.txt | 2026-11-12 | 172181 | 15067 | d513777f77fea01a4de9c0a2d9d6713cb53b8231f1b7a2ab56705f8d51b066dc |

## 待入库（M3）

配套栈按需增量入库，不要一次全抓：

- 3262 SUBSCRIBE/NOTIFY、3263 DNS、3264 SDP offer/answer、3581 rport、4028 session timer
- 4320（3261 更新）、5626 outbound/keepalive、6026（3261 更新）、6665（事件框架现状）
- 4475 SIP torture tests（用于 `sip/labs/abnf/` 校验）
- 协议无关但会用到的：3550/3551 RTP、4566 SDP

> 3261 的 `Updated by` / `Obsoletes` 清单**以 rfc-editor 页面为准**，禁止凭记忆写入
> （见 `AGENTS.md` §3 第 2 条）。
