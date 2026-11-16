# 构建日志（append-only）

格式固定，便于 `grep "^## \[" log.md | tail -5`：
`## [YYYY-MM-DD] 动作 | 对象`

---

## [2026-11-12] ingest | RFC3261 章节地图（不新增引文，只做分类与路线）

- 新建 `specs/rfc3261.md`：四类文档分类、28 节地图（服务 α–ε 哪个里程碑）、三条阅读路线、陷阱清单
- `updated_by` / errata 标 `unknown`（未核 rfc-editor，按 `AGENTS.md` §3 不凭记忆填）
- 更新 `wiki/index.md` specs 区

## [2026-11-12] query | 该不该“粗读一遍”269 页

- 结论 file back 进 `specs/rfc3261.md` 的“文档性质”与 `docs/01-workflow.md` 的“读 spec 的时机”
- 目标从“学 SIP”定格为“自研 SIP 栈 → FreeSWITCH-like 组件”，见 ADR-0004


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

## [2026-11-16] query | “四个角色各维护什么状态” + L0-1 验收

- 新建 `concepts/dialog.md`（status: draft）：dialog ID 两端镜像、UAS/UAC 各自构造的字段表、
  route set 正序/反序、谁维护对话（代理不维护、B2BUA 被迫参与）
- 更新 `flows/basic-call.md`：F 表改按 §24.2 重编（原表把 Figure 1 的 F6 混进来）、
  新增「各角色维护什么状态」「为什么 ACK / BYE 可以贯穿全场」两节、`concepts/dialog` 红链消除
- 发现并记录：§4 Figure 1 与 §24.2 的 F 编号**不一致**（F2/F3 互换）
- 发现并记录：站点“✓ 已支撑”只校验 wiki slug 存在，不校验内容是否覆盖判据
- 未动：`plan/plan.yaml`（仅人可写）——l0-1 判据拆分为 l0-1 + 新增 l0-3，片段已交给用户
