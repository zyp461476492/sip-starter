> 一句话：本仓库当前做到哪、下一步做什么。**只写现在，历史进 `memory/journal.md`**。

last_updated: 2026-11-12

## 现在

**目标已定格**：亲手实现 FreeSWITCH-like 组件的信令内核（自研 SIP 栈）；
本仓只做知识库 + labs 验证件（ADR-0004）。

- M1 最小闭环 ✅：目录、`AGENTS.md`、`docs/` 全套、rfc3261 入库、wiki 三页样板、
  vocab 5 条（含音标与三层发音回退）、站点三视图、`npm run check` 锚点校验
- M2 ✅（结构部分）：`wiki/specs/rfc3261.md` 章节地图（28 节 → 读/查/跳 + 服务哪个里程碑）、
  `plan.yaml` 改为 **L0 骨架 → L1 观察 → L2 原理 → L3 模仿 → α–ε 实现**（31 任务），
  前三段标 `code: false`（不写代码），每段带时间盒
- M2 ✅（文档落地）：ADR-0005（学习方案的备选与否决）+ `docs/03-learning-method.md`（四分类法、
  里程碑切法、验收物三分、反模式），并把方法内容从 `01-workflow` 移过去
- 站点补强：`§x.y` chip 现在可点 → 原文锁点页 `raw/rfc3261.html`（316 个节锁点，已剔页眉页脚）；
  `drill:` chip → 练习页 `drills/<slug>.html`；未入库的 RFC 仍为虚线不可点
- 图表能力：项目级技能 `.agents/skills/svg-diagram/`（手写内联 SVG + 自检脚本 + 截图回归），
  已产出 `wiki/assets/ladder-basic-call.svg` 并内联进 `flows/basic-call`
- 校验：`npm run check` → 0 错误（红链为待建页，已在 open-threads 记录）

## 下一步（有序）

1. **L0-1** 读 §4 + §24.1/§24.2（40min，不写代码）→ 能画梯形拓扑
2. **L0-2** 把 F1 REGISTER / F2 200 OK 逐头标注（30min）
3. **L1-0** 工具链就绪：sipsak / sipp / tshark / 一台软电话（缺的用 docker）

> 前三段（L0–L3）合计约 7–12 小时，**期间不写实现代码**（`AGENTS.md` §3 第 10 条）。

## 阻塞 / 待你决定

- 实现语言与并发模型未定（影响 β 的定时器轮设计，但不阻塞 α）
- 是否先在本仓 `labs/` 里用同一语言写验证件（建议：是，方便将来直接搬迁）
