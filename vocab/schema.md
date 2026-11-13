> 一句话：生词本字段约定。正式词条在 `terms.yaml`，LLM 抽取的候选在 `candidates.yaml`。

# vocab schema

## 为什么要有 `domain_meaning` 和 `confusion`

学协议卡人的往往**不是生词，是熟词僻义**：`fork`、`provisional`、`canonical`、`glare`、`tag`
都是英语常用词，但在 RFC 3261 里指非常具体的东西。普通词典查不到这一层，
所以字段必须留给"领域义"和"我当初误以为是什么"。

## 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `term` | ✅ | 词条原形（英文，小写；缩写保留大写如 `CSeq`） |
| `pos` | | 词性：n / v / adj / abbr |
| `phonetic` | ✅ | 音标，英美并列时用 `BrE /fɔːk/ · AmE /fɔːrk/` 格式 |
| `say` | | **朗读文本覆盖**。缩写/头域名（`CSeq`、`Via`、`SDP`）TTS 会读错，用它能读对 |
| `audio` | | 本地音频，相对 `vocab/` 路径（如 `audio/fork.mp3`）。有则优先播它，否则走浏览器 TTS |
| `domain_meaning` | ✅ | **在本协议语境里到底指什么**（一句中文，尽量对应英文原文用词） |
| `general_meaning` | | 通用义，用来对照"熟词僻义" |
| `confusion` | ✅ | 我当初的误解 / 最容易混的点 |
| `source` | ✅ | 证据锚点，如 `RFC3261 §19.3`，必须能在 `sip/raw/` 里 grep 到 |
| `topics` | ✅ | `[sip]` / `[sip, media]` |
| `status` | ✅ | `candidate` → `learning` → `known` |
| `wiki` | | 相关页面 slug 列表，站点据此做双向跳转 |
| `added` | ✅ | 日期 |
| `missing` | | **自动算出**的空项清单，如 `[domain_meaning, confusion, source]`；手改会被 `check` 拦 |
| `drafted_by` | | 只允许 `agent`。出现在 `terms.yaml` 即报错（正式本必须人确认） |
| `lookup` | | 音标从哪来：`{source: dictionaryapi\|cmudict, at: 日期}`，便于追溯 |
| `audio_source` | | 音频出处与许可（如 `dictionaryapi.dev / Wikimedia Commons (BY-SA 4.0)`） |

## 发音怎么来

三层回退（站点实现，见 `site/assets/app.js`）：

1. `audio` 字段指向的本地文件（离线、音质确定）
2. **在线词典音频**（有道 `dictvoice`，只发送单词本身）——工具栏可开关，默认在检测到本机无语音时自动打开
3. 浏览器 Web Speech API（`speechSynthesis`）——需要系统装语音包，Linux 上要 `speech-dispatcher`

缩写类词条用 `say` 写出发音近似（如 `CSeq` → `say: C see cue`），否则 TTS 会念成字母串。
`say` **不参与在线音频**：有道拿的是 `say` 的文本，所以 `say` 只该写真正要读的东西。

## 状态机（四级，AI 与人分工）

```
录词/抽取 ──▶ candidate ──[agent 批量起草]──▶ drafted ──[人复核]──▶ learning ──▶ known
             （机械信息齐全）                （草案待审）        （进 terms.yaml）
```

| 状态 | 在哪 | 谁能写 | 含义 |
|---|---|---|---|
| `candidate` | `candidates.yaml` | 人（表单）+ agent | 音标已就位，语义待补 |
| `drafted` | `candidates.yaml` | **仅 agent**（必须带 `drafted_by`） | 草案已起草，等人复核 |
| `learning` | `terms.yaml` | **仅人** | 正式词条，正在学 |
| `known` | `terms.yaml` | 仅人 | 已掌握 |

## 两条录入路径

1. **网页表单**：`npm run dev` → 生词本页顶部「录词」面板 → 输入单词回车 → 自动填音标/通用义/发音 →
   语义三件套可留空 → 保存进 `candidates.yaml`（留空项自动进 `missing`）
2. **agent 抽取**：ingest/query 时由 agent 追加候选；语义三件套可先留空

静态打开页面（非 dev）时表单只能查、不能写。

## 缺失项怎么补（批量）

对 agent 说「批量补全候选词」→ 它按 `AGENTS.md` §4 的动作：逐词 grep `raw/` 找真实锚点 →
写 `domain_meaning`/`confusion` 草案 → `status: drafted` + `drafted_by: agent` → 重算 `missing`。
人复核后才搬进 `terms.yaml`。

## `npm run check` 的四条硬校验

| 校验 | 为什么 |
|---|---|
| 候选必须有 `phonetic` | 机械信息能自动拿，缺了就是录入链路坏了 |
| `missing` 必须与实际空字段一致 | 防手改后"声明"与"事实"漂移 |
| `status: drafted` 必须带 `drafted_by` | 草案必须可追溯到 AI |
| `terms.yaml` 禁止 `drafted_by` / 非空 `missing` | AI 草案不得冒充人已确认 |
