---
sec: "A"
en_sha: "cf02e8c7a1f9c347"
status: draft
translator: agent
date: 2026-11-16
---

Table 4 汇总本规范所用各定时器的含义与默认值（表体原样保留）：

```
Timer    Value            Section               Meaning
----------------------------------------------------------------------
T1       500ms default    Section 17.1.1.1     RTT Estimate
T2       4s               Section 17.1.2.2     The maximum retransmit
                                               interval for non-INVITE
                                               requests and INVITE
                                               responses
T4       5s               Section 17.1.2.2     Maximum duration a
                                               message will
                                               remain in the network
Timer A  initially T1     Section 17.1.1.2     INVITE request retransmit
                                               interval, for UDP only
Timer B  64*T1            Section 17.1.1.2     INVITE transaction
                                               timeout timer
Timer C  > 3min           Section 16.6         proxy INVITE transaction
                           bullet 11            timeout
Timer D  > 32s for UDP    Section 17.1.1.2     Wait time for response
         0s for TCP/SCTP                       retransmits
Timer E  initially T1     Section 17.1.2.2     non-INVITE request
                                               retransmit interval,
                                               UDP only
Timer F  64*T1            Section 17.1.2.2     non-INVITE transaction
                                               timeout timer
Timer G  initially T1     Section 17.2.1       INVITE response
                                               retransmit interval
Timer H  64*T1            Section 17.2.1       Wait time for
                                               ACK receipt
Timer I  T4 for UDP       Section 17.2.1       Wait time for
         0s for TCP/SCTP                       ACK retransmits
Timer J  64*T1 for UDP    Section 17.2.2       Wait time for
         0s for TCP/SCTP                       non-INVITE request
                                               retransmits
Timer K  T4 for UDP       Section 17.1.2.2     Wait time for
         0s for TCP/SCTP                       response retransmits

                   Table 4: Summary of timers
```

读法（按用途分组）：

- **两个基础常量**：T1 = 500ms 是 RTT 估计值，几乎所有重传间隔都由它起步；T2 = 4s 是非 INVITE 请求与 INVITE 响应重传间隔的上限；T4 = 5s 是一条消息在网络里可能滞留的最长时间。
- **客户端事务的定时器**：A（INVITE 请求重传间隔，初值 T1，仅 UDP）、B（INVITE 事务超时，64*T1）、D（等响应重传的时长：UDP 大于 32s，TCP/SCTP 为 0）；E（非 INVITE 请求重传间隔，初值 T1，仅 UDP）、F（非 INVITE 事务超时，64*T1）、K（等响应重传的时长：UDP 为 T4，TCP/SCTP 为 0）。
- **服务端事务的定时器**：G（INVITE 响应重传间隔，初值 T1）、H（等 ACK 到达的时长，64*T1）、I（等 ACK 重传的时长：UDP 为 T4，TCP/SCTP 为 0）、J（等非 INVITE 请求重传的时长：UDP 为 64*T1，TCP/SCTP 为 0）。
- **代理的定时器**：C（代理的 INVITE 事务超时，大于 3 分钟）。

> 原文本节之后还附有 Acknowledgments、Authors' Addresses 与 Full Copyright Statement，与协议行为无关，未译。
