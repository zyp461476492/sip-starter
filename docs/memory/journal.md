> 一句话：append-only 时间线。每次会话一条，前缀固定，可 grep。

# journal

格式固定，便于 `grep "^## \[" journal.md | tail -5`：

```markdown
## [YYYY-MM-DD] 里程碑 | 标题
- 做：
- 变：
- 留：
```

---

## [2026-11-12] M1 | 目录骨架 + rfc3261 入库 + 站点三视图

- 做：`sip/ media/ wiki/ plan/ vocab/ site/ docs/ scripts/` 骨架；`AGENTS.md`；`docs/` 全套
  （ADR 0001–0003 + memory 四件）；rfc3261.txt 入库并记 sha256；`wiki/` 三页样板
  （concepts/transaction、messages/headers/via、flows/basic-call）；`vocab/terms.yaml` 5 条；
  `plan/plan.yaml` 2 项；`site/build.mjs` 生成三视图
- 变：站点确定为自写生成器（ADR-0002）；wiki 定为全局单层（ADR-0001）；取消 `other/`
- 留：M2 的阶段任务表、第一个 drill、生词晋升流程 → `open-threads.md`

## [2026-11-12] M1.1 | 生词本加音标与发音

- 做：`vocab/schema.md` 新增 `phonetic`（转必填）/`say`/`audio` 三字段；5 条词条补英美音标；
  卡片加 🔊、工具栏加 US/UK 与慢速、抽卡自动先读一遍；构建支持 `vocab/audio/` 本地音频
- 变：发音走浏览器 `speechSynthesis`（零外部依赖），本地 mp3 为可选增强
- 留：`phonetic` 现在是必填，新词条漏写会被 `npm run check` 拦住（已实测）

## [2026-11-12] M2 | 目标定格 + 章节地图 + 计划改按里程碑

- 做：`wiki/specs/rfc3261.md`（四类文档分类 + 28 节地图 + 三条阅读路线 + 陷阱清单）；
  `plan.yaml` 重写为 α–ε 里程碑（17 个任务，全部带可验证 `done_when`）；
  `sip/labs/drills/` 首批 3 个（msg-parse / options-uas / transaction-timers）+ README 格式约定；
  ADR-0004；`docs/01-workflow.md` 增“读 spec 的时机”
- 变：**目标从“学 SIP”定格为“自研 SIP 栈 → FreeSWITCH-like 组件”**；计划组织从“按章节”改为“按可运行里程碑”；
  `media/` 从“学完再说”改为与 sip 并行（δ 里程碑需要 SDP/RTP）
- 留：α-1 尚未开工 → `open-threads.md`

## [2026-11-12] M2.1 | 把“设计过程”落地成 ADR + 方法篇

- 做：`docs/adr/0005-learning-milestones-over-linear-reading.md`（列出 4 个被否决的备选 + 重估触发条件）；
  `docs/03-learning-method.md`（四分类法/里程碑切法/验收物三分/反模式/迁移到 media）；
  `01-workflow` 瘦身（方法移入 03，只留动作清单）；`docs/README` 加索引与“新增文档的判据”
- 变：确立边界——**规用则在 docs，实例在 wiki**；讨论过程不留存，只留判断 + 依据
- 留：无

## [2026-11-12] M2.3 | 加 Phase 0 认知地基（修分类漏洞）

- 触发：用户质疑"介绍性章节是不是也得看" → 发现自己给 §1–§3 标"跳"时**未读正文，只看了标题**，
  违反 `AGENTS.md` §3
- 做：`plan.yaml` 新增 Phase 0（p0-1..p0-5，通读 §1–§3/§5、精读 §6/§4、通读 §24、产出心智模型页）；
  新建 `wiki/concepts/sip-mental-model.md`（draft，五题待答）+ `sip/labs/drills/mental-model.md`；
  章节地图 §1–§3 从"跳"改"通读"并标未核对；`03-learning-method.md` 改成**四种读法**（补"通读"档）；
  ADR-0005 加"修订"节；`AGENTS.md` 加第 9 条"计划是假设不是承诺"
- 变：学习路线前面多了一环**不产代码的前置**；读法从三档变四档
- 留：Phase 0 未开工

## [2026-11-12] M2.4 | 阶段重排：现象 → 原理 → 模仿 → 实现

- 触发：用户反馈"计划直接就让写代码，我对整体概念根本不了解"
- 诊断：p0（读 2–3h）→ α-1（写 parser + 字节级 round-trip）跳了三个台阶：没见过真实报文 /
  没有工具反馈 / round-trip 对初学是第二周任务
- 做：`plan.yaml` 重排为 **L0 骨架(1–1.5h) → L1 观察(3–5h) → L2 原理(2–3h) → L3 模仿(2–4h) → α–ε**，
  共 31 任务；前三段 `code: false`；α-1 判据拆两档（基线=解析并打印，加强=round-trip）；
  阶段加 `timebox`/`est`，站点显示"不写代码 · 约 3–5h"；`AGENTS.md` 加第 10 条；
  `03-learning-method.md` 加"阶段顺序"原则；ADR-0005 加修订二；章节地图阅读路线改成五条
- 变：**通读 §1–§6 从"最前"移到 L2**（有现象之后再读），L0 只留 §4 + §24
- 留：L0-1 尚未开工

## [2026-11-12] M2.5 | 图表能力：svg-diagram 技能 + 首个 SIP 时序图

- 触发：希望 agent 生成说明时能配图（类似 WorkBuddy 的架构图），并提炼成可复用技能
- 做：项目级技能 `.agents/skills/svg-diagram/`（SKILL.md 硬规则 + references/tokens.md 调色板几何 +
  references/archetypes.md 五类骨架 + scripts/svg-check.mjs 机械校验 + scripts/render.mjs 截图 +
  assets/skeleton.svg）；产出 `wiki/assets/ladder-basic-call.svg` 并内联进 `wiki/flows/basic-call`
- 关键：**脚本查"错"（几何/文字溢出/类未定义/marker），截图查"难看"**——模型能自己看图，闭环才成立
- 变：构建支持 `![说明](assets/x.svg)` 内联；`AGENTS.md` 加 §7 图表规则（`dg-` 前缀等）
- 变更：技能改为**全局可用**——源码移到 `tools/skills/svg-diagram/`（纳入 git，且不在技能发现路径，避免重名），
  `scripts/install-skills.sh` 负责装到 `~/.pi/agent/skills/`；已安装并自检通过

## [2026-11-12] M2.2 | 计划页 chip 可点：原文锁点页 + 练习页

- 做：`site/build.mjs` 新增 `rfcSections()`（按节切分、剔页眉页脚、生成 `#sec-x.y` 锁点）与
  `renderDrillPage()`；`sources` chip 链到原文、`drills` chip 链到练习页；导航加“RFC 原文”
- 变：**原文也进了站点**（之前只能 grep txt）；`npm run check` 新增“plan/wiki 引用的 drill 必须存在”
- 坑：首版标题正则要求 `[A-Z]` 开头，漏了 54 个以数字开头的节（如 `13.2.2.1 1xx Responses`）；
  改为 `[A-Za-z0-9]` + 首段≤30 过滤后对齐到 314 个编号节 + 附录 A
- 留：无
