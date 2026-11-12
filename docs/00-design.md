> 一句话：本仓库的分层设计，以及每一处"为什么不那样"。

# 00 设计

## 目标

1. 学 SIP（后续扩展到 RTP/RTCP/SDP/ICE 等媒体协议），并且**学得可验证**；
2. 知识可复利：编译一次，之后只查编译产物，不重复读 RFC；
3. 学习过程本身（计划、问题、生词）也要沉淀成能查能算的数据，而不是散在各处。

模式来源：[Karpathy 的 LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)（2026-04）。
我们采用它的核心结构（raw / wiki / schema + ingest·query·lint + index·log），
但针对"协议规范"这个领域做了三处改造，理由见下。

## 分层

```
证据层  sip/raw/           RFC 原文、errata、图 —— 只读，唯一事实来源
实验层  sip/labs/          ABNF、抓包、报文样例、练习 —— 可执行、可校验
编译层  wiki/              领域知识 —— LLM 独占写，每个论断带原文锚点
数据层  plan/ vocab/       学习计划、生词本 —— yaml，人工确认
展示层  site/              静态站点 —— 生成物，三视图
元      AGENTS.md docs/    约束、理由、记忆
```

## 三个改造（相对 Karpathy 原版）

### 1. 规范性论断必须原文引用 + 锚点

原版让 LLM "读、抽取、综合、改写"。协议规范不能这么干：`MUST` / `MUST NOT` 的语义一旦被转述走形，
会作为"事实"永久留在 wiki 里污染后续每次查询，且同源模型做 lint 抓不出来（错误相关而非独立）。
所以规则硬化为：`> 原文引用` + 锚点，拿不准就进 `wiki/questions/`。

详见 [adr/0001-single-wiki-layer.md](adr/0001-single-wiki-layer.md) 与 `AGENTS.md` §3。

### 2. 加一层"可校验实验"（`labs/`）

学习协议的产出不是文字，是能推理和排障的能力。所以 ABNF 抽成脚本可校验的产物、
流程配报文样例与抓包、练习带对照答案。wiki 与 labs 互相引用：
wiki 页声明 `drills:`，练习声明 `wiki:`。

### 3. 计划与词库是数据，HTML 是生成物

手写 HTML 的学习计划必然失真。数据源是 `plan/plan.yaml` 与 `vocab/*.yaml`，
站点从数据生成三视图并自动算进度、抽卡、搜索。

## 为什么 wiki 只有一层（而不是每个协议一个）

SIP 不是孤岛：SDP 的 offer/answer（RFC 3264）、RTP（3550/3551）、ICE、DTLS-SRTP 全都横跨边界。
若"每个协议一个 wiki"，`offer-answer` 这类页面会有两个住所，最终分叉。
所以：**一个编译层，多个证据层**。协议差异体现在 `sip/`、`media/` 的 raw 与 labs，
页面归属靠 frontmatter `topics: [sip, media]` 标记。
→ [adr/0001-single-wiki-layer.md](adr/0001-single-wiki-layer.md)

## 为什么没有 `other/`

`other` 是垃圾桶命名，第二个协议进来它就失去判别力。用协议族命名（`media/`、将来 `webrtc/`、`ims/`），
而"当前主线是哪个"是**状态**，交给 `plan/plan.yaml` 的 `active_topic` 声明。

## 为什么站点不用 VitePress

站点 80% 是数据面板（计划进度、抽卡、搜索），20% 才是文档。VitePress 为那 20% 设计，
而 `[[wikilink]]` 解析 + 页尾反链 + 两个面板都发生在**构建期内容变换**，自己拥有管线才舒服。
→ [adr/0002-no-vitepress.md](adr/0002-no-vitepress.md)

## 为什么计划与词库用 yaml

一个数据源、多处消费（站点、脚本、lint）。见 → [adr/0003-yaml-as-source-of-truth.md](adr/0003-yaml-as-source-of-truth.md)

## 边界与已知失效模式

| 风险 | 我们的对策 |
|---|---|
| 幻觉复利（错误论断固化） | 强制原文引用 + 锚点；lint 对照 raw 校验锚点存在性 |
| lint 与 compile 同源（互相背书） | lint 至少含**机器可判定**的部分（锚点 grep、yaml 字段、wikilink、ABNF 校验） |
| 规模天花板（~100–200 来源后 index 塞不进上下文） | 一开始就两级索引（area → page）；超限后加本地搜索，而不是硬塞 |
| markdown 不是数据库 | 只用于单人知识库；不承载权限/并发；需要确定性查询的用脚本读 yaml |
| 学过就忘（wiki 变写-only） | query 必须 file back；计划项绑定 wiki 页，站点显示"未支撑" |

## 相关

- 工作流：[`01-workflow.md`](01-workflow.md)
- 站点：[`02-site.md`](02-site.md)
- 里程碑：[`roadmap.md`](roadmap.md)
