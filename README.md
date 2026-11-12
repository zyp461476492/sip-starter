# sip-starter

学 SIP（以及后续 RTP/RTCP/SDP 等媒体协议）的**编译型知识库**：把 RFC 原文"编译"成
可交叉引用、可持续维护的 wiki，再用一个静态站点把学习计划、知识库、生词本串起来。

**目标**：亲手实现一个 FreeSWITCH-like 组件的**信令内核**（自研 SIP 栈）。
本仓是知识库 + `sip/labs/` 最小验证件；真实实现另起仓库（见 ADR-0004）。

模式来自 [Karpathy 的 LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)，
但做了三处改造（见 `docs/00-design.md`）：规范性论断必须原文引用 + 锚点、加一层可校验实验、
计划与词库是数据而非手写网页。

## 三分钟上手

```bash
npm install          # 只装 marked + js-yaml
npm run site         # 生成 site/dist/
npm run dev          # 生成并起本地服务（默认 http://localhost:5173）
```

打开站点后有三个视图：

| 视图 | 回答什么问题 |
|---|---|
| 学习计划 `index.html` | 学到哪了、下一项是什么、这一项背后有没有 wiki 支撑 |
| 知识库 `wiki/index.html` | SIP 是什么（每个论断都带 RFC 原文锚点） |
| 生词本 `vocab.html` | 哪些词我还没掌握（音标 + 发音 + 抽卡） |

学习路线按**可运行里程碑**组织：α 报文 → β 事务 → γ 对话/注册 → δ B2BUA → ε 互通。
章节到里程碑的映射见 [`wiki/specs/rfc3261.md`](wiki/specs/rfc3261.md)（**不要线性通读 269 页**）。

## 目录

```
sip/     证据层与实验层：RFC 原文（只读）、errata、ABNF、抓包、练习
media/   后续协议（RTP/RTCP/SDP/ICE…），与 sip/ 同构
wiki/    唯一编译层：LLM 独占写入的领域知识
plan/    学习计划（yaml，站点数据源）
vocab/   生词本（yaml，站点数据源）
site/    静态站点：生成器 + 样式，dist/ 为产物（不入库）
docs/    项目自身文档：设计、工作流、决策记录、本地项目记忆
AGENTS.md  给 AI 助手的约束（唯一权威）
```

## 给 AI 助手的用法

把仓库根目录丢给 Pi / Codex / Claude Code，说一句「按 AGENTS.md 编译 RFC 3261 §17」即可。
它的读入顺序、引用纪律、ingest/query/lint 流程、会话收尾义务都写在 `AGENTS.md` 里。

**当前进度看 `docs/status.md`。**
