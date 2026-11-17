> 一句话：本仓库当前做到哪、下一步做什么。**只写现在，历史进 `memory/journal.md`**。

last_updated: 2026-11-16

## 现在

**目标已定格**：亲手实现 FreeSWITCH-like 组件的信令内核（自研 SIP 栈）；
本仓只做知识库 + labs 验证件（ADR-0004）。

- M1 最小闭环 ✅：目录、`AGENTS.md`、`docs/` 全套、rfc3261 入库、wiki 三页样板、
  vocab 5 条（含音标与三层发音回退）、站点三视图、`npm run check` 锚点校验
- M2 ✅：`wiki/specs/rfc3261.md` 章节地图（28 节 → 读法四档）、`plan.yaml` 改 L0 骨架 → L1 观察 →
  L2 原理 → L3 模仿 → α–ε 实现（31 任务，前三段 `code: false`）、ADR-0005 + `docs/03-learning-method.md`、
  `§x.y` chip 可点 + 316 个节锁点、`svg-diagram` 全局技能 + `wiki/assets/ladder-basic-call.svg`
- M3.0/M3.1 ✅：生词录入表单（dev 可写）+ `missing` 缺口标记 + 四级状态机 + 录词后自动重建
- **M4.0 站点版式 ✅（ADR-0002 仍是 current，没迁 VitePress）**：自写外壳改 VitePress 风格——
  左侧导航树 + 右侧「本页内容」大纲（滚动高亮）+ 页底上下页 + `Aa` 阅读偏好（字号/行宽，快捷键 `s`/`l`）+
  移动端抽屉；`§chip` 105 处全部命中 316 个节锚点；暗色两套变量
- **M4.1 中文译文层 ✅（ADR-0006）**：`sip/zh/`（GLOSSARY + README + `rfc3261/<节号>.md`）、
  `scripts/rfc-sections.mjs`（切节 + `en_sha`）/ `zh.mjs`（校验）/ `zh-check.mjs` / `zh-status.mjs`；
  原文页三态阅读器（中文默认为主、原文折叠、左右对照，快捷键 `t`）+「未译」「原文已变」徽标；
  **已译 49 节 / 302 节有正文小节**（全部 `draft`）：§4、§6、§7.1–7.3、§8.1.1.7、§9–9.2、§10.3、
  §12.1.1/12.1.2、§17.1.1.1、§17.1.3、§18.2.1、§20.42、§21.4 全块（21.4–21.4.28）、§22.1、§24.1、§24.2、附录 A
- **M4.2 原文页目录树可调 ✅**：拖动右缘改宽（150–480px，双击复位）+「隐藏目录」/`[` 收起，
  状态存 localStorage；`<head>` 内联脚本先于绘制套用
- **M4.4 原文页宽度可调 ✅**：正文默认满宽（`--raw-w`），`Aa` 面板第三行「原文」= 满 / 宽 / 中；页头收在 900px
- **M4.5 GitHub Pages ✅**：`.github/workflows/pages.yml`（check → site → artifact → deploy），`dist` 不入库；
  地址 **https://zyp461476492.github.io/sip-starter/**（已出站：Pages 的 Source = GitHub Actions）
- **M4.6 字体排版 ✅**：自托管 Inter（48KB）+ JetBrains Mono（21KB），中文走系统 CJK 栈；
  字号阶梯 h1 2em / h2 1.5em / h3 1.2em；去掉 wiki h1 绿下划线
- **M4.7 dialog 层补齐 ✅**：新建 `wiki/concepts/dialog.md`；`flows/basic-call.md` 加「各角色维护什么状态」
  （dialog / transaction / binding 三层）与「ACK/BYE 为何贯穿全场（无 Record-Route）」两节，F 表改按 §24.2 重编
- **M4.9 L0–L1 译文补齐 ✅**：把 L0/L1 各任务 `sources` 里出现的节**逐节翻完**（8 → 52 节，17%）：
  §6 Definitions、§7.3 的子节（7.3.1/7.3.2/7.3.3）、§9/9.1/9.2 CANCEL、§10.3 REGISTER 处理、§12.1.1/12.1.2 对话创建、§17.1.3 响应匹配、
  §18.2.1 服务端收请求、§20.42 Via、§21.4 整个 4xx 块、§22.1 鉴权框架、附录 A Table 4；
  父节只有引言时连同子节一起译（§9、§21.4），与其无关的兄弟节（§10.1/10.2、§12.2）不动
  → **“L0–L1 要读的节全有中文”已达成**（后续任务的判据现在能靠中文页先建骨架）
- 校验：`npm run check` → **0 错误 0 提醒**（红链已清）；`npm run zh:check` → 0 错误 0 提醒

## 下一步（有序）

1. **P4 续译批次 2**（52/302）：§17 主体（17.1.1.2、17.1.2.1/2、17.2.1–17.2.3）+ §16.2–16.7（代理）+
   §13.1/13.2 + §10.2 → 目标是“L2 要读的节全有中文”。每译完一组跑 `npm run zh:check`
2. 批次 2 完成后做一轮**独立规范段落复审**（换上下文只读英文 + 现有中文，只报不一致，不改文风）；
   优先复审 L0/L1 已用的节：§6、§10.3、§12.1.1/12.1.2、§17.1.3、§9、§20.42
3. **L0-1 已验收**（2026-11-16）：梯形拓扑画对，编号/方向/逐跳与端到端全部对上 §24.2
4. **L0-3**「四个角色各维护什么状态（dialog / transaction / binding 三层）」40min，wiki 侧已就绪
5. **L0-2** 把 F1 REGISTER / F2 200 OK 逐头标注（30min）
5. **L1-0** 实验环境就绪：`sip/labs/toolbox/`（Dockerfile + run.sh + 前 3 个 recipe），方案已定未动手

> 前三段（L0–L3）合计约 7–12 小时，**期间不写实现代码**（`AGENTS.md` §3 第 10 条）。

## 阻塞 / 待你决定

- **`AGENTS.md` 要不要加 `sip/zh/` 与"规范词不译"**：目录表与硬规则只由人改，建议已写在
  `docs/memory/open-threads.md`，等你点头我再落笔
- 实现语言与并发模型未定（影响 β 的定时器轮设计，但不阻塞 α）
- 是否先在本仓 `labs/` 里用同一语言写验证件（建议：是）
