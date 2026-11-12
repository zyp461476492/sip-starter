> 一句话：本仓库当前做到哪、下一步做什么。**只写现在，历史进 `memory/journal.md`**。

last_updated: 2026-11-12

## 现在

**目标已定格**：亲手实现 FreeSWITCH-like 组件的信令内核（自研 SIP 栈）；
本仓只做知识库 + labs 验证件（ADR-0004）。

- M1 最小闭环 ✅：目录、`AGENTS.md`、`docs/` 全套、rfc3261 入库、wiki 三页样板、
  vocab 5 条（含音标与三层发音回退）、站点三视图、`npm run check` 锚点校验
- M2 ✅（结构部分）：`wiki/specs/rfc3261.md` 章节地图（28 节 → 读/查/跳 + 服务哪个里程碑）、
  `plan.yaml` 改为 α–ε 里程碑组织（17 任务）、首批 3 个 drill、`docs/01-workflow.md` 写明读法
- M2 ✅（文档落地）：ADR-0005（学习方案的备选与否决）+ `docs/03-learning-method.md`（四分类法、
  里程碑切法、验收物三分、反模式），并把方法内容从 `01-workflow` 移过去
- 站点补强：`§x.y` chip 现在可点 → 原文锁点页 `raw/rfc3261.html`（316 个节锁点，已剔页眉页脚）；
  `drill:` chip → 练习页 `drills/<slug>.html`；未入库的 RFC 仍为虚线不可点
- 校验：`npm run check` → 0 错误（红链为待建页，已在 open-threads 记录）

## 下一步（有序）

1. **α-1**：消息解析/序列化 round-trip，夹具用 §24.1 的 F1/F2 + §20.42 的两个 Via
2. α-2 URI 解析与比较（§19.1、§19.1.4）
3. α-3 framing（§7.5、§18）→ α-4 最小 UAS 应答 OPTIONS（§11.2，用 sipsak 验收）

## 阻塞 / 待你决定

- 实现语言与并发模型未定（影响 β 的定时器轮设计，但不阻塞 α）
- 是否先在本仓 `labs/` 里用同一语言写验证件（建议：是，方便将来直接搬迁）
