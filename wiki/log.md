# 构建日志（append-only）

格式固定，便于 `grep "^## \[" log.md | tail -5`：
`## [YYYY-MM-DD] 动作 | 对象`

---

## [2026-11-12] ingest | RFC3261 §17 Transactions

- 新建 `concepts/transaction.md`：定义、ACK 归属例外、ICT/IST/NICT/NIST、计时器（附录 Table 4）
- 更新 `wiki/index.md` concepts 区
- 生词候选：provisional

## [2026-11-12] ingest | RFC3261 §8.1.1.7 + §20.42 Via

- 新建 `messages/headers/via.md`：作用、UAC 生成规则、branch 唯一性与 z9hG4bK 前缀、
  received 参数来历、与事务的关系
- 生词候选：canonical、tag

## [2026-11-12] ingest | RFC3261 §24.2 + §13.1 基本呼叫流程

- 新建 `flows/basic-call.md`（status: draft）：F1–F14 序列表、ACK 两套规则
- 生词候选：fork、glare

## [2026-11-12] query | "事务和对话到底差在哪"

- 结论 file back 进 `concepts/transaction.md` 的"与相邻概念的关系"
- 留下的红链：`concepts/dialog`（待建）
