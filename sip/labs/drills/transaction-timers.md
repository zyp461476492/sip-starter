---
slug: transaction-timers
phase: beta
specs: ["RFC3261 §17", "RFC3261 附录 A Table 4"]
wiki: ["concepts/transaction"]
---

# drill: 定时器推演（假时钟）

## 目标

在**不等待真实时间**的前提下，验证事务状态机的定时器路径与 §17 的图一致。

## 输入

- `sip/raw/rfc/rfc3261.txt` 附录 A Table 4（T1/T2/T4、Timer A/B/E/F/K/J）
- §17.1.1.2 / §17.1.2.2 的正式描述与状态图

## 做法

1. 把时钟抽象成可注入接口（`now()` + 定时器堆），测试里用手动推进的假时钟
2. 逐个断言：重传间隔序列、超时时刻、状态停留时长
3. 断言对象是**状态迁移 + 发出的报文序列**，不是日志文本

## 判据

| 路径 | 判据 |
|---|---|
| NICT 请求重传 | 间隔为 T1, 2T1, 4T1…封顶 T2（4s） |
| NICT 收到 1xx | 重传继续，但间隔为 T2 |
| ICT 收到 1xx | 请求重传**停止** |
| 事务超时 | Timer B / Timer F 在 64*T1（32s）触发 |
| 服务端收尾 | Timer J/K 在 UDP 下为 64*T1 / T4，TCP 下为 0 |

全部路径在假时钟下 1 秒内跑完。

## 我踩到的

（做完立刻填。已知高频坑：把 INVITE 与非 INVITE 的 1xx 行为写反）
